# DISK SLAM 3D — Multiplayer Physics Board Game

A complete, production-quality **3D multiplayer physics-based board game** built with React, Three.js, React Three Fiber, Rapier Physics, Express, Socket.IO, and MongoDB.

Playable on mobile phones (Android, iOS), tablets, and desktops (macOS, Windows, Linux) as a responsive web application and installable PWA.

---

## 🌟 Features

- **3D Gameplay & Physics Simulation**:
  - Physically based 3D arena table, borders, cushioned walls, and goal pockets.
  - Realistic physics powered by `@react-three/rapier` (restitution, friction, linear & angular damping).
  - Responsive top-down 45°–60° camera with automatic portrait/landscape aspect ratio adjustment.
  - Interactive drag-to-shoot sling mechanic with dynamic trajectory dots, power gauge, and haptic sound effects.
  - Turn settle monitor ensuring turns transition only when all disks have come to rest.

- **Offline Mode vs Physics-Aware AI**:
  - 100% playable client-side without internet or backend connection.
  - Physics-aware AI (Easy, Medium, Hard) that analyzes striker position, target disks, line-of-sight, pocket trajectory, and obstacle avoidance.

- **Online Multiplayer & Friend System**:
  - Real-time 1v1 friend matches via Socket.IO.
  - Unique human-friendly Player IDs (e.g. `TM8K29XP`).
  - Search players by Player ID, send friend requests, accept/reject, and track online/offline presence.
  - Real-time game invitations with instant Accept/Decline pop-ups.
  - Authoritative turn synchronization, move broadcasting, and score tracking.

- **Core Game Rules & Color System**:
  - Two-player turn-based match.
  - **Random Player Color Assignment**: At the start of every match, each player is assigned a random color from the palette (`blue`, `red`, `green`, `yellow`, `purple`, `orange`). Colors are never permanently assigned.
  - **Winning Condition**: A player wins when **ALL of their own colored pieces have entered the opponent's goal**. Pocketing opponent pieces does NOT count towards victory (`remainingOwnPieces === 0`).

- **Arena Tables System**:
  - **Classic Arena** (Warm mahogany wood & brass finish — Free Entry)
  - **Neon Arena** (Cyberpunk glowing rails & laser grid — 100 Coins)
  - **Royal Arena** (Imperial gold trim & deep velvet emerald — 500 Coins)
  - **Cyber Arena** (Quantum hyper-alloy with holographic field — 1,000 Coins)

- **Virtual Coin Economy**:
  - Starter bonus coins on signup.
  - Daily reward claim with 24-hour cooldown.
  - Server-side validation of wallet balances and match reward payouts with transaction history (`MATCH_ENTRY`, `MATCH_REWARD`, `DAILY_REWARD`, `BONUS`).
  - Strict virtual currency model with zero real-money gambling.

- **Sound & Visual Design**:
  - Procedural Web Audio sound synthesizer for clicks, shots, disk-to-disk clacks, wall thumps, goal chimes, victory fanfare, and coin jingles without external broken URLs.
  - Modern glassmorphic dark game UI with Tailwind CSS and Framer Motion animations.
  - Confetti victory celebrations and detailed match stats (pieces pocketed, accuracy %, shots taken, duration).

- **Progressive Web App (PWA)**:
  - Installable on Android and iOS homescreens (`vite-plugin-pwa`).
  - Offline static asset caching via Service Worker.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Styling & UI**: Tailwind CSS, Framer Motion, Lucide React
- **3D Graphics**: Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`
- **Physics Engine**: Rapier Physics (`@react-three/rapier`)
- **State Management**: Zustand
- **Audio Engine**: Web Audio API Procedural Synthesizer
- **Networking**: `socket.io-client`

### Backend
- **Runtime**: Node.js, Express, TypeScript
- **WebSockets**: Socket.IO
- **Database**: MongoDB with Mongoose (with automated in-memory fallback for local development)
- **Authentication**: JWT, bcryptjs password hashing
- **Security**: CORS, sanitized inputs, server-side coin validation

---

## 📂 Project Architecture

```
/
├── client/                     # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── audio/              # Procedural Web Audio Synthesizer
│   │   ├── components/         # GameOverlay, GameOverModal, HeaderBar, Nav, AuthModal
│   │   ├── game/
│   │   │   ├── ai/             # Physics-aware client-side AI (Easy, Medium, Hard)
│   │   │   ├── camera/         # Responsive 3D Game Camera
│   │   │   ├── core/           # GameRulesEngine (random colors, pocket rules, win state)
│   │   │   ├── entities/       # 3D Board, Piece pucks, Striker, AimTrajectory
│   │   │   └── physics/        # PhysicsWorld R3F & Rapier container
│   │   ├── pages/              # Home, PlayOffline, Friends, Tables, Profile
│   │   ├── services/           # Socket.IO client and REST API service
│   │   ├── store/              # Zustand stores (gameStore, authStore, settingsStore)
│   │   └── types/              # Color palettes, tables, piece interfaces
│   ├── vite.config.ts          # Vite & PWA configuration
│   └── tailwind.config.js      # Game UI theme
│
├── server/                     # Express + Socket.IO + TypeScript Backend
│   ├── src/
│   │   ├── middleware/         # JWT auth middleware
│   │   ├── models/             # Mongoose schemas (User, Wallet, GameRoom, Friendship, etc.)
│   │   ├── routes/             # REST routes for auth, friends, and wallet
│   │   ├── socket/             # Authoritative Socket.IO multiplayer handler
│   │   ├── utils/              # Unique short Player ID generator (e.g. TM8K29XP)
│   │   ├── db.ts               # Database connector with development fallback
│   │   └── index.ts            # Express server entry point
│   ├── tsconfig.json
│   └── package.json
│
├── test/                       # Automated validation test suite
│   ├── game-validation.test.ts # Game engine, rules, AI, and geometry tests
│   └── backend-auth-wallet.test.ts # User auth, Player ID, and wallet tests
└── package.json                # Root orchestration scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or later (v20+ recommended)
- **npm**: v9 or later

### Installation

1. **Clone or navigate to the repository:**
   ```bash
   cd /path/to/Game
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Environment Setup:**
   The server includes a `.env` file pre-configured for local development:
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/diskslam
   JWT_SECRET=super_secret_jwt_key_diskslam_game_production_ready_9921
   CORS_ORIGIN=http://localhost:3000
   ```

---

## 💻 Local Development

Run both the frontend and backend servers together with a **single command**:

```bash
npm run dev
```

This starts:
- **Backend API & Socket Server** on `http://localhost:5001` with `[SERVER]` prefix.
- **Frontend Client (Vite)** on `http://localhost:3000` with `[CLIENT]` prefix.

You can also run them individually if needed:
```bash
# Frontend only
npm run dev:client

# Backend only
npm run dev:server
```

Open your browser at `http://localhost:3000`.

---

## 🧪 Running Automated Tests

Run the game validation test suite verifying random colors, symmetric piece layout, pocket detection, win condition rules, AI calculations, and wallet transactions:

```bash
# Run game rules and physics AI tests
./server/node_modules/.bin/tsx test/game-validation.test.ts

# Run backend auth, Player ID uniqueness, and wallet tests
NODE_PATH=./server/node_modules ./server/node_modules/.bin/tsx test/backend-auth-wallet.test.ts
```

---

## 🌐 Multiplayer Networking Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `inviteFriend` | Client → Server | `{ targetPlayerId, tableId }` | Sends game invite to an online friend |
| `gameInviteReceived`| Server → Client | `{ roomId, fromPlayerId, fromUsername, tableId }` | Pop-up notification on recipient client |
| `respondInvite` | Client → Server | `{ roomId, accept }` | Accepts or declines match invitation |
| `matchStarted` | Server → Client | `{ roomId, tableId, playerA, playerB, myRole, initialPieces }` | Launches synchronized 3D arena match |
| `sendShoot` | Client → Server | `{ roomId, dirX, dirZ, power }` | Sends shot impulse to server |
| `opponentShot` | Server → Client | `{ dirX, dirZ, power }` | Replicates opponent shot in Rapier physics |
| `syncPocketedPiece`| Client → Server | `{ roomId, pieceId, intoOpponentGoal }` | Reports goal entry to room |
| `syncSettled` | Client → Server | `{ roomId }` | Syncs physics settle and switches turn |

---

## 🚢 Production Deployment

### Frontend (Vercel)
1. Set the root directory to `client`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com`

### Backend (Render / Railway)
1. Set the root directory to `server`.
2. Build command: `npm run build`
3. Start command: `npm start`
4. Set environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas cluster connection string
   - `JWT_SECRET`: Production random cryptographic key
   - `CORS_ORIGIN`: Your deployed Vercel frontend URL

