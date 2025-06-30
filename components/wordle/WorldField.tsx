import { ReactNode } from "react";

interface WorldFieldProps {
  attempts: number; // current row index (attempts so far)
  answers: string[];
  maxAttempts: number;
  wordLength: number;
  keyAnswer: string;
  gameStatus: "playing" | "won" | "lost";
}

type LetterStatus = "correct" | "present" | "absent" | "empty";

export default function WorldField({
  attempts,
  answers,
  maxAttempts,
  wordLength,
  keyAnswer,
  gameStatus,
}: WorldFieldProps) {
  const getStatuses = (word: string): LetterStatus[] => {
    const result: LetterStatus[] = Array(wordLength).fill("empty");
    const target = keyAnswer.split("");
    const used = Array(wordLength).fill(false);

    for (let i = 0; i < wordLength; i++) {
      if (word[i] === keyAnswer[i]) {
        result[i] = "correct";
        used[i] = true;
      }
    }

    for (let i = 0; i < wordLength; i++) {
      if (result[i] === "correct") continue;
      const idx = target.findIndex((char, j) => char === word[i] && !used[j]);
      if (idx !== -1) {
        result[i] = "present";
        used[idx] = true;
      } else {
        result[i] = word[i] === " " ? "empty" : "absent";
      }
    }

    return result;
  };

  const getColorClass = (status: LetterStatus, isActive: boolean): string => {
    const baseColor = (() => {
      switch (status) {
        case "correct":
          return "bg-green-600 text-white";
        case "present":
          return "bg-yellow-600 text-white";
        case "absent":
          return "bg-gray-700 text-white";
        case "empty":
        default:
          return "bg-gray-900 text-white";
      }
    })();

    const border = isActive ? "ring-2 ring-blue-700" : "";
    return `${baseColor} ${border}`;
  };

  const LetterBox = ({
    status,
    children = " ",
    isActive,
  }: {
    status: LetterStatus;
    children?: ReactNode;
    isActive?: boolean;
  }) => (
    <div
      className={`px-4 py-2 text-3xl w-14 h-14 text-center rounded capitalize select-none transition-colors duration-150 ${getColorClass(
        status,
        isActive || false
      )}`}
    >
      {children}
    </div>
  );

  return (
    <div className="self-center flex flex-col gap-2">
      {Array.from({ length: maxAttempts }, (_, rowIndex) => {
        const word = answers[rowIndex] || "";
        const paddedWord = word.padEnd(wordLength);
        const letters = paddedWord.split("");
        const isActiveRow = rowIndex === attempts && gameStatus === "playing";

        const statuses =
          rowIndex < attempts && word.length === wordLength
            ? getStatuses(word)
            : Array(wordLength).fill("empty");

        return (
          <div key={rowIndex} className="flex gap-2 w-full">
            {letters.map((letter, i) => (
              <LetterBox key={i} status={statuses[i]} isActive={isActiveRow}>
                {letter.trim() || " "}
              </LetterBox>
            ))}
          </div>
        );
      })}
    </div>
  );
}
