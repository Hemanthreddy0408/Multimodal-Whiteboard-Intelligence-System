import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "WhiteboardAI | Turn any whiteboard into working code",
  description: "AI-powered diagram understanding: upload whiteboard drawings, get code generation, OCR extraction, semantic search, and real-time explanations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
            if (t === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch (e) {}
        ` }} />
      </head>
      <body className="antialiased bg-theme-bg text-theme-primary min-h-screen transition-colors duration-250">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
