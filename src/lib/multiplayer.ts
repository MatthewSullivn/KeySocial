import { getSupabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { generateWordSequence, type WordPrompt } from "./game-engine";

// ── Types ──

export type RoomState = "waiting" | "ready" | "countdown" | "racing" | "finished";

export interface PlayerPresence {
  id: string;
  username: string;
  isHost: boolean;
}

export interface ProgressPayload {
  playerId: string;
  username: string;
  progress: number;
  wpm: number;
  accuracy: number;
  correctHits: number;
  totalHits: number;
  streak: number;
  isFinished: boolean;
}

export interface GameStartPayload {
  words: WordPrompt[];
  difficulty: string;
  trackLength: number;
  stakeAmount: number;
}

export interface StakeInfoPayload {
  stakeAmount: number;
  escrowPubkey: string;
}

export interface DepositConfirmedPayload {
  playerId: string;
  txSignature: string;
}

export interface RoomEvent {
  type: "game_start" | "progress" | "player_finished" | "player_left" | "stake_info" | "deposit_confirmed";
  payload: GameStartPayload | ProgressPayload | { playerId: string } | StakeInfoPayload | DepositConfirmedPayload;
}

// ── Room code generation ──

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function channelName(roomCode: string): string {
  return `ks-room-${roomCode.toUpperCase()}`;
}

// ── Channel management ──

let activeChannel: RealtimeChannel | null = null;

export function getActiveChannel(): RealtimeChannel | null {
  return activeChannel;
}

export function createRoomChannel(
  roomCode: string,
  player: PlayerPresence,
  callbacks: {
    onPlayerJoin: (p: PlayerPresence) => void;
    onPlayerLeave: (p: PlayerPresence) => void;
    onGameStart: (payload: GameStartPayload) => void;
    onProgress: (payload: ProgressPayload) => void;
    onPlayerFinished: (playerId: string) => void;
    onStakeInfo?: (payload: StakeInfoPayload) => void;
    onDepositConfirmed?: (payload: DepositConfirmedPayload) => void;
  }
): RealtimeChannel {
  cleanupChannel();

  const channel = getSupabase().channel(channelName(roomCode), {
    config: { presence: { key: player.id } },
  });

  channel.on("presence", { event: "join" }, ({ newPresences }) => {
    for (const p of newPresences) {
      if (p.id !== player.id) {
        callbacks.onPlayerJoin(p as unknown as PlayerPresence);
      }
    }
  });

  channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
    for (const p of leftPresences) {
      if (p.id !== player.id) {
        callbacks.onPlayerLeave(p as unknown as PlayerPresence);
      }
    }
  });

  channel.on("broadcast", { event: "room_event" }, ({ payload }) => {
    const evt = payload as RoomEvent;
    switch (evt.type) {
      case "game_start":
        callbacks.onGameStart(evt.payload as GameStartPayload);
        break;
      case "progress":
        callbacks.onProgress(evt.payload as ProgressPayload);
        break;
      case "player_finished":
        callbacks.onPlayerFinished((evt.payload as { playerId: string }).playerId);
        break;
      case "stake_info":
        callbacks.onStakeInfo?.(evt.payload as StakeInfoPayload);
        break;
      case "deposit_confirmed":
        callbacks.onDepositConfirmed?.(evt.payload as DepositConfirmedPayload);
        break;
      default:
        break;
    }
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        id: player.id,
        username: player.username,
        isHost: player.isHost,
      });
    }
  });

  activeChannel = channel;
  return channel;
}

// ── Broadcast helpers ──

export function broadcastGameStart(
  channel: RealtimeChannel,
  difficulty: string,
  trackLength: number,
  stakeAmount: number = 0
) {
  const words = generateWordSequence(difficulty, trackLength + 10);
  const payload: GameStartPayload = { words, difficulty, trackLength, stakeAmount };
  channel.send({
    type: "broadcast",
    event: "room_event",
    payload: { type: "game_start", payload } as RoomEvent,
  });
  return payload;
}

export function broadcastStakeInfo(
  channel: RealtimeChannel,
  stakeAmount: number,
  escrowPubkey: string
) {
  const payload: StakeInfoPayload = { stakeAmount, escrowPubkey };
  channel.send({
    type: "broadcast",
    event: "room_event",
    payload: { type: "stake_info", payload } as RoomEvent,
  });
}

export function broadcastDepositConfirmed(
  channel: RealtimeChannel,
  playerId: string,
  txSignature: string
) {
  const payload: DepositConfirmedPayload = { playerId, txSignature };
  channel.send({
    type: "broadcast",
    event: "room_event",
    payload: { type: "deposit_confirmed", payload } as RoomEvent,
  });
}

export function broadcastProgress(
  channel: RealtimeChannel,
  data: ProgressPayload
) {
  channel.send({
    type: "broadcast",
    event: "room_event",
    payload: { type: "progress", payload: data } as RoomEvent,
  });
}

export function broadcastFinished(
  channel: RealtimeChannel,
  playerId: string
) {
  channel.send({
    type: "broadcast",
    event: "room_event",
    payload: { type: "player_finished", payload: { playerId } } as RoomEvent,
  });
}

// ── Cleanup ──

export function cleanupChannel() {
  if (activeChannel) {
    activeChannel.unsubscribe();
    getSupabase().removeChannel(activeChannel);
    activeChannel = null;
  }
}
