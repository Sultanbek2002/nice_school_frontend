"use client";
import { motion } from "framer-motion";
import type { TeamSnapshot } from "./useGameSocket";

// framer-motion's typings don't line up with React 19 yet — same workaround
// used elsewhere in this app (see Auth/SignIn/Signin.tsx's `motion.div as any`).
const MotionDiv = motion.div as any;

const TEAM_COLORS = ["#17a589", "#e0a72a", "#c0392b", "#6c5ce7", "#0984e3", "#e17055"];

export default function ShipTrack({
  teams,
  finishLine = 10,
}: {
  teams: TeamSnapshot[];
  finishLine?: number;
}) {
  return (
    <div className="w-full space-y-5">
      {teams.map((team, i) => {
        const pct = Math.min(100, (team.progress / finishLine) * 100);
        const color = TEAM_COLORS[i % TEAM_COLORS.length];
        return (
          <div key={team.id} className="w-full">
            <div className="mb-1 flex items-center justify-between text-sm font-medium text-midnight_text">
              <span>{team.name}</span>
              <span>
                {team.progress}/{finishLine}
              </span>
            </div>
            <div className="relative h-10 overflow-hidden rounded-full border border-black/10 bg-white">
              <div
                className="absolute inset-y-0 left-0 opacity-10"
                style={{ width: "100%", background: color }}
              />
              <MotionDiv
                className="absolute top-1/2 -translate-y-1/2 text-2xl"
                animate={{ left: `calc(${pct}% - 16px)` }}
                transition={{ type: "spring", stiffness: 80, damping: 14 }}
              >
                🚀
              </MotionDiv>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-lg">🏁</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
