import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, LogOut, LogIn, Coins, Settings, Volume2, VolumeX, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { soundEffects } from '../audio/SoundEffects';

interface ProfilePageProps {
  onOpenAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenAuth }) => {
  const { user, isGuest, logout } = useAuthStore();
  const { soundEnabled, toggleSound, volume, setVolume } = useSettingsStore();
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCopyId = () => {
    if (!user?.playerId) return;
    navigator.clipboard.writeText(user.playerId);
    setCopied(true);
    soundEffects.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  const stats = user?.stats || { matches: 0, wins: 0, losses: 0, winRate: 0, bestScore: 0 };

  return (
    <div className="w-full h-full overflow-y-auto pb-24 px-4 pt-4 max-w-xl mx-auto flex flex-col gap-5 select-none">

      {/* Page Header with Settings Button */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" />
          PLAYER PROFILE
        </h2>

        {/* Settings Gear Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              soundEffects.playClick();
              setSettingsOpen((v) => !v);
            }}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              settingsOpen
                ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
                : 'bg-[#361D2E] border-[#361D2E] text-amber-200 hover:border-yellow-400/40'
            }`}
          >
            <Settings size={20} className={settingsOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
          </button>

          {/* Settings Dropdown */}
          {settingsOpen && (
            <div
              className="absolute right-0 top-12 w-72 rounded-2xl border border-white/15 shadow-2xl z-50 overflow-hidden"
              style={{ background: '#261220', backdropFilter: 'blur(16px)' }}
            >
              {/* Dropdown Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs font-black text-yellow-300 uppercase tracking-wider">Settings</p>
              </div>

              {/* Sound Toggle */}
              <div className="px-4 py-3.5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {soundEnabled
                      ? <Volume2 size={17} className="text-yellow-400" />
                      : <VolumeX size={17} className="text-slate-500" />
                    }
                    <div>
                      <p className="text-sm font-black text-white">Sound Effects</p>
                      <p className="text-[10px] text-amber-100/50">{soundEnabled ? 'ON' : 'OFF'}</p>
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      toggleSound();
                    }}
                    className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-all ${
                      soundEnabled ? 'bg-yellow-400' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                        soundEnabled ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-amber-100/60 font-semibold">Volume</span>
                    <span className="text-[11px] font-black text-yellow-300">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    disabled={!soundEnabled}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: soundEnabled
                        ? `linear-gradient(to right, #facc15 ${volume * 100}%, rgba(255,255,255,0.12) ${volume * 100}%)`
                        : 'rgba(255,255,255,0.12)',
                      accentColor: '#facc15',
                    }}
                  />
                </div>
              </div>

              {/* Login / Logout */}
              <div className="px-4 py-3">
                {isGuest ? (
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setSettingsOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-yellow-400/20"
                  >
                    <LogIn size={14} />
                    <span>LOG IN TO SAVE PROGRESS</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setSettingsOpen(false);
                      logout();
                    }}
                    className="w-full py-2.5 rounded-xl border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ background: 'rgba(239,68,68,0.08)' }}
                  >
                    <LogOut size={14} />
                    <span>LOG OUT</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Card */}
      <div
        className="p-6 rounded-3xl border border-[#361D2E] shadow-xl flex flex-col items-center text-center relative overflow-hidden"
        style={{ background: '#361D2E' }}
      >
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-[#261220] border-2 border-yellow-400/40 flex items-center justify-center text-4xl shadow-md mb-3 relative z-10">
          {user?.avatar || '🎯'}
        </div>

        {/* Username */}
        <h3 className="text-xl font-black text-white relative z-10">{user?.username || 'Player'}</h3>

        {/* Player ID */}
        <div className="flex items-center gap-2 mt-1.5 px-3 py-1.5 rounded-xl bg-[#261220] border border-yellow-400/30 relative z-10 shadow-sm">
          <span className="text-xs font-mono font-black text-yellow-300">
            ID: {user?.playerId || 'TM8K29XP'}
          </span>
          <button
            onClick={handleCopyId}
            className="text-amber-100 hover:text-white p-1 rounded-lg transition-colors"
            title="Copy Player ID"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Coins display */}
        <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#261220] border border-yellow-400/30 text-yellow-300 font-black text-sm shadow-sm">
          <Coins size={16} className="text-yellow-400" />
          <span>{user?.coins.toLocaleString() || '1,000'} Coins</span>
        </div>
      </div>

      {/* Statistics Section */}
      <div>
        <h3 className="text-xs font-bold text-yellow-300 uppercase tracking-wider mb-2.5">
          CAREER STATISTICS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div
            className="p-3.5 rounded-2xl border border-[#361D2E] shadow-md flex flex-col items-center"
            style={{ background: '#361D2E' }}
          >
            <span className="text-[10px] text-amber-100 font-bold uppercase">Matches</span>
            <span className="text-lg font-black text-white mt-0.5">{stats.matches}</span>
          </div>

          <div
            className="p-3.5 rounded-2xl border border-[#361D2E] shadow-md flex flex-col items-center"
            style={{ background: '#361D2E' }}
          >
            <span className="text-[10px] text-amber-100 font-bold uppercase">Wins</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5">{stats.wins}</span>
          </div>

          <div
            className="p-3.5 rounded-2xl border border-[#361D2E] shadow-md flex flex-col items-center"
            style={{ background: '#361D2E' }}
          >
            <span className="text-[10px] text-amber-100 font-bold uppercase">Losses</span>
            <span className="text-lg font-black text-rose-400 mt-0.5">{stats.losses}</span>
          </div>

          <div
            className="p-3.5 rounded-2xl border border-[#361D2E] shadow-md flex flex-col items-center"
            style={{ background: '#361D2E' }}
          >
            <span className="text-[10px] text-amber-100 font-bold uppercase">Win Rate</span>
            <span className="text-lg font-black text-yellow-300 mt-0.5">{stats.winRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
