"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { consentConfig } from "../../data/consent-forms";

interface SignatureConsentFormProps {
  userId: string;
  consentText?: string;
  title?: string;
  onSignatureChange?: (signatureData: string) => void;
  onSignatureStatusChange?: (hasSignature: boolean) => void;
  showNavigation?: boolean;
}

export function SignatureConsentForm({
  userId: _userId,
  consentText = consentConfig.signature.text,
  title = consentConfig.signature.title,
  onSignatureChange,
  onSignatureStatusChange,
  showNavigation: _showNavigation = true,
}: SignatureConsentFormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Set up canvas drawing context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        updateSignatureState(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas && touch) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas && touch) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.stroke();
        updateSignatureState(true);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const updateSignatureState = (hasSignature: boolean) => {
    setHasSignature(hasSignature);
    onSignatureStatusChange?.(hasSignature);

    if (hasSignature) {
      const canvas = canvasRef.current;
      if (canvas) {
        const signatureData = canvas.toDataURL("image/png");
        onSignatureChange?.(signatureData);
      }
    } else {
      onSignatureChange?.("");
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateSignatureState(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {/* Consent Text */}
      <div className="space-y-4">
        <ScrollArea className="h-80 w-full border rounded-lg bg-background">
          <div className="text-sm whitespace-pre-line leading-relaxed p-4">
            {consentText}
          </div>
        </ScrollArea>
      </div>

      {/* Signature Section */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Electronic Signature</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please sign your name in the box below using your mouse or touch
            screen
          </p>
        </div>

        <div className="flex justify-start">
          <div className="border rounded-lg p-4 bg-background w-96 relative">
            <canvas
              ref={canvasRef}
              width={350}
              height={120}
              className="w-full border border-dashed border-muted-foreground/25 rounded cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: "none" }}
            />
            {hasSignature && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
                className="absolute bottom-6 right-6 h-6 w-6 p-0  mb-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {!hasSignature && "Sign here"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
