"use client";

const AVATARS = ["🧑‍🚀", "🦸", "🥷", "🧙", "🤖", "🐱", "🐺", "🦊", "🐸", "🦁"];

export default function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {AVATARS.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl transition ${
            value === a ? "border-primary bg-primary/10" : "border-black/10 bg-white"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
