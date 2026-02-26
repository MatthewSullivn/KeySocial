# KeySocial

Real-time, skill-based typing racing game on Solana. Race head-to-head, stake SOL, and climb on-chain leaderboards. Built for the Solana Hackathon with Tapestry Protocol integration.

## Overview

KeySocial combines fast-paced word typing with blockchain technology to create a competitive racing platform:

- 30-60 second matches for quick sessions
- Pure skill: typing speed and accuracy, no luck involved
- On-chain profiles, follows, and match history powered by Tapestry
- Optional SOL staking for multiplayer races
- Four difficulty levels and AI opponent (KeyBot) for practice

## Features

### Gameplay
- Head-to-head racing: two players race to type words fastest
- Word-based typing with real-time WPM, accuracy, and streak tracking
- AI opponents for practice
- Four difficulties: Casual, Ranked, Elite, Insane (short words to 14+ letter words)

### Social (Tapestry)
- On-chain profiles linked to wallet
- Follow/unfollow system for rivals and friends
- Match history recorded on-chain with full stats
- Global leaderboard built from on-chain data
- Ranking tiers: Bronze to Legend

### Staking
- Optional SOL stakes before multiplayer races
- Escrow holds both deposits; winner takes all
- Automatic refunds for losers and cancelled matches

## Tech Stack

| Layer      | Tech                         |
|-----------|------------------------------|
| Frontend  | Next.js 14, React, TypeScript |
| Styling   | Tailwind CSS                 |
| Blockchain| Solana (Web3.js, Wallet Adapter) |
| Social    | Tapestry Protocol API         |
| Realtime | Supabase Realtime            |
| State     | Zustand                      |

## Quick Start

### Prerequisites
- Node.js 18+
- Solana wallet (Phantom, Solflare, etc.)

### Setup

1. Clone and install:
```bash
git clone <repo-url>
cd KeySocial
npm install
```

2. Create `.env.local` (see `.env.example` for reference):
```
NEXT_PUBLIC_TAPESTRY_API_KEY=
TAPESTRY_API_KEY=
NEXT_PUBLIC_TAPESTRY_API_URL=https://api.usetapestry.dev/api/v1
NEXT_PUBLIC_APP_NAMESPACE=keysocial
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
ESCROW_SECRET_KEY=
NEXT_PUBLIC_ESCROW_PUBKEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

3. Run:
```bash
npm run dev
```

4. Open `http://localhost:3000`

## How to Play

1. Connect wallet and create a profile
2. Choose mode: Bot (practice) or Multiplayer (create/join room)
3. Select difficulty and optional stake
4. Race: type words as fast as possible; first to finish wins
5. Win matches to climb the leaderboard and grow your on-chain reputation

## Tapestry Integration

KeySocial uses [Tapestry Protocol](https://docs.usetapestry.dev/) for all social features:

- **Profiles**: `findOrCreateProfile`, `getProfile`, `updateProfile`
- **Social Graph**: `followProfile`, `unfollowProfile`, `getFollowers`, `getFollowing`
- **Content**: Match results via `recordMatchResult` / `createContent` with `type: "match_result"`
- **Leaderboard**: Aggregated from on-chain match data

Match content includes winner/loser IDs, WPM, accuracy, stake amount, and transaction signatures. Data is stored on-chain with Solana state compression.

## Game Mechanics

| Difficulty | Track | AI Target WPM |
|------------|-------|---------------|
| Easy (Casual)   | 20 words | 30  |
| Medium (Ranked) | 25 words | 60  |
| Hard (Elite)    | 30 words | 100 |
| Insane          | 35 words | 130 |

- **WPM**: (correct characters / 5) / elapsed minutes
- **Winner**: First player to 100% progress (complete all words)

## Hackathon Submission

Submitted for the **Solana Hackathon** - Onchain Social track with **Tapestry Protocol** bounty.

**Bounty requirements**: Profile creation, social graph (follow/unfollow), content creation (match results), leaderboard aggregation, FAST_UNCONFIRMED execution.

**Additional**: Real-time 1v1 multiplayer (Supabase), SOL staking with escrow, match history with full tx details.

## Roadmap

- Mainnet launch
- Matchmaking queue
- Tournaments and spectator mode
- NFT avatars, token rewards, dedicated escrow program

## License

MIT

## Acknowledgments

- Tapestry Protocol for social graph infrastructure
- Solana Foundation
- Supabase for real-time multiplayer
