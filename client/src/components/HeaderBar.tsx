import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Coins, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { soundEffects } from '../audio/SoundEffects';

interface HeaderBarProps {
  onOpenAuth: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenAuth }) => {
  const { user, isGuest } = useAuthStore();
  const { soundEnabled, toggleSound } = useSettingsStore();
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.playerId) return;
    navigator.clipboard.writeText(user.playerId);
    setCopied(true);
    soundEffects.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between z-30 select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-xl">
            ⚡
          </div>
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-white leading-none">
            DISK SLAM 3D
          </h1>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Physics Arena
          </span>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Sound Toggle */}
        <button
          onClick={() => {
            soundEffects.playClick();
            toggleSound();
          }}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all active:scale-95"
          title="Toggle Sound"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-red-400" />}
        </button>

        {/* Coins Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/20 border border-amber-500/30 text-amber-300 font-bold text-sm shadow-inner">
          <Coins size={16} className="text-amber-400" />
          <span>{user?.coins.toLocaleString() || '1,000'}</span>
        </div>

        {/* Player Profile & ID */}
        {user && (
          <div
            onClick={isGuest ? onOpenAuth : undefined}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 ${
              isGuest ? 'cursor-pointer hover:border-blue-500/50' : ''
            }`}
          >
            <div className="text-lg">{user.avatar}</div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {user.username}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
                <span>{user.playerId}</span>
                <button
                  onClick={handleCopyId}
                  className="hover:text-cyan-200 transition-colors"
                  title="Copy Player ID"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            {isGuest && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Login
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

