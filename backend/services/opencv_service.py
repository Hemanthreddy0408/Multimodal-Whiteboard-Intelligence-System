"""
OpenCV Preprocessing Service

This module handles all image preprocessing BEFORE the heavy AI models see the image.
Think of this as the "cleaning and prep" stage in a kitchen before cooking.

WHY PREPROCESSING?
- Camera images have noise, blur, variable lighting
- Whiteboard drawings may be skewed or have uneven ink
- Models like TrOCR and DINOv2 perform MUCH better on clean, normalized input
- Preprocessing increases OCR accuracy by 20-40%
"""
import cv2
import numpy as np
from PIL import Image
import io
import logging

log = logging.getLogger(__name__)


class OpenCVPreprocessor:
    """
    Full preprocessing pipeline for diagram images.
    
    Pipeline stages:
    1. Deskewing      — Fix tilted/rotated images
    2. Denoising      — Remove camera/sensor noise  
    3. Contrast Enh.  — Improve visibility
    4. Thresholding   — Convert to high-contrast binary
    5. Contour Detect — Find diagram elements
    """

    def preprocess(self, image_bytes: bytes) -> dict:
        """
        Main preprocessing entry point.
        
        Args:
            image_bytes: Raw image file bytes
            
        Returns:
            dict with:
            - 'preprocessed': clean numpy image
            - 'binary': binary (black/white) version
            - 'contours': detected shapes/regions
            - 'pil_image': PIL image for transformers
            - 'metadata': image info
        """
        # Convert bytes → numpy array → OpenCV image
        np_array = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Could not decode image. Check file format.")

        log.info(f"📐 Input image shape: {img.shape}")  # (height, width, channels)

        # Stage 1: Resize if too large (protects GPU memory)
        img = self._resize_if_needed(img, max_dimension=1920)

        # Stage 2: Deskew — fix rotation
        img = self._deskew(img)

        # Stage 3: Denoise — smooth out noise
        img_denoised = self._denoise(img)

        # Stage 4: Enhance contrast
        img_enhanced = self._enhance_contrast(img_denoised)

        # Stage 5: Binary thresholding (good for OCR)
        binary = self._binarize(img_enhanced)

        # Stage 6: Find contours (diagram element candidates)
        contours = self._find_contours(binary)

        # Convert to PIL for Transformer models (they expect PIL images)
        pil_image = Image.fromarray(cv2.cvtColor(img_enhanced, cv2.COLOR_BGR2RGB))

        log.info(f"✅ Preprocessing complete. Found {len(contours)} contours.")

        return {
            "preprocessed": img_enhanced,
            "binary": binary,
            "contours": contours,
            "pil_image": pil_image,
            "metadata": {
                "original_shape": img.shape,
                "contour_count": len(contours),
            }
        }

    def _resize_if_needed(self, img: np.ndarray, max_dimension: int = 1920) -> np.ndarray:
        """
        Resize very large images to protect memory.
        Maintains aspect ratio.
        """
        h, w = img.shape[:2]
        if max(h, w) > max_dimension:
            scale = max_dimension / max(h, w)
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
            log.info(f"📏 Resized from {w}×{h} to {new_w}×{new_h}")
        return img

    def _deskew(self, img: np.ndarray) -> np.ndarray:
        """
        Detect and correct image skew/rotation.
        
        HOW IT WORKS:
        1. Convert to grayscale + binary
        2. Find all text/line pixels (white pixels on black)
        3. Use minAreaRect to find the bounding rectangle angle
        4. Rotate image to straighten it
        
        EXAMPLE: A whiteboard photo taken at an angle of 5° 
        gets rotated back to 0° so OCR reads correctly.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) < 100:  # Not enough pixels to detect skew
            return img
            
        angle = cv2.minAreaRect(coords)[-1]
        
        # Correct angle calculation
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        # Only deskew if angle is significant (> 0.5°)
        if abs(angle) > 0.5:
            h, w = img.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            img = cv2.warpAffine(img, M, (w, h), 
                                  flags=cv2.INTER_CUBIC,
                                  borderMode=cv2.BORDER_REPLICATE)
            log.info(f"↺ Deskewed by {angle:.2f}°")

        return img

    def _denoise(self, img: np.ndarray) -> np.ndarray:
        """
        Remove noise from camera captures.
        
        Uses Non-Local Means Denoising — the best OpenCV denoising algorithm.
        It compares small patches across the entire image to find similar regions
        and averages them, removing random noise while preserving edges.
        
        h=10: filter strength (higher = more smoothing but may blur edges)
        """
        return cv2.fastNlMeansDenoisingColored(img, None, h=10, hColor=10,
                                                templateWindowSize=7,
                                                searchWindowSize=21)

    def _enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        """
        Improve contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization).
        
        Normal histogram equalization applies globally — bad for images with
        areas of different brightness (like a whiteboard with a window in background).
        
        CLAHE applies equalization in small tiles (8×8) and limits contrast
        amplification, giving locally-adaptive, natural-looking enhancement.
        """
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    def _binarize(self, img: np.ndarray) -> np.ndarray:
        """
        Convert to binary (black/white) image for OCR.
        
        Uses Adaptive Thresholding — much better than simple thresholding
        for images with uneven lighting (which is almost every real photo).
        
        How it works: for each pixel, it looks at its neighborhood (11×11 block),
        computes the mean, and uses (mean - 2) as the threshold. This adapts
        to local lighting conditions instead of using one global threshold.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        binary = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=11,
            C=2
        )
        return binary

    def _find_contours(self, binary: np.ndarray) -> list:
        """
        Find all contours (shapes) in the binary image.
        
        Contours are useful for:
        - Identifying bounding boxes (nodes in flowcharts)
        - Finding connected components (text regions)
        - Detecting arrows (elongated contours)
        
        We filter out tiny contours (noise) and very large ones (whole image border).
        """
        # Invert binary for contour detection (contours on white bg)
        inverted = cv2.bitwise_not(binary)
        
        contours, hierarchy = cv2.findContours(
            inverted,
            cv2.RETR_EXTERNAL,       # Only outer contours
            cv2.CHAIN_APPROX_SIMPLE  # Compress horizontal/vertical/diagonal segments
        )
        
        # Filter: minimum area = 500px², max = 80% of image area
        h, w = binary.shape[:2]
        min_area = 500
        max_area = 0.8 * h * w
        
        filtered = [
            c for c in contours
            if min_area < cv2.contourArea(c) < max_area
        ]
        
        return filtered

    def extract_roi_crops(self, img: np.ndarray, contours: list) -> list:
        """
        Extract individual Region of Interest (ROI) crops from the image.
        
        For each contour found, we crop out that region of the image.
        These crops are sent to TrOCR one by one for text extraction.
        
        Example:
        - Contour of "Start" box → crop → TrOCR → "Start"
        - Contour of "Process X" box → crop → TrOCR → "Process X"
        """
        crops = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            # Add small padding around each crop
            pad = 5
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(img.shape[1], x + w + pad)
            y2 = min(img.shape[0], y + h + pad)
            
            crop = img[y1:y2, x1:x2]
            if crop.size > 0:
                crops.append({
                    "image": crop,
                    "bbox": [x1, y1, x2 - x1, y2 - y1],
                    "pil": Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
                })
        return crops


# Singleton instance
preprocessor = OpenCVPreprocessor()
