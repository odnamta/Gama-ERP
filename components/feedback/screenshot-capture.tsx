'use client';

import { useRef, useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ScreenshotData } from '@/types/feedback';

interface ScreenshotCaptureProps {
  screenshots: ScreenshotData[];
  onScreenshotsChange: (screenshots: ScreenshotData[]) => void;
  maxScreenshots?: number;
}

export function ScreenshotCapture({
  screenshots,
  onScreenshotsChange,
  maxScreenshots = 5,
}: ScreenshotCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    if (screenshots.length >= maxScreenshots) return;
    
    setIsCapturing(true);
    try {
      // Dynamically import html2canvas to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      
      // Capture the current page
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        scale: 0.5, // Reduce size for performance
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const newScreenshot: ScreenshotData = {
        dataUrl,
        filename: `screenshot-${Date.now()}.png`,
      };
      
      onScreenshotsChange([...screenshots, newScreenshot]);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = maxScreenshots - screenshots.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const newScreenshot: ScreenshotData = {
            dataUrl,
            filename: file.name,
          };
          onScreenshotsChange([...screenshots, newScreenshot]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newScreenshots = screenshots.filter((_, i) => i !== index);
    onScreenshotsChange(newScreenshots);
  };

  const canAddMore = screenshots.length < maxScreenshots;

  return (
    <div className="space-y-3">
      <Label>Screenshots ({screenshots.length}/{maxScreenshots})</Label>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCapture}
          disabled={!canAddMore || isCapturing}
        >
          {isCapturing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          Capture Screen
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAddMore}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Screenshot Previews */}
      {screenshots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {screenshots.map((screenshot, index) => (
            <div
              key={index}
              className="relative group w-24 h-24 rounded-md overflow-hidden border"
            >
              <img
                src={screenshot.dataUrl}
                alt={screenshot.filename || `Screenshot ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove screenshot"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                {screenshot.filename || `Screenshot ${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {!canAddMore && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxScreenshots} screenshots allowed
        </p>
      )}
    </div>
  );
}
