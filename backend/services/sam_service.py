"""
SAM (Segment Anything Model) Service

SAM by Meta AI (2023) is one of the most powerful image segmentation models ever built.
It can segment ANY object in ANY image — trained on 11 billion masks.

WHY WE USE SAM:
- Regular contour detection (OpenCV) can miss complex shapes
- SAM uses a Vision Transformer to understand image semantics
- It can separate: boxes, arrows, text regions, decorations — reliably
- It gives us precise pixel-level masks for each diagram element

SAM ARCHITECTURE:
1. Image Encoder (ViT-H) → Image embedding
2. Prompt Encoder → Point/Box/Text prompts
3. Mask Decoder → Binary masks (which pixels belong to each object)

We use the "automatic mask generation" mode — no prompts needed.
"""
import numpy as np
from PIL import Image
import logging
import os
from typing import List, Dict

log = logging.getLogger(__name__)


class SAMSegmentationService:
    """
    Wraps Meta's Segment Anything Model for diagram segmentation.
    
    In AUTO mode, SAM:
    1. Samples a grid of points across the image
    2. For each point, generates a mask prediction
    3. Scores each mask by quality
    4. Returns all masks ranked by confidence
    """
    
    def __init__(self):
        self.model = None
        self.mask_generator = None
        self._loaded = False

    def _load_model(self):
        """
        Lazy-load SAM model on first use.
        This prevents slow startup and saves memory if SAM isn't needed.
        
        SAM requires a checkpoint file (~2.5GB for ViT-H).
        Download: https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth
        """
        if self._loaded:
            return
            
        try:
            from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
            from core.config import settings
            
            checkpoint = settings.SAM_CHECKPOINT_PATH
            model_type = settings.SAM_MODEL_TYPE
            
            if not os.path.exists(checkpoint):
                log.warning(f"⚠️  SAM checkpoint not found at {checkpoint}. Using fallback segmentation.")
                self._loaded = True
                return
            
            log.info(f"🔄 Loading SAM model ({model_type})...")
            
            # Load SAM model onto appropriate device
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            log.info(f"🖥️  Using device: {device}")
            
            self.model = sam_model_registry[model_type](checkpoint=checkpoint)
            self.model.to(device)
            
            # Configure automatic mask generator
            # points_per_side=32 → 32×32 = 1024 sample points on image grid
            # pred_iou_thresh=0.88 → only keep masks with >88% predicted quality
            # min_mask_region_area=100 → ignore tiny regions (noise)
            self.mask_generator = SamAutomaticMaskGenerator(
                model=self.model,
                points_per_side=8,
                pred_iou_thresh=0.88,
                stability_score_thresh=0.95,
                crop_n_layers=1,
                crop_n_points_downscale_factor=2,
                min_mask_region_area=100,
            )
            
            self._loaded = True
            log.info("✅ SAM model loaded successfully")
            
        except ImportError:
            log.warning("⚠️  segment_anything not installed. Using fallback segmentation.")
            self._loaded = True
        except Exception as e:
            log.error(f"❌ SAM load error: {e}")
            self._loaded = True

    def segment(self, image: np.ndarray) -> List[Dict]:
        """
        Run SAM segmentation on a preprocessed image.
        
        Args:
            image: numpy array (H, W, 3) in BGR format (OpenCV default)
            
        Returns:
            List of segment dicts, each containing:
            - 'mask': binary mask (H, W) bool array
            - 'bbox': [x, y, w, h] bounding box
            - 'area': pixel area of segment
            - 'confidence': predicted IoU score
            - 'element_type': our classification (box, arrow, text, unknown)
            - 'crop': cropped numpy image of this segment
        """
        self._load_model()
        
        if self.mask_generator is None:
            # Fallback: use simple contour-based segmentation
            return self._fallback_segmentation(image)
        
        # SAM expects RGB, OpenCV gives BGR — convert
        rgb_image = image[:, :, ::-1]
        
        log.info("🔍 Running SAM segmentation...")
        masks = self.mask_generator.generate(rgb_image)
        log.info(f"📦 SAM found {len(masks)} raw segments")
        
        # Process and classify each mask
        elements = []
        for mask_data in masks:
            element = self._process_mask(image, mask_data)
            if element:
                elements.append(element)
        
        # Sort by confidence
        elements.sort(key=lambda x: x["confidence"], reverse=True)
        log.info(f"✅ Segmentation complete: {len(elements)} diagram elements")
        
        return elements

    def _process_mask(self, image: np.ndarray, mask_data: dict) -> dict:
        """
        Process a single SAM mask into a structured diagram element.
        
        SAM returns:
        - segmentation: binary mask
        - bbox: [x, y, w, h]
        - area: pixel count
        - predicted_iou: quality score
        - stability_score: how stable this mask is
        """
        mask = mask_data["segmentation"]  # bool array H×W
        bbox = mask_data["bbox"]           # [x, y, w, h]
        area = mask_data["area"]
        confidence = mask_data["predicted_iou"]
        
        x, y, w, h = [int(v) for v in bbox]
        
        # Skip very small segments (likely noise)
        if area < 200:
            return None
        
        # Crop the image to this segment
        crop = image[y:y+h, x:x+w]
        
        # Classify element type based on shape properties
        element_type = self._classify_element(mask, bbox, area)
        
        return {
            "mask": mask,
            "bbox": [x, y, w, h],
            "area": int(area),
            "confidence": float(confidence),
            "element_type": element_type,
            "crop": crop,
            "pil_crop": Image.fromarray(crop[:, :, ::-1]) if crop.size > 0 else None,
        }

    def _classify_element(self, mask: np.ndarray, bbox: list, area: int) -> str:
        """
        Heuristically classify a segment into diagram element types.
        
        CLASSIFICATION RULES:
        
        ARROW detection:
        - High aspect ratio (width/height > 3 or height/width > 3)
        - Long and thin shape
        - Low area relative to bounding box (not filled rectangle)
        
        BOX/NODE detection:
        - Roughly square aspect ratio (0.5 < w/h < 2.0)
        - High area fill (area / bbox_area > 0.5)
        - Medium size
        
        TEXT detection:
        - Wide, short bounding box (width >> height)
        - Low area (text is sparse pixels)
        
        Otherwise: UNKNOWN
        """
        x, y, w, h = bbox
        
        if w == 0 or h == 0:
            return "unknown"
        
        aspect_ratio = w / h
        bbox_area = w * h
        fill_ratio = area / bbox_area if bbox_area > 0 else 0
        
        # Arrow: high aspect ratio, low fill
        if (aspect_ratio > 4 or aspect_ratio < 0.25) and fill_ratio < 0.3:
            return "arrow"
        
        # Box/Node: near-square, filled
        if 0.4 < aspect_ratio < 2.5 and fill_ratio > 0.4 and area > 1000:
            return "box"
        
        # Text: wide, short, sparse
        if aspect_ratio > 2.0 and fill_ratio < 0.4:
            return "text"
        
        return "unknown"

    def _fallback_segmentation(self, image: np.ndarray) -> List[Dict]:
        """
        Fallback when SAM is not available.
        Uses OpenCV contour detection to find regions.
        """
        import cv2
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        elements = []
        h_img, w_img = image.shape[:2]
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 500 or area > 0.8 * h_img * w_img:
                continue
            
            x, y, w, h = cv2.boundingRect(contour)
            crop = image[y:y+h, x:x+w]
            mask = np.zeros(image.shape[:2], dtype=bool)
            cv2.drawContours(mask.astype(np.uint8) * 255, [contour], -1, 255, -1)
            mask = mask.astype(bool)
            
            element_type = self._classify_element(mask, [x, y, w, h], int(area))
            
            elements.append({
                "mask": mask,
                "bbox": [x, y, w, h],
                "area": int(area),
                "confidence": 0.75,  # Assumed confidence for fallback
                "element_type": element_type,
                "crop": crop,
                "pil_crop": Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)) if crop.size > 0 else None,
            })
        
        log.info(f"📌 Fallback segmentation found {len(elements)} elements")
        return elements


# Singleton
sam_service = SAMSegmentationService()
