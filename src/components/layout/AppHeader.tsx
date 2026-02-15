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
        "sticky top-0 z-50 w-full backdrop-blur-md bg-background-light/80 dark:bg-background-dark/80 border-b border-gray-200 dark:border-gray-800",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Left: Logo + nav links */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-black font-extrabold">
                K
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-black dark:text-white">
                KeySocial
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                    isActive(item.href)
                      ? "bg-primary text-black"
                      : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <span className="material-icons-outlined text-[18px]">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Profile + Wallet + mobile toggle */}
          <div className="flex items-center gap-2">
            {/* Profile link (desktop) */}
            <Link
              href={profileHref}
              className={cn(
                "hidden md:flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-sm font-medium transition-colors",
                isProfileActive
                  ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                  : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {profile ? (
                <span className="w-6 h-6 rounded-full bg-primary text-black text-xs font-bold flex items-center justify-center">
                  {profile.username?.[0]?.toUpperCase() || "?"}
                </span>
              ) : (
                <span className="material-icons-outlined text-[18px]">person</span>
              )}
              {profile ? profile.username : "Profile"}
            </Link>

            <div className="hidden sm:block">
              <WalletMultiButton className="!bg-black hover:!bg-gray-800 !text-white dark:!bg-white dark:!text-black dark:hover:!bg-gray-200 !px-5 !py-2 !rounded-full !text-sm !font-bold !shadow-lg" />
            </div>

            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span className="material-icons">{mobileOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
            <WalletMultiButton className="!justify-center !bg-black !text-white dark:!bg-white dark:!text-black !rounded-full" />
            <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2",
                  isActive(item.href)
                    ? "bg-primary text-black"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                "px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2",
                isProfileActive
                  ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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
