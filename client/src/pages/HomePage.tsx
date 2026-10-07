import React, { useState } from 'react';
import { Play, Users, Bot, Layers, Gift, Sparkles, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { GAME_TABLES } from '@shared/types';
import { soundEffects } from '../audio/SoundEffects';
import { apiService } from '../services/apiService';
import { HomeBackground } from '../components/HomeBackground';

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
    <div className="w-full h-full overflow-y-auto pb-24 select-none relative">
      {/* ── Animated 3D Colorful Background ── */}
      <HomeBackground />

      {/* ── Page Content ── */}
      <div className="relative z-10 px-4 pt-5 pb-4 flex flex-col gap-5 max-w-lg mx-auto">
      {/* 3D Animated Hero Preview Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 border border-cyan-500/40 shadow-2xl shadow-cyan-500/20"
        style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        {/* Inner glow accents */}
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-cyan-500/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wider mb-3">
            <Sparkles size={13} />
            <span>3D PHYSICS MULTIPLAYER</span>
          </div>
          <h2 className="font-display text-3xl font-extrabold text-white tracking-wide leading-tight mb-2">
            SLING, BOUNCE &amp; WIN
          </h2>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed mb-5">
            Pocket all your pieces into the enemy goal before they clear theirs!
          </p>

          <button
            onClick={handleQuickPlay}
            className="w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 active:from-blue-500 active:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
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
          className="p-5 rounded-2xl border border-slate-700/60 cursor-pointer transition-all active:scale-95 flex flex-col justify-between group shadow-lg"
          style={{ background: 'rgba(15,23,42,0.60)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4 group-active:scale-110 transition-transform border border-cyan-500/20">
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
          className="p-5 rounded-2xl border border-slate-700/60 cursor-pointer transition-all active:scale-95 flex flex-col justify-between group shadow-lg"
          style={{ background: 'rgba(15,23,42,0.60)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-4 group-active:scale-110 transition-transform border border-indigo-500/20">
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
          className="col-span-2 p-4 rounded-2xl border border-amber-500/25 cursor-pointer transition-all active:scale-95 flex items-center justify-between"
          style={{ background: 'rgba(15,23,42,0.60)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
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
      <div className="p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between"
        style={{ background: 'rgba(20,12,5,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
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
      </div> {/* end z-10 content wrapper */}
    </div>
  );
};

