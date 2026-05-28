# 🧠 Multimodal Whiteboard Intelligence System

> **AI-powered diagram understanding: transform any visual diagram into working code, explanations, and semantic knowledge — powered by Vision Transformers and LLMs.**

---

## 🏗️ Architecture Overview

```
Frontend (Next.js + TypeScript)
    ↓ REST API + WebSockets
Backend (FastAPI + Python)
    ↓ AI Pipeline
OpenCV → SAM → TrOCR → DINOv2 → Qdrant → GPT-4o/Gemini/Llama3
    ↓ Storage
PostgreSQL (metadata) + Qdrant (vectors) + Redis (queue/cache)
```

## ✨ Features

| Feature | Technology |
|---------|-----------|
| Image Upload + Webcam + Whiteboard | Next.js, HTML5 Canvas, MediaDevices API |
| Image Preprocessing | OpenCV (deskew, denoise, binarize) |
| Diagram Segmentation | SAM (Segment Anything Model) |
| Handwritten OCR | TrOCR (Microsoft) |
| Semantic Embeddings | DINOv2-Large (Meta) |
| Similarity Search | Qdrant Vector DB (HNSW) |
| Code Generation | GPT-4o / Gemini / Llama 3 |
| Real-time Updates | WebSockets |
| Background Processing | Celery + Redis |
| Attention Heatmaps | DINOv2 attention maps |

---

## 🚀 Quick Start (Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional, for full stack)

### Option A: Manual Setup

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys (OPENAI_API_KEY or GOOGLE_API_KEY)

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Option B: Docker Compose (Full Stack)
```bash
cd docker
# Edit backend/.env with your API keys first
docker-compose up -d
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Qdrant UI: http://localhost:6333/dashboard
- Flower (Celery): http://localhost:5555

---

## 🤖 AI Models Setup

### TrOCR + DINOv2 (Auto-downloaded)
These models are automatically downloaded from HuggingFace on first run.
They will be cached in `~/.cache/huggingface/`.
- TrOCR: ~1.2GB
- DINOv2-Large: ~1.1GB

### SAM (Manual Download Required)
```bash
mkdir -p backend/models
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth \
     -O backend/models/sam_vit_h_4b8939.pth
```
File size: ~2.5GB

### Ollama (Local LLM — Free, No API Key)
```bash
brew install ollama           # macOS
ollama run llama3             # Download and run Llama3 locally
```
Then set `OLLAMA_BASE_URL=http://localhost:11434` in `.env`

---

## 📁 Project Structure

```
Multimodal Whiteboard Intelligence System/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example               # Environment variables template
│   ├── core/
│   │   ├── config.py              # Pydantic Settings
│   │   └── database.py            # PostgreSQL + Qdrant setup
│   ├── models/
│   │   └── schemas.py             # ORM models + Pydantic schemas
│   ├── services/
│   │   ├── opencv_service.py      # Image preprocessing
│   │   ├── sam_service.py         # Segmentation
│   │   ├── trocr_service.py       # OCR
│   │   ├── dinov2_service.py      # Vision embeddings
│   │   ├── vector_service.py      # Qdrant operations
│   │   ├── llm_service.py         # LLM reasoning
│   │   └── pipeline.py            # Master orchestrator
│   ├── api/routes/
│   │   ├── analyze.py             # POST /api/analyze
│   │   ├── chat.py                # POST /api/chat
│   │   ├── search.py              # GET /api/search
│   │   ├── sessions.py            # Session management
│   │   ├── health.py              # Health checks
│   │   └── websocket_router.py    # WebSocket manager
│   └── workers/
│       ├── celery_app.py          # Celery configuration
│       └── tasks.py               # Background tasks
├── frontend/
│   ├── app/
│   │   ├── layout.tsx             # Root layout + SEO
│   │   ├── page.tsx               # Main page
│   │   └── globals.css            # Design system
│   ├── components/
│   │   ├── Header.tsx             # Top navigation
│   │   ├── Sidebar.tsx            # Mode selector
│   │   ├── UploadPanel.tsx        # Image upload + progress
│   │   ├── WhiteboardCanvas.tsx   # Drawing canvas
│   │   ├── AnalysisPanel.tsx      # Results display
│   │   └── ChatInterface.tsx      # AI chat
│   └── types/
│       └── index.ts               # TypeScript definitions
├── docker/
│   ├── docker-compose.yml         # Full stack deployment
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
└── docs/
    └── ARCHITECTURE.md            # Deep-dive technical guide
```

---

## 🔌 API Reference

### POST /api/analyze
Upload a diagram image for full AI analysis.

```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@diagram.png" \
  -F "question=Generate Python code for this flowchart" \
  -F "target_language=python" \
  -F "session_id=my-session"
```

Response:
```json
{
  "job_id": "uuid",
  "status": "queued",
  "message": "Connect to WebSocket at /ws/{job_id} for live updates"
}
```

### WebSocket: /ws/{job_id}
Real-time progress updates:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/your-job-id');
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  // msg.event: "progress" | "result" | "error"
  // msg.progress: 0-100
  // msg.data: full result (on "result" event)
};
```

### POST /api/chat
Ask questions about analyzed diagrams:
```json
{
  "question": "What is the time complexity?",
  "context": { /* analysis result */ }
}
```

---

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## 🚢 Production Deployment

### On AWS (EC2 + GPU)
```bash
# g4dn.xlarge: 1x T4 GPU, $0.526/hr
# Recommended for DINOv2 + TrOCR + SAM

# Install Docker + NVIDIA Container Toolkit
apt-get install -y docker.io nvidia-container-toolkit

# Clone and deploy
git clone <your-repo>
cd "Multimodal Whiteboard Intelligence System/docker"
docker-compose up -d
```

### On RunPod (Cheaper GPU)
RunPod offers spot GPU instances from $0.20/hr.
Use the PyTorch template and run Docker Compose.

---

## ⚡ Performance Notes

| Model | CPU Time | GPU Time (T4) |
|-------|----------|---------------|
| OpenCV | <100ms | N/A |
| SAM | 5-15s | 1-3s |
| TrOCR (batch 8) | 10-30s | 2-5s |
| DINOv2 | 3-8s | 0.5-1s |
| LLM (GPT-4o) | 3-10s | N/A (API) |
| **Total** | **25-65s** | **7-20s** |

---

## 💼 Resume Description

> **Multimodal Whiteboard Intelligence System** | *Python, FastAPI, Next.js, TypeScript*  
> Built a production-grade AI application converting hand-drawn diagrams into working code using Vision Transformers (DINOv2, TrOCR), SAM segmentation, and LLM reasoning (GPT-4o/Gemini/Llama3). Implemented real-time WebSocket pipeline with Celery/Redis task queue, Qdrant vector database for semantic diagram search, and full-stack Next.js frontend with interactive whiteboard, webcam capture, and attention heatmap visualization. Deployed with Docker Compose supporting horizontal scaling.

**Key skills demonstrated:** Multimodal AI, Vision Transformers, OCR, Vector Databases, RAG, FastAPI, WebSockets, Next.js, TypeScript, Docker, Production ML Systems

---

## 📚 Learn More

- [Architecture Deep Dive](./docs/ARCHITECTURE.md)
- [DINOv2 Paper](https://arxiv.org/abs/2304.07193)
- [SAM Paper](https://arxiv.org/abs/2304.02643)
- [TrOCR Paper](https://arxiv.org/abs/2109.10282)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
# Multimodal-Whiteboard-Intelligence-System
