// Shared types between client and server for Disk Slam 3D Multiplayer

export type PlayerColor = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange';

export interface PlayerColorDefinition {
  id: PlayerColor;
  name: string;
  hex: string;
  lightHex: string;
  glowHex: string;
  emissiveHex: string;
}

export const COLOR_PALETTE: Record<PlayerColor, PlayerColorDefinition> = {
  blue: {
    id: 'blue',
    name: 'Cobalt Blue',
    hex: '#2563eb',
    lightHex: '#60a5fa',
    glowHex: '#3b82f6',
    emissiveHex: '#1d4ed8'
  },
  red: {
    id: 'red',
    name: 'Crimson Red',
    hex: '#dc2626',
    lightHex: '#f87171',
    glowHex: '#ef4444',
    emissiveHex: '#b91c1c'
  },
  green: {
    id: 'green',
    name: 'Emerald Green',
    hex: '#16a34a',
    lightHex: '#4ade80',
    glowHex: '#22c55e',
    emissiveHex: '#15803d'
  },
  yellow: {
    id: 'yellow',
    name: 'Amber Gold',
    hex: '#eab308',
    lightHex: '#fde047',
    glowHex: '#facc15',
    emissiveHex: '#ca8a04'
  },
  purple: {
    id: 'purple',
    name: 'Amethyst Violet',
    hex: '#9333ea',
    lightHex: '#c084fc',
    glowHex: '#a855f7',
    emissiveHex: '#7e22ce'
  },
  orange: {
    id: 'orange',
    name: 'Solar Orange',
    hex: '#ea580c',
    lightHex: '#fb923c',
    glowHex: '#f97316',
    emissiveHex: '#c2410c'
  }
};

export interface TableConfig {
  id: string;
  name: string;
  tagline: string;
  entryFee: number;
  minCoinsRequired: number;
  theme: 'classic' | 'neon' | 'royal' | 'cyber';
  boardColor: string;
  feltColor: string;
  borderColor: string;
  ambientLight: string;
  pointLightColor: string;
  goalGlowColor: string;
  friction: number;
  restitution: number;
  unlockedByDefault: boolean;
}

export const GAME_TABLES: TableConfig[] = [
  {
    // ── Classic Arena: Warm honey-maple wood, bright clean playing surface
    id: 'table_classic',
    name: 'Classic Arena',
    tagline: 'Natural birch wood · Ivory smooth surface · Brass elastic pegs',
    entryFee: 0,
    minCoinsRequired: 0,
    theme: 'classic',
    boardColor: '#b45309',      // Warm golden-amber wood rails
    feltColor: '#fffbeb',       // Bright ivory/cream playing surface (maximum clarity)
    borderColor: '#d97706',
    ambientLight: '#ffffff',
    pointLightColor: '#fef3c7',
    goalGlowColor: '#f59e0b',
    friction: 0.12,
    restitution: 0.88,
    unlockedByDefault: true
  },
  {
    // ── Neon Arena: Midnight black surface, electric cyan/pink neon rails
    id: 'table_neon',
    name: 'Neon Arena',
    tagline: 'Midnight black · Electric cyan neon · Laser rails',
    entryFee: 100,
    minCoinsRequired: 100,
    theme: 'neon',
    boardColor: '#164e63',      // Dark cyan-teal rails glowing with neon
    feltColor: '#020c14',       // Ultra-dark near-black playing surface
    borderColor: '#06b6d4',
    ambientLight: '#c084fc',
    pointLightColor: '#ec4899',
    goalGlowColor: '#22d3ee',
    friction: 0.08,
    restitution: 0.94,
    unlockedByDefault: false
  },
  {
    // ── Royal Arena: Deep emerald green surface, gold rails
    id: 'table_royal',
    name: 'Royal Arena',
    tagline: 'Emerald velvet · Imperial gold frame · Crown jewel finish',
    entryFee: 500,
    minCoinsRequired: 500,
    theme: 'royal',
    boardColor: '#78350f',      // Rich antique gold-brown wood frame
    feltColor: '#14532d',       // Deep emerald green felt
    borderColor: '#ca8a04',
    ambientLight: '#fef08a',
    pointLightColor: '#fbbf24',
    goalGlowColor: '#fde047',
    friction: 0.10,
    restitution: 0.90,
    unlockedByDefault: false
  },
  {
    // ── Cyber Arena: Deep violet surface, chrome-purple alloy rails
    id: 'table_cyber',
    name: 'Cyber Arena',
    tagline: 'Hyper-violet · Chrome alloy · Quantum particle field',
    entryFee: 1000,
    minCoinsRequired: 1000,
    theme: 'cyber',
    boardColor: '#3b0764',      // Deep glowing purple chrome frame
    feltColor: '#1e1b4b',       // Indigo-violet playing surface
    borderColor: '#8b5cf6',
    ambientLight: '#818cf8',
    pointLightColor: '#a855f7',
    goalGlowColor: '#c026d3',
    friction: 0.06,
    restitution: 0.96,
    unlockedByDefault: false
  }
];

export type GameStatePhase =
  | 'LOBBY'
  | 'WAITING'
  | 'READY'
  | 'AIMING'
  | 'SIMULATING'
  | 'CHECKING_RESULT'
  | 'GAME_OVER';

export interface PieceState {
  id: string;
  color: PlayerColor;
  ownerId: string; // 'playerA' or 'playerB' or socket/user id
  x: number;
  z: number;
  isPocketed: boolean;
  pocketedAt?: number;
}

export interface ShotData {
  playerId: string;
  dirX: number;
  dirZ: number;
  force: number;
  strikerId: string;
}

export interface MatchSummary {
  matchId: string;
  winnerId: string;
  loserId: string;
  winnerColor: PlayerColor;
  loserColor: PlayerColor;
  scoreA: number;
  scoreB: number;
  tableId: string;
  durationSeconds: number;
  entryFee: number;
  rewardCoins: number;
  totalShots: number;
  timestamp: string;
}

