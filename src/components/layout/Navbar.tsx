"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useUserStore } from "@/store/user-store";
import { shortenAddress } from "@/lib/utils";
import {
  Zap,
  Trophy,
  User,
  Gamepad2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { connected } = useWallet();
  const { profile, walletAddress } = useUserStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-600/50 bg-dark-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Zap className="w-8 h-8 text-neon-green group-hover:text-neon-blue transition-colors" />
              <div className="absolute inset-0 blur-lg bg-neon-green/30 group-hover:bg-neon-blue/30 transition-colors" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
              KeySocial
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/game" icon={<Gamepad2 className="w-4 h-4" />}>
              Play
            </NavLink>
            <NavLink href="/leaderboard" icon={<Trophy className="w-4 h-4" />}>
              Leaderboard
            </NavLink>
            {connected && profile && (
              <NavLink
                href={`/profile/${profile.username || profile.id}`}
                icon={<User className="w-4 h-4" />}
              >
                Profile
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {connected && walletAddress && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-600/50 text-sm">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span className="text-slate-400">
                  {profile?.username || shortenAddress(walletAddress)}
                </span>
              </div>
            )}
            <WalletMultiButton />

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-dark-700 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-dark-600/50 bg-dark-900/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            <MobileNavLink href="/game" onClick={() => setMobileOpen(false)}>
              <Gamepad2 className="w-4 h-4" /> Play
            </MobileNavLink>
            <MobileNavLink href="/leaderboard" onClick={() => setMobileOpen(false)}>
              <Trophy className="w-4 h-4" /> Leaderboard
            </MobileNavLink>
            {connected && profile && (
              <MobileNavLink
                href={`/profile/${profile.username || profile.id}`}
                onClick={() => setMobileOpen(false)}
              >
                <User className="w-4 h-4" /> Profile
              </MobileNavLink>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-neon-green hover:bg-dark-700/50 transition-all"
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-neon-green hover:bg-dark-700/50 transition-all"
    >
      {children}
    </Link>
  );
}
