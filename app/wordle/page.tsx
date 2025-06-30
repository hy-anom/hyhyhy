import WordleGame from "@/components/wordle/WordleGame";

export default function Wordle() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center justify-center">
        <h1 className="text-center text-3xl">WORDLE</h1>
        <WordleGame />
      </main>
    </div>
  );
}
