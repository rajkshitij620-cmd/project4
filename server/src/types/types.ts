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

