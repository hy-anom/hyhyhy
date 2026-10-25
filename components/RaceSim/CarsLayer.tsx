"use client";

import { useEffect, useRef } from "react";
import {
  calculateRacingLine,
  calculateTargetSpeeds,
  getCircuitLength,
  getPointAtProgress,
  sampleCircuit,
  type TrackSample,
} from "./circuit";

const CAR_COUNT = 10;
const INITIAL_SPEED = 0.024;

const CAR_COLORS = [
  "#e63946",
  "#457b9d",
  "#f4a261",
  "#2a9d8f",
  "#e9c46a",
  "#9b5de5",
  "#f15bb5",
  "#00bbf9",
  "#fb8500",
  "#90be6d",
];

type CarsLayerProps = {
  isRunning: boolean;
  resetKey: number;
};

export default function CarsLayer({ isRunning, resetKey }: CarsLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isRunningRef = useRef(isRunning);
  const resetKeyRef = useRef(resetKey);

  isRunningRef.current = isRunning;
  resetKeyRef.current = resetKey;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const samples = sampleCircuit();
    const targetSpeeds = calculateTargetSpeeds(samples);
    const circuitLength = getCircuitLength(samples);

    let racingLine: TrackSample[] = [];

    const cars = Array.from({ length: CAR_COUNT }, (_, index) => ({
      id: index,
      progress: (1 - index * 0.005) % 1,
      speed: INITIAL_SPEED,
      performance: 0.9 + Math.random() * 0.2,
      acceleration: 0.024 + Math.random() * 0.008,
      color: CAR_COLORS[index % CAR_COLORS.length],
    }));

    let animationFrameId = 0;
    let previousTime = 0;
    let appliedResetKey = resetKeyRef.current;
    let width = 0;
    let height = 0;
    let scale = 0;
    let offsetX = 0;
    let offsetY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      width = rect.width;
      height = rect.height;
      scale = Math.min(width, height);
      offsetX = (width - scale) / 2;
      offsetY = (height - scale) / 2;

      racingLine = calculateRacingLine(samples, scale, scale);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const getTargetSpeed = (progress: number) => {
      const distance = (((progress % 1) + 1) % 1) * circuitLength;

      let low = 0;
      let high = samples.length - 1;

      while (low < high) {
        const mid = Math.floor((low + high) / 2);

        if (samples[mid].distance < distance) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      return targetSpeeds[low] ?? 0.07;
    };

    const render = (time: number) => {
      if (resetKeyRef.current !== appliedResetKey) {
        cars.forEach((car) => {
          car.progress = (1 - car.id * 0.005) % 1;
          car.speed = INITIAL_SPEED;
        });

        appliedResetKey = resetKeyRef.current;
        previousTime = time;
      }

      const deltaTime =
        previousTime === 0 ? 0 : Math.min(time - previousTime, 50) / 1000;

      previousTime = time;
      ctx.clearRect(0, 0, width, height);

      const radius = Math.max(3, scale * 0.009);

      cars.forEach((car) => {
        if (isRunningRef.current) {
          const targetSpeed = getTargetSpeed(car.progress) * car.performance;

          const speedChange = car.acceleration * deltaTime;

          if (car.speed < targetSpeed) {
            car.speed = Math.min(targetSpeed, car.speed + speedChange);
          } else {
            car.speed = Math.max(targetSpeed, car.speed - speedChange * 1.5);
          }

          car.progress = (car.progress + car.speed * deltaTime) % 1;
        }

        const point = getPointAtProgress(car.progress, racingLine);
        const x = offsetX + point.x * scale;
        const y = offsetY + point.y * scale;

        ctx.beginPath();
        ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = car.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Cars moving around the circuit"
      className="pointer-events-none absolute inset-0 block h-full w-full"
    />
  );
}
