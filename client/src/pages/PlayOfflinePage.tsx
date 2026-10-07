import React, { useState } from 'react';
import { ArrowLeft, Play, Shield, Zap, Flame, Lock } from 'lucide-react';
import { TableConfig, GAME_TABLES } from '@shared/types';
import { AIDifficulty } from '../game/ai/DiskSlamAI';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { soundEffects } from '../audio/SoundEffects';

interface PlayOfflinePageProps {
  onBack: () => void;
}

export const PlayOfflinePage: React.FC<PlayOfflinePageProps> = ({ onBack }) => {
  const { startOfflineMatch } = useGameStore();
  const { user } = useAuthStore();

  const [selectedTable, setSelectedTable] = useState<TableConfig>(GAME_TABLES[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('MEDIUM');

  const coins = user?.coins || 1000;

  const handleStart = () => {
    soundEffects.playClick();
    startOfflineMatch(selectedTable, selectedDifficulty);
  };

  const difficulties: { id: AIDifficulty; name: string; desc: string; icon: any; color: string }[] = [
    {
      id: 'EASY',
      name: 'EASY',
      desc: 'Forgiving angles & casual play',
      icon: Shield,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    },
    {
      id: 'MEDIUM',
      name: 'MEDIUM',
      desc: 'Balanced shots & tactical defense',
      icon: Zap,
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
    },
    {
      id: 'HARD',
      name: 'HARD',
      desc: 'Laser precision physics calculations',
      icon: Flame,
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
    }
  ];

  return (
    <div className="w-full h-full overflow-y-auto pb-24 px-4 pt-4 max-w-xl mx-auto flex flex-col gap-5 select-none">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            soundEffects.playClick();
            onBack();
          }}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-display text-xl font-bold text-white tracking-wide">
          OFFLINE VS AI
        </h2>
      </div>

      {/* Select Table Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          1. SELECT ARENA TABLE
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {GAME_TABLES.map((t) => {
            const isSelected = selectedTable.id === t.id;
            const isLocked = !t.unlockedByDefault && coins < t.minCoinsRequired;

            return (
              <div
                key={t.id}
                onClick={() => {
                  if (isLocked) return;
                  soundEffects.playClick();
                  setSelectedTable(t);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between shadow-md ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/50'
                    : isLocked
                    ? 'opacity-60 border-slate-300'
                    : 'border-amber-200/90 hover:border-amber-300'
                }`}
                style={{ background: 'rgba(254, 250, 224, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-950">{t.name}</span>
                    {isLocked ? (
                      <Lock size={14} className="text-slate-600" />
                    ) : (
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.borderColor }}
                      />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-700 font-semibold leading-snug">{t.tagline}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-amber-300/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 font-bold">Entry:</span>
                  <span className="font-black text-amber-900">
                    {t.entryFee === 0 ? 'FREE' : `🪙 ${t.entryFee}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Select AI Difficulty */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          2. SELECT DIFFICULTY
        </h3>
        <div className="flex flex-col gap-2.5">
          {difficulties.map((diff) => {
            const Icon = diff.icon;
            const isSelected = selectedDifficulty === diff.id;

            return (
              <div
                key={diff.id}
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedDifficulty(diff.id);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-md ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/50'
                    : 'border-amber-300/60 hover:border-amber-300'
                }`}
                style={{ background: 'rgba(254, 250, 224, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-200/80 text-slate-900 border border-amber-300">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-950">{diff.name}</h4>
                    <p className="text-[11px] text-slate-600 font-medium">{diff.desc}</p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-400'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Launch Button */}
      <button
        onClick={handleStart}
        className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Play size={18} fill="currentColor" />
        <span>START OFFLINE BATTLE</span>
      </button>
    </div>
  );
};

