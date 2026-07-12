"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarPicker from "@/app/components/GameQuiz/AvatarPicker";

export default function JoinGamePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🧑‍🚀");

  const join = () => {
    if (!code.trim() || !name.trim()) return;
    const params = new URLSearchParams({ name, avatar });
    router.push(`/gamequiz/play/${code.trim().toUpperCase()}?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-gray px-4">
      <div className="glass-card w-full max-w-md rounded-2xl p-8">
        <h1 className="mb-6 text-2xl font-bold text-midnight_text">Присоединиться к игре</h1>

        <label className="mb-1 block text-sm font-medium text-midnight_text">Код комнаты</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="mb-4 w-full rounded-xl border border-black/10 px-3 py-2 uppercase tracking-widest"
          maxLength={6}
          placeholder="ABC123"
        />

        <label className="mb-1 block text-sm font-medium text-midnight_text">Ваше имя</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded-xl border border-black/10 px-3 py-2"
          maxLength={24}
          placeholder="Имя"
        />

        <label className="mb-2 block text-sm font-medium text-midnight_text">Персонаж</label>
        <div className="mb-6">
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>

        <button
          onClick={join}
          disabled={!code.trim() || !name.trim()}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50"
        >
          Войти в игру
        </button>
      </div>
    </div>
  );
}
