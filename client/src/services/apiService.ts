import { UserProfile, UserFriend, FriendRequestItem } from '../store/authStore';

const BASE_URL = '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('diskslam_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  // Auth
  public async register(payload: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ user: UserProfile; token: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async login(payload: {
    loginId: string; // email or playerId
    password: string;
  }): Promise<{ user: UserProfile; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async googleLogin(payload: {
    email: string;
    name?: string;
    avatar?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getMe(): Promise<{ user: UserProfile }> {
    return this.request('/auth/me');
  }

  // Friends
  public async searchPlayer(playerId: string): Promise<{ user: UserFriend }> {
    return this.request(`/friends/search/${playerId.toUpperCase()}`);
  }

  public async getFriends(): Promise<{ friends: UserFriend[]; requests: FriendRequestItem[] }> {
    return this.request('/friends');
  }

  public async sendFriendRequest(targetPlayerId: string): Promise<{ message: string }> {
    return this.request('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ targetPlayerId: targetPlayerId.toUpperCase() })
    });
  }

  public async respondFriendRequest(
    requestId: string,
    action: 'ACCEPT' | 'REJECT'
  ): Promise<{ message: string }> {
    return this.request('/friends/respond', {
      method: 'POST',
      body: JSON.stringify({ requestId, action })
    });
  }

  // Wallet
  public async getWallet(): Promise<{
    coins: number;
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      description: string;
      createdAt: string;
    }>;
  }> {
    return this.request('/wallet');
  }

  public async claimDailyReward(): Promise<{ coins: number; message: string }> {
    return this.request('/wallet/claim-daily', {
      method: 'POST'
    });
  }
}

export const apiService = new ApiService();

