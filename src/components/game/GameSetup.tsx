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
  { id: "easy", label: "Casual", icon: "sports_esports", desc: "Short words", ring: "ring-primary/60", bg: "bg-primary/10", text: "text-primary" },
  { id: "medium", label: "Ranked", icon: "local_fire_department", desc: "Medium words", ring: "ring-secondary/60", bg: "bg-secondary/10", text: "text-secondary" },
  { id: "hard", label: "Elite", icon: "bolt", desc: "Long words", ring: "ring-accent-purple/60", bg: "bg-accent-purple/10", text: "text-accent-purple" },
  { id: "insane", label: "Insane", icon: "skull", desc: "Very long words", ring: "ring-accent-pink/60", bg: "bg-accent-pink/10", text: "text-accent-pink" },
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

  // Deposit tracking for multiplayer staking
  const [myDepositDone, setMyDepositDone] = useState(false);
  const [opponentDepositDone, setOpponentDepositDone] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositPhase, setDepositPhase] = useState(false); // true = waiting for deposits
  // Store game start payload so guest can finalize after deposits
  const pendingGameStartRef = useRef<{ payload: GameStartPayload; code: string } | null>(null);
  const depositTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-create room if mode=create, auto-join if mode=join
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

  // Start the actual game after both deposits confirmed (or immediately if no stake)
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

      // Broadcast deposit confirmation
      if (channelRef.current) {
        broadcastDepositConfirmed(channelRef.current, getPlayerId(), signature);
      }

      // Check if opponent already deposited
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
      // Reset deposit phase on failure
      setDepositPhase(false);
      setMyDepositDone(false);
      setOpponentDepositDone(false);
    } finally {
      setIsDepositing(false);
    }
  }

  // When opponent deposits after we already deposited
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
        // Ignore presence leaves once the game has started (racing/finished)
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
          // Need to deposit first
          setStakeAmount(payload.stakeAmount);
          setDepositPhase(true);
          pendingGameStartRef.current = { payload, code };

          // Set 60s timeout for deposits
          depositTimeoutRef.current = setTimeout(() => {
            toast.error("Deposit timeout. Match cancelled.");
            setDepositPhase(false);
            setMyDepositDone(false);
            setOpponentDepositDone(false);
            pendingGameStartRef.current = null;
          }, 60000);

          // Auto-trigger deposit for guest
          handleDeposit(payload.stakeAmount, payload, code, false);
        } else {
          // Zero stake — start immediately
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
      // Enter deposit phase
      setDepositPhase(true);
      pendingGameStartRef.current = { payload: startPayload, code: roomCode };

      // Set 60s timeout
      depositTimeoutRef.current = setTimeout(() => {
        toast.error("Deposit timeout. Match cancelled.");
        setDepositPhase(false);
        setMyDepositDone(false);
        setOpponentDepositDone(false);
        pendingGameStartRef.current = null;
      }, 60000);

      // Host deposits
      handleDeposit(stakeAmount, startPayload, roomCode, true);
    } else {
      // Zero stake — start immediately
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
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-primary/30">
          <span className="material-icons text-4xl text-primary">speed</span>
        </div>
        <h2 className="text-2xl font-extrabold mb-2">Connect to Race</h2>
        <p className="text-muted-light dark:text-muted-dark mb-8">
          Connect your Solana wallet to start racing and earn rewards.
        </p>
        <WalletMultiButton className="!bg-black hover:!bg-gray-800 !text-white dark:!bg-white dark:!text-black dark:hover:!bg-gray-200 !px-6 !py-3 !rounded-full !text-sm !font-bold !shadow-lg" />
      </div>
    );
  }

  // ── Waiting room ──
  if (setupMode === "waiting") {
    return (
      <div className="max-w-md mx-auto py-8 text-center">
        <button onClick={handleBack} className="mb-6 text-sm text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mx-auto">
          <span className="material-icons text-base">arrow_back</span> Leave Room
        </button>

        <div className="bg-surface-light dark:bg-surface-dark border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-8 shadow-pop">
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Room Code</div>
            <div className="text-5xl font-black tracking-[0.3em] text-primary font-mono">{roomCode}</div>
            <button
              onClick={() => { navigator.clipboard.writeText(roomCode); toast.success("Copied!"); }}
              className="mt-2 text-xs text-slate-400 hover:text-primary flex items-center gap-1 mx-auto"
            >
              <span className="material-icons text-sm">content_copy</span> Copy code
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black font-bold">
                {getPlayerUsername()[0]?.toUpperCase()}
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-sm">{getPlayerUsername()}</div>
                <div className="text-xs text-slate-500">{isHost ? "Host" : "Guest"}</div>
              </div>
              {depositPhase ? (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  myDepositDone ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                )}>
                  {myDepositDone ? "Deposited" : isDepositing ? "Depositing..." : "Pending"}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">Ready</span>
              )}
            </div>

            {opponentName ? (
              <div className="flex items-center gap-3 p-3 bg-accent-blue/10 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-accent-blue flex items-center justify-center text-white font-bold">
                  {opponentName[0]?.toUpperCase()}
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-sm">{opponentName}</div>
                  <div className="text-xs text-slate-500">{isHost ? "Guest" : "Host"}</div>
                </div>
                {depositPhase ? (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-bold",
                    opponentDepositDone ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {opponentDepositDone ? "Deposited" : "Pending"}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">Ready</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <span className="material-icons text-slate-400 animate-pulse">person_add</span>
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-sm text-slate-400">Waiting for opponent...</div>
                  <div className="text-xs text-slate-400">Share the room code</div>
                </div>
              </div>
            )}
          </div>

          {/* Deposit phase UI */}
          {depositPhase && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-1">
                Staking {stakeAmount} SOL each
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
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
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Difficulty</div>
                <div className="grid grid-cols-4 gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={cn(
                        "p-2 rounded-xl border text-center transition-all text-xs",
                        difficulty === d.id
                          ? `${d.bg} ${d.ring} ring-2 border-transparent font-bold`
                          : "border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <span className={cn("material-icons text-lg block", d.text)}>{d.icon}</span>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake selector for multiplayer */}
              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Stake (SOL)</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {stakeOptions.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setStakeAmount(amount)}
                      className={cn(
                        "px-3 py-2 rounded-xl font-mono text-xs font-bold transition-all border",
                        stakeAmount === amount
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(212,232,98,0.3)]"
                          : "border-gray-200 dark:border-gray-700 text-muted-light dark:text-muted-dark hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      {amount === 0 ? "Free" : `${amount}`}
                    </button>
                  ))}
                </div>
                {stakeAmount > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Winner takes {(stakeAmount * 2 * 0.95).toFixed(3)} SOL (5% fee)
                  </p>
                )}
              </div>

              <button
                onClick={handleHostStart}
                disabled={!opponentName}
                className="w-full py-3 rounded-xl bg-primary hover:bg-[#B8D43B] text-black font-extrabold text-lg shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="mt-6 text-sm text-slate-400">
              <span className="material-icons text-base align-middle animate-spin mr-1">progress_activity</span>
              Connecting to room...
            </div>
          )}
          {!isHost && opponentName && !depositPhase && (
            <div className="mt-6 text-sm text-slate-500">
              <span className="material-icons text-base align-middle mr-1">hourglass_top</span>
              Waiting for host to start the race...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Mode selection ──
  if (setupMode === "choose") {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 flex items-center justify-center gap-2">
            <span className="material-icons text-primary text-3xl">bolt</span>
            Race Setup
          </h1>
          <p className="text-muted-light dark:text-muted-dark">Choose your game mode</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setSetupMode("bot")}
            className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all text-center hover:shadow-lg hover:-translate-y-0.5 group"
          >
            <span className="material-icons text-4xl text-primary mb-3 block group-hover:scale-110 transition-transform">smart_toy</span>
            <div className="font-bold text-lg mb-1">vs Bot</div>
            <p className="text-xs text-slate-500">Practice against AI at 30-130 WPM</p>
          </button>

          <button
            onClick={handleCreateRoom}
            className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-accent-blue transition-all text-center hover:shadow-lg hover:-translate-y-0.5 group"
          >
            <span className="material-icons text-4xl text-accent-blue mb-3 block group-hover:scale-110 transition-transform">add_circle</span>
            <div className="font-bold text-lg mb-1">Create Room</div>
            <p className="text-xs text-slate-500">Host a 1v1 and share the code</p>
          </button>

          <button
            onClick={() => setSetupMode("join")}
            className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-accent-pink transition-all text-center hover:shadow-lg hover:-translate-y-0.5 group"
          >
            <span className="material-icons text-4xl text-accent-pink mb-3 block group-hover:scale-110 transition-transform">group_add</span>
            <div className="font-bold text-lg mb-1">Join Room</div>
            <p className="text-xs text-slate-500">Enter a code to join a friend</p>
          </button>
        </div>
      </div>
    );
  }

  // ── Join room (enter code) ──
  if (setupMode === "join") {
    return (
      <div className="max-w-md mx-auto py-8 text-center">
        <button onClick={handleBack} className="mb-6 text-sm text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mx-auto">
          <span className="material-icons text-base">arrow_back</span> Back
        </button>

        <div className="bg-surface-light dark:bg-surface-dark border-2 border-slate-900 dark:border-slate-700 rounded-2xl p-8 shadow-pop">
          <span className="material-icons text-5xl text-accent-pink mb-4">group_add</span>
          <h2 className="text-2xl font-extrabold mb-2">Join Room</h2>
          <p className="text-sm text-slate-500 mb-6">Enter the 4-character room code</p>

          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="XXXX"
            maxLength={4}
            className="w-full text-center text-4xl font-black tracking-[0.4em] font-mono bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl p-4 focus:border-accent-pink focus:ring-2 focus:ring-accent-pink/30 outline-none transition-all"
            autoFocus
          />

          <button
            onClick={() => handleJoinRoom()}
            disabled={roomCode.length !== 4}
            className="w-full mt-6 py-3 rounded-xl bg-accent-pink hover:bg-pink-400 text-white font-extrabold text-lg shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="material-icons">login</span>
            Join
          </button>
        </div>
      </div>
    );
  }

  // ── Bot setup (original) ──
  const currentConfig = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <button onClick={handleBack} className="mb-6 text-sm text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
        <span className="material-icons text-base">arrow_back</span> Back
      </button>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 flex items-center justify-center gap-2">
          <span className="material-icons text-primary text-3xl">smart_toy</span>
          Practice vs Bot
        </h1>
        <p className="text-muted-light dark:text-muted-dark">Choose your difficulty</p>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-light dark:text-muted-dark mb-3">Difficulty</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {difficulties.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={cn(
                "p-4 rounded-2xl border-2 text-center transition-all hover:scale-[1.02]",
                difficulty === d.id
                  ? `${d.bg} ${d.ring} ring-2 border-transparent`
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <span className={cn("material-icons text-2xl mb-2 block", d.text)}>{d.icon}</span>
              <div className="font-bold text-sm">{d.label}</div>
              <div className="text-xs text-muted-light dark:text-muted-dark mt-1">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="text-center">
          <div className="text-2xl font-black text-primary">{currentConfig?.trackLength ?? "–"}</div>
          <div className="text-xs text-muted-light dark:text-muted-dark font-medium mt-1">Words to finish the race</div>
        </div>
      </div>

      <button
        onClick={handleBotStart}
        className="w-full py-4 rounded-xl bg-primary hover:bg-[#B8D43B] text-black font-extrabold text-lg shadow-lg hover:shadow-[0_0_15px_rgba(212,232,98,0.5)] transition-all hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <span className="material-icons">swords</span>
        Start Practice Race
      </button>
    </div>
  );
}
