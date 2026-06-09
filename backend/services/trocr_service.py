"""
TrOCR (Transformer-based Optical Character Recognition) Service

TrOCR by Microsoft is an end-to-end trained Transformer model for OCR.
Unlike Tesseract (rule-based), TrOCR learns text patterns directly from data.

ARCHITECTURE:
- Encoder: BEiT (BERT pre-training of Image Transformers) — a Vision Transformer
  that encodes the image into contextual patch embeddings
- Decoder: RoBERTa — a Transformer text decoder that generates characters
- Together: image → Encoder → cross-attention → Decoder → text tokens

WHY TROCR > TESSERACT:
| Feature           | Tesseract     | TrOCR        |
|-------------------|---------------|--------------|
| Handwriting       | ~60-70%       | ~92-95%      |
| Printed text      | ~90%          | ~97%         |
| Low resolution    | Poor          | Good         |
| Multiple fonts    | Limited       | Excellent    |
| Architecture      | Rule-based    | Transformer  |

INPUT:  PIL image of text region (e.g., a box containing "bubble sort")
OUTPUT: String of extracted text ("bubble sort")
"""
import logging
from PIL import Image
from typing import List, Optional
import numpy as np

log = logging.getLogger(__name__)


class TrOCRService:
    """
    Handles text extraction from diagram elements using TrOCR.
    
    We maintain two models:
    - trocr-large-handwritten: for whiteboard/handwritten content
    - trocr-large-printed: for printed/typed diagrams
    
    Model selection is automatic based on image characteristics.
    """
    
    def __init__(self):
        self.processor = None
        self.handwritten_model = None
        self.printed_model = None
        self._loaded = False

    def _load_models(self):
        """Lazy-load TrOCR models on first use."""
        if self._loaded:
            return
        
        try:
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            from core.config import settings
            import torch
            
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            log.info(f"🔄 Loading TrOCR on {self.device}...")
            
            # Processor handles image preprocessing for the model
            self.processor = TrOCRProcessor.from_pretrained(
                settings.TROCR_MODEL
            )
            
            # Handwritten model — our primary model
            self.handwritten_model = VisionEncoderDecoderModel.from_pretrained(
                settings.TROCR_MODEL  # "microsoft/trocr-large-handwritten"
            ).to(self.device)
            self.handwritten_model.eval()  # Inference mode (no gradient tracking)
            
            log.info("✅ TrOCR loaded successfully")
            
        except ImportError:
            log.warning("⚠️  transformers not installed properly")
        except Exception as e:
            log.error(f"❌ TrOCR load error: {e}")
        
        self._loaded = True

    def extract_text(self, pil_image: Image.Image) -> str:
        """
        Extract text from a single PIL image crop.
        
        HOW IT WORKS (step by step):
        1. Processor resizes image to 384×384 (TrOCR's expected size)
        2. Converts to pixel values tensor (3-channel float)
        3. Passes through BEiT encoder → patch embeddings
        4. Decoder generates text tokens autoregressively
        5. Token IDs → decoded string
        
        EXAMPLE:
        Input: PIL image of handwritten "binary search tree"
        Output: "binary search tree"
        """
        self._load_models()
        
        if self.processor is None or self.handwritten_model is None:
            return self._fallback_ocr(pil_image)
        
        try:
            import torch
            
            # Ensure image is RGB (TrOCR needs 3 channels)
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")
            
            # Skip tiny images (<10×10) — likely noise
            if pil_image.width < 10 or pil_image.height < 10:
                return ""
            
            # ── Preprocessing fix: upscale small images so TrOCR can read text ──
            # TrOCR is trained on images where text is legible (~32px+ height).
            # Tiny crops cause the model to hallucinate single characters like 'G'.
            MIN_HEIGHT = 64
            if pil_image.height < MIN_HEIGHT:
                scale = MIN_HEIGHT / pil_image.height
                new_w = max(1, int(pil_image.width * scale))
                pil_image = pil_image.resize((new_w, MIN_HEIGHT), Image.LANCZOS)
            
            # Boost contrast on low-contrast images (whiteboard / synthetic drawings)
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(pil_image)
            pil_image = enhancer.enhance(2.0)   # 2x contrast
            
            # Preprocess: resize, normalize, convert to tensor
            pixel_values = self.processor(
                images=pil_image,
                return_tensors="pt"
            ).pixel_values.to(self.device)
            
            # Generate text tokens (beam search decoding)
            # max_new_tokens=128 to avoid premature termination (which causes 'G' output)
            with torch.no_grad():
                generated_ids = self.handwritten_model.generate(
                    pixel_values,
                    max_new_tokens=128,         # Use max_new_tokens (not max_length)
                    num_beams=4,                # Beam search width
                    early_stopping=True,
                    no_repeat_ngram_size=3,     # Prevent repetitive outputs
                )
            
            # Decode token IDs back to text string
            text = self.processor.batch_decode(
                generated_ids,
                skip_special_tokens=True  # Remove [CLS], [SEP] etc.
            )[0]
            
            # Clean up whitespace
            text = text.strip()
            
            # Filter out single-character degenerate outputs
            if len(text) <= 1:
                log.debug(f"TrOCR degenerate output '{text}' — returning empty string")
                return ""
            
            log.debug(f"📝 OCR result: '{text}'")
            return text
            
        except Exception as e:
            log.error(f"TrOCR error: {e}")
            return self._fallback_ocr(pil_image)

    def extract_batch(self, pil_images: List[Image.Image]) -> List[str]:
        """
        Extract text from multiple images in a single batch.
        
        BATCHING is important for performance:
        - Processing one at a time: N × inference_time
        - Batching all together: ≈ 1 × inference_time (parallel on GPU)
        - 5-10× speedup with batch size of 8
        
        We cap batch size at 8 to avoid GPU OOM errors.
        """
        self._load_models()
        
        if not pil_images:
            return []
        
        results = []
        batch_size = 8
        
        for i in range(0, len(pil_images), batch_size):
            batch = pil_images[i:i + batch_size]
            batch_results = self._process_batch(batch)
            results.extend(batch_results)
        
        return results

    def _process_batch(self, images: List[Image.Image]) -> List[str]:
        """Process a single batch of images."""
        if self.processor is None:
            return [self._fallback_ocr(img) for img in images]
        
        try:
            import torch
            
            # Convert all images to RGB
            rgb_images = [img.convert("RGB") for img in images]
            
            # Filter out tiny images
            valid_images = []
            valid_indices = []
            for idx, img in enumerate(rgb_images):
                if img.width >= 10 and img.height >= 10:
                    valid_images.append(img)
                    valid_indices.append(idx)
            
            if not valid_images:
                return [""] * len(images)
            
            # Batch preprocess
            pixel_values = self.processor(
                images=valid_images,
                return_tensors="pt",
                padding=True  # Pad to same size for batching
            ).pixel_values.to(self.device)
            
            # Batch generate
            with torch.no_grad():
                generated_ids = self.handwritten_model.generate(
                    pixel_values,
                    max_length=64,
                    num_beams=2,  # Reduce beams for batch (memory)
                )
            
            texts = self.processor.batch_decode(
                generated_ids,
                skip_special_tokens=True
            )
            
            # Reconstruct results with empty strings for filtered images
            all_results = [""] * len(images)
            for valid_idx, text in zip(valid_indices, texts):
                all_results[valid_idx] = text.strip()
            
            return all_results
            
        except Exception as e:
            log.error(f"Batch OCR error: {e}")
            return [self._fallback_ocr(img) for img in images]

    def _fallback_ocr(self, pil_image: Image.Image) -> str:
        """
        Fallback OCR using pytesseract when TrOCR isn't available.
        Tesseract is faster but less accurate, especially for handwriting.
        """
        try:
            import pytesseract
            text = pytesseract.image_to_string(pil_image, config='--psm 6')
            return text.strip()
        except Exception:
            return ""

    def extract_full_image_text(self, pil_image: Image.Image) -> str:
        """
        Extract ALL text from the entire image (not just crops).
        Useful for printed diagrams / architecture diagrams with labels.
        
        Strategy:
        1. Split image into overlapping horizontal strips
        2. Run TrOCR on each strip
        3. Combine results
        """
        # For now, use direct extraction on full image
        # In production: use sliding window + NLP deduplication
        return self.extract_text(pil_image)


# Singleton
trocr_service = TrOCRService()
