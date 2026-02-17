"use client";

import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";

export default function LandingPageV2() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark antialiased overflow-x-hidden selection:bg-primary selection:text-black">
      {/* Organic blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="organic-blob top-0 left-0 w-64 h-64 md:w-96 md:h-96 text-primary opacity-50 dark:opacity-20 transform -translate-x-1/3 -translate-y-1/3">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,32.2C59,42.9,47.1,51.4,35,58.8C22.9,66.2,10.6,72.5,-0.6,73.6C-11.8,74.7,-24.6,70.6,-36.4,63.6C-48.2,56.6,-59,46.7,-67.2,35.1C-75.4,23.5,-81,10.2,-81.1,-3.2C-81.2,-16.6,-75.8,-30.1,-66.4,-41.2C-57,-52.3,-43.6,-61,-30.3,-68.6C-17,-76.2,-3.8,-82.7,8.2,-96.9L44.7,-76.4Z"
              fill="currentColor"
              transform="translate(100 100)"
            />
          </svg>
        </div>
        <div className="organic-blob top-20 right-0 w-48 h-48 md:w-80 md:h-80 text-primary opacity-50 dark:opacity-20 transform translate-x-1/3">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M38.1,-63.9C50.2,-56.3,61.4,-47.9,70.6,-37.2C79.8,-26.5,87,-13.5,86.2,-0.9C85.4,11.7,76.6,23.9,67,34.1C57.4,44.3,47,52.5,36.1,59.3C25.2,66.1,13.8,71.5,1.7,68.6C-10.4,65.7,-23.2,54.5,-34.9,45.2C-46.6,35.9,-57.2,28.5,-64.1,18.4C-71,8.3,-74.2,-4.5,-70.5,-16.3C-66.8,-28.1,-56.2,-38.9,-44.8,-46.8C-33.4,-54.7,-21.2,-59.7,-8.7,-61.4C3.8,-63.1,16.3,-61.5,25.9,-71.5L38.1,-63.9Z"
              fill="currentColor"
              transform="translate(100 100)"
            />
          </svg>
        </div>
      </div>

      <AppHeader className="backdrop-blur-lg" />

      <main className="relative z-10">
        {/* Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight tracking-tight">
                Race at the <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-accent-pink to-accent-purple">
                    Speed of Social
                  </span>
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-primary/30 -z-10 rounded-sm transform -rotate-1"></span>
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                The first high-stakes on-chain typing racing platform on Solana. Challenge friends,
                bet on your WPM, and climb the global leaderboards in real-time.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  className="w-full sm:w-auto px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  href="/match"
                >
                  Start Racing
                </Link>
                <Link
                  className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-full font-bold text-lg hover:border-black dark:hover:border-white transition-all"
                  href="/game"
                >
                  View Demo
                </Link>
              </div>
              <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="material-icons text-primary text-lg">bolt</span> Powered by Solana
                </span>
                <span className="flex items-center gap-2">
                  <span className="material-icons text-primary text-lg">verified</span> Verifiable Results
                </span>
              </div>
            </div>

            {/* Floating cards (visual) */}
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div className="relative w-full max-w-lg aspect-square">
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-full opacity-50 blur-3xl"></div>
                <div className="absolute top-1/4 left-0 w-48 h-32 bg-white dark:bg-card-dark rounded-xl shadow-card border border-gray-100 dark:border-gray-700 transform -rotate-6 p-4 flex flex-col justify-between z-10 animate-[bounce_4s_infinite]">
                  <div className="flex gap-2 mb-2">
                    <div className="w-8 h-8 bg-accent-pink rounded-lg flex items-center justify-center text-white font-bold">
                      Q
                    </div>
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                    <div className="w-8 h-8 bg-accent-teal rounded-lg flex items-center justify-center text-white font-bold">
                      S
                    </div>
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                </div>

                <div className="absolute bottom-1/4 right-0 w-56 h-40 bg-white dark:bg-card-dark rounded-xl shadow-card border border-gray-100 dark:border-gray-700 transform rotate-3 p-5 flex flex-col items-center justify-center z-20 animate-[pulse_3s_infinite]">
                  <div className="relative w-24 h-24 rounded-full border-8 border-gray-100 dark:border-gray-700 border-t-primary border-r-primary rotate-45 flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-gray-900 dark:text-white -rotate-45">
                      128
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase mt-2 tracking-wider">
                    WPM Speed
                  </span>
                </div>

                <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-primary rounded-full shadow-lg flex items-center justify-center border-4 border-white dark:border-gray-800 z-30 animate-[spin_10s_linear_infinite]">
                  <span className="material-icons text-black text-4xl">currency_bitcoin</span>
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 200 Q 250 150 350 350" fill="none" stroke="#D9ED65" strokeDasharray="10 10" strokeWidth="4" />
                  <path d="M300 150 Q 200 250 150 400" fill="none" stroke="#F45B82" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted row */}
        <div className="py-10 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-8">
              Trusted by Builders &amp; Racers
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {[
                { icon: "token", label: "SOLANA", cls: "text-primary" },
                { icon: "rocket", label: "PHANTOM", cls: "text-accent-pink" },
                { icon: "hub", label: "HELIUS", cls: "text-accent-purple" },
                { icon: "security", label: "JUPITER", cls: "text-accent-teal" },
                { icon: "architecture", label: "METAPLEX", cls: "" },
              ].map((x) => (
                <div
                  key={x.label}
                  className="flex items-center gap-2 text-xl font-bold font-display text-gray-800 dark:text-gray-200"
                >
                  <span className={`material-icons ${x.cls}`}>{x.icon}</span> {x.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vision */}
        <div id="vision" className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                Unlock Your Typing Potential
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Compete, earn, and build your reputation. KeySocial turns every keystroke into an
                opportunity for glory on the blockchain.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                title="Compete for Glory"
                desc="Race against the best typists worldwide and climb the immutable leaderboard."
                icon="emoji_events"
                gradient="from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30"
                iconColor="text-orange-500"
                badge="Rank #1"
              />
              <FeatureCard
                title="Stake & Earn"
                desc="Put your money where your fingers are. Stake SOL on your races and take home the pot when you win."
                icon="account_balance_wallet"
                gradient="from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30"
                iconColor="text-purple-500"
                badge="Earnings ↑"
              />
              <FeatureCard
                title="100% On-Chain"
                desc="Verifiable speed. Every race result is recorded on Solana, ensuring transparency and trust."
                icon="code"
                gradient="from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30"
                iconColor="text-teal-500"
                badge="</> API"
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="py-24 bg-background-light dark:bg-background-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold">Ready, Set, Type!</h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Get started in under 30 seconds.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StepCard
                n="1"
                color="bg-accent-pink"
                title="Connect Wallet"
                desc="Link your Phantom or Solflare wallet to create your secure racer profile instantly."
                icon="account_balance_wallet"
              />
              <StepCard
                n="2"
                color="bg-accent-purple"
                title="Pick a Room"
                desc="Join a public lobby or create a private high-stakes room for you and your friends."
                icon="meeting_room"
              />
              <StepCard
                n="3"
                color="bg-accent-teal"
                title="Win Rewards"
                desc="Type fast, make zero errors, and claim the pot directly to your wallet."
                icon="emoji_events"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black font-bold text-lg">
                K
              </div>
              <span className="font-display font-bold text-xl tracking-tight">KeySocial</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link className="hover:text-black dark:hover:text-white" href="/feed">
                Feed
              </Link>
              <Link className="hover:text-black dark:hover:text-white" href="/leaderboard">
                Leaderboard
              </Link>
              <Link className="hover:text-black dark:hover:text-white" href="/match">
                Lobby
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
  gradient,
  iconColor,
  badge,
}: {
  title: string;
  desc: string;
  icon: string;
  gradient: string;
  iconColor: string;
  badge: string;
}) {
  return (
    <div className="bg-white dark:bg-card-dark rounded-2xl p-8 outline-card group">
      <div
        className={`w-full h-48 mb-6 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden border border-gray-100 dark:border-gray-700`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`material-icons text-6xl ${iconColor} transform group-hover:scale-110 transition-transform`}>
            {icon}
          </span>
        </div>
        <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-600 shadow-sm">
          {badge}
        </div>
      </div>
      <h3 className="text-2xl font-display font-bold mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{desc}</p>
    </div>
  );
}

function StepCard({
  n,
  color,
  title,
  desc,
  icon,
}: {
  n: string;
  color: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div
      className={`relative ${color} rounded-2xl p-8 text-white overflow-hidden shadow-lg h-64 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300`}
    >
      <div className="absolute -right-8 -bottom-8 text-white opacity-20 font-display font-bold text-9xl group-hover:scale-110 transition-transform">
        {n}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-white/90 text-sm leading-relaxed">{desc}</p>
      </div>
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
        <span className="material-icons">{icon}</span>
      </div>
    </div>
  );
}
