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
    id: 'table_classic',
    name: 'Classic Arena',
    tagline: 'Warm mahogany wood & brass finish',
    entryFee: 0,
    minCoinsRequired: 0,
    theme: 'classic',
    boardColor: '#4a2511',
    feltColor: '#1c1917',
    borderColor: '#b45309',
    ambientLight: '#fff7ed',
    pointLightColor: '#fbbf24',
    goalGlowColor: '#f59e0b',
    friction: 0.12,
    restitution: 0.88,
    unlockedByDefault: true
  },
  {
    id: 'table_neon',
    name: 'Neon Arena',
    tagline: 'Cyberpunk glass grid with laser rails',
    entryFee: 100,
    minCoinsRequired: 100,
    theme: 'neon',
    boardColor: '#090d16',
    feltColor: '#030712',
    borderColor: '#06b6d4',
    ambientLight: '#c084fc',
    pointLightColor: '#ec4899',
    goalGlowColor: '#38bdf8',
    friction: 0.08,
    restitution: 0.94,
    unlockedByDefault: false
  },
  {
    id: 'table_royal',
    name: 'Royal Arena',
    tagline: 'Imperial gold trim & deep velvet emerald',
    entryFee: 500,
    minCoinsRequired: 500,
    theme: 'royal',
    boardColor: '#1e1b4b',
    feltColor: '#064e3b',
    borderColor: '#eab308',
    ambientLight: '#fef08a',
    pointLightColor: '#f59e0b',
    goalGlowColor: '#fbbf24',
    friction: 0.10,
    restitution: 0.90,
    unlockedByDefault: false
  },
  {
    id: 'table_cyber',
    name: 'Cyber Arena',
    tagline: 'Quantum hyper-alloy with particle fields',
    entryFee: 1000,
    minCoinsRequired: 1000,
    theme: 'cyber',
    boardColor: '#020617',
    feltColor: '#0f172a',
    borderColor: '#8b5cf6',
    ambientLight: '#818cf8',
    pointLightColor: '#06b6d4',
    goalGlowColor: '#a855f7',
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
  ownerId: string;
  x: number;
  z: number;
  isPocketed: boolean;
  pocketedAt?: number;
}

