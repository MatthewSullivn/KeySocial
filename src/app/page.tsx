import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import WalletCTA from "@/components/landing/WalletCTA";

const FEATURES = [
  {
    icon: "sports_esports",
    title: "Speed Racing",
    description: "Challenge opponents to 1v1 typing duels. Race in real-time and prove you're the fastest.",
  },
  {
    icon: "forum",
    title: "Social Feed",
    description: "Share your results, flex your WPM, and challenge friends directly from your feed.",
  },
  {
    icon: "leaderboard",
    title: "Global Rankings",
    description: "Climb from Bronze to Legend. A full ranking system tracks your progress every season.",
  },
  {
    icon: "account_balance_wallet",
    title: "Solana Rewards",
    description: "Stake SOL on races, earn rewards, and build your on-chain typing profile.",
  },
];

const STEPS = [
  { number: "1", title: "Connect your Solana wallet", description: "Link your wallet to create your on-chain racer profile." },
  { number: "2", title: "Join or create a race", description: "Find an opponent or invite a friend to a real-time typing duel." },
  { number: "3", title: "Win SOL and climb the leaderboard", description: "Earn rewards for every victory and rise through the ranks." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-sm font-medium text-purple-700 mb-8">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Built on Solana
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            Type. Race.{" "}
            <span className="bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
              Compete.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-500 mb-10 leading-relaxed">
            The competitive typing platform on Solana. Race opponents in real-time,
            climb the global leaderboard, and earn rewards for your speed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/game"
              className="inline-flex items-center gap-2 px-8 py-3 bg-purple-500 text-white font-bold rounded-xl text-base hover:bg-purple-600 transition-colors"
            >
              <span className="material-icons text-lg">bolt</span>
              Start Racing
            </Link>
            <WalletCTA />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Everything you need to compete
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            A full-featured competitive typing platform, powered by Solana.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
                <span className="material-icons text-purple-500 text-2xl">{f.icon}</span>
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-gray-500 text-lg">
              Get started in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.number} className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {s.number}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-violet-500 rounded-2xl px-8 py-14 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to prove your speed?
          </h2>
          <p className="text-purple-100 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of racers competing on-chain. Your next win is one race away.
          </p>
          <Link
            href="/game"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-purple-600 font-bold rounded-xl text-base hover:bg-purple-50 transition-colors"
          >
            <span className="material-icons text-lg">bolt</span>
            Start Racing
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} KeySocial. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
