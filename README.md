# KeySocial

Real-time, skill-based typing racing game on Solana. Race head-to-head, stake SOL, and climb on-chain leaderboards. Built for the Solana Hackathon with Tapestry Protocol integration.

## Overview

- 30-60 second matches; pure skill (typing speed and accuracy)
- On-chain profiles, follows, and match history via Tapestry
- Optional SOL staking; four difficulty levels and AI opponent

## Features

- **Gameplay**: Head-to-head word typing, real-time WPM/accuracy, AI (KeyBot), four difficulties
- **Social**: On-chain profiles, follow system, match history, global leaderboard, ranking tiers
- **Staking**: Escrow holds deposits; winner takes all; automatic refunds

## Tech Stack

Next.js 14, React, TypeScript, Tailwind, Solana (Web3.js, Wallet Adapter), Tapestry Protocol, Supabase Realtime, Zustand

## Quick Start

- Node.js 18+ and a Solana wallet
- Clone, `npm install`, create `.env.local` (see `.env.example`), run `npm run dev`
- Open `http://localhost:3000`

## How to Play

Connect wallet, create profile, choose Bot or Multiplayer, select difficulty and optional stake, race, climb the leaderboard.

## Tapestry Integration

Profiles (`findOrCreateProfile`, `getProfile`), social graph (`followProfile`, `getFollowers`), match content (`recordMatchResult`), leaderboard from on-chain data. Match content includes winner/loser, WPM, stake, tx signatures. Solana state compression.

## Game Mechanics

| Difficulty | Track | AI WPM |
|------------|-------|--------|
| Easy | 20 words | 30 |
| Medium | 25 words | 60 |
| Hard | 30 words | 100 |
| Insane | 35 words | 130 |

WPM = (correct chars / 5) / minutes. Winner = first to 100% progress.

## Hackathon

Solana Hackathon, Onchain Social track, Tapestry bounty. Profile creation, social graph, match content, leaderboard, FAST_UNCONFIRMED. Plus: real-time multiplayer, SOL staking, match history with tx details.

## Roadmap

Mainnet, matchmaking queue, tournaments, spectator mode, NFT avatars, token rewards, dedicated escrow program.

## License

MIT

## Acknowledgments

Tapestry Protocol, Solana Foundation, Supabase
