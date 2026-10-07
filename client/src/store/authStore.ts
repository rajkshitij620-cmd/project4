import { create } from 'zustand';

export interface UserFriend {
  _id: string;
  playerId: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface FriendRequestItem {
  _id: string;
  from: {
    _id: string;
    playerId: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

export interface UserProfile {
  id: string;
  playerId: string;
  username: string;
  email: string;
  avatar: string;
  coins: number;
  stats: {
    matches: number;
    wins: number;
    losses: number;
    winRate: number;
    bestScore: number;
  };
}

interface AuthStoreState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  friends: UserFriend[];
  incomingRequests: FriendRequestItem[];
  incomingInvite: {
    roomId: string;
    fromPlayerId: string;
    fromUsername: string;
    tableId: string;
  } | null;

  // Actions
  login: (userData: UserProfile, token: string) => void;
  logout: () => void;
  updateCoins: (coins: number) => void;
  updateStats: (won: boolean) => void;
  setFriends: (friends: UserFriend[]) => void;
  setIncomingRequests: (requests: FriendRequestItem[]) => void;
  setIncomingInvite: (invite: AuthStoreState['incomingInvite']) => void;
  initGuest: () => void;
}

const GUEST_STORAGE_KEY = 'diskslam_guest_user';
const TOKEN_STORAGE_KEY = 'diskslam_token';
const USER_STORAGE_KEY = 'diskslam_user';

function generateRandomPlayerId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TM';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: true,
  friends: [],
  incomingRequests: [],
  incomingInvite: null,

  login: (userData, token) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    set({
      user: userData,
      token,
      isAuthenticated: true,
      isGuest: false
    });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    get().initGuest();
  },

  updateCoins: (coins) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, coins };
    set({ user: updated });
    if (!get().isGuest) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    } else {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
    }
  },

  updateStats: (won) => {
    const user = get().user;
    if (!user) return;
    const matches = user.stats.matches + 1;
    const wins = won ? user.stats.wins + 1 : user.stats.wins;
    const losses = won ? user.stats.losses : user.stats.losses + 1;
    const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
    const bestScore = Math.max(user.stats.bestScore, won ? 4 : 0);

    const updated: UserProfile = {
      ...user,
      stats: { matches, wins, losses, winRate, bestScore }
    };

    set({ user: updated });
    if (!get().isGuest) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    } else {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
    }
  },

  setFriends: (friends) => set({ friends }),
  setIncomingRequests: (incomingRequests) => set({ incomingRequests }),
  setIncomingInvite: (incomingInvite) => set({ incomingInvite }),

  initGuest: () => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        set({
          user: parsed,
          token: savedToken,
          isAuthenticated: true,
          isGuest: false
        });
        return;
      } catch {}
    }

    // Otherwise load or generate guest profile
    const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest);
        set({
          user: parsed,
          token: null,
          isAuthenticated: false,
          isGuest: true
        });
        return;
      } catch {}
    }

    const guestId = generateRandomPlayerId();
    const guestUser: UserProfile = {
      id: `guest_${guestId}`,
      playerId: guestId,
      username: `Player_${guestId.slice(-4)}`,
      email: '',
      avatar: '👑',
      coins: 1000,
      stats: {
        matches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        bestScore: 0
      }
    };

    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    set({
      user: guestUser,
      token: null,
      isAuthenticated: false,
      isGuest: true
    });
  }
}));

