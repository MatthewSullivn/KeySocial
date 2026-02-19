"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useUserStore } from "@/store/user-store";
import { useGameStore } from "@/store/game-store";
import { DIFFICULTY_CONFIGS } from "@/lib/game-engine";
import {
  generateRoomCode,
  createRoomChannel,
  broadcastGameStart,
  broadcastDepositConfirmed,
  cleanupChannel,
  type PlayerPresence,
  type GameStartPayload,
  type DepositConfirmedPayload,
} from "@/lib/multiplayer";
import { createDepositTransaction, getConnection } from "@/lib/escrow";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

interface GameSetupProps {
  onStart: () => void;
  onMultiplayerStart: (channel: RealtimeChannel) => void;
  initialDifficulty?: string;
  initialMode?: string;
  initialRoomCode?: string;
  initialStake?: number;
}

const difficulties = [
  { id: "easy", label: "Casual", icon: "sports_esports", desc: "Short words", color: "purple-400" },
  { id: "medium", label: "Ranked", icon: "local_fire_department", desc: "Medium words", color: "pink-400" },
  { id: "hard", label: "Elite", icon: "bolt", desc: "Long words", color: "purple-300" },
  { id: "insane", label: "Insane", icon: "skull", desc: "Very long words", color: "red-400" },
];

const stakeOptions = [0, 0.01, 0.05, 0.1, 0.25, 0.5];

type SetupMode = "choose" | "bot" | "create" | "join" | "waiting";

export default function GameSetup({ onStart, onMultiplayerStart, initialDifficulty, initialMode, initialRoomCode, initialStake }: GameSetupProps) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { profile, walletAddress } = useUserStore();
  const { initGame, initMultiplayerGame } = useGameStore();

  const validDiffs = ["easy", "medium", "hard", "insane"];
  const [difficulty, setDifficulty] = useState(
    initialDifficulty && validDiffs.includes(initialDifficulty) ? initialDifficulty : "medium"
  );
  const [stakeAmount, setStakeAmount] = useState(initialStake ?? 0);

  const [setupMode, setSetupMode] = useState<SetupMode>(
    initialMode === "join" ? "join" : initialMode === "bot" ? "bot" : "choose"
  );
  const [roomCode, setRoomCode] = useState(initialRoomCode?.toUpperCase() || "");
  const [isHost, setIsHost] = useState(false);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [myDepositDone, setMyDepositDone] = useState(false);
  const [opponentDepositDone, setOpponentDepositDone] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositPhase, setDepositPhase] = useState(false);
  const pendingGameStartRef = useRef<{ payload: GameStartPayload; code: string } | null>(null);
  const depositTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const didAutoAction = useRef(false);
  useEffect(() => {
    if (didAutoAction.current || !connected || !profile) return;
    if (initialMode === "create") {
      didAutoAction.current = true;
      handleCreateRoom();
    } else if (initialMode === "join" && initialRoomCode) {
      didAutoAction.current = true;
      handleJoinRoom(initialRoomCode.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, initialRoomCode, connected, profile]);

  useEffect(() => {
    return () => {
      if (depositTimeoutRef.current) clearTimeout(depositTimeoutRef.current);
    };
  }, []);

  function getPlayerId() {
    return profile?.id || profile?.username || walletAddress || "guest";
  }
  function getPlayerUsername() {
    return profile?.username || "Player";
  }

  const finalizeGameStart = useCallback((payload: GameStartPayload, code: string, isHostPlayer: boolean) => {
    const pid = getPlayerId();
    const pname = getPlayerUsername();
    const store = useGameStore.getState();

    store.initMultiplayerGame(
      pid, pname, opponentId || "remote-opponent", opponentName || "Opponent",
      payload.words, payload.difficulty, payload.trackLength, code, payload.stakeAmount
    );

    if (channelRef.current) {
      onMultiplayerStart(channelRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentName, onMultiplayerStart]);

  async function handleDeposit(stakeSOL: number, gamePayload: GameStartPayload, code: string, isHostPlayer: boolean) {
    if (!publicKey || !sendTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    setIsDepositing(true);
    try {
      const tx = await createDepositTransaction(publicKey, stakeSOL);
      const escrowConnection = getConnection();
      const signature = await sendTransaction(tx, escrowConnection);
      await escrowConnection.confirmTransaction(signature, "confirmed");

      toast.success(`Deposited ${stakeSOL} SOL to escrow`);
      setMyDepositDone(true);

      if (channelRef.current) {
        broadcastDepositConfirmed(channelRef.current, getPlayerId(), signature);
      }

      if (opponentDepositDone) {
        if (depositTimeoutRef.current) clearTimeout(depositTimeoutRef.current);
        finalizeGameStart(gamePayload, code, isHostPlayer);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("insufficient") || msg.includes("0x1")) {
        toast.error("Insufficient SOL balance");
      } else {
        toast.error("Deposit failed: " + msg);
      }
      setDepositPhase(false);
      setMyDepositDone(false);
      setOpponentDepositDone(false);
    } finally {
      setIsDepositing(false);
    }
  }

  useEffect(() => {
    if (myDepositDone && opponentDepositDone && depositPhase && pendingGameStartRef.current) {
      if (depositTimeoutRef.current) clearTimeout(depositTimeoutRef.current);
      const { payload, code } = pendingGameStartRef.current;
      finalizeGameStart(payload, code, isHost);
    }
  }, [myDepositDone, opponentDepositDone, depositPhase, isHost, finalizeGameStart]);

  function handleDepositConfirmed(data: DepositConfirmedPayload) {
    if (data.playerId !== getPlayerId()) {
      setOpponentDepositDone(true);
      toast.success("Opponent deposited SOL!");
    }
  }

  function handleCreateRoom() {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    setSetupMode("waiting");

    const player: PlayerPresence = {
      id: getPlayerId(),
      username: getPlayerUsername(),
      isHost: true,
    };

    const channel = createRoomChannel(code, player, {
      onPlayerJoin: (p) => {
        setOpponentName(p.username);
        setOpponentId(p.id);
        toast.success(`${p.username} joined the room!`);
      },
      onPlayerLeave: (p) => {
        const gs = useGameStore.getState().gameState;
        if (gs === "racing" || gs === "finished" || gs === "countdown") return;
        setOpponentName(null);
        setOpponentId(null);
        toast.error(`${p.username} left the room.`);
        if (depositPhase) {
          setDepositPhase(false);
          setOpponentDepositDone(false);
          toast.error("Opponent left during staking. Match cancelled.");
        }
      },
      onGameStart: () => {},
      onProgress: () => {},
      onPlayerFinished: () => {},
      onDepositConfirmed: handleDepositConfirmed,
    });

    channelRef.current = channel;
  }

  function handleJoinRoom(codeOverride?: string) {
    const code = (codeOverride || roomCode).toUpperCase().trim();
    if (code.length !== 4) {
      toast.error("Room code must be 4 characters");
      return;
    }

    setRoomCode(code);
    setIsHost(false);
    setSetupMode("waiting");

    const player: PlayerPresence = {
      id: getPlayerId(),
      username: getPlayerUsername(),
      isHost: false,
    };

    const channel = createRoomChannel(code, player, {
      onPlayerJoin: (p) => {
        setOpponentName(p.username);
        setOpponentId(p.id);
      },
      onPlayerLeave: (p) => {
        const gs = useGameStore.getState().gameState;
        if (gs === "racing" || gs === "finished" || gs === "countdown") return;
        setOpponentName(null);
        setOpponentId(null);
        toast.error(`${p.username} left the room.`);
        if (depositPhase) {
          setDepositPhase(false);
          setOpponentDepositDone(false);
          toast.error("Opponent left during staking. Match cancelled.");
        }
      },
      onGameStart: (payload: GameStartPayload) => {
        if (payload.stakeAmount > 0) {
          setStakeAmount(payload.stakeAmount);
          setDepositPhase(true);
          pendingGameStartRef.current = { payload, code };

          depositTimeoutRef.current = setTimeout(() => {
            toast.error("Deposit timeout. Match cancelled.");
            setDepositPhase(false);
            setMyDepositDone(false);
            setOpponentDepositDone(false);
            pendingGameStartRef.current = null;
          }, 60000);

          handleDeposit(payload.stakeAmount, payload, code, false);
        } else {
          const pid = getPlayerId();
          const pname = getPlayerUsername();
          const store = useGameStore.getState();
          store.initMultiplayerGame(
            pid, pname, opponentId || "remote-opponent", opponentName || "Opponent",
            payload.words, payload.difficulty, payload.trackLength, code, 0
          );
          if (channelRef.current) {
            onMultiplayerStart(channelRef.current);
          }
        }
      },
      onProgress: () => {},
      onPlayerFinished: () => {},
      onDepositConfirmed: handleDepositConfirmed,
    });

    channelRef.current = channel;
    toast.success(`Joined room ${code}!`);
  }

  function handleHostStart() {
    if (!channelRef.current || !opponentName) return;
    const config = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.medium;
    const startPayload = broadcastGameStart(channelRef.current, config.difficulty, config.trackLength, stakeAmount);

    if (stakeAmount > 0) {
      setDepositPhase(true);
      pendingGameStartRef.current = { payload: startPayload, code: roomCode };

      depositTimeoutRef.current = setTimeout(() => {
        toast.error("Deposit timeout. Match cancelled.");
        setDepositPhase(false);
        setMyDepositDone(false);
        setOpponentDepositDone(false);
        pendingGameStartRef.current = null;
      }, 60000);

      handleDeposit(stakeAmount, startPayload, roomCode, true);
    } else {
      const pid = getPlayerId();
      const pname = getPlayerUsername();
      initMultiplayerGame(
        pid, pname, opponentId || "remote-opponent", opponentName || "Opponent",
        startPayload.words, startPayload.difficulty, startPayload.trackLength, roomCode, 0
      );
      onMultiplayerStart(channelRef.current);
    }
  }

  function handleBotStart() {
    const playerId = getPlayerId();
    const playerUsername = getPlayerUsername();
    initGame(playerId, playerUsername, difficulty, "practice", 0);
    onStart();
  }

  function handleBack() {
    cleanupChannel();
    channelRef.current = null;
    setOpponentName(null);
    setOpponentId(null);
    setRoomCode("");
    setSetupMode("choose");
    setDepositPhase(false);
    setMyDepositDone(false);
    setOpponentDepositDone(false);
    if (depositTimeoutRef.current) clearTimeout(depositTimeoutRef.current);
  }

  if (!connected) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-20 h-20 bg-purple-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/25">
          <span className="material-icons text-4xl text-purple-400">speed</span>
        </div>
        <h2 className="text-2xl font-extrabold mb-2">Connect to Race</h2>
        <p className="text-gray-400 mb-8">
          Connect your Solana wallet to start racing.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  // Waiting room
  if (setupMode === "waiting") {
    return (
      <div className="max-w-md mx-auto py-8 text-center">
        <button onClick={handleBack} className="mb-6 text-sm text-gray-500 hover:text-white flex items-center gap-1 mx-auto transition-colors">
          <span className="material-icons text-base">arrow_back</span> Leave Room
        </button>

        <div className="bg-bg-card border border-purple-500/15 rounded-2xl p-8">
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Room Code</div>
            <div className="text-5xl font-black tracking-[0.3em] text-purple-400 font-mono">{roomCode}</div>
            <button
              onClick={() => { navigator.clipboard.writeText(roomCode); toast.success("Copied!"); }}
              className="mt-2 text-xs text-gray-500 hover:text-purple-400 flex items-center gap-1 mx-auto transition-colors"
            >
              <span className="material-icons text-sm">content_copy</span> Copy code
            </button>
          </div>

          <div className="border-t border-purple-500/10 pt-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold">
                {getPlayerUsername()[0]?.toUpperCase()}
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-sm">{getPlayerUsername()}</div>
                <div className="text-xs text-gray-500">{isHost ? "Host" : "Guest"}</div>
              </div>
              {depositPhase ? (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  myDepositDone ? "bg-accent-green/20 text-accent-green" : "bg-yellow-500/20 text-yellow-400"
                )}>
                  {myDepositDone ? "Deposited" : isDepositing ? "Depositing..." : "Pending"}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green font-bold">Ready</span>
              )}
            </div>

            {opponentName ? (
              <div className="flex items-center gap-3 p-3 bg-pink-500/10 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center text-white font-bold">
                  {opponentName[0]?.toUpperCase()}
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-sm">{opponentName}</div>
                  <div className="text-xs text-gray-500">{isHost ? "Guest" : "Host"}</div>
                </div>
                {depositPhase ? (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-bold",
                    opponentDepositDone ? "bg-accent-green/20 text-accent-green" : "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {opponentDepositDone ? "Deposited" : "Pending"}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green font-bold">Ready</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border-2 border-dashed border-purple-500/20">
                <div className="w-10 h-10 rounded-xl bg-bg-hover flex items-center justify-center">
                  <span className="material-icons text-gray-500 animate-pulse">person_add</span>
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-sm text-gray-500">Waiting for opponent...</div>
                  <div className="text-xs text-gray-600">Share the room code</div>
                </div>
              </div>
            )}
          </div>

          {depositPhase && (
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="text-sm font-bold text-yellow-400 mb-1">
                Staking {stakeAmount} SOL each
              </div>
              <div className="text-xs text-yellow-500/80">
                {myDepositDone && opponentDepositDone
                  ? "Both deposits confirmed! Starting race..."
                  : myDepositDone
                  ? "Waiting for opponent to deposit..."
                  : "Confirm the transaction in your wallet"}
              </div>
            </div>
          )}

          {isHost && !depositPhase && (
            <div className="mt-6">
              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Difficulty</div>
                <div className="grid grid-cols-4 gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={cn(
                        "p-2 rounded-xl border text-center transition-all text-xs",
                        difficulty === d.id
                          ? "bg-purple-500/15 border-purple-500/40 ring-1 ring-purple-500/40 font-bold"
                          : "border-purple-500/10 hover:border-purple-500/25"
                      )}
                    >
                      <span className={cn("material-icons text-lg block", `text-${d.color}`)}>{d.icon}</span>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Stake (SOL)</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {stakeOptions.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setStakeAmount(amount)}
                      className={cn(
                        "px-3 py-2 rounded-xl font-mono text-xs font-bold transition-all border",
                        stakeAmount === amount
                          ? "border-purple-500/40 bg-purple-500/15 text-purple-300 shadow-glow-sm"
                          : "border-purple-500/10 text-gray-500 hover:border-purple-500/25"
                      )}
                    >
                      {amount === 0 ? "Free" : `${amount}`}
                    </button>
                  ))}
                </div>
                {stakeAmount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Winner takes {(stakeAmount * 2 * 0.95).toFixed(3)} SOL (5% fee)
                  </p>
                )}
              </div>

              <button
                onClick={handleHostStart}
                disabled={!opponentName}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-extrabold text-lg shadow-glow-md transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-icons">swords</span>
                {!opponentName
                  ? "Waiting for opponent..."
                  : stakeAmount > 0
                  ? `Stake ${stakeAmount} SOL & Start`
                  : "Start Race!"}
              </button>
            </div>
          )}

          {!isHost && !opponentName && !depositPhase && (
            <div className="mt-6 text-sm text-gray-500">
              <span className="material-icons text-base align-middle animate-spin mr-1">progress_activity</span>
              Connecting to room...
            </div>
          )}
          {!isHost && opponentName && !depositPhase && (
            <div className="mt-6 text-sm text-gray-500">
              <span className="material-icons text-base align-middle mr-1">hourglass_top</span>
              Waiting for host to start the race...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mode selection
  if (setupMode === "choose") {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 flex items-center justify-center gap-2">
            <span className="material-icons text-purple-400 text-3xl">bolt</span>
            Race Setup
          </h1>
          <p className="text-gray-400">Choose your game mode</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setSetupMode("bot")}
            className="p-6 rounded-2xl border border-purple-500/15 bg-bg-card hover:border-purple-500/40 transition-all text-center hover:shadow-glow-sm hover:-translate-y-0.5 group"
          >
            <span className="material-icons text-4xl text-purple-400 mb-3 block group-hover:scale-110 transition-transform">smart_toy</span>
            <div className="font-bold text-lg mb-1">vs Bot</div>
            <p className="text-xs text-gray-500">Practice against AI at 30-130 WPM</p>
          </button>

          <button
            onClick={handleCreateRoom}
            className="p-6 rounded-2xl border border-purple-500/15 bg-bg-card hover:border-purple-500/40 transition-all text-center hover:shadow-glow-sm hover:-translate-y-0.5 group"
          >
            <span className="material-icons text-4xl text-accent-blue mb-3 block group-hover:scale-110 transition-transform">add_circle</span>
            <div className="font-bold text-lg mb-1">Create Room</div>
            <p className="text-xs text-gray-500">Host a 1v1 and share the code</p>
          </button>

          <button
            onClick={() => setSetupMode("join")}
            className="p-6 rounded-2xl border border-purple-500/15 bg-bg-card hover:border-pink-500/30 transition-all text-center hover:shadow-glow-sm hover:-translate-y-0.5 group"
          >
            <span className="material-icons text-4xl text-pink-400 mb-3 block group-hover:scale-110 transition-transform">group_add</span>
            <div className="font-bold text-lg mb-1">Join Room</div>
            <p className="text-xs text-gray-500">Enter a code to join a friend</p>
          </button>
        </div>
      </div>
    );
  }

  // Join room (enter code)
  if (setupMode === "join") {
    return (
      <div className="max-w-md mx-auto py-8 text-center">
        <button onClick={handleBack} className="mb-6 text-sm text-gray-500 hover:text-white flex items-center gap-1 mx-auto transition-colors">
          <span className="material-icons text-base">arrow_back</span> Back
        </button>

        <div className="bg-bg-card border border-purple-500/15 rounded-2xl p-8">
          <span className="material-icons text-5xl text-pink-400 mb-4">group_add</span>
          <h2 className="text-2xl font-extrabold mb-2">Join Room</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the 4-character room code</p>

          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="XXXX"
            maxLength={4}
            className="w-full text-center text-4xl font-black tracking-[0.4em] font-mono bg-bg-elevated border border-purple-500/20 rounded-xl p-4 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-white"
            autoFocus
          />

          <button
            onClick={() => handleJoinRoom()}
            disabled={roomCode.length !== 4}
            className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 text-white font-extrabold text-lg shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="material-icons">login</span>
            Join
          </button>
        </div>
      </div>
    );
  }

  // Bot setup
  const currentConfig = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <button onClick={handleBack} className="mb-6 text-sm text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
        <span className="material-icons text-base">arrow_back</span> Back
      </button>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 flex items-center justify-center gap-2">
          <span className="material-icons text-purple-400 text-3xl">smart_toy</span>
          Practice vs Bot
        </h1>
        <p className="text-gray-400">Choose your difficulty</p>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Difficulty</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {difficulties.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={cn(
                "p-4 rounded-2xl border text-center transition-all hover:scale-[1.02]",
                difficulty === d.id
                  ? "bg-purple-500/15 border-purple-500/40 ring-1 ring-purple-500/40"
                  : "border-purple-500/10 hover:border-purple-500/25 bg-bg-card"
              )}
            >
              <span className={cn("material-icons text-2xl mb-2 block", `text-${d.color}`)}>{d.icon}</span>
              <div className="font-bold text-sm">{d.label}</div>
              <div className="text-xs text-gray-500 mt-1">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 bg-bg-card rounded-2xl border border-purple-500/10 p-5">
        <div className="text-center">
          <div className="text-2xl font-black text-purple-400">{currentConfig?.trackLength ?? "–"}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Words to finish the race</div>
        </div>
      </div>

      <button
        onClick={handleBotStart}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-extrabold text-lg shadow-glow-md transition-all hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <span className="material-icons">swords</span>
        Start Practice Race
      </button>
    </div>
  );
}
