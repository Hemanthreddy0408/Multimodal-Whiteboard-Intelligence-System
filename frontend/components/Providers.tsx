"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: "#13131A",
            color: "#F8FAFC",
            border: "1px solid #1E1E2E",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif",
          },
        }} 
      />
    </SessionProvider>
  );
}
