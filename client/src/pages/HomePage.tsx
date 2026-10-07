import React, { useState } from 'react';
import { Play, Users, Bot, Layers, Gift, Sparkles, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { GAME_TABLES } from '@shared/types';
import { soundEffects } from '../audio/SoundEffects';
import { apiService } from '../services/apiService';

interface HomePageProps {
  onStartOffline: () => void;
  onNavigateTab: (tab: 'home' | 'friends' | 'tables' | 'profile') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartOffline, onNavigateTab }) => {
  const { user, isGuest, updateCoins } = useAuthStore();
  const { startOfflineMatch } = useGameStore();
  const [dailyClaimed, setDailyClaimed] = useState(false);

  const handleQuickPlay = () => {
    soundEffects.playClick();
    startOfflineMatch(GAME_TABLES[0], 'MEDIUM');
  };

  const handleClaimDaily = async () => {
    soundEffects.playClick();
    try {
      if (!isGuest) {
        const res = await apiService.claimDailyReward();
        updateCoins(res.coins);
      } else {
        const current = user?.coins || 1000;
        updateCoins(current + 250);
      }
      soundEffects.playCoin();
      setDailyClaimed(true);
    } catch {
      // already claimed or error
      setDailyClaimed(true);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-24 px-4 pt-6 max-w-xl mx-auto flex flex-col gap-6 select-none">
      {/* 3D Animated Hero Preview Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider mb-3">
            <Sparkles size={13} />
            <span>3D PHYSICS MULTIPLAYER</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-wide leading-tight mb-2">
            SLING, BOUNCE &amp; WIN
          </h2>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed mb-5">
            Pocket all your pieces into the enemy goal before they clear theirs!
          </p>

          <button
            onClick={handleQuickPlay}
            className="w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 active:from-blue-500 active:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play size={18} fill="currentColor" />
            <span>QUICK PLAY NOW</span>
          </button>
        </div>
      </div>

      {/* Main Game Mode Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Play with Friend */}
        <div
          onClick={() => {
            soundEffects.playClick();
            onNavigateTab('friends');
          }}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 cursor-pointer transition-all active:scale-98 flex flex-col justify-between group shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white tracking-wide">
              PLAY WITH FRIEND
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Online Real-time 1v1</p>
          </div>
        </div>

        {/* Offline Mode */}
        <div
          onClick={() => {
            soundEffects.playClick();
            onStartOffline();
          }}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 cursor-pointer transition-all active:scale-98 flex flex-col justify-between group shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white tracking-wide">
              OFFLINE VS AI
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">No Internet Needed</p>
          </div>
        </div>

        {/* Arena Tables */}
        <div
          onClick={() => {
            soundEffects.playClick();
            onNavigateTab('tables');
          }}
          className="col-span-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">ARENA TABLES</h4>
              <p className="text-[11px] text-slate-400">Classic, Neon, Royal &amp; Cyber Tables</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-500" />
        </div>
      </div>

      {/* Daily Reward Bonus Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
            <Gift size={22} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-200">DAILY REWARD</h4>
            <p className="text-[11px] text-slate-400">Claim 250 Free Coins</p>
          </div>
        </div>

        <button
          onClick={handleClaimDaily}
          disabled={dailyClaimed}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase transition-all ${
            dailyClaimed
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
          }`}
        >
          {dailyClaimed ? 'CLAIMED' : 'CLAIM'}
        </button>
      </div>
    </div>
  );
};

