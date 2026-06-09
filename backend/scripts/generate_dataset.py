import os
import random
from PIL import Image, ImageDraw, ImageFont

def generate_flowchart(draw, width, height, font):
    # Flowchart elements: Start/End (rounded box/capsule), Process (rectangle), Decision (diamond)
    # Start node
    draw.rounded_rectangle([20, 20, 120, 60], radius=15, outline="black", width=3)
    draw.text((45, 30), "Start", fill="black", font=font)
    
    # Arrow 1
    draw.line([70, 60, 70, 110], fill="black", width=2)
    draw.polygon([65, 110, 75, 110, 70, 120], fill="black")
    
    # Process node 1
    draw.rectangle([20, 120, 120, 170], outline="black", width=3)
    draw.text((35, 135), "Initialize", fill="black", font=font)
    
    # Arrow 2
    draw.line([70, 170, 70, 220], fill="black", width=2)
    draw.polygon([65, 220, 75, 220, 70, 230], fill="black")
    
    # Decision node (diamond)
    # Coordinates of diamond: (70, 230), (130, 270), (70, 310), (10, 270)
    draw.polygon([70, 230, 130, 270, 70, 310, 10, 270], outline="black", width=3)
    draw.text((35, 260), "Is valid?", fill="black", font=font)
    
    # Yes arrow (down)
    draw.line([70, 310, 70, 370], fill="black", width=2)
    draw.polygon([65, 370, 75, 370, 70, 380], fill="black")
    draw.text((80, 330), "Yes", fill="black", font=font)
    
    # Process node 2
    draw.rectangle([20, 380, 120, 430], outline="black", width=3)
    draw.text((30, 395), "Process data", fill="black", font=font)
    
    # No arrow (right)
    draw.line([130, 270, 200, 270], fill="black", width=2)
    draw.polygon([200, 265, 200, 275, 210, 270], fill="black")
    draw.text((150, 250), "No", fill="black", font=font)
    
    # End node
    draw.rounded_rectangle([210, 250, 310, 290], radius=15, outline="black", width=3)
    draw.text((245, 260), "Stop", fill="black", font=font)

def generate_dsa(draw, width, height, font):
    # DSA elements: Node circles, pointers/links, memory boxes, stacks, queues
    # Binary Tree structure
    # Root
    draw.ellipse([200, 40, 250, 90], outline="black", width=3)
    draw.text((215, 55), "Root", fill="black", font=font)
    
    # Left Child
    draw.ellipse([100, 140, 150, 190], outline="black", width=3)
    draw.text((115, 155), "L:10", fill="black", font=font)
    
    # Right Child
    draw.ellipse([300, 140, 350, 190], outline="black", width=3)
    draw.text((315, 155), "R:30", fill="black", font=font)
    
    # Connectors
    draw.line([205, 85, 145, 145], fill="black", width=2)
    draw.line([245, 85, 305, 145], fill="black", width=2)
    
    # Left-Left Child
    draw.ellipse([50, 240, 100, 290], outline="black", width=3)
    draw.text((65, 255), "L-L", fill="black", font=font)
    draw.line([110, 185, 85, 240], fill="black", width=2)
    
    # Array/List Representation at the bottom
    for i in range(5):
        x = 50 + i * 60
        draw.rectangle([x, 380, x + 60, 430], outline="black", width=2)
        draw.text((x + 20, 395), f"[{i}]", fill="black", font=font)
        draw.text((x + 25, 412), str(random.randint(1, 99)), fill="black", font=font)
    draw.text((50, 350), "Array representation:", fill="black", font=font)

def generate_architecture(draw, width, height, font):
    # Architecture elements: boxes for client, api gateway, db, service, etc.
    # Client Box
    draw.rectangle([30, 50, 130, 110], outline="black", width=3)
    draw.text((50, 75), "Client UI", fill="black", font=font)
    
    # API Gateway
    draw.rectangle([180, 50, 280, 250], outline="black", width=3)
    draw.text((195, 140), "API Gateway", fill="black", font=font)
    draw.line([130, 80, 180, 80], fill="black", width=2)
    
    # Auth Service
    draw.rectangle([330, 50, 450, 110], outline="black", width=3)
    draw.text((350, 75), "Auth Service", fill="black", font=font)
    draw.line([280, 80, 330, 80], fill="black", width=2)
    
    # Data Service
    draw.rectangle([330, 170, 450, 230], outline="black", width=3)
    draw.text((350, 195), "Data Service", fill="black", font=font)
    draw.line([280, 200, 330, 200], fill="black", width=2)
    
    # Database (Cylinder)
    # Top ellipse
    draw.ellipse([350, 300, 430, 330], outline="black", width=3)
    # Bottom ellipse
    draw.ellipse([350, 380, 430, 410], outline="black", width=3)
    # Sides
    draw.line([350, 315, 350, 395], fill="black", width=3)
    draw.line([430, 315, 430, 395], fill="black", width=3)
    draw.text((365, 350), "PostgreSQL", fill="black", font=font)
    draw.line([390, 230, 390, 300], fill="black", width=2)

def generate_er_diagram(draw, width, height, font):
    # ER Diagram: Entities (rectangles), Attributes (ovals), Relationships (diamonds)
    # Entity 1: User
    draw.rectangle([40, 50, 140, 100], outline="black", width=3)
    draw.text((75, 70), "USER", fill="black", font=font)
    
    # Attributes for User
    draw.ellipse([10, 130, 70, 170], outline="black", width=2)
    draw.text((25, 145), "user_id", fill="black", font=font)
    draw.line([90, 100, 40, 130], fill="black", width=2)
    
    draw.ellipse([90, 130, 160, 170], outline="black", width=2)
    draw.text((115, 145), "email", fill="black", font=font)
    draw.line([90, 100, 125, 130], fill="black", width=2)
    
    # Relationship: Places (diamond)
    # Center (230, 75)
    draw.polygon([230, 45, 280, 75, 230, 105, 180, 75], outline="black", width=3)
    draw.text((205, 68), "places", fill="black", font=font)
    draw.line([140, 75, 180, 75], fill="black", width=2)
    
    # Entity 2: Order
    draw.rectangle([320, 50, 420, 100], outline="black", width=3)
    draw.text((355, 70), "ORDER", fill="black", font=font)
    draw.line([280, 75, 320, 75], fill="black", width=2)
    
    # Attributes for Order
    draw.ellipse([340, 130, 410, 170], outline="black", width=2)
    draw.text((355, 145), "order_id", fill="black", font=font)
    draw.line([370, 100, 375, 130], fill="black", width=2)

def generate_class_diagram(draw, width, height, font):
    # Class Diagram: divided boxes (class name, attributes, methods)
    # Class 1: User
    draw.rectangle([40, 40, 200, 180], outline="black", width=3)
    draw.line([40, 75, 200, 75], fill="black", width=2)
    draw.line([40, 130, 200, 130], fill="black", width=2)
    draw.text((85, 50), "User", fill="black", font=font)
    draw.text((45, 85), "- id: int\n- email: str", fill="black", font=font)
    draw.text((45, 140), "+ login()\n+ logout()", fill="black", font=font)
    
    # Class 2: Customer (inherits from User)
    draw.rectangle([40, 280, 200, 380], outline="black", width=3)
    draw.line([40, 315, 200, 315], fill="black", width=2)
    draw.text((80, 290), "Customer", fill="black", font=font)
    draw.text((45, 325), "+ checkout()", fill="black", font=font)
    
    # Generalization arrow (pointing from Customer to User)
    # Arrow head is a hollow triangle
    draw.line([120, 280, 120, 200], fill="black", width=2)
    draw.polygon([120, 180, 110, 200, 130, 200], fill="white", outline="black")

def generate_unknown(draw, width, height, font):
    # Unknown: random scribbles, math formulas, grids, or blank-like images
    # Math text
    draw.text((50, 80), "f(x) = dx/dy (sin(x) + cos(y))", fill="black", font=font)
    draw.text((50, 140), "E = mc^2", fill="black", font=font)
    draw.text((50, 200), "Sum(i=1 to n) i = n(n+1)/2", fill="black", font=font)
    
    # Doodles / scribbles
    for _ in range(10):
        x1 = random.randint(10, width - 10)
        y1 = random.randint(10, height - 10)
        x2 = random.randint(10, width - 10)
        y2 = random.randint(10, height - 10)
        draw.line([x1, y1, x2, y2], fill="black", width=random.randint(1, 3))
        
    # Draw random circle/doodle
    draw.ellipse([150, 250, 280, 380], outline="black", width=2)
    draw.line([130, 280, 300, 350], fill="black", width=1)

def generate_dataset(output_dir, num_train=30, num_eval=10):
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.join(output_dir, "train"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "eval"), exist_ok=True)
    
    generators = {
        "flowchart": generate_flowchart,
        "dsa": generate_dsa,
        "architecture": generate_architecture,
        "er_diagram": generate_er_diagram,
        "class_diagram": generate_class_diagram,
        "unknown": generate_unknown
    }
    
    font = ImageFont.load_default()
    
    # Generate train and eval data
    for category, generator_func in generators.items():
        print(f"Generating synthetic data for category: {category}...")
        for split, count in [("train", num_train), ("eval", num_eval)]:
            split_dir = os.path.join(output_dir, split, category)
            os.makedirs(split_dir, exist_ok=True)
            
            for i in range(count):
                # Create a blank white image
                image = Image.new("RGB", (518, 518), "white")
                draw = ImageDraw.Draw(image)
                
                # Draw the specific category items
                generator_func(draw, 518, 518, font)
                
                # Apply slight random rotation or noise to simulate handwriting/whiteboard photo
                # We can rotate slightly: -3 to +3 degrees
                angle = random.uniform(-4, 4)
                image = image.rotate(angle, fillcolor="white")
                
                # Save the image
                filename = f"{category}_{i:03d}.png"
                image.save(os.path.join(split_dir, filename))
                
    print(f"🎉 Dataset generation complete. Files saved in {output_dir}")

if __name__ == "__main__":
    generate_dataset("/Users/hemanthreddy/Desktop/Multimodal Whiteboard Intelligence System/backend/tests/synthetic_dataset")
