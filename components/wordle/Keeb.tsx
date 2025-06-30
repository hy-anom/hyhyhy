"use client";

const rows: string[] = ["QWERTYUIOP⌫", "ASDFGHJKL↩", "ZXCVBNM↺"];

interface KeebProps {
  onClick: (key: string) => void;
}

export default function Keeb({ onClick }: KeebProps) {
  const isSpecialKey = (key: string) => ["⌫", "↩", "↺"].includes(key);

  return (
    <div className="inline-block p-4 bg-gray-700 rounded-xl">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center mb-2">
          {row.split("").map((char, keyIndex) => (
            <button
              key={`${rowIndex}-${keyIndex}-${char}`}
              onClick={() => onClick(char)}
              className={`m-1 py-2 text-lg rounded capitalize select-none cursor-pointer transition-colors duration-150
                ${isSpecialKey(char) ? "w-20" : "w-12"}
                bg-gray-300 hover:bg-gray-400 active:bg-gray-400 text-gray-700`}
              aria-label={
                char === "⌫" ? "Backspace" : char === "↩" ? "Enter" : char
              }
            >
              {char}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
