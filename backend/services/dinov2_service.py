"""
DINOv2 Vision Transformer Embedding Service

DINOv2 (by Meta AI, 2023) is the state-of-the-art self-supervised Vision Transformer.
It generates rich, semantic embeddings from images that capture meaning, not just pixels.

WHAT IS A VISION TRANSFORMER (ViT)?

Traditional CNNs process images with sliding local filters — they see only
small neighborhoods at a time and gradually build up global understanding.

ViT takes a radically different approach:
1. PATCH CREATION: Divide the image into N patches (e.g., 16×16 pixels each)
   - 224×224 image ÷ 16×16 patches = 196 patches (tokens)

2. PATCH EMBEDDING: Each patch → linear projection → 1024-dim vector
   - Like word embeddings in NLP, each patch becomes a "word" in image "vocabulary"

3. POSITION EMBEDDING: Add position info (patch 1, 2, 3... up to 196)
   - Without this, model wouldn't know WHERE each patch is

4. [CLS] TOKEN: Special summary token prepended to the sequence
   - After Transformer layers, this token contains a summary of the WHOLE image

5. TRANSFORMER ENCODER: 24 layers of Multi-Head Self-Attention + Feed-Forward
   - Every patch attends to every other patch in each layer
   - The model learns: "this arrow patch is related to this box patch"

6. OUTPUT: 1024-dimensional CLS embedding — the "DNA" of the diagram

WHY THESE EMBEDDINGS ARE POWERFUL:
- Similar diagrams → similar embeddings (small cosine distance)
- "Binary search tree" diagram ≈ "BST" diagram in embedding space
- You can search for similar diagrams using fast nearest-neighbor search
- Embeddings are transferable: DINOv2 trained on ImageNet generalizes to diagrams

DINOV2 vs CLIP vs RESNET for Embeddings:
| Model    | Training       | Embedding Dim | Semantic Quality |
|----------|----------------|---------------|-----------------|
| ResNet   | Supervised     | 2048          | Medium           |
| CLIP     | Contrastive    | 512-1024      | High (text-img)  |
| DINOv2   | Self-supervised| 1024          | Highest (visual) |

We chose DINOv2-large because:
- Best visual representation quality
- No need for text-image pairs
- Dense feature maps (useful for attention visualization)
- Excellent zero-shot performance on custom domains
"""
import logging
import numpy as np
from PIL import Image
from typing import Optional, List, Tuple
import io

log = logging.getLogger(__name__)


class DINOv2EmbeddingService:
    """
    Generates semantic visual embeddings using DINOv2-Large.
    
    These embeddings are:
    - 1024-dimensional float32 vectors
    - L2-normalized (unit sphere)
    - Stored in Qdrant for fast similarity search
    """
    
    def __init__(self):
        self.model = None
        self.processor = None
        self._loaded = False
        self.embedding_dim = 384  # DINOv2-small output dimension

    def _load_model(self):
        """Lazy-load DINOv2-large model."""
        if self._loaded:
            return
        
        try:
            from transformers import AutoImageProcessor, AutoModel
            from core.config import settings
            import torch
            
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            model_name = settings.DINOV2_MODEL  # "facebook/dinov2-large"
            
            log.info(f"🔄 Loading DINOv2 ({model_name}) on {self.device}...")
            
            # Image processor: handles resizing to 518×518 and normalization
            self.processor = AutoImageProcessor.from_pretrained(model_name)
            
            # Main model: 307M parameters, ViT-Large architecture
            self.model = AutoModel.from_pretrained(model_name).to(self.device)
            self.model.eval()  # No dropout during inference
            
            log.info("✅ DINOv2 loaded successfully")
            
        except ImportError as e:
            log.warning(f"⚠️  transformers not available: {e}")
        except Exception as e:
            log.error(f"❌ DINOv2 load error: {e}")
        
        self._loaded = True

    def generate_embedding(self, pil_image: Image.Image) -> np.ndarray:
        """
        Generate a 1024-dim semantic embedding for an image.
        
        STEP BY STEP:
        
        1. Processor resizes image to 518×518 (DINOv2's training resolution)
           - 518 = 14×37, divisible by patch size 14
        
        2. Normalizes pixels: (pixel - mean) / std
           - Mean/std from ImageNet statistics
        
        3. Converts to tensor: shape (1, 3, 518, 518)
           - Batch size 1, 3 RGB channels, 518×518 pixels
        
        4. Splits into patches: 518÷14 = 37 patches per side
           - Total: 37×37 = 1369 patches
        
        5. Each patch → linear projection → 1024-dim vector
        
        6. Forward pass through 24 Transformer layers
           - Each layer: Multi-Head Self-Attention + Layer Norm + Feed-Forward
           - attention computes: softmax(QK^T / √d) × V
        
        7. Extract CLS token output: shape (1, 1024)
        
        8. L2 normalize: vector / ||vector||
           - Ensures all embeddings live on unit sphere
           - Cosine similarity becomes simple dot product
        
        Args:
            pil_image: Input diagram image
            
        Returns:
            numpy array of shape (1024,) — the semantic embedding
        """
        self._load_model()
        
        if self.model is None:
            return self._fallback_embedding(pil_image)
        
        try:
            import torch
            
            # Ensure RGB
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")
            
            # Preprocess
            inputs = self.processor(images=pil_image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Forward pass (no gradients needed for inference)
            with torch.no_grad():
                outputs = self.model(**inputs)
                
                # last_hidden_state shape: (batch, num_tokens, hidden_dim)
                # Token 0 = CLS token = global image summary
                cls_embedding = outputs.last_hidden_state[:, 0, :]  # (1, 1024)
            
            # Convert to numpy and L2-normalize
            embedding = cls_embedding.cpu().numpy()[0]  # (1024,)
            embedding = embedding / (np.linalg.norm(embedding) + 1e-8)
            
            log.debug(f"🔢 Generated embedding: shape={embedding.shape}, norm={np.linalg.norm(embedding):.3f}")
            return embedding
            
        except Exception as e:
            log.error(f"❌ Embedding generation error: {e}")
            return self._fallback_embedding(pil_image)

    def generate_attention_map(self, pil_image: Image.Image) -> Optional[np.ndarray]:
        """
        Extract the self-attention maps from DINOv2's last Transformer layer.
        
        Attention maps visualize WHERE the model is "looking" when it processes
        the image. This creates the "heatmap" feature in our UI.
        
        HOW IT WORKS:
        1. Run forward pass with output_attentions=True
        2. Get attention weights from last layer: shape (heads, tokens, tokens)
        3. Average across attention heads
        4. Extract attention from CLS token to all patch tokens
           (This shows: "which patches does the global summary attend to?")
        5. Reshape from (N_patches,) → (37, 37) spatial grid
        6. Resize to match original image dimensions
        7. Normalize to [0, 1] for visualization
        
        Returns:
            Heatmap as numpy array (H, W) with values 0-1
        """
        self._load_model()
        
        if self.model is None:
            return None
        
        try:
            import torch
            
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")
            
            inputs = self.processor(images=pil_image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model(**inputs, output_attentions=True)
            
            # Get last layer attention: (batch, heads, tokens, tokens)
            last_attn = outputs.attentions[-1]  
            
            # Average over heads
            attn_mean = last_attn[0].mean(dim=0)  # (tokens, tokens)
            
            # CLS token's attention to all patch tokens (skip CLS→CLS)
            cls_to_patches = attn_mean[0, 1:]  # (N_patches,)
            
            # Determine grid size
            n_patches = cls_to_patches.shape[0]
            grid_size = int(n_patches ** 0.5)  # e.g., sqrt(1369) = 37
            
            # Reshape to spatial grid
            attn_map = cls_to_patches.reshape(grid_size, grid_size).cpu().numpy()
            
            # Normalize to [0, 1]
            attn_map = (attn_map - attn_map.min()) / (attn_map.max() - attn_map.min() + 1e-8)
            
            # Resize to original image size using PIL
            w, h = pil_image.size
            attn_pil = Image.fromarray((attn_map * 255).astype(np.uint8))
            attn_resized = attn_pil.resize((w, h), Image.BILINEAR)
            
            return np.array(attn_resized) / 255.0
            
        except Exception as e:
            log.error(f"Attention map error: {e}")
            return None

    def save_attention_visualization(self, pil_image: Image.Image,
                                     attention_map: np.ndarray,
                                     save_path: str) -> str:
        """
        Overlay the attention heatmap on the original image and save.
        
        Creates a colorful "where is the AI looking?" visualization.
        Uses a JET colormap: blue (low attention) → red (high attention).
        """
        import cv2
        
        img_array = np.array(pil_image)
        
        # Convert attention to colormap (JET: blue→green→yellow→red)
        attn_uint8 = (attention_map * 255).astype(np.uint8)
        heatmap = cv2.applyColorMap(attn_uint8, cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Blend original image with heatmap (50% each)
        if img_array.shape[:2] != heatmap_rgb.shape[:2]:
            heatmap_rgb = cv2.resize(heatmap_rgb, 
                                      (img_array.shape[1], img_array.shape[0]))
        
        blended = cv2.addWeighted(img_array, 0.6, heatmap_rgb, 0.4, 0)
        
        # Save
        result = Image.fromarray(blended)
        result.save(save_path)
        return save_path

    def _fallback_embedding(self, pil_image: Image.Image) -> np.ndarray:
        """
        Fallback: generate a random normalized embedding when DINOv2 is unavailable.
        In production, use CLIP or a smaller ViT instead.
        """
        log.warning("Using fallback random embedding (DINOv2 not available)")
        embedding = np.random.randn(self.embedding_dim).astype(np.float32)
        embedding = embedding / (np.linalg.norm(embedding) + 1e-8)
        return embedding

    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Since embeddings are L2-normalized, cosine similarity = dot product.
        
        Returns value in [-1, 1]:
        - 1.0 = identical diagrams
        - 0.7+ = very similar (same type of diagram)
        - 0.3-0.7 = somewhat related
        - < 0.3 = different topics
        """
        return float(np.dot(embedding1, embedding2))


# Singleton
dinov2_service = DINOv2EmbeddingService()
