"use client";
import { useState } from "react";
import type { QuestionPayload } from "./useGameSocket";

const LETTERS = ["А", "Б", "В", "Г", "Д", "Е"];

export default function QuestionCard({
  question,
  disabled,
  onAnswer,
}: {
  question: QuestionPayload;
  disabled: boolean;
  onAnswer: (answer: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const pick = (opt: string) => {
    if (disabled || selected) return;
    setSelected(opt);
    onAnswer(opt);
  };

  return (
    <div className="glass-card w-full max-w-xl rounded-2xl p-6">
      {question.image_url && (
        <img
          src={question.image_url}
          alt=""
          className="mb-4 max-h-56 w-full rounded-xl object-cover"
        />
      )}
      <h2 className="mb-5 text-lg font-semibold text-midnight_text">{question.text}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(question.options || []).map((opt, i) => (
          <button
            key={i}
            disabled={disabled || !!selected}
            onClick={() => pick(opt)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              selected === opt
                ? "border-primary bg-primary/10"
                : "border-black/10 bg-white hover:border-primary/50"
            } ${disabled && !selected ? "opacity-50" : ""}`}
          >
            <span className="mr-2 font-semibold text-primary">{LETTERS[i]}.</span>
            {opt}
          </button>
        ))}
      </div>
      {disabled && !selected && (
        <p className="mt-4 text-sm text-grey">Сейчас отвечает другой игрок вашей команды…</p>
      )}
      {selected && <p className="mt-4 text-sm text-grey">Ответ отправлен, ждём остальных…</p>}
    </div>
  );
}
