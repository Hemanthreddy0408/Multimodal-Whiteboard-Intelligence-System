import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from PIL import Image

# Add backend directory to path
sys.path.append("/Users/hemanthreddy/Desktop/Multimodal Whiteboard Intelligence System/backend")

from core.database import init_db
from services.dinov2_service import dinov2_service
from models.classifier_head import DiagramClassifierHead, CATEGORIES

def load_split_data(dataset_dir, split):
    split_dir = os.path.join(dataset_dir, split)
    embeddings = []
    labels = []
    
    print(f"📦 Extracting DINOv2 embeddings for split: {split}...")
    
    for category in CATEGORIES:
        cat_dir = os.path.join(split_dir, category)
        if not os.path.isdir(cat_dir):
            continue
            
        cat_idx = CATEGORIES.index(category)
        files = [f for f in os.listdir(cat_dir) if f.endswith(".png")]
        
        print(f"  Category '{category}': found {len(files)} files")
        
        for file in files:
            file_path = os.path.join(cat_dir, file)
            try:
                # Load PIL image
                img = Image.open(file_path).convert("RGB")
                # Generate embedding
                embedding = dinov2_service.generate_embedding(img)
                embeddings.append(embedding)
                labels.append(cat_idx)
            except Exception as e:
                print(f"    Error processing {file}: {e}")
                
    return np.array(embeddings), np.array(labels)

def train_classifier():
    dataset_dir = "/Users/hemanthreddy/Desktop/Multimodal Whiteboard Intelligence System/backend/tests/synthetic_dataset"
    
    # Check if dataset exists
    if not os.path.exists(dataset_dir):
        print("❌ Dataset not found! Run generate_dataset.py first.")
        return
        
    # Load Train and Eval splits
    x_train, y_train = load_split_data(dataset_dir, "train")
    x_eval, y_eval = load_split_data(dataset_dir, "eval")
    
    if len(x_train) == 0:
        print("❌ No training embeddings extracted!")
        return
        
    print(f"📊 Training shape: {x_train.shape}, labels: {y_train.shape}")
    print(f"📊 Evaluation shape: {x_eval.shape}, labels: {y_eval.shape}")
    
    # Compute class prototypes (centroids) for calibration
    class_prototypes = {}
    for i, category in enumerate(CATEGORIES):
        indices = np.where(y_train == i)[0]
        if len(indices) > 0:
            category_embeddings = x_train[indices]
            centroid = np.mean(category_embeddings, axis=0)
            # Normalize centroid
            centroid = centroid / (np.linalg.norm(centroid) + 1e-8)
            class_prototypes[category] = centroid
            
    # Save class prototypes
    prototypes_path = "/Users/hemanthreddy/Desktop/Multimodal Whiteboard Intelligence System/backend/models/class_prototypes.pt"
    torch.save(class_prototypes, prototypes_path)
    print(f"💾 Saved class prototypes to {prototypes_path}")
    
    # Convert to PyTorch Tensors
    X_train_t = torch.tensor(x_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.long)
    X_eval_t = torch.tensor(x_eval, dtype=torch.float32)
    y_eval_t = torch.tensor(y_eval, dtype=torch.long)
    
    # Define model
    model = DiagramClassifierHead(input_dim=384, num_classes=len(CATEGORIES))
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # Training Loop
    epochs = 40
    batch_size = 16
    print(f"🏋️ Training classifier head for {epochs} epochs...")
    
    model.train()
    for epoch in range(epochs):
        permutation = torch.randperm(X_train_t.size()[0])
        epoch_loss = 0
        
        for i in range(0, X_train_t.size()[0], batch_size):
            optimizer.zero_grad()
            
            indices = permutation[i:i+batch_size]
            batch_x, batch_y = X_train_t[indices], y_train_t[indices]
            
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item() * len(batch_x)
            
        epoch_loss /= X_train_t.size()[0]
        
        if (epoch + 1) % 5 == 0 or epoch == 0:
            # Eval accuracy
            model.eval()
            with torch.no_grad():
                eval_outputs = model(X_eval_t)
                val_loss = criterion(eval_outputs, y_eval_t).item()
                preds = torch.argmax(eval_outputs, dim=1)
                acc = (preds == y_eval_t).float().mean().item() * 100
            print(f"  Epoch {epoch+1:02d}/{epochs:02d} | Train Loss: {epoch_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {acc:.1f}%")
            model.train()
            
    # Save model weights
    save_path = "/Users/hemanthreddy/Desktop/Multimodal Whiteboard Intelligence System/backend/models/classifier_head.pth"
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    torch.save(model.state_dict(), save_path)
    print(f"🎉 Model weights saved successfully to {save_path}")

if __name__ == "__main__":
    train_classifier()
