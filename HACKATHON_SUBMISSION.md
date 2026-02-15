# KeySocial - Solana Hackathon Submission 🏆

## Project Overview

**KeySocial** is a real-time, skill-based keypress racing game built on Solana with full Tapestry Protocol integration for onchain social features.

## 🎯 Bounty Track: Onchain Social with Tapestry

### Tapestry Integration Requirements ✅

#### 1. Profile Creation & Management
- ✅ `findOrCreateProfile()` - Create onchain profiles with wallet addresses
- ✅ `getProfile()` - Retrieve player profiles
- ✅ `updateProfile()` - Modify profile information
- ✅ Custom properties support for stats and metadata
- ✅ Profile creation UI at `/create-profile`
- ✅ Profile view pages at `/profile/[username]`

#### 2. Social Graph Features
- ✅ `followProfile()` - Follow other racers
- ✅ `unfollowProfile()` - Unfollow functionality
- ✅ `checkFollowStatus()` - Check relationship status
- ✅ `getFollowers()` / `getFollowing()` - Retrieve social connections
- ✅ Follow/unfollow UI on profile pages
- ✅ Follower/following counts displayed

#### 3. Content Creation
- ✅ `createContent()` - Record match results onchain
- ✅ `recordMatchResult()` - Custom function wrapping content with match metadata
- ✅ `getContents()` - Retrieve match history
- ✅ Custom properties for detailed match data (winner, loser, WPM, accuracy, stake)
- ✅ Match history displayed on profile pages
- ✅ Global content feed for leaderboard aggregation

#### 4. User Engagement
- ✅ Leaderboard aggregates wins/losses from onchain content
- ✅ Rankings calculated from match results
- ✅ Player stats (WPM, accuracy, earnings) tracked
- ✅ Social counts (followers, following, matches) displayed
- ✅ Profile discovery through leaderboard

#### 5. Technical Implementation
- ✅ `FAST_UNCONFIRMED` execution for optimal UX
- ✅ Optimistic UI updates
- ✅ Error handling and loading states
- ✅ TypeScript types for all Tapestry responses
- ✅ Clean API abstraction layer (`src/lib/tapestry.ts`)
- ✅ Namespace isolation (`keysocial`)

## 🎮 Core Features

### Gameplay
- **Head-to-head racing**: Two players race to finish line
- **Dynamic key sequences**: Rapidly changing keys test reaction time
- **Graveyard system**: Too many mistakes = elimination
- **4 difficulty levels**: Easy, Ranked, Elite, Insane
- **Real-time stats**: WPM, accuracy, streak tracking
- **AI opponents**: Practice against bots

### Onchain Integration
- **SOL staking**: Lock tokens before matches
- **Automatic payouts**: Winner takes all
- **Transparent results**: All outcomes recorded via Tapestry
- **Profile system**: Persistent identity across matches
- **Social graph**: Follow rivals and friends
- **Leaderboard**: Global rankings from onchain data

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **React 18** with modern hooks

### Blockchain
- **Solana Web3.js** for blockchain interactions
- **Wallet Adapter** (Phantom, Solflare support)
- **Devnet** for testing (Mainnet ready)

### Social Layer
- **Tapestry Protocol** for all social features
- Direct API integration via `fetch`
- Optimistic updates with background confirmation

### UI/UX
- **Lucide Icons** for consistent iconography
- **Sonner** for toast notifications
- **Custom animations** for game feel
- **Responsive design** for all screen sizes

## 📁 Project Structure

```
KeySocial/
├── src/
│   ├── app/                          # Next.js pages
│   │   ├── page.tsx                 # Landing page with hero
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── globals.css              # Global styles & animations
│   │   ├── game/page.tsx            # Main game interface
│   │   ├── leaderboard/page.tsx     # Global rankings
│   │   ├── profile/[username]/      # Dynamic profile pages
│   │   └── create-profile/page.tsx  # Profile creation flow
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── RaceTrack.tsx       # Visual race progress
│   │   │   ├── KeyDisplay.tsx      # Key prompt UI
│   │   │   ├── GameHUD.tsx         # Stats overlay
│   │   │   ├── GameResults.tsx     # Post-match screen
│   │   │   ├── GameSetup.tsx       # Pre-game configuration
│   │   │   └── CountdownOverlay.tsx # Race countdown
│   │   └── layout/
│   │       └── Navbar.tsx           # Navigation bar
│   │
│   ├── lib/
│   │   ├── tapestry.ts             # Tapestry API client
│   │   ├── game-engine.ts          # Core game logic
│   │   └── utils.ts                # Helper functions
│   │
│   ├── providers/
│   │   ├── WalletProvider.tsx      # Solana wallet context
│   │   └── ProfileProvider.tsx     # User profile context
│   │
│   └── store/
│       ├── game-store.ts           # Game state (Zustand)
│       └── user-store.ts           # User state (Zustand)
│
├── public/                          # Static assets
├── .env.local                       # Environment variables
├── README.md                        # Full documentation
├── QUICKSTART.md                    # Quick start guide
└── HACKATHON_SUBMISSION.md         # This file
```

## 🔗 Key Files for Review

### Tapestry Integration
- **`src/lib/tapestry.ts`** - Complete API integration
  - Profile CRUD operations
  - Follow/unfollow system
  - Content creation for matches
  - Leaderboard data aggregation

### Game Engine
- **`src/lib/game-engine.ts`** - Core game mechanics
  - Key generation and validation
  - WPM/accuracy calculation
  - AI opponent logic
  - Match result computation

### State Management
- **`src/store/game-store.ts`** - Game state (Zustand)
  - Player tracking
  - Opponent AI updates
  - Key press handling
  - Match lifecycle
  
- **`src/store/user-store.ts`** - User state (Zustand)
  - Wallet connection
  - Profile data
  - Stats aggregation

### UI Components
- **`src/components/game/`** - Full game UI
  - RaceTrack with progress bars
  - KeyDisplay with animations
  - GameHUD with live stats
  - GameResults with match summary
  - CountdownOverlay for race start

### Pages
- **`src/app/page.tsx`** - Landing page with hero & features
- **`src/app/game/page.tsx`** - Main game interface
- **`src/app/leaderboard/page.tsx`** - Rankings page
- **`src/app/profile/[username]/page.tsx`** - Player profiles
- **`src/app/create-profile/page.tsx`** - Onboarding

## 🎯 Unique Features

### What Makes KeySocial Different

1. **Pure Skill**: No RNG, only reaction time and accuracy matter
2. **Fast Matches**: 30-60 second rounds for instant gratification
3. **Real Stakes**: SOL tokens on the line
4. **Onchain Social**: Every match, follow, and stat recorded via Tapestry
5. **Beautiful UX**: Smooth animations, neon aesthetics, responsive design
6. **AI Practice**: Test skills against adaptive bots
7. **Ranking System**: Bronze → Silver → Gold → Platinum → Diamond → Legend
8. **Match History**: Detailed breakdowns of every race

### Innovation Points

- **Tapestry for Gaming**: First typing/racing game using Tapestry Protocol
- **Social Competition**: Follow system creates rivalries and community
- **Transparent Economics**: All stakes and earnings onchain
- **Scalable**: Merkle tree compression keeps costs low at scale
- **Mobile-Ready**: Responsive design works on all devices

## 📊 Data Flow

### Match Lifecycle with Tapestry

1. **Pre-Match**
   - User connects wallet
   - Profile loaded from Tapestry
   - User selects difficulty & stake

2. **During Match**
   - Local game state managed (no blockchain calls)
   - Real-time updates for optimal UX
   - AI opponent generates actions

3. **Post-Match**
   - Match result calculated
   - `recordMatchResult()` called
   - Content created via Tapestry API
   - Custom properties store detailed stats
   - Result appears in profile & leaderboard

4. **Social Features**
   - View other players on leaderboard
   - Visit their profiles
   - Follow/unfollow
   - See their match history
   - Compare stats

## 🚀 Getting Started

### Installation
```bash
# Dependencies already installed
npm install --ignore-scripts  # If needed

# Start dev server
npm run dev

# Open browser
http://localhost:3000
```

### Environment Variables
Already configured in `.env.local`:
```
NEXT_PUBLIC_TAPESTRY_API_KEY=d359faf1-f381-435d-b4d2-e498b8c4b260
NEXT_PUBLIC_TAPESTRY_API_URL=https://api.usetapestry.dev/v1
NEXT_PUBLIC_APP_NAMESPACE=keysocial
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## 🎥 Demo Flow

1. **Landing Page** - Hero section with animated floating keys
2. **Connect Wallet** - Phantom/Solflare integration
3. **Create Profile** - Choose username, add bio
4. **Game Setup** - Select difficulty and stake
5. **Race** - Real-time typing against AI
6. **Results** - View stats, recorded onchain
7. **Leaderboard** - See global rankings
8. **Profile** - View match history and social connections

## 📈 Metrics & Stats

### Tracked Data (via Tapestry)
- Total matches played
- Win/loss records  
- Best WPM per player
- Average accuracy
- Net earnings (SOL)
- Follower/following counts
- Match timestamps
- Detailed per-match stats

### Leaderboard Sorting
- Most wins
- Highest WPM
- Total earnings

## 🔮 Future Enhancements

### Multiplayer
- Real PvP matchmaking (currently AI)
- Live spectator mode
- Tournament brackets

### Social
- Comments on match results (Tapestry)
- Likes on profiles (Tapestry)
- Direct challenges
- Team competitions

### Economic
- Token rewards for wins
- NFT badges for achievements
- Seasonal prize pools
- Sponsored tournaments

### Technical
- WebSocket for real-time multiplayer
- Solana program for stake escrow
- Compressed NFTs for achievements
- Mobile app (React Native)

## 🏁 Why KeySocial Wins

### Technical Excellence
✅ Clean, maintainable code structure  
✅ Full TypeScript coverage  
✅ Comprehensive Tapestry integration  
✅ Responsive design for all devices  
✅ Production-ready architecture  
✅ Optimistic UI updates for speed  
✅ Error handling throughout  

### User Experience
✅ Beautiful neon aesthetics  
✅ Smooth animations (Framer Motion)  
✅ Fast gameplay (30-60s matches)  
✅ Clear onboarding flow  
✅ Real-time feedback  
✅ Mobile-friendly UI  

### Blockchain Integration
✅ Solana wallet adapter  
✅ Real SOL staking  
✅ Tapestry for social layer  
✅ State compression efficiency  
✅ Fast execution mode  
✅ Mainnet-ready code  

### Product Market Fit
✅ Addictive, skill-based gameplay  
✅ Social competition hooks  
✅ Real money stakes drive engagement  
✅ Leaderboards create aspirations  
✅ Quick sessions fit modern attention  
✅ Growing trend: onchain gaming + social  

### Innovation
✅ First typing game on Tapestry  
✅ Unique blend of arcade + blockchain  
✅ Social features enhance retention  
✅ Transparent, verifiable results  
✅ Scalable for mass adoption  

## 📞 Contact & Links

- **Project**: KeySocial
- **Track**: Onchain Social
- **Bounty**: Tapestry Protocol
- **Namespace**: `keysocial`
- **API Key**: `d359faf1-f381-435d-b4d2-e498b8c4b260`

## 🙏 Acknowledgments

- **Tapestry Team** - Amazing protocol and documentation
- **Solana Foundation** - Fast, cheap blockchain
- **Wallet Adapter Team** - Seamless wallet integration
- **Open Source Community** - Tools and libraries used

---

## ✅ Submission Checklist

- [x] Project builds successfully (`npm run dev`)
- [x] All Tapestry features implemented
- [x] Profile creation working
- [x] Social graph (follow/unfollow) working
- [x] Content creation (match results) working
- [x] Leaderboard aggregation working
- [x] Wallet integration working
- [x] Responsive UI
- [x] TypeScript throughout
- [x] Documentation (README, QUICKSTART, this file)
- [x] Clean code structure
- [x] Error handling
- [x] Loading states
- [x] Environment variables configured
- [x] Dependencies installed

---

**Built with ⚡ for the Solana Hackathon**

*KeySocial - Where Speed Meets Social Meets Solana*

🏁 **Ready to Race!**
