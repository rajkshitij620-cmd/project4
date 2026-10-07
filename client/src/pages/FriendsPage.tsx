import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check, X, Gamepad2, Circle, ShieldAlert } from 'lucide-react';
import { useAuthStore, UserFriend, FriendRequestItem } from '../store/authStore';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import { soundEffects } from '../audio/SoundEffects';

interface FriendsPageProps {
  onOpenAuth: () => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({ onOpenAuth }) => {
  const { isGuest, friends, setFriends, incomingRequests, setIncomingRequests } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searchPlayerId, setSearchPlayerId] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserFriend | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (!isGuest) {
      loadFriendsData();
    }
  }, [isGuest]);

  const loadFriendsData = async () => {
    try {
      const data = await apiService.getFriends();
      setFriends(data.friends || []);
      setIncomingRequests(data.requests || []);
    } catch {}
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlayerId.trim()) return;
    setSearchError(null);
    setSearchedUser(null);
    setRequestSent(false);
    setIsSearching(true);
    soundEffects.playClick();

    try {
      const res = await apiService.searchPlayer(searchPlayerId.trim());
      setSearchedUser(res.user);
    } catch (err: any) {
      setSearchError(err.message || 'Player not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchedUser) return;
    soundEffects.playClick();
    try {
      await apiService.sendFriendRequest(searchedUser.playerId);
      setRequestSent(true);
    } catch (err: any) {
      setSearchError(err.message || 'Could not send request');
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    soundEffects.playClick();
    try {
      await apiService.respondFriendRequest(requestId, action);
      loadFriendsData();
    } catch {}
  };

  const handleInviteToGame = (friend: UserFriend) => {
    soundEffects.playClick();
    socketService.inviteFriend(friend.playerId, 'table_classic');
    alert(`Invitation sent to ${friend.username}! Waiting for them to accept...`);
  };

  if (isGuest) {
    return (
      <div className="w-full h-full overflow-y-auto pb-24 px-4 pt-12 max-w-md mx-auto flex flex-col items-center justify-center text-center select-none">
        <div 
          className="p-8 rounded-3xl border border-[#361D2E]/70 shadow-2xl flex flex-col items-center"
          style={{ background: 'rgba(54, 29, 46, 1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#361D2E]/80 border border-[#361D2E] text-rose-300 flex items-center justify-center mb-4 shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <h2 className="font-display text-2xl font-black text-white mb-2">FRIEND SYSTEM</h2>
          <p className="text-xs text-slate-200 font-semibold mb-6 max-w-xs leading-relaxed">
            Connect your Google account to generate a permanent Player ID, add friends, and challenge them to 1v1 battles!
          </p>
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenAuth();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
          >
            LOGIN WITH GOOGLE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pb-24 px-4 pt-4 max-w-xl mx-auto flex flex-col gap-4 select-none">
      <h2 className="font-display text-xl font-bold text-white tracking-wide">FRIENDS</h2>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchPlayerId}
            onChange={(e) => setSearchPlayerId(e.target.value.toUpperCase())}
            placeholder="Search by Player ID (e.g. TM8K29XP)"
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-mono font-bold text-white placeholder-slate-400 focus:outline-none focus:border-[#361D2E] uppercase shadow-md border border-[#361D2E]/70"
            style={{ background: 'rgba(54, 29, 46, 1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-5 py-3 rounded-2xl text-white text-xs font-black transition-all active:scale-95 shadow-md border border-[#361D2E]/80"
          style={{ background: 'rgba(54, 29, 46, 1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          {isSearching ? '...' : 'Search'}
        </button>
      </form>

      {/* Searched Player Card */}
      {searchError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
          {searchError}
        </div>
      )}

      {searchedUser && (
        <div 
          className="p-4 rounded-2xl border border-[#361D2E]/70 flex items-center justify-between shadow-md"
          style={{ background: 'rgba(54, 29, 46, 1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#361D2E]/80 border border-[#361D2E] flex items-center justify-center text-lg shadow-sm">
              {searchedUser.avatar}
            </div>
            <div>
              <h4 className="text-xs font-black text-white">{searchedUser.username}</h4>
              <span className="text-[11px] font-mono font-bold text-amber-300">{searchedUser.playerId}</span>
            </div>
          </div>

          <button
            onClick={handleSendRequest}
            disabled={requestSent}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              requestSent
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {requestSent ? (
              <>
                <Check size={14} />
                <span>SENT</span>
              </>
            ) : (
              <>
                <UserPlus size={14} />
                <span>ADD</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Sub-tabs: Friends vs Requests */}
      <div className="flex border-b border-slate-800 text-xs font-bold">
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveTab('friends');
          }}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            activeTab === 'friends'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          FRIEND LIST ({friends.length})
        </button>
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveTab('requests');
          }}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <span>REQUESTS</span>
          {incomingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Friends List */}
      {activeTab === 'friends' && (
        <div className="flex flex-col gap-2.5">
          {friends.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No friends added yet. Enter a Player ID above to add friends!
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend._id}
                className="p-3.5 rounded-2xl border border-[#361D2E]/80 shadow-md flex items-center justify-between"
                style={{
                  background: 'rgba(54, 29, 46, 1)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-[#361D2E]/80 border border-[#361D2E] flex items-center justify-center text-lg shadow-sm">
                      {friend.avatar}
                    </div>
                    <Circle
                      size={10}
                      className={`absolute -bottom-0.5 -right-0.5 fill-current ${
                        friend.isOnline ? 'text-emerald-500' : 'text-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{friend.username}</h4>
                    <span className="text-[11px] font-mono font-bold text-rose-300">{friend.playerId}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleInviteToGame(friend)}
                  disabled={!friend.isOnline}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                    friend.isOnline
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/25 active:scale-95'
                      : 'bg-[#361D2E]/60 text-slate-400 cursor-not-allowed border border-[#361D2E]'
                  }`}
                >
                  <Gamepad2 size={14} />
                  <span>INVITE</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Incoming Requests */}
      {activeTab === 'requests' && (
        <div className="flex flex-col gap-2.5">
          {incomingRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No pending friend requests.
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req._id}
                className="p-3.5 rounded-2xl border border-[#361D2E]/80 shadow-md flex items-center justify-between"
                style={{
                  background: 'rgba(54, 29, 46, 1)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#361D2E]/80 border border-[#361D2E] flex items-center justify-center text-lg shadow-sm">
                    {req.from.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{req.from.username}</h4>
                    <span className="text-[11px] font-mono font-bold text-amber-300">{req.from.playerId}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespondRequest(req._id, 'REJECT')}
                    className="p-2 rounded-xl bg-amber-200 hover:bg-amber-300 text-slate-800 border border-amber-300"
                    title="Reject"
                  >
                    <X size={15} />
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req._id, 'ACCEPT')}
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-sm"
                    title="Accept"
                  >
                    <Check size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

