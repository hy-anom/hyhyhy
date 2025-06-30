"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ResultModalProps {
  isOpen: boolean;
  status: "won" | "lost";
  answer: string;
  onReset: () => void;
  onClose: () => void;
}
export default function ResultModal({
  isOpen,
  status,
  answer,
  onReset,
  onClose,
}: ResultModalProps) {
  const title = status === "won" ? "🎉 You Won!" : "💀 You Lost!";
  const color = status === "won" ? "text-green-500" : "text-red-500";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm w-full relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
              aria-label="Close"
            >
              ×
            </button>

            <h2 className={`text-2xl font-bold mb-2 ${color}`}>{title}</h2>
            <p className="my-4 text-gray-900">
              The word was: <br />
              <strong>{answer}</strong>
            </p>
            <button
              onClick={onReset}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Play Again
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
