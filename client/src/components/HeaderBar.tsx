import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Coins } from 'lucide-react';
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
    <header className="w-full h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-30 select-none flex-shrink-0">
      {/* Brand Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-base">
            ⚡
          </div>
        </div>
        <div>
          <h1 className="font-display text-base font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-white leading-none">
            DISK SLAM 3D
          </h1>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
            Physics Arena
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <button
          onClick={() => {
            soundEffects.playClick();
            toggleSound();
          }}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition-all"
          title="Toggle Sound"
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-red-400" />}
        </button>

        {/* Coins Badge */}
        <div 
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-300 text-amber-950 font-black text-xs shadow-sm"
          style={{
            background: 'rgba(254, 250, 224, 0.70)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          <Coins size={14} className="text-amber-800" />
          <span>{user?.coins.toLocaleString() || '1,000'}</span>
        </div>

        {/* Player Profile & ID */}
        {user && (
          <div
            onClick={isGuest ? onOpenAuth : undefined}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-amber-300 shadow-sm ${
              isGuest ? 'cursor-pointer active:scale-95' : ''
            }`}
            style={{
              background: 'rgba(254, 250, 224, 0.70)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <div className="text-base">{user.avatar}</div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-black text-slate-950 leading-tight">
                {user.username.length > 8 ? user.username.slice(0, 8) + '…' : user.username}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-amber-900 font-mono font-bold">
                <span>{user.playerId}</span>
                <button
                  onClick={handleCopyId}
                  className="active:scale-90 transition-transform text-slate-700 hover:text-black"
                  title="Copy Player ID"
                >
                  {copied ? <Check size={10} className="text-emerald-700" /> : <Copy size={10} />}
                </button>
              </div>
            </div>

            {isGuest && (
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400">
                Login
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

