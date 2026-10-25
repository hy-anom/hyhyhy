"use client";

import { useEffect, useRef } from "react";
import { sampleCircuit } from "./circuit";

export default function CircuitLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { width, height } = rect;
      const samples = sampleCircuit();

      // Preserve the circuit's proportions.
      const scale = Math.min(width, height);
      const offsetX = (width - scale) / 2;
      const offsetY = (height - scale) / 2;

      const trackWidth = Math.max(12, scale * 0.055);

      ctx.fillStyle = "#263b30";
      ctx.fillRect(0, 0, width, height);

      const drawTrack = () => {
        ctx.beginPath();

        samples.forEach((point, index) => {
          const x = offsetX + point.x * scale;
          const y = offsetY + point.y * scale;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.closePath();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
      };

      // Track shadow.
      drawTrack();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      ctx.lineWidth = trackWidth + 8;
      ctx.stroke();

      // Track boundary.
      drawTrack();
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = trackWidth + 4;
      ctx.stroke();

      // Asphalt.
      drawTrack();
      ctx.strokeStyle = "#45494e";
      ctx.lineWidth = trackWidth;
      ctx.stroke();
    };

    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();

    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Monza-inspired racing circuit"
      className="absolute inset-0 block h-full w-full"
    />
  );
}
