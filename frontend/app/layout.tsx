import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multimodal Whiteboard Intelligence System | AI Diagram Assistant",
  description: "AI-powered diagram understanding: upload whiteboard drawings, get code generation, OCR extraction, semantic search, and real-time explanations using Vision Transformers and LLMs.",
  keywords: ["AI", "diagram", "whiteboard", "code generation", "OCR", "computer vision", "transformer"],
  openGraph: {
    title: "Multimodal Whiteboard Intelligence System",
    description: "Transform diagrams into working code with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
