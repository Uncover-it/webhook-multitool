"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

/** Discord-themed preset colors */
const discordColors = [
  "#5865F2", // Blurple
  "#57F287", // Green
  "#FEE75C", // Yellow
  "#EB459E", // Fuchsia
  "#ED4245", // Red
  "#000000", // Black
  "#FFFFFF", // White
  "#1E1F22", // Dark
  "#2B2D31", // Dark but not as dark
  "#313338", // Even less dark
  "#F2F3F5", // Light
  "#E3E5E8", // Less light
];

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color);
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* --------------------------------------------------------------------- *
   *  Draw the HSV-style gradient on the canvas
   * --------------------------------------------------------------------- */
  const drawColorGradient = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Horizontal hue gradient
    const gradH = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradH.addColorStop(0, "#FF0000");
    gradH.addColorStop(1 / 6, "#FFFF00");
    gradH.addColorStop(2 / 6, "#00FF00");
    gradH.addColorStop(3 / 6, "#00FFFF");
    gradH.addColorStop(4 / 6, "#0000FF");
    gradH.addColorStop(5 / 6, "#FF00FF");
    gradH.addColorStop(1, "#FF0000");

    ctx.fillStyle = gradH;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vertical white→transparent→black overlay (saturation/value)
    const gradV = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradV.addColorStop(0, "rgba(255,255,255,1)");
    gradV.addColorStop(0.5, "rgba(255,255,255,0)");
    gradV.addColorStop(0.5, "rgba(0,0,0,0)");
    gradV.addColorStop(1, "rgba(0,0,0,1)");

    ctx.fillStyle = gradV;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  /* --------------------------------------------------------------------- *
   *  Redraw when the popover opens (give the canvas time to mount)
   * --------------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      drawColorGradient();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, drawColorGradient]);

  /* --------------------------------------------------------------------- *
   *  Keep the input in sync with the prop
   * --------------------------------------------------------------------- */
  useEffect(() => {
    setInputValue(color);
  }, [color]);

  /* --------------------------------------------------------------------- *
   *  Click → sample colour from canvas
   * --------------------------------------------------------------------- */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), canvas.width - 1);
    const y = Math.min(Math.max(0, e.clientY - rect.top), canvas.height - 1);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${[r, g, b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")}`;

    onChange(hex);
    setInputValue(hex);
  };

  /* --------------------------------------------------------------------- *
   *  Manual hex input
   * --------------------------------------------------------------------- */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="flex gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-10 h-10 p-0 border-2"
            style={{ backgroundColor: color }}
          >
            <span className="sr-only">Pick a color</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64">
          <div className="space-y-4">
            {/* Canvas picker */}
            <div className="relative w-full h-40 rounded-md overflow-hidden border border-input">
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                onClick={handleCanvasClick}
              />
            </div>

            {/* Discord preset swatches */}
            <div className="grid grid-cols-6 gap-2">
              {discordColors.map((c, i) => (
                <Button
                  key={c}
                  variant="outline"
                  className="w-8 h-8 p-0 rounded-md border"
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    onChange(c);
                    setInputValue(c);
                  }}
                >
                  <span className="sr-only">Select {c}</span>
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Hex input */}
      <Input
        value={inputValue}
        onChange={handleInputChange}
        className="font-mono"
        maxLength={7}
      />
    </div>
  );
}
