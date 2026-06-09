// TypeScript interfaces for the entire application

export interface DiagramElement {
  id: number;
  type: "box" | "arrow" | "text" | "unknown";
  text: string;
  bbox: [number, number, number, number]; // [x, y, w, h]
  confidence: number;
}

export interface Relationship {
  from: string;
  to: string;
  relationship: string;
}

export interface Complexity {
  time?: string;
  space?: string;
}

export interface SimilarDiagram {
  id: string;
  score: number;
  diagram_type: string;
  ocr_text: string;
  explanation: string;
  file_path?: string;
}

export interface AnalysisResult {
  upload_id: string;
  session_id: string;
  diagram_type: string;
  elements: DiagramElement[];
  ocr_text: string;
  explanation: string;
  generated_code: string | null;
  code_explanation: string;
  summary: string;
  relationships: Relationship[];
  similar_diagrams: SimilarDiagram[];
  attention_map_url: string | null;
  confidence: number;
  model_used: string;
  embedding_id: string | null;
  algorithm_pattern?: string | null;
  complexity?: Complexity;
  language?: string;
  error?: string;
  latencies?: Record<string, number>;
  estimated_cost?: number;
  low_confidence?: boolean;
}

export interface PipelineProgress {
  stage: string;
  progress: number;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export type InputMode = "upload" | "whiteboard" | "webcam";

export type ProgrammingLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "java"
  | "cpp"
  | "go"
  | "rust"
  | "kotlin";

export const STAGE_LABELS: Record<string, string> = {
  uploading: "Uploading",
  queued: "Queued",
  preprocessing: "OpenCV Preprocessing",
  segmentation: "SAM Segmentation",
  ocr: "TrOCR Text Extraction",
  classification: "Diagram Classification",
  embedding: "DINOv2 Embedding",
  vector_search: "Semantic Search",
  attention: "Attention Heatmap",
  llm_analysis: "LLM Reasoning",
  complete: "Complete",
  error: "Error",
};

export const STAGE_ICONS: Record<string, string> = {
  uploading: "⬆️",
  queued: "⏳",
  preprocessing: "🔧",
  segmentation: "🧩",
  ocr: "📝",
  classification: "🏷️",
  embedding: "🔢",
  vector_search: "🔍",
  attention: "👁️",
  llm_analysis: "🤖",
  complete: "✅",
  error: "❌",
};
