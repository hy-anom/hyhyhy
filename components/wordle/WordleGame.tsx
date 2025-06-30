"use client";

import { useEffect, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import Keeb from "./Keeb";
import ResultModal from "./ResultModal";
import WorldField from "./WorldField";

const MAX_ATTEMPTS = 5;
const WORD_LENGTH = 5;

export default function WordleGame() {
  const [possibleAnswers, setPossibleAnswers] = useState<string[]>([]);
  const [keyAnswer, setKeyAnswer] = useState<string>("");

  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>(
    Array(MAX_ATTEMPTS).fill("")
  );
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

  useEffect(() => {
    fetch("/wordle-answers.txt")
      .then((res) => res.text())
      .then((text) => {
        const words = text
          .split("\n")
          .map((w) => w.trim().toUpperCase())
          .filter((w) => w.length === 5);
        if (words.length > 0) {
          setPossibleAnswers(words);
          setKeyAnswer(words[Math.floor(Math.random() * words.length)]);
        }
      });
  }, []);

  const getRandomKeyAnswer = () =>
    possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];

  const handleKeebClick = (key: string) => {
    if (key === "↺") {
      setConfirmOpen(true);
      return;
    }

    if (gameStatus !== "playing") return;

    const currentWord = answers[attemptsCount] || "";

    if (key === "⌫") {
      if (!currentWord) return;
      updateAnswer(currentWord.slice(0, -1));
      return;
    }

    if (key === "↩") {
      if (currentWord.length === WORD_LENGTH) {
        const isCorrect = currentWord.toUpperCase() === keyAnswer;
        const isLastTry = attemptsCount + 1 >= MAX_ATTEMPTS;

        setAttemptsCount((prev) => prev + 1);

        if (isCorrect) {
          setGameStatus("won");
          setResultOpen(true);
        } else if (isLastTry) {
          setGameStatus("lost");
          setResultOpen(true);
        }
      }
      return;
    }

    if (currentWord.length < WORD_LENGTH && key.length === 1) {
      updateAnswer(currentWord + key);
    }
  };

  const updateAnswer = (newWord: string) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[attemptsCount] = newWord;
      return updated;
    });
  };

  const cancelReset = () => {
    setConfirmOpen(false);
  };

  const resetGame = () => {
    setKeyAnswer(getRandomKeyAnswer());
    setAnswers(Array(MAX_ATTEMPTS).fill(""));
    setAttemptsCount(0);
    setGameStatus("playing");
    setConfirmOpen(false);
    setResultOpen(false);
  };

  return (
    <>
      <WorldField
        attempts={attemptsCount}
        answers={answers}
        maxAttempts={MAX_ATTEMPTS}
        wordLength={WORD_LENGTH}
        keyAnswer={keyAnswer}
        gameStatus={gameStatus}
      />
      <Keeb onClick={handleKeebClick} />
      <ResultModal
        isOpen={gameStatus !== "playing" && resultOpen}
        status={gameStatus === "won" ? "won" : "lost"}
        answer={keyAnswer}
        onReset={resetGame}
        onClose={() => setResultOpen(false)}
      />
      <ConfirmModal
        isOpen={confirmOpen}
        onConfirm={resetGame}
        onCancel={cancelReset}
      />
    </>
  );
}
