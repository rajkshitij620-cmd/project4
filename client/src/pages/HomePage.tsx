import React, { useState } from 'react';
import { Play, Users, Bot, Layers, Gift, ChevronRight } from 'lucide-react';
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
      setDailyClaimed(true);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-24 select-none relative">
      {/* ── Page Content ── */}
      <div className="relative z-10 px-4 pt-5 pb-4 flex flex-col gap-5 max-w-lg mx-auto">
      {/* 3D Animated Hero Preview Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 border border-[#361D2E] shadow-2xl"
        style={{ background: '#361D2E' }}>
        {/* Subtle glow accents */}
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-yellow-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-black text-white tracking-wide leading-tight mb-2">
            SLING, BOUNCE &amp; WIN
          </h2>
          <p className="text-sm text-amber-100 font-semibold max-w-xs leading-relaxed mb-5">
            Pocket all your pieces into the enemy goal before they clear theirs!
          </p>

          <button
            onClick={handleQuickPlay}
            className="w-full px-8 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-900 font-black text-sm uppercase tracking-wider shadow-lg shadow-yellow-400/30 active:scale-95 transition-all flex items-center justify-center gap-2"
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
          className="p-5 rounded-2xl border border-[#361D2E] cursor-pointer transition-all active:scale-95 flex flex-col justify-between group shadow-lg min-h-[140px]"
          style={{ background: '#361D2E' }}
        >
          <div className="w-12 h-12 rounded-xl bg-yellow-400/20 text-yellow-300 flex items-center justify-center mb-4 group-active:scale-110 transition-transform border border-yellow-400/40">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-display text-base font-black text-white tracking-wide leading-tight">
              PLAY WITH FRIEND
            </h3>
          </div>
        </div>

        {/* Offline Mode */}
        <div
          onClick={() => {
            soundEffects.playClick();
            onStartOffline();
          }}
          className="p-5 rounded-2xl border border-[#361D2E] cursor-pointer transition-all active:scale-95 flex flex-col justify-between group shadow-lg min-h-[140px]"
          style={{ background: '#361D2E' }}
        >
          <div className="w-12 h-12 rounded-xl bg-yellow-400/20 text-yellow-300 flex items-center justify-center mb-4 group-active:scale-110 transition-transform border border-yellow-400/40">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-display text-base font-black text-white tracking-wide leading-tight">
              OFFLINE VS AI
            </h3>
          </div>
        </div>

        {/* Arena Tables */}
        <div
          onClick={() => {
            soundEffects.playClick();
            onNavigateTab('tables');
          }}
          className="col-span-2 p-4 rounded-2xl border border-[#361D2E] cursor-pointer transition-all active:scale-95 flex items-center justify-between shadow-lg"
          style={{ background: '#361D2E' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-yellow-300 flex items-center justify-center border border-yellow-400/40">
              <Layers size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">ARENA TABLES</h4>
            </div>
          </div>
          <ChevronRight size={18} className="text-yellow-300" />
        </div>
      </div>

      {/* Daily Reward Bonus Card */}
      <div className="p-4 rounded-2xl border border-[#361D2E] flex items-center justify-between shadow-lg"
        style={{ background: '#361D2E' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
            <Gift size={22} />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">DAILY REWARD</h4>
            <p className="text-xs text-amber-100 font-medium">Claim 250 Free Coins</p>
          </div>
        </div>

        <button
          onClick={handleClaimDaily}
          disabled={dailyClaimed}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
            dailyClaimed
              ? 'bg-yellow-200 text-yellow-800 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-900 shadow-md shadow-yellow-400/30 active:scale-95'
          }`}
        >
          {dailyClaimed ? 'CLAIMED' : 'CLAIM'}
        </button>
      </div>
      </div> {/* end z-10 content wrapper */}
    </div>
  );
};
