# KeySocial - Quick Start Guide ⚡

## 🚀 Get Started in 3 Minutes

### 1. Dependencies are Already Installed ✅

The project comes with all dependencies pre-installed in `node_modules`. If you need to reinstall:

```bash
npm install --ignore-scripts
```

### 2. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

### 3. Connect & Play

1. **Open** http://localhost:3000 in your browser
2. **Connect** your Solana wallet (Phantom, Solflare, etc.)
3. **Create** your profile with a username
4. **Race** - Choose difficulty and start playing!

## 🎮 How to Play

### Game Setup
- **Difficulty**: Easy (casual) → Ranked → Elite → Insane
- **Stake**: 0 SOL for practice, or real SOL for ranked matches
- Click "Start Race" to begin

### During the Race
- **Watch** the screen for the key to press
- **Type fast** - correct keys move you forward
- **Be accurate** - too many mistakes send you to the graveyard
- **First to finish** wins the stake!

### After the Race
- View your stats (WPM, accuracy, streak)
- Results are automatically saved onchain via Tapestry
- Play again or check the leaderboard

## 📁 Project Structure

```
src/
├── app/                    # Pages
│   ├── page.tsx           # Landing page
│   ├── game/              # Game page
│   ├── leaderboard/       # Rankings
│   ├── profile/[username]/ # Player profiles
│   └── create-profile/    # Onboarding
├── components/
│   ├── game/              # Game UI (RaceTrack, KeyDisplay, etc.)
│   └── layout/            # Navbar, etc.
├── lib/
│   ├── tapestry.ts        # Tapestry API integration
│   ├── game-engine.ts     # Game logic
│   └── utils.ts           # Helpers
├── store/                 # Zustand state management
└── providers/             # Wallet & Profile context
```

## 🔑 Key Features

### Tapestry Integration
All social features use [Tapestry Protocol](https://docs.usetapestry.dev/):
- ✅ Onchain profiles with custom properties
- ✅ Follow/unfollow system
- ✅ Match history recorded as content
- ✅ Leaderboard aggregated from onchain data
- ✅ Fast execution with `FAST_UNCONFIRMED` mode

### Game Features
- 4 difficulty levels with different key sets
- Real-time WPM and accuracy tracking
- Mistake limit system (graveyard)
- AI opponent for practice
- Beautiful animations with Framer Motion

## 🎯 API Key

Your Tapestry API key is configured in `.env.local`:
```
NEXT_PUBLIC_TAPESTRY_API_KEY=d359faf1-f381-435d-b4d2-e498b8c4b260
```

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🌐 Environment Variables

Already configured in `.env.local`:
- `NEXT_PUBLIC_TAPESTRY_API_KEY` - Your Tapestry API key
- `NEXT_PUBLIC_TAPESTRY_API_URL` - Tapestry API endpoint
- `NEXT_PUBLIC_APP_NAMESPACE` - App namespace (keysocial)
- `NEXT_PUBLIC_SOLANA_NETWORK` - Solana network (devnet)

## 🐛 Troubleshooting

### "npm install" fails
Use the ignore-scripts flag:
```bash
npm install --ignore-scripts
```

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Wallet not connecting
- Make sure you have Phantom or Solflare installed
- Try refreshing the page
- Check that you're on the correct network (devnet)

### Profile creation fails
- Username must be 3-20 characters
- Only letters, numbers, and underscores allowed
- Try a different username if taken

## 📊 Game Mechanics

### Difficulty Comparison
| Level | Keys | Length | Lives | Speed |
|-------|------|--------|-------|-------|
| Easy | asdfjkl; | 30 | 10 | Slow |
| Ranked | a-z | 40 | 7 | Medium |
| Elite | a-z, 0-9 | 50 | 5 | Fast |
| Insane | All chars | 60 | 3 | Very Fast |

### Scoring
- **WPM** = (Correct Keys / 5) / Minutes Elapsed
- **Accuracy** = Correct / Total × 100%
- **Progress** = Correct / Track Length × 100%

## 🏆 Hackathon Submission

This project is built for the **Solana Hackathon** using:
- **Tapestry Protocol** for onchain social features
- **Solana** for blockchain integration
- **Next.js 14** for the web app

### Bounty Requirements ✅
- ✅ Profile creation & management
- ✅ Social graph (follow/unfollow)
- ✅ Content creation (match results)
- ✅ User engagement (leaderboard)
- ✅ Full Tapestry API integration

## 💡 Next Steps

1. **Play some races** to test the gameplay
2. **Create content** by playing ranked matches
3. **Check the leaderboard** to see rankings
4. **Follow other players** to build your network
5. **Share your profile** with friends

## 🔗 Useful Links

- [Tapestry Documentation](https://docs.usetapestry.dev/)
- [Solana Docs](https://docs.solana.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Phantom Wallet](https://phantom.app/)

---

**Ready to race?** Run `npm run dev` and visit http://localhost:3000 ⚡🏁
