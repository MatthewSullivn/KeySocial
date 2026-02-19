"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useUserStore } from "@/store/user-store";
import { cn } from "@/lib/utils";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

type NavItem = { href: string; label: string; icon: string };

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/feed", label: "Feed", icon: "forum" },
  { href: "/game", label: "Race", icon: "sports_esports" },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
];

export default function AppHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const { profile } = useUserStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileHref = useMemo(() => {
    return profile ? `/profile/${profile.username || profile.id}` : "/create-profile";
  }, [profile]);

  const isProfileActive =
    pathname.startsWith("/profile") || pathname.startsWith("/create-profile");

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-bg-primary/80 backdrop-blur-xl border-b border-purple-500/10",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-glow-sm">
                K
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                KeySocial
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-6">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5",
                    isActive(item.href)
                      ? "bg-purple-500/15 text-purple-300 shadow-glow-sm"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="material-icons-outlined text-[18px]">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={profileHref}
              className={cn(
                "hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
                isProfileActive
                  ? "bg-purple-500/15 text-purple-300"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {profile ? (
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white text-xs font-bold flex items-center justify-center">
                  {profile.username?.[0]?.toUpperCase() || "?"}
                </span>
              ) : (
                <span className="material-icons-outlined text-[18px]">person</span>
              )}
              {profile ? profile.username : "Profile"}
            </Link>

            <div className="hidden sm:block">
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-purple-500 !text-white !px-5 !py-2 !rounded-xl !text-sm !font-bold !border-0 hover:!opacity-90" />
            </div>

            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span className="material-icons">{mobileOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-purple-500/10 bg-bg-primary/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
            <WalletMultiButton className="!justify-center !bg-gradient-to-r !from-purple-600 !to-purple-500 !text-white !rounded-xl" />
            <div className="h-px bg-purple-500/10 my-2" />
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                  isActive(item.href)
                    ? "bg-purple-500/15 text-purple-300"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="material-icons-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <Link
              href={profileHref}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                isProfileActive
                  ? "bg-purple-500/15 text-purple-300"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="material-icons-outlined text-[18px]">person</span>
              Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
