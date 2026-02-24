"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  broadcastRoomCancelled,
  cleanupChannel,
  type PlayerPresence,
  type GameStartPayload,
  type DepositConfirmedPayload,
} from "@/lib/multiplayer";
import {
  createDepositTransaction,
  getConnection,
  waitForSignatureConfirmation,
} from "@/lib/escrow";
import { useNetwork } from "@/providers/NetworkProvider";
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
  { id: "easy", label: "Casual", icon: "mood", desc: "Short words", color: "purple-500" },
  { id: "medium", label: "Ranked", icon: "local_fire_department", desc: "Medium words", color: "pink-500" },
  { id: "hard", label: "Elite", icon: "electric_bolt", desc: "Long words", color: "purple-600" },
  { id: "insane", label: "Insane", icon: "skull", desc: "Very long words", color: "red-500" },
];

const MAX_STAKE_SOL = 5;
const stakePresets = [0, 0.01, 0.05, 0.1, 0.25, 0.5];

interface DepositEntry {
  player: string;
  type: "deposit" | "refund";
  amount: number;
  txSignature: string;
  timestamp: number;
}

type SetupMode = "choose" | "bot" | "create" | "join" | "waiting";

export default function GameSetup({ onStart, onMultiplayerStart, initialDifficulty, initialMode, initialRoomCode, initialStake }: GameSetupProps) {
  const router = useRouter();
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { profile, walletAddress } = useUserStore();
  const { solscanSuffix, rpcUrl, networkLabel } = useNetwork();
  const { initGame, initMultiplayerGame } = useGameStore();
  const [customStake, setCustomStake] = useState("");
  const [depositHistory, setDepositHistory] = useState<DepositEntry[]>([]);

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
  const [isRefunding, setIsRefunding] = useState(false);
  const [depositPhase, setDepositPhase] = useState(false);
  const pendingGameStartRef = useRef<{ payload: GameStartPayload; code: string } | null>(null);
  const depositTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveCheckTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const depositTxSignaturesRef = useRef<string[]>([]);
  const myDepositAmountRef = useRef<number>(0);
  const refundRequestedRef = useRef(false);
  // Refs that mirror state — needed because setTimeout/channel callbacks capture stale closures
  const myDepositDoneRef = useRef(false);
  const opponentDepositDoneRef = useRef(false);
  const depositPhaseRef = useRef(false);

  // Countdown timers
  const [depositDeadline, setDepositDeadline] = useState<number | null>(null);
  const [roomCreatedAt, setRoomCreatedAt] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [roomElapsed, setRoomElapsed] = useState<number>(0);

  const DEPOSIT_TIMEOUT_MS = 60_000;

  const didAutoAction = useRef(false);
  useEffect(() => {
    if (didAutoAction.current || !connected || !profile) return;
    // Already in a room (e.g. manual join then URL updated) — don't re-join
    if (channelRef.current && setupMode === "waiting") return;
    if (initialMode === "create") {
      didAutoAction.current = true;
      handleCreateRoom();
    } else if (initialMode === "join" && initialRoomCode) {
      didAutoAction.current = true;
      handleJoinRoom(initialRoomCode.toUpperCase());
    }
    // eslint-disable-next-line react-hooks-exhaustive-deps
  }, [initialMode, initialRoomCode, connected, profile, setupMode]);

  useEffect(() => {
    return () => {
      if (depositTimeoutRef.current) clearTimeout(depositTimeoutRef.current);
      Object.values(leaveCheckTimeoutsRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  function addDepositTxSignature(signature?: string) {
    if (!signature) return;
    if (!depositTxSignaturesRef.current.includes(signature)) {
      depositTxSignaturesRef.current.push(signature);
    }
  }

  // Robust refund: fire sendBeacon on browser close / tab hide (only before both have deposited)
  useEffect(() => {
    const fireBeaconRefund = () => {
      const addr = publicKey?.toBase58() || walletAddress;
      const amount = myDepositAmountRef.current;
      if (!addr || amount <= 0 || refundRequestedRef.current) return;
      if (opponentDepositDoneRef.current) return; // both deposited — stakes locked, no refund
      refundRequestedRef.current = true;
      const blob = new Blob(
        [JSON.stringify({ walletAddress: addr, amount, network: "devnet" })],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/escrow/refund", blob);
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (myDepositAmountRef.current > 0 && !refundRequestedRef.current && !opponentDepositDoneRef.current) {
        e.preventDefault();
        fireBeaconRefund();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !opponentDepositDoneRef.current) {
        fireBeaconRefund();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [publicKey, walletAddress]);

  // Host: re-track presence when difficulty/stake changes (before opponent joins) so guest sees correct room config
  useEffect(() => {
    if (!channelRef.current || !isHost || opponentName) return;
    channelRef.current.track({
      id: getPlayerId(),
      username: getPlayerUsername(),
      isHost: true,
      difficulty,
      stakeAmount,
    });
  }, [isHost, opponentName, difficulty, stakeAmount]);

  // Deposit deadline countdown (ticks every second)
  useEffect(() => {
    if (!depositDeadline) { setCountdownSeconds(0); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((depositDeadline - Date.now()) / 1000));
      setCountdownSeconds(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [depositDeadline]);

  // Room elapsed timer (ticks every second while in waiting room)
  useEffect(() => {
    if (!roomCreatedAt || setupMode !== "waiting") { setRoomElapsed(0); return; }
    const tick = () => setRoomElapsed(Math.floor((Date.now() - roomCreatedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [roomCreatedAt, setupMode]);

  // Keep refs in sync with state
  useEffect(() => { myDepositDoneRef.current = myDepositDone; }, [myDepositDone]);
  useEffect(() => { opponentDepositDoneRef.current = opponentDepositDone; }, [opponentDepositDone]);
  useEffect(() => { depositPhaseRef.current = depositPhase; }, [depositPhase]);

  // Backup: poll presence during deposit phase to catch missed leave events
  useEffect(() => {
    if (!depositPhase || !opponentId || !channelRef.current) return;
    const id = setInterval(() => {
      const stillThere = isPlayerStillPresent({ id: opponentId, username: opponentName || "", isHost: !isHost });
      if (!stillThere) {
        setOpponentName(null);
        setOpponentId(null);
        toast.error("Opponent left the room.");
        if (depositPhaseRef.current) {
          cancelDepositPhase("Opponent left during staking. Match cancelled.");
        }
      }
    }, 1500);
    return () => clearInterval(id);
  }, [depositPhase, opponentId, opponentName, isHost]);

  function getPlayerId() {
    return profile?.id || profile?.username || walletAddress || "guest";
  }
  function getPlayerUsername() {
    return profile?.username || "Guest";
  }

  async function requestRefund() {
    const addr = publicKey?.toBase58() || walletAddress;
    const amount = myDepositAmountRef.current;
    console.log("[Refund] Attempting refund:", { addr, amount, alreadyRequested: refundRequestedRef.current });
    if (!addr || amount <= 0 || refundRequestedRef.current) {
      console.log("[Refund] Skipped — missing addr, zero amount, or already requested");
      return;
    }
    refundRequestedRef.current = true;
    setIsRefunding(true);
    try {
      const res = await fetch("/api/escrow/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: addr, amount, network: "devnet" }),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.txSignature) {
        setDepositHistory((prev) => [...prev, {
          player: getPlayerUsername(),
          type: "refund",
          amount,
          txSignature: resData.txSignature,
          timestamp: Date.now(),
        }]);
        toast.success(`Refunded ${amount} SOL to your wallet`, {
          duration: 15000,
          description: `TX: ${resData.txSignature}`,
          action: {
            label: "View on Solscan",
            onClick: () => window.open(`https://solscan.io/tx/${resData.txSignature}${solscanSuffix}`, "_blank"),
          },
        });
      } else if (res.ok) {
        toast.success(`Refunded ${amount} SOL to your wallet`, { duration: 10000 });
      } else {
        console.error("Refund API error:", resData);
        toast.error("Refund failed: " + (resData.error || "Unknown error"), { duration: 10000 });
      }
    } catch (err) {
      console.error("Refund error:", err);
      toast.error("Refund request failed. Contact support.");
    } finally {
      setIsRefunding(false);
      myDepositAmountRef.current = 0;
    }
  }

  async function cancelDepositPhase(reason: string) {
    if (depositTimeoutRef.current) clearTimeout(depositTimeoutRef.current);
    // Read from refs — state closures are stale inside setTimeout/channel callbacks
    const needsRefund = myDepositDoneRef.current && !opponentDepositDoneRef.current && myDepositAmountRef.current > 0;
    console.log("[CancelDeposit]", reason, { myDeposit: myDepositDoneRef.current, opponentDeposit: opponentDepositDoneRef.current, amount: myDepositAmountRef.current, needsRefund });
    setDepositPhase(false);
    setDepositDeadline(null);
    setMyDepositDone(false);
    setOpponentDepositDone(false);
    myDepositDoneRef.current = false;
    opponentDepositDoneRef.current = false;
    pendingGameStartRef.current = null;
    toast.error(reason);
    if (needsRefund) {
      toast.info("Requesting refund for your deposit...");
      await requestRefund();
    }
  }

  const finalizeGameStart = useCallback((payload: GameStartPayload, code: string, isHostPlayer: boolean) => {
    const pid = getPlayerId();
    const pname = getPlayerUsername();
    const store = useGameStore.getState();

    // Use canonical signature list to avoid race conditions between peers.
    const txSigs = [...depositTxSignaturesRef.current];

    store.initMultiplayerGame(
      pid, pname, opponentId || "remote-opponent", opponentName || "Opponent",
      payload.words, payload.difficulty, payload.trackLength, code, payload.stakeAmount, txSigs
    );

    if (channelRef.current) {
      onMultiplayerStart(channelRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentName, onMultiplayerStart, opponentId]);

  async function handleDeposit(stakeSOL: number, gamePayload: GameStartPayload, code: string, isHostPlayer: boolean) {
    if (!publicKey || !signTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    setIsDepositing(true);
    refundRequestedRef.current = false;
    try {
      const tx = await createDepositTransaction(publicKey, stakeSOL, rpcUrl);
      const escrowConnection = getConnection(rpcUrl);
      // Sign with wallet (network-agnostic), then send to our RPC directly
      // so the tx always hits the app-selected network, not the wallet's.
      const signed = await signTransaction(tx);
      const signature = await escrowConnection.sendRawTransaction(signed.serialize());
      await waitForSignatureConfirmation(escrowConnection, signature, "confirmed");
      addDepositTxSignature(signature);

      setDepositHistory((prev) => [...prev, {
        player: getPlayerUsername(),
        type: "deposit",
        amount: stakeSOL,
        txSignature: signature,
        timestamp: Date.now(),
      }]);
      toast.success(`Deposited ${stakeSOL} SOL to escrow`, {
        description: `TX: ${signature.slice(0, 16)}...`,
        action: {
          label: "View TX",
          onClick: () => window.open(`https://solscan.io/tx/${signature}${solscanSuffix}`, "_blank"),
        },
      });
      setMyDepositDone(true);
      myDepositAmountRef.current += stakeSOL;

      if (channelRef.current) {
        broadcastDepositConfirmed(
          channelRef.current,
          getPlayerId(),
          signature,
          getPlayerUsername(),
          stakeSOL
        );
        // Re-track presence with deposit metadata so opponent can proxy-refund if we disconnect
        channelRef.current.track({
          id: getPlayerId(),
          username: getPlayerUsername(),
          isHost,
          walletAddress: publicKey.toBase58(),
          depositAmount: myDepositAmountRef.current,
          depositNetwork: "devnet",
        });
      }

      if (opponentDepositDone) {
        if (depositTimeoutRef.current) clearTimeout(depositTimeoutRef.current);
        finalizeGameStart(gamePayload, code, isHostPlayer);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      if (lower.includes("insufficient") || msg.includes("0x1")) {
        toast.error("Insufficient SOL balance");
      } else if (
        lower.includes("rejected") ||
        lower.includes("declined") ||
        lower.includes("denied") ||
        lower.includes("cancel")
      ) {
        toast.error("Deposit canceled. Click the deposit button to try again.");
      } else if (lower.includes("unexpected error")) {
        toast.error("Deposit failed before sending. Click the deposit button to retry.");
      } else {
        toast.error("Deposit failed: " + msg);
      }
      // Keep staking phase active so players can retry manually.
      setMyDepositDone(false);
    } finally {
      setIsDepositing(false);
    }
  }

  useEffect(() => {
    if (myDepositDone && opponentDepositDone && depositPhase && pendingGameStartRef.current) {
      if (depositTimeoutRef.current) clearTimeout(depositTimeoutRef.current);
      setDepositDeadline(null);
      const { payload, code } = pendingGameStartRef.current;
      finalizeGameStart(payload, code, isHost);
    }
  }, [myDepositDone, opponentDepositDone, depositPhase, isHost, finalizeGameStart]);

  function handleDepositConfirmed(data: DepositConfirmedPayload) {
    if (data.playerId !== getPlayerId()) {
      addDepositTxSignature(data.txSignature);
      setOpponentDepositDone(true);
      if (data.txSignature) {
        setDepositHistory((prev) => [...prev, {
          player: data.username || opponentName || "Opponent",
          type: "deposit",
          amount: data.amount || stakeAmount,
          txSignature: data.txSignature,
          timestamp: Date.now(),
        }]);
      }
      const payerName = data.username || opponentName || "Opponent";
      toast.success(`${payerName} deposited ${data.amount || stakeAmount} SOL`, {
        description: data.txSignature ? `TX: ${data.txSignature.slice(0, 16)}...` : undefined,
        duration: 10000,
        action: data.txSignature
          ? {
              label: "View TX",
              onClick: () =>
                window.open(`https://solscan.io/tx/${data.txSignature}${solscanSuffix}`, "_blank"),
            }
          : undefined,
      });
    }
  }

  function isPlayerStillPresent(player: PlayerPresence): boolean {
    const channel = channelRef.current;
    if (!channel) return false;

    const state = channel.presenceState<Record<string, unknown>>();
    const values = Object.values(state);

    for (const value of values) {
      const candidates = Array.isArray(value) ? value : [value];
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== "object") continue;
        const record = candidate as Record<string, unknown>;
        const candidateId = record.id;
        const candidateUsername = record.username;

        if (candidateId === player.id || candidateUsername === player.username) {
          return true;
        }

        const metas = Array.isArray(record.metas) ? record.metas : [];
        for (const meta of metas) {
          if (!meta || typeof meta !== "object") continue;
          const m = meta as Record<string, unknown>;
          if (m.id === player.id || m.username === player.username) {
            return true;
          }
        }
      }
    }

    return false;
  }

  function handleConfirmedOpponentLeave(p: PlayerPresence) {
    const gs = useGameStore.getState().gameState;
    if (gs === "racing" || gs === "finished" || gs === "countdown") return;
    // Proxy refund: if departed player had deposit metadata, refund on their behalf
    if (p.walletAddress && p.depositAmount && p.depositAmount > 0) {
      fetch("/api/escrow/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: p.walletAddress, amount: p.depositAmount, network: "devnet" }),
      }).then((res) => {
        if (res.status === 409) console.log("[ProxyRefund] Dedup — already refunded");
        else if (res.ok) console.log("[ProxyRefund] Refunded departed player", p.walletAddress);
        else console.error("[ProxyRefund] Failed", res.status);
      }).catch((err) => console.error("[ProxyRefund] Error:", err));
    }
    setOpponentName(null);
    setOpponentId(null);
    toast.error(`${p.username} left the room.`);
    if (depositPhaseRef.current) {
      cancelDepositPhase("Opponent left during staking. Match cancelled.");
    }
  }

  function handleOpponentLeave(p: PlayerPresence) {
    const key = p.id || p.username || "unknown";
    const existing = leaveCheckTimeoutsRef.current[key];
    if (existing) clearTimeout(existing);

    // Presence metadata refreshes can emit transient leave/join during staking.
    // Delay and verify presence snapshot before treating as a true disconnect.
    leaveCheckTimeoutsRef.current[key] = setTimeout(() => {
      delete leaveCheckTimeoutsRef.current[key];
      if (isPlayerStillPresent(p)) return;
      handleConfirmedOpponentLeave(p);
    }, 600);
  }

  function handleCreateRoom() {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    setSetupMode("waiting");
    setRoomCreatedAt(Date.now());
    router.replace(`/game?mode=create&room=${code}`, { scroll: false });

    const player: PlayerPresence = {
      id: getPlayerId(),
      username: getPlayerUsername(),
      isHost: true,
      difficulty,
      stakeAmount,
    };

    const channel = createRoomChannel(code, player, {
      onPlayerJoin: (p) => {
        setOpponentName(p.username);
        setOpponentId(p.id);
        toast.success(`${p.username} joined the room!`);
      },
      onPlayerLeave: (p) => {
        handleOpponentLeave(p as PlayerPresence);
      },
      onGameStart: () => {},
      onProgress: () => {},
      onPlayerFinished: () => {},
      onDepositConfirmed: handleDepositConfirmed,
      onRoomCancelled: () => {
        setOpponentName(null);
        setOpponentId(null);
        toast.error("Opponent cancelled the room.");
        if (depositPhaseRef.current) {
          cancelDepositPhase("Opponent cancelled. Match cancelled.");
        }
      },
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
    setRoomCreatedAt(Date.now());
    router.replace(`/game?mode=join&room=${code}`, { scroll: false });

    const player: PlayerPresence = {
      id: getPlayerId(),
      username: getPlayerUsername(),
      isHost: false,
    };

    const channel = createRoomChannel(code, player, {
      onHostFound: (host) => {
        setOpponentName(host.username);
        setOpponentId(host.id);
        if (host.difficulty && validDiffs.includes(host.difficulty)) {
          setDifficulty(host.difficulty);
        }
        if (host.stakeAmount !== undefined && host.stakeAmount >= 0) {
          setStakeAmount(host.stakeAmount);
        }
      },
      onPlayerJoin: (p) => {
        setOpponentName(p.username);
        setOpponentId(p.id);
      },
      onPlayerLeave: (p) => {
        handleOpponentLeave(p as PlayerPresence);
      },
      onRoomCancelled: () => {
        setOpponentName(null);
        setOpponentId(null);
        toast.error("Host cancelled the room.");
        if (depositPhaseRef.current) {
          cancelDepositPhase("Host cancelled. Match cancelled.");
        }
      },
      onGameStart: (payload: GameStartPayload) => {
        if (payload.stakeAmount > 0) {
          refundRequestedRef.current = false;
          setStakeAmount(payload.stakeAmount);
          setDepositPhase(true);
          setDepositDeadline(Date.now() + DEPOSIT_TIMEOUT_MS);
          pendingGameStartRef.current = { payload, code };

          depositTimeoutRef.current = setTimeout(() => {
            cancelDepositPhase("Deposit timeout. Match cancelled.");
          }, DEPOSIT_TIMEOUT_MS);

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
    const clampedStake = Math.min(stakeAmount, MAX_STAKE_SOL);
    const config = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.medium;
    const startPayload = broadcastGameStart(channelRef.current, config.difficulty, config.trackLength, clampedStake);

    if (clampedStake > 0) {
      refundRequestedRef.current = false;
      setDepositPhase(true);
      setDepositDeadline(Date.now() + DEPOSIT_TIMEOUT_MS);
      pendingGameStartRef.current = { payload: startPayload, code: roomCode };

      depositTimeoutRef.current = setTimeout(() => {
        cancelDepositPhase("Deposit timeout. Match cancelled.");
      }, DEPOSIT_TIMEOUT_MS);

      handleDeposit(clampedStake, startPayload, roomCode, true);
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

  async function handleBack() {
    if (channelRef.current && depositPhaseRef.current) {
      broadcastRoomCancelled(channelRef.current);
    }
    const needsRefund = myDepositDoneRef.current && !opponentDepositDoneRef.current && myDepositAmountRef.current > 0;
    cleanupChannel();
    channelRef.current = null;
    setOpponentName(null);
    setOpponentId(null);
    setDepositPhase(false);
    setDepositDeadline(null);
    setMyDepositDone(false);
    setOpponentDepositDone(false);
    myDepositDoneRef.current = false;
    opponentDepositDoneRef.current = false;
    if (depositTimeoutRef.current) clearTimeout(depositTimeoutRef.current);
    if (needsRefund) {
      toast.info("Requesting refund for your deposit...");
      await requestRefund();
    }
    // Navigate away only after refund completes
    setRoomCode("");
    setSetupMode("choose");
    setRoomCreatedAt(null);
  }

  if (!connected) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-200">
          <span className="material-icons text-4xl text-purple-500">speed</span>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Connect to Race</h2>
        <p className="text-gray-500 mb-8">
          Connect your Solana wallet to start racing.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  // Waiting room
  if (setupMode === "waiting") {
    return (
      <div className="max-w-md mx-auto py-6 text-center">
        <button onClick={handleBack} disabled={isRefunding} className="mb-4 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mx-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="material-icons text-base">arrow_back</span> {isRefunding ? "Refunding..." : "Leave Room"}
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {/* Header row: room code + copy + network badge */}
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Room</span>
              <span className="text-lg font-black tracking-[0.2em] text-purple-500 font-mono">{roomCode}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(roomCode); toast.success("Copied!"); }}
                className="text-gray-400 hover:text-purple-500 transition-colors"
              >
                <span className="material-icons text-sm">content_copy</span>
              </button>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 border border-yellow-200 text-yellow-700">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              {networkLabel}
            </div>
          </div>

          {/* Player cards */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 p-2.5 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {getPlayerUsername()[0]?.toUpperCase()}
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-sm text-gray-900 leading-tight">{getPlayerUsername()}</div>
                <div className="text-[11px] text-gray-500">{isHost ? "Host" : "Guest"}</div>
              </div>
              {depositPhase ? (
                <span className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-bold",
                  myDepositDone ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                )}>
                  {myDepositDone ? "Deposited" : isDepositing ? "Depositing..." : "Pending"}
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">Ready</span>
              )}
            </div>

            {opponentName ? (
              <div className="flex items-center gap-3 p-2.5 bg-pink-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {opponentName[0]?.toUpperCase()}
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-sm text-gray-900 leading-tight">{opponentName}</div>
                  <div className="text-[11px] text-gray-500">{isHost ? "Guest" : "Host"}</div>
                </div>
                {depositPhase ? (
                  <span className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-bold",
                    opponentDepositDone ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {opponentDepositDone ? "Deposited" : "Pending"}
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">Ready</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="material-icons text-gray-400 animate-pulse text-base">person_add</span>
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-sm text-gray-400">Waiting for opponent...</div>
                  <div className="text-[11px] text-gray-400">Share the room code</div>
                </div>
                {roomElapsed > 0 && (
                  <span className="text-[11px] font-mono text-gray-400">{formatElapsed(roomElapsed)}</span>
                )}
              </div>
            )}
          </div>

          {/* Deposit phase — takes center stage */}
          {depositPhase && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-bold text-yellow-700">
                  Staking {stakeAmount} SOL each
                </div>
                {countdownSeconds > 0 && !(myDepositDone && opponentDepositDone) && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full",
                    countdownSeconds <= 10
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "bg-yellow-100 text-yellow-700"
                  )}>
                    <span className="material-icons text-[14px]">timer</span>
                    {countdownSeconds}s
                  </div>
                )}
              </div>
              <div className="text-xs text-yellow-600">
                {myDepositDone && opponentDepositDone
                  ? "Both deposits confirmed! Starting race..."
                  : myDepositDone
                  ? `Waiting for opponent to deposit... (${countdownSeconds}s until auto-refund)`
                  : isDepositing
                  ? "Confirm the transaction in your wallet..."
                  : "Preparing deposit transaction..."}
              </div>
              {countdownSeconds > 0 && !(myDepositDone && opponentDepositDone) && (
                <div className="mt-2 h-1 w-full bg-yellow-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-linear",
                      countdownSeconds <= 10 ? "bg-red-400" : "bg-yellow-500"
                    )}
                    style={{ width: `${(countdownSeconds / (DEPOSIT_TIMEOUT_MS / 1000)) * 100}%` }}
                  />
                </div>
              )}
              {!myDepositDone && (
                <button
                  onClick={() => {
                    if (pendingGameStartRef.current) {
                      handleDeposit(stakeAmount, pendingGameStartRef.current.payload, pendingGameStartRef.current.code, isHost);
                    }
                  }}
                  disabled={isDepositing || !pendingGameStartRef.current}
                  className="mt-3 w-full py-2 rounded-lg bg-yellow-500 text-white font-bold text-sm hover:bg-yellow-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="material-icons text-base">account_balance_wallet</span>
                  {isDepositing ? "Depositing..." : `Deposit ${stakeAmount} SOL Now`}
                </button>
              )}
            </div>
          )}

          {/* Host controls — only when opponent has joined and NOT in deposit phase */}
          {isHost && opponentName && !depositPhase && (
            <div className="border-t border-gray-200 pt-4 mt-2">
              <div className="mb-3">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Difficulty</div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {difficulties.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                        difficulty === d.id
                          ? "bg-purple-50 border-purple-300 ring-1 ring-purple-300 text-purple-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      )}
                    >
                      <span className={cn("material-symbols-outlined text-sm", `text-${d.color}`)}>{d.icon}</span>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Stake</div>
                <div className="flex flex-wrap items-center gap-1.5 justify-center">
                  {stakePresets.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => { setStakeAmount(amount); setCustomStake(""); }}
                      className={cn(
                        "px-2.5 py-1 rounded-full font-mono text-xs font-bold transition-all border",
                        stakeAmount === amount && customStake === ""
                          ? "border-purple-300 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      {amount === 0 ? "Free" : `${amount}`}
                    </button>
                  ))}
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={MAX_STAKE_SOL}
                      placeholder="Custom"
                      value={customStake}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomStake(val);
                        const num = parseFloat(val);
                        if (!isNaN(num) && num >= 0) setStakeAmount(Math.min(num, MAX_STAKE_SOL));
                      }}
                      className="w-20 px-2 py-1 rounded-full border border-gray-200 font-mono text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-gray-900 bg-gray-50 text-center"
                    />
                    <span className="text-xs font-bold text-gray-400">SOL</span>
                  </div>
                </div>
                {customStake !== "" && parseFloat(customStake) > MAX_STAKE_SOL && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    Max stake is {MAX_STAKE_SOL} SOL.
                  </p>
                )}
                {stakeAmount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Winner takes {(stakeAmount * 2).toFixed(3)} SOL
                  </p>
                )}
              </div>

              <button
                onClick={handleHostStart}
                className="w-full py-2.5 rounded-lg bg-purple-500 text-white font-extrabold text-base transition-all hover:bg-purple-600 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">swords</span>
                {stakeAmount > 0 ? `Stake ${stakeAmount} SOL & Start` : "Start Race!"}
              </button>
            </div>
          )}

          {/* Host waiting for opponent — no controls yet */}
          {isHost && !opponentName && !depositPhase && (
            <div className="text-sm text-gray-400 flex items-center justify-center gap-2 pt-2">
              <span className="material-icons text-base animate-pulse">group_add</span>
              <span>Waiting for opponent to join...</span>
              {roomElapsed > 0 && (
                <span className="font-mono text-xs">{formatElapsed(roomElapsed)}</span>
              )}
            </div>
          )}

          {/* Guest states */}
          {!isHost && !opponentName && !depositPhase && (
            <div className="text-sm text-gray-500 flex items-center justify-center gap-2 pt-2">
              <span className="material-symbols-outlined text-base animate-spin flex-shrink-0 inline-flex leading-none">progress_activity</span>
              <span>Connecting to room...</span>
              {roomElapsed > 0 && (
                <span className="font-mono text-xs text-gray-400">{formatElapsed(roomElapsed)}</span>
              )}
            </div>
          )}
          {!isHost && opponentName && !depositPhase && (
            <div className="text-sm text-gray-500 flex flex-col items-center gap-1 pt-2">
              <div className="flex items-center gap-2">
                <span className="material-icons text-base">hourglass_top</span>
                <span>Waiting for host to start the race...</span>
              </div>
              <span className="text-xs text-gray-400">
                Host selected: {difficulties.find((d) => d.id === difficulty)?.label || difficulty} • {stakeAmount > 0 ? `${stakeAmount} SOL stake` : "Free race"}
              </span>
              {roomElapsed > 0 && (
                <span className="font-mono text-xs text-gray-400">{formatElapsed(roomElapsed)}</span>
              )}
            </div>
          )}

          {/* Deposit History — collapsible */}
          {depositHistory.length > 0 && (
            <details open className="mt-4 border border-gray-200 rounded-lg overflow-hidden text-left">
              <summary className="px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors">
                Deposit History ({depositHistory.length})
              </summary>
              <div className="divide-y divide-gray-100">
                {depositHistory.map((entry, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-2 text-xs">
                    <span className={cn(
                      "material-icons text-base",
                      entry.type === "deposit" ? "text-green-500" : "text-orange-500"
                    )}>
                      {entry.type === "deposit" ? "arrow_upward" : "arrow_downward"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-gray-900">{entry.player}</span>
                      <span className="text-gray-400 mx-1">&middot;</span>
                      <span className={cn(
                        "font-bold",
                        entry.type === "deposit" ? "text-green-600" : "text-orange-600"
                      )}>
                        {entry.type === "deposit" ? "\u2212" : "+"}{entry.amount} SOL
                      </span>
                    </div>
                    <a
                      href={`https://solscan.io/tx/${entry.txSignature}${solscanSuffix}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-purple-500 hover:text-purple-700 font-medium shrink-0"
                    >
                      {entry.txSignature.slice(0, 8)}...
                      <span className="material-icons text-[12px]">open_in_new</span>
                    </a>
                  </div>
                ))}
              </div>
            </details>
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
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 flex items-center justify-center gap-2 text-gray-900">
            <span className="material-icons text-purple-500 text-3xl">bolt</span>
            Race Setup
          </h1>
          <p className="text-gray-500">Choose your game mode</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setSetupMode("bot")}
            className="p-6 rounded-xl border border-gray-200 bg-white hover:border-purple-300 transition-all text-center hover:shadow-card hover:-translate-y-0.5 group"
          >
            <span className="material-icons text-4xl text-purple-500 mb-3 block group-hover:scale-110 transition-transform">smart_toy</span>
            <div className="font-bold text-lg text-gray-900 mb-1">vs Bot</div>
            <p className="text-xs text-gray-500">Practice against AI at 30-130 WPM</p>
          </button>

          <button
            onClick={handleCreateRoom}
            className="p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-300 transition-all text-center hover:shadow-card hover:-translate-y-0.5 group"
          >
            <span className="material-icons text-4xl text-blue-500 mb-3 block group-hover:scale-110 transition-transform">add_circle</span>
            <div className="font-bold text-lg text-gray-900 mb-1">Create Room</div>
            <p className="text-xs text-gray-500">Host a 1v1 and share the code</p>
          </button>

          <button
            onClick={() => setSetupMode("join")}
            className="p-6 rounded-xl border border-gray-200 bg-white hover:border-pink-300 transition-all text-center hover:shadow-card hover:-translate-y-0.5 group"
          >
            <span className="material-icons text-4xl text-pink-500 mb-3 block group-hover:scale-110 transition-transform">group_add</span>
            <div className="font-bold text-lg text-gray-900 mb-1">Join Room</div>
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
        <button onClick={handleBack} className="mb-6 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mx-auto transition-colors">
          <span className="material-icons text-base">arrow_back</span> Back
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <span className="material-icons text-5xl text-pink-500 mb-4">group_add</span>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Join Room</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the 4-character room code</p>

          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="XXXX"
            maxLength={4}
            className="w-full text-center text-4xl font-black tracking-[0.4em] font-mono bg-gray-50 border border-gray-200 rounded-lg p-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-gray-900"
            autoFocus
          />

          <button
            onClick={() => handleJoinRoom()}
            disabled={roomCode.length !== 4}
            className="w-full mt-6 py-3 rounded-lg bg-pink-500 text-white font-extrabold text-lg shadow-lg transition-all hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      <button onClick={handleBack} className="mb-6 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
        <span className="material-icons text-base">arrow_back</span> Back
      </button>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 flex items-center justify-center gap-2 text-gray-900">
          <span className="material-icons text-purple-500 text-3xl">smart_toy</span>
          Practice vs Bot
        </h1>
        <p className="text-gray-500">Choose your difficulty</p>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Difficulty</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {difficulties.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={cn(
                "p-4 rounded-xl border text-center transition-all hover:scale-[1.02]",
                difficulty === d.id
                  ? "bg-purple-50 border-purple-300 ring-1 ring-purple-300"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <span className={cn("material-symbols-outlined text-xl mb-2 block", `text-${d.color}`)}>{d.icon}</span>
              <div className="font-bold text-sm text-gray-900">{d.label}</div>
              <div className="text-xs text-gray-500 mt-1">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-center">
          <div className="text-2xl font-black text-purple-500">{currentConfig?.trackLength ?? "–"}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Words to finish the race</div>
        </div>
      </div>

      <button
        onClick={handleBotStart}
        className="w-full py-4 rounded-lg bg-purple-500 text-white font-extrabold text-lg transition-all hover:bg-purple-600 hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">swords</span>
        Start Practice Race
      </button>
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `0:${String(s).padStart(2, "0")}`;
}
