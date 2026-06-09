import os
import logging
import torch
import torch.nn as nn
import numpy as np

log = logging.getLogger(__name__)

class DiagramClassifierHead(nn.Module):
    """
    Lightweight Linear head on top of DINOv2 embeddings (1024 dimensions).
    Maps 1024 features to 6 diagram categories:
    0: flowchart
    1: dsa
    2: architecture
    3: er_diagram
    4: class_diagram
    5: unknown
    """
    def __init__(self, input_dim=384, num_classes=6):
        super().__init__()
        self.classifier = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, num_classes)
        )
        
    def forward(self, x):
        return self.classifier(x)

# Categories list
CATEGORIES = ["flowchart", "dsa", "architecture", "er_diagram", "class_diagram", "unknown"]

class DiagramClassifier:
    """
    Wrapper for loading and executing the PyTorch classifier head.
    """
    def __init__(self, model_path="./models/classifier_head.pth"):
        self.model_path = model_path
        self.model = None
        self.device = "cpu"
        self._loaded = False
        
    def load(self):
        if self._loaded:
            return True
            
        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model = DiagramClassifierHead(input_dim=384, num_classes=len(CATEGORIES))
            
            if os.path.exists(self.model_path):
                self.model.load_state_dict(torch.load(self.model_path, map_location=self.device, weights_only=False))
                log.info(f"✅ Loaded Diagram Classifier Head weights from {self.model_path}")
            else:
                log.warning(f"⚠️  Diagram Classifier Head weights not found at {self.model_path}. Using untrained weights.")
                
            self.model.to(self.device)
            self.model.eval()
            self._loaded = True
            return True
        except Exception as e:
            log.error(f"❌ Failed to load Diagram Classifier Head: {e}")
            return False
            
    def predict(self, embedding: np.ndarray) -> tuple[str, float]:
        """
        Predict diagram type and returns (category_name, confidence).
        """
        if not self._loaded:
            self.load()
            
        if self.model is None:
            return "unknown", 0.0
            
        try:
            # Prepare tensor
            x = torch.tensor(embedding, dtype=torch.float32).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                logits = self.model(x)
                probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
                
            class_idx = int(np.argmax(probs))
            category = CATEGORIES[class_idx]
            confidence = float(probs[class_idx])
            
            return category, confidence
        except Exception as e:
            log.error(f"Prediction error in DiagramClassifier: {e}")
            return "unknown", 0.0

# Singleton instance
diagram_classifier = DiagramClassifier()
