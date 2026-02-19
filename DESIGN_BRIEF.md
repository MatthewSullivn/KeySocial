# KeySocial — Design Brief for Matching Theme

Use this document to generate designs (illustrations, marketing assets, UI concepts) that match KeySocial’s existing app theme.

---

## Product Summary

**KeySocial** is a real-time, browser-based **typing racing game** on Solana. Users race head-to-head (or vs AI), optionally stake SOL, and climb on-chain leaderboards. Core flows: connect wallet → create profile → pick difficulty/room → race (type words) → see results and leaderboard. Social feed shows posts, race results, WPM flexes, and bot challenge cards.

---

## Design System Overview

- **Vibe:** Modern, friendly, competitive. “Gaming” but not dark/aggressive — clean SaaS meets racing/social. Light mode default; dark mode fully supported with the same palette.
- **Aesthetic:** Rounded corners, soft blobs, subtle gradients. Accent colors (lime, pink, purple, teal) on neutral light/dark backgrounds. Optional **neo-brutalist** touch: solid black borders, `shadow-pop` (offset black shadow), “pop-card” hover. Material Icons (Outlined/Round) for UI icons.
- **Motion:** Subtle — pulse, float, slide-up, key-pop; nothing flashy. Smooth transitions (200–300ms). Typing feedback: correct = lime highlight + scale; wrong = red tint + small shake.

---

## Color Palette

### Primary / Brand
- **Primary (lime):** `#D9ED65` — main brand, CTAs, active nav, avatar fills, “correct” typing, WPM highlights. Hover: `#C8DB5B`.
- **Secondary (pink):** `#EA4C89` / `#F45D86` — race accent, difficulty “Ranked”, some cards.
- **Tertiary / Purple:** `#6366F1` / `#6B63F6` — accents, “Elite” tier, defeated state.
- **Teal:** `#4FD1C5` — accent, “Casual” tier, progress bars, links.
- **Blue:** `#5D5DF8` — challenge/lobby accents.

### Backgrounds
- **Light:** Page `#F7F9FB`; cards/surfaces `#FFFFFF`; muted areas `#F7F9FB` / gray-50.
- **Dark:** Page `#0F172A`; cards `#1F2937`; surfaces `#1E293B`; darker grays `#111118`, `#1a1a24`, `#252530`, `#32323f`.

### Text
- **Light mode:** Primary text `#111827`; muted `#6B7280`; borders `#E5E7EB`.
- **Dark mode:** Primary text `#F3F4F6`; muted `#9CA3AF`; borders gray-700/slate-700.

### Legacy / Neon (used sparingly)
- Neon green `#39FF14`, blue `#00f0ff`, purple `#b829ff`, pink `#ff2d78`, yellow `#ffe600` — racing/typing glow or decorative only.

---

## Typography

- **Display / Headings:** Plus Jakarta Sans, fallback Space Grotesk, then Inter. Bold (700–800), tight tracking. Used for hero, section titles, card titles, usernames.
- **Body:** Inter. Weights 300–800. Used for descriptions, posts, form labels, table text.
- **Mono:** Courier New / system monospace. Used for WPM numbers, race stats, code-like elements (hash, “Press Start”).

Fonts loaded: Inter (300–800), Plus Jakarta Sans (500–800), Space Grotesk (300–700). Material Icons (default, Round, Outlined), Material Symbols Outlined.

---

## Layout & Structure

- **Max content width:** `max-w-7xl` (1280px) or `max-w-6xl` (1152px) for leaderboard; centered, with `px-4 sm:px-6 lg:px-8`.
- **Header:** Sticky, `backdrop-blur`, light/dark bg with opacity; height ~4rem. Logo: “K” in a rounded square (primary bg, black text). Nav: pill-shaped links; active = primary bg + black text. Wallet button: pill, black (light) / white (dark). Mobile: hamburger, same pills in a dropdown.
- **Pages:** Consistently use `AppHeader`; main content below with consistent padding and optional background blobs.

---

## Reusable UI Patterns

### Cards
- **Default:** White/dark surface, `rounded-2xl` or `rounded-xl`, border gray-200/dark gray-700. Hover: slight lift (`-translate-y-1` or `-translate-y-4`), soft shadow. Class: `outline-card`.
- **Pop-card (feed):** Same base + `shadow-pop` (e.g. `4px 4px 0 rgba(0,0,0,1)`). Hover: `translate(-2px,-2px)`, stronger pop shadow. Left border accent: 4px in primary, pink, purple, or teal by card type.
- **Step/feature cards:** Colored background (e.g. accent-pink, accent-purple, accent-teal), white text, rounded-2xl, optional huge number in corner; icon in rounded circle.

### Buttons
- **Primary CTA:** Black bg (light theme) / white (dark), white/black text, `rounded-full`, bold, padding ~py-4 px-8. Hover: darker/lighter + slight lift.
- **Secondary:** Bordered pill, same padding; hover border and text emphasis.
- **In-card actions:** Rounded-lg/xl, primary or accent fill; e.g. “Join Lobby” = primary bg, black text, `shadow-pop-sm`.

### Form inputs
- Rounded-xl, border gray-200/dark gray-700; focus: ring-2 primary/30, border primary. Optional leading icon (Material) in muted color. Labels: semibold; hints: xs, muted.

### Avatars / identity
- **Profile:** Rounded-lg or rounded-full; bg = primary; text = black; bold initial letter. Optional 2px border (slate-900/dark gray). Small “online” dot: accent-teal, bottom-right.

### Blobs / background
- **Organic blobs:** SVG paths (organic shapes), `fill: currentColor`, color = primary at 40–50% opacity (light) / 20% (dark). Placed top-left, top-right, bottom; some with `animate-pulse` (slow).
- **Floating blobs:** Large `rounded-full` divs, blur-3xl, primary/pink/teal at low opacity; `floating-blob` animation (translateY + optional rotate). Used in feed, leaderboard hero.

---

## Page-Specific Design Notes

### Landing
- Hero: “Type Fast. Win On-Chain.” — “Win On-Chain” has pink→purple gradient + small lime underline. Subtext gray-600/dark gray-300. Two CTAs: “Start Racing” (filled), “View Demo” (outline). Trust line: “Powered by Solana”, “Verifiable Results” with Material icons (bolt, verified).
- Visual: Floating card mockups (keyboard keys, WPM “128” with circular progress), soft gradients, optional dashed lime/pink SVG paths.
- Vision: Three feature cards — gradient image area (yellow/orange, purple/pink, green/teal), icon, badge, title, description. Hover: icon scale.
- Steps: Three colored step cards (pink, purple, teal), big number in corner, icon at bottom.
- Footer: Logo “K” + “KeySocial”; links Feed, Leaderboard, Game; border-top.

### Game
- **Setup:** Difficulty pills (Casual=primary, Ranked=secondary, Elite=purple, Insane=pink); stake chips; mode: vs Bot / Create room / Join room. Cards with ring and bg tint per difficulty.
- **Racing:** Large word area in a rounded-2xl container; words in mono, wrap; current word: correct = primary, wrong = red-400 + bg tint, cursor = primary underline + pulse. Space hint “␣” when awaiting space. Optional race track stripes (repeating gradient).
- **Results:** Big result card — win = primary border/bg tint + trophy icon; lose = purple. Stats grid: You WPM | bolt icon | Opponent WPM. Rows: Accuracy, Best Streak, Mistakes, Duration. If stake: “You won/lost X SOL” in primary or red tint.

### Feed
- **Layout:** Sidebar (hidden on small) — profile card with avatar, WPM Avg, Wins, “Flex WPM” / “Challenge” / post composer; filter pills (Following, Top, Global). Main: list of cards.
- **Post cards:** Pop-card; left border 4px (teal default, pink for flex, blue for challenge). Avatar (primary, initial), author name (display font), handle, time ago. Content text; optional WPM flex block (dark gradient, big WPM number, tier badge, “Beat this” link) or challenge block.
- **Bot challenge cards:** Same card style; bot icon, message, difficulty, “Race” CTA with accent color.
- **Race result cards:** Left border pink; inner “New Personal Best” box with gradient, trophy, WPM/accuracy, hash, “View Race Replay”.

### Leaderboard
- **Hero:** “Global Racing Standings”; subtext; soft blob accents (lime, purple).
- **Podium:** Top 3 as blocks — 2nd left, 1st center, 3rd right; heights/visual weight by rank; avatar, name, WPM or wins. “YOU” badge (primary) when current user.
- **Table:** White/dark card, `rounded-2xl`, strong border (2px black in light / slate-700 dark), `shadow-pop`. Header row: Rank, Player, Best WPM, Win Rate, Matches, Earnings. Rows: rank badge (gold/silver/bronze for 1–3), avatar, username, stats. Current user row: primary/5 bg + left border primary.

### Profile
- Header: Cover area, avatar (large), username, @handle, follow button (primary when following), stats (Wins, Losses, Best WPM, etc.). Tabs or sections: Posts, Match history. Match history: list of result cards (winner, WPM, accuracy, stake).

### Create profile
- Centered form in rounded-3xl card; icon (person_add) in primary/20 box; “Create Your Profile”; username (with @ icon), bio optional; Submit = primary/black CTA. Same blob background as landing.

---

## Icons & Imagery

- **Icons:** Material Icons (Outlined preferred for nav): home, forum, sports_esports, leaderboard, person, bolt, verified, emoji_events, account_balance_wallet, timer, local_fire_department, code, meeting_room, etc. Material Symbols for any extra UI.
- **Illustration:** Prefer simple SVG shapes (blobs, dashed tracks), abstract gradients, and card mockups over heavy illustration. No stock-photo humans.

---

## Motion & Interaction

- **Transitions:** 200ms for hover (color, background); 300ms for transform (lift, scale). Page/section: slide-up or fade-in.
- **Animations:** `pulse` (opacity) for blobs; `float` (translateY ±10px) for floating blobs; `key-pop` for correct key; `stumble` for wrong key; `race-progress` (scaleX) for progress bars.
- **Toasts:** Dark panel (#111827), light border, system theme; position bottom-right (Sonner).

---

## What to Preserve When Generating New Designs

1. **Primary lime `#D9ED65`** as the main brand and success/action color.
2. **Pink, purple, teal** as secondary accents; don’t replace with a completely different palette.
3. **Plus Jakarta Sans / Inter** for headings and body (or very similar geometric sans).
4. **Rounded corners** (xl, 2xl, 3xl, full for pills).
5. **Light-first with proper dark mode** — same hues, darker backgrounds and muted text.
6. **Pop-card / neo-brutalist** option: solid borders, offset black shadow, left-border accent on cards.
7. **Organic blobs and soft gradients** in the background, not busy patterns.
8. **Gaming/social tone** — competitive but approachable; “racing”, “WPM”, “stake”, “on-chain” fit the copy.

---

## Summary One-Liner for Prompts

“KeySocial is a Solana typing-racing game. Use a lime primary (#D9ED65), pink/purple/teal accents, Plus Jakarta Sans and Inter, rounded cards and pills, optional pop-card shadows and left-border accents, organic SVG blobs and soft gradients, Material-style icons, and light/dark themes. Tone: modern, friendly, competitive.”
