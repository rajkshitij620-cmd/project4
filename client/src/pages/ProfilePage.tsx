import React, { useState } from 'react';
import { Copy, Check, Trophy, Award, Flame, LogOut, LogIn, Coins } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { soundEffects } from '../audio/SoundEffects';

interface ProfilePageProps {
  onOpenAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenAuth }) => {
  const { user, isGuest, logout } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (!user?.playerId) return;
    navigator.clipboard.writeText(user.playerId);
    setCopied(true);
    soundEffects.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = user?.stats || { matches: 0, wins: 0, losses: 0, winRate: 0, bestScore: 0 };

  return (
    <div className="w-full h-full overflow-y-auto pb-24 px-4 pt-4 max-w-xl mx-auto flex flex-col gap-5 select-none">
      <h2 className="font-display text-xl font-bold text-white tracking-wide">
        PLAYER PROFILE
      </h2>

      {/* Main Profile Card */}
      <div 
        className="p-6 rounded-3xl border border-[#361D2E]/70 shadow-xl flex flex-col items-center text-center relative overflow-hidden"
        style={{ background: 'rgba(54, 29, 46, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#361D2E]/40 to-transparent pointer-events-none" />

        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-[#361D2E]/90 border-2 border-[#361D2E] flex items-center justify-center text-4xl shadow-md mb-3 relative z-10">
          {user?.avatar || '🎯'}
        </div>

        {/* Username */}
        <h3 className="text-xl font-black text-white relative z-10">{user?.username || 'Player'}</h3>

        {/* Unique Player ID with Copy Button */}
        <div className="flex items-center gap-2 mt-1.5 px-3 py-1.5 rounded-xl bg-[#361D2E]/80 border border-[#361D2E] relative z-10 shadow-sm">
          <span className="text-xs font-mono font-black text-rose-300">
            ID: {user?.playerId || 'TM8K29XP'}
          </span>
          <button
            onClick={handleCopyId}
            className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors"
            title="Copy Player ID"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Coins display */}
        <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#361D2E]/80 border border-[#361D2E] text-amber-300 font-black text-sm shadow-sm">
          <Coins size={16} className="text-amber-400" />
          <span>{user?.coins.toLocaleString() || '1,000'} Coins</span>
        </div>
      </div>

      {/* Statistics Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          CAREER STATISTICS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div 
            className="p-3.5 rounded-2xl border border-[#361D2E]/70 shadow-md flex flex-col items-center"
            style={{ background: 'rgba(54, 29, 46, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <span className="text-[10px] text-slate-300 font-bold uppercase">Matches</span>
            <span className="text-lg font-black text-white mt-0.5">{stats.matches}</span>
          </div>

          <div 
            className="p-3.5 rounded-2xl border border-[#361D2E]/70 shadow-md flex flex-col items-center"
            style={{ background: 'rgba(54, 29, 46, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <span className="text-[10px] text-slate-300 font-bold uppercase">Wins</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5">{stats.wins}</span>
          </div>

          <div 
            className="p-3.5 rounded-2xl border border-[#361D2E]/70 shadow-md flex flex-col items-center"
            style={{ background: 'rgba(54, 29, 46, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <span className="text-[10px] text-slate-300 font-bold uppercase">Losses</span>
            <span className="text-lg font-black text-rose-400 mt-0.5">{stats.losses}</span>
          </div>

          <div 
            className="p-3.5 rounded-2xl border border-[#361D2E]/70 shadow-md flex flex-col items-center"
            style={{ background: 'rgba(54, 29, 46, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <span className="text-[10px] text-slate-300 font-bold uppercase">Win Rate</span>
            <span className="text-lg font-black text-cyan-400 mt-0.5">{stats.winRate}%</span>
          </div>
        </div>
      </div>

      {/* Account Status / Log out */}
      <div className="mt-2">
        {isGuest ? (
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenAuth();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={16} />
            <span>LOG IN WITH GOOGLE TO SAVE PROGRESS</span>
          </button>
        ) : (
          <button
            onClick={() => {
              soundEffects.playClick();
              logout();
            }}
            className="w-full py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>LOG OUT</span>
          </button>
        )}
      </div>
    </div>
  );
};

