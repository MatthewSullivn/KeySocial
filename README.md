# KeySocial ⚡

**Real-time, browser-based social typing game on Solana**

KeySocial is a competitive word typing racing game where players compete in head-to-head sprint duels with real SOL stakes. Built for the Solana Hackathon with Tapestry Protocol integration for onchain social features.

![Built on Solana](https://img.shields.io/badge/Solana-Blockchain-14F195?logo=solana)
![Tapestry Protocol](https://img.shields.io/badge/Tapestry-Social%20Graph-9945FF)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)

## 🎮 What is KeySocial?

KeySocial combines fast-paced word typing mechanics with blockchain technology to create a skill-based competitive racing platform:

- **⚡ Fast Rounds**: 30-60 second matches for instant gratification
- **💰 Real Stakes**: Stake SOL tokens on your matches
- **🏆 Skill-Based**: Pure typing speed and accuracy - no luck involved involved
- **📊 Onchain Social**: Profiles, follows, and match history powered by Tapestry
- **🎯 Multiple Difficulties**: From casual home-row typing to insane mode with symbols
- **👥 Social Competition**: Follow rivals, climb leaderboards, challenge friends

## 🚀 Features

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
- **Ranking System**: Bronze → Silver → Gold → Platinum → Diamond → Legend

### Staking & Rewards
- **SOL Staking**: Lock tokens before each match
- **Winner Takes All**: Automatic payouts to the victor
- **Transparent Results**: All match outcomes onchain via Tapestry

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Blockchain**: Solana (Web3.js, Wallet Adapter)
- **Social Layer**: Tapestry Protocol API
- **State Management**: Zustand
- **Animations**: Framer Motion
- **UI Components**: Lucide Icons, Sonner (toasts)

## 📦 Installation

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

The `.env.local` file is already configured with the API key:
```env
NEXT_PUBLIC_TAPESTRY_API_KEY=d359faf1-f381-435d-b4d2-e498b8c4b260
NEXT_PUBLIC_TAPESTRY_API_URL=https://api.usetapestry.dev/v1
NEXT_PUBLIC_APP_NAMESPACE=keysocial
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

## 🎯 How to Play

1. **Connect Wallet**: Connect your Solana wallet (Phantom, Solflare, etc.)
2. **Create Profile**: Set up your racer profile (username, bio)
3. **Choose Settings**: 
   - Select difficulty (Easy, Ranked, Elite, Insane)
   - Set stake amount (0 for practice, or real SOL)
4. **Race**: 
   - Words appear on screen - type them as fast as possible
   - Complete words move you forward
   - Mistakes slow you down (too many = graveyard!)
   - First to finish wins
5. **Climb Ranks**: Win matches to climb the leaderboard

## 🏗️ Project Structure

```
KeySocial/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx             # Landing page
│   │   ├── game/page.tsx        # Main game page
│   │   ├── leaderboard/page.tsx # Global rankings
│   │   ├── profile/[username]/  # Profile pages
│   │   └── create-profile/      # Profile creation
│   ├── components/
│   │   ├── game/                # Game UI components
│   │   │   ├── RaceTrack.tsx   # Visual race display
│   │   │   ├── KeyDisplay.tsx  # Key prompt UI
│   │   │   ├── GameHUD.tsx     # Stats overlay
│   │   │   ├── GameResults.tsx # Post-match screen
│   │   │   └── ...
│   │   └── layout/
│   │       └── Navbar.tsx       # Navigation
│   ├── lib/
│   │   ├── tapestry.ts         # Tapestry API client
│   │   ├── game-engine.ts      # Core game logic
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

## 🔗 Tapestry Integration

KeySocial uses [Tapestry Protocol](https://docs.usetapestry.dev/) for all social features:

- **Profiles**: `findOrCreateProfile()`, `getProfile()`, `updateProfile()`
- **Social Graph**: `followProfile()`, `unfollowProfile()`, `getFollowers()`, `getFollowing()`
- **Content**: `createContent()` for match results, `getContents()` for history
- **Likes & Comments**: Full engagement system for social interactions

All data is stored onchain with Solana state compression via Merkle trees.

## 🎨 Game Mechanics

### Difficulty Levels

| Difficulty | Keys | Track Length | Max Mistakes | Key Interval |
|------------|------|--------------|--------------|--------------|
| **Easy (Casual)** | `asdfjkl;` | 30 | 10 | 2000ms |
| **Medium (Ranked)** | `a-z` | 40 | 7 | 1500ms |
| **Hard (Elite)** | `a-z, 0-9` | 50 | 5 | 1000ms |
| **Insane** | `a-z, 0-9, symbols` | 60 | 3 | 700ms |

### Scoring
- **WPM**: (Correct keys / 5) / elapsed minutes
- **Accuracy**: (Correct / Total) × 100
- **Progress**: (Correct keys / Track length) × 100
- **Winner**: First to 100% progress OR opponent dies

## 🏆 Hackathon Bounty

This project is submitted for the **Onchain Social** track with **Tapestry Protocol** bounty.

### Bounty Requirements Met:
✅ **Profile Creation**: Users can create onchain profiles via Tapestry  
✅ **Social Graph**: Follow/unfollow system with relationship tracking  
✅ **Content Creation**: Match results recorded as onchain content  
✅ **Social Engagement**: Leaderboard aggregates onchain data  
✅ **Real-time Updates**: Fast, optimistic UI updates with `FAST_UNCONFIRMED` execution  
✅ **Integration Quality**: Full Tapestry API integration throughout the app  

### Additional Features:
- Custom profile properties (stats, images)
- Match history with detailed breakdowns
- Ranking system based on wins
- Transparent earnings tracking
- Social feed potential (can add comments/likes to match results)

## 🚧 Future Enhancements

- **Multiplayer Matchmaking**: Real PvP lobbies (currently AI opponents)
- **Tournaments**: Scheduled competitions with prize pools
- **Spectator Mode**: Watch live races from top players
- **Custom Challenges**: Create and share custom key sequences
- **NFT Avatars**: Profile pictures as Solana NFTs
- **Seasonal Leaderboards**: Reset rankings each season
- **Chat System**: In-game messaging via Tapestry comments
- **Mobile Support**: PWA for mobile racing

## 📄 License

MIT License - feel free to fork and build upon this!

## 🙏 Acknowledgments

- **Tapestry Protocol** for the amazing social graph infrastructure
- **Solana** for fast, cheap onchain interactions
- **Phantom Wallet** for seamless wallet integration
- Hackathon organizers and judges

## 🔥 Start Racing Now!

```bash
npm install
npm run dev
```

Then connect your wallet at `http://localhost:3000` and start dominating the leaderboard! ⚡🏁

---

**Built with ⚡ for the Solana Hackathon**  
*Powered by Tapestry Protocol*
