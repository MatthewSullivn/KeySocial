# KeySocial

**Real-time, browser-based social typing game on Solana**

KeySocial is a competitive word typing racing game where players compete in head-to-head sprint duels with real SOL stakes. Built for the Solana Hackathon with Tapestry Protocol integration for onchain social features.

## What is KeySocial?

KeySocial combines fast-paced word typing mechanics with blockchain technology to create a skill-based competitive racing platform:

- **Fast Rounds**: 30-60 second matches for instant gratification
- **Real Stakes**: Stake SOL tokens on your matches
- **Skill-Based**: Pure typing speed and accuracy - no luck involved
- **Onchain Social**: Profiles, follows, and match history powered by Tapestry
- **Multiple Difficulties**: From casual home-row typing to insane mode with symbols
- **Social Competition**: Follow rivals, climb leaderboards, challenge friends

## Features

### Core Gameplay
- **Head-to-head Racing**: Two players compete to type words fastest
- **Word-based Typing**: Type complete words, not just single keys
- **Graveyard System**: Too many mistakes = instant elimination
- **Real-time Stats**: WPM, accuracy, word streak tracking
- **AI Opponents**: Practice against adaptive bots
- **4 Difficulty Levels**: From short 3-letter words to complex 14+ letter words

### Social Features (Tapestry Integration)
- **Onchain Profiles**: Create and manage your racer identity
- **Follow System**: Build your network of rivals and friends
- **Match History**: Every race recorded onchain
- **Global Leaderboard**: Compete for the top spot
- **Ranking System**: Bronze > Silver > Gold > Platinum > Diamond > Legend

### Staking & Rewards
- **SOL Staking**: Lock tokens before each match
- **Winner Takes All**: Automatic payouts to the victor
- **Transparent Results**: All match outcomes onchain via Tapestry

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Blockchain**: Solana (Web3.js, Wallet Adapter)
- **Social Layer**: Tapestry Protocol API
- **Realtime**: Supabase Realtime (multiplayer)
- **State Management**: Zustand
- **UI Components**: Lucide Icons, Sonner (toasts)

## Installation

### Prerequisites
- Node.js 18+ and npm
- A Solana wallet (Phantom, Solflare, etc.)

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd KeySocial
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment variables**

Create a `.env.local` file with:
```env
NEXT_PUBLIC_TAPESTRY_API_KEY=your_tapestry_api_key
TAPESTRY_API_KEY=your_tapestry_api_key
NEXT_PUBLIC_TAPESTRY_API_URL=https://api.usetapestry.dev/api/v1
NEXT_PUBLIC_APP_NAMESPACE=keysocial
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
ESCROW_SECRET_KEY=your_escrow_keypair_base58
NEXT_PUBLIC_ESCROW_PUBKEY=your_escrow_public_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

## How to Play

1. **Connect Wallet**: Connect your Solana wallet (Phantom, Solflare, etc.)
2. **Create Profile**: Set up your racer profile (username, bio)
3. **Choose Settings**: 
   - Select difficulty (Easy, Ranked, Elite, Insane)
   - Play against bots or create/join a multiplayer room
4. **Race**: 
   - Words appear on screen - type them as fast as possible
   - Complete words move you forward
   - Mistakes are highlighted but you keep going
   - First to finish wins
5. **Climb Ranks**: Win matches to climb the leaderboard

## Project Structure

```
KeySocial/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx             # Landing page
│   │   ├── game/page.tsx        # Main game page
│   │   ├── leaderboard/page.tsx # Global rankings
│   │   ├── feed/page.tsx        # Social feed
│   │   ├── profile/[username]/  # Profile pages
│   │   └── create-profile/      # Profile creation
│   ├── components/
│   │   ├── game/                # Game UI components
│   │   │   ├── GameSetup.tsx   # Game mode selection
│   │   │   ├── KeyDisplay.tsx  # Typing display
│   │   │   ├── GameResults.tsx # Post-match screen
│   │   │   └── ...
│   │   ├── feed/               # Feed components
│   │   └── layout/
│   │       └── AppHeader.tsx   # Navigation
│   ├── lib/
│   │   ├── tapestry.ts         # Tapestry API client
│   │   ├── game-engine.ts      # Core game logic
│   │   ├── multiplayer.ts      # Supabase Realtime rooms
│   │   ├── escrow.ts           # SOL staking/escrow
│   │   └── utils.ts            # Helpers
│   ├── providers/
│   │   ├── WalletProvider.tsx  # Solana wallet context
│   │   └── ProfileProvider.tsx # User profile context
│   └── store/
│       ├── game-store.ts       # Game state (Zustand)
│       └── user-store.ts       # User state (Zustand)
├── public/                      # Static assets
└── ...config files
```

## Tapestry Integration

KeySocial uses [Tapestry Protocol](https://docs.usetapestry.dev/) for all social features:

- **Profiles**: `findOrCreateProfile()`, `getProfile()`, `updateProfile()`
- **Social Graph**: `followProfile()`, `unfollowProfile()`, `getFollowers()`, `getFollowing()`
- **Content**: `createContent()` for match results and posts, `getContents()` for history
- **Likes & Comments**: Full engagement system for social interactions

All data is stored onchain with Solana state compression via Merkle trees.

## Game Mechanics

### Difficulty Levels

| Difficulty | Keys | Track Length | Key Interval |
|------------|------|--------------|--------------|
| **Easy (Casual)** | `asdfjkl;` | 30 | 2000ms |
| **Medium (Ranked)** | `a-z` | 40 | 1500ms |
| **Hard (Elite)** | `a-z, 0-9` | 50 | 1000ms |
| **Insane** | `a-z, 0-9, symbols` | 60 | 700ms |

### Scoring
- **WPM**: (Correct keys / 5) / elapsed minutes
- **Accuracy**: (Correct / Total) x 100
- **Progress**: (Correct keys / Track length) x 100
- **Winner**: First to 100% progress

## Hackathon Bounty

This project is submitted for the **Onchain Social** track with **Tapestry Protocol** bounty.

### Bounty Requirements Met:
- **Profile Creation**: Users can create onchain profiles via Tapestry
- **Social Graph**: Follow/unfollow system with relationship tracking
- **Content Creation**: Match results and posts recorded as onchain content
- **Social Engagement**: Leaderboard aggregates onchain data, likes and comments on posts
- **Real-time Updates**: Fast, optimistic UI updates with `FAST_UNCONFIRMED` execution
- **Integration Quality**: Full Tapestry API integration throughout the app

### Additional Features:
- Real-time 1v1 multiplayer via Supabase Realtime
- SOL staking with escrow and automated payouts
- Custom profile properties (stats, images)
- Match history with detailed breakdowns
- Ranking system based on wins
- Social feed with Flex WPM and Challenge cards

## Future Enhancements

- **Matchmaking Queue**: Auto-match with players of similar skill
- **Tournaments**: Scheduled competitions with prize pools
- **Spectator Mode**: Watch live races from top players
- **Custom Challenges**: Create and share custom key sequences
- **NFT Avatars**: Profile pictures as Solana NFTs
- **Seasonal Leaderboards**: Reset rankings each season
- **Mobile Support**: PWA for mobile racing

## License

MIT License - feel free to fork and build upon this!

## Acknowledgments

- **Tapestry Protocol** for the amazing social graph infrastructure
- **Solana** for fast, cheap onchain interactions
- **Supabase** for real-time multiplayer infrastructure
- **Phantom Wallet** for seamless wallet integration

---

**Built for the Solana Hackathon**
*Powered by Tapestry Protocol*
