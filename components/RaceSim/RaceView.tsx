"use client";

import { useState } from "react";
import CircuitLayer from "./CircuitLayer";
import CarsLayer from "./CarsLayer";

export default function RaceView() {
  const [isRunning, setIsRunning] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setIsRunning(false);
    setResetKey((key) => key + 1);
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-[#101214] p-4 text-white md:p-6">
      <header className="mx-auto mb-4 flex w-full max-w-7xl shrink-0 items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
            Racing Simulator
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">"Monza (I tried)"</h1>
        </div>

        <p className="text-xs text-neutral-400">Circuit 01 / Italy</p>
      </header>

      <section className="relative mx-auto flex min-h-0 w-full max-w-7xl flex-1 overflow-hidden rounded-xl border border-white/10">
        <CircuitLayer />
        <CarsLayer isRunning={isRunning} resetKey={resetKey} />
      </section>

      <footer className="mx-auto mt-3 flex w-full max-w-7xl shrink-0 items-center justify-between">
        <span className="text-[10px] text-neutral-500">ITALIAN GRAND PRIX</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning((running) => !running)}
            className="rounded-md bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-neutral-200"
          >
            {isRunning ? "Pause" : "Start"}
          </button>

          <button
            onClick={handleReset}
            className="rounded-md border border-white/20 px-4 py-2 text-xs text-white transition hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </footer>
    </main>
  );
}
