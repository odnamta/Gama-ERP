'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface CaptureOverlayProps {
  isCapturing: boolean;
}

export function CaptureOverlay({ isCapturing }: CaptureOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isCapturing) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
      data-capture-overlay="true"
    >
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-3 text-sm font-medium">Capturing screenshot...</p>
        <p className="mt-1 text-xs text-muted-foreground">Please wait</p>
      </div>
    </div>,
    document.body
  );
}
