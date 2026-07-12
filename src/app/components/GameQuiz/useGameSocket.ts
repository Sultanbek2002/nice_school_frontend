"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_WS_URL } from "@/utils/apiData";

export interface PlayerSummary {
  id: string;
  display_name: string;
  avatar: string;
}

export interface TeamSnapshot {
  id: string;
  name: string;
  progress: number;
  members: PlayerSummary[];
}

export interface QuestionPayload {
  question_id: number;
  text: string;
  image_url?: string;
  options?: string[];
  can_answer: boolean;
  time_limit: number;
}

export type ServerMessage =
  | { type: "room_state"; payload: { players: PlayerSummary[]; phase: string } }
  | { type: "joined"; payload: { player_id: string } }
  | { type: "game_started"; payload: { teams: TeamSnapshot[] } }
  | { type: "question"; payload: QuestionPayload }
  | { type: "question_result"; payload: { correct_answer: string; teams: TeamSnapshot[] } }
  | { type: "game_over"; payload: { winner_team_id: string; teams: TeamSnapshot[] } }
  | { type: "error"; payload: { message: string } };

// Thin wrapper around the native WebSocket API — the Go backend speaks plain
// JSON {type, payload} frames, no socket.io/protocol library needed.
export function useGameSocket(code: string, onMessage: (msg: ServerMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!code) return;
    const ws = new WebSocket(`${GAME_WS_URL}/api/gamequiz/rooms/${code}/ws`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        onMessageRef.current(JSON.parse(event.data) as ServerMessage);
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [code]);

  const send = useCallback((type: string, payload: unknown = {}) => {
    wsRef.current?.send(JSON.stringify({ type, payload }));
  }, []);

  return { connected, send };
}
