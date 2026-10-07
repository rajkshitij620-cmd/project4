import React, { useState } from 'react';
import { ArrowLeft, Play, Shield, Zap, Flame } from 'lucide-react';
import { GAME_TABLES } from '@shared/types';
import { AIDifficulty } from '../game/ai/DiskSlamAI';
import { useGameStore } from '../store/gameStore';
import { soundEffects } from '../audio/SoundEffects';

interface PlayOfflinePageProps {
  onBack: () => void;
}

// Offline mode always uses Classic Arena (Free, unlocked for everyone)
const OFFLINE_TABLE = GAME_TABLES[0];

export const PlayOfflinePage: React.FC<PlayOfflinePageProps> = ({ onBack }) => {
  const { startOfflineMatch } = useGameStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('MEDIUM');

  const handleStart = () => {
    soundEffects.playClick();
    startOfflineMatch(OFFLINE_TABLE, selectedDifficulty);
  };

  const difficulties: {
    id: AIDifficulty;
    name: string;
    desc: string;
    detail: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
  }[] = [
    {
      id: 'EASY',
      name: 'Easy',
      desc: 'Casual & Beginner Friendly',
      detail: 'Bot makes wider angle errors, shoots with less power and accuracy.',
      icon: Shield,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
      border: 'border-emerald-400',
    },
    {
      id: 'MEDIUM',
      name: 'Medium',
      desc: 'Balanced & Tactical',
      detail: 'Bot aims with moderate precision, mixes power shots with strategic angles.',
      icon: Zap,
      color: 'text-amber-700',
      bg: 'bg-amber-100',
      border: 'border-amber-400',
    },
    {
      id: 'HARD',
      name: 'Hard',
      desc: 'Precise & Aggressive',
      detail: 'Bot shoots with near-perfect accuracy and high power. Good luck!',
      icon: Flame,
      color: 'text-rose-700',
      bg: 'bg-rose-100',
      border: 'border-rose-400',
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto pb-24 px-4 pt-4 max-w-xl mx-auto flex flex-col gap-5 select-none">

      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => {
            soundEffects.playClick();
            onBack();
          }}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-display text-xl font-bold text-white tracking-wide">OFFLINE VS AI</h2>
          <p className="text-[11px] text-slate-400">Classic Arena · Sling Puck · 5 vs 5 pucks</p>
        </div>
      </div>

      {/* Classic Arena Preview Banner */}
      <div
        className="rounded-3xl border border-amber-400/70 p-4 relative overflow-hidden shadow-xl flex items-center gap-4"
        style={{ background: 'rgba(248, 237, 235, 0.50)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {/* Color dot glow */}
        <div
          className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-30"
          style={{ backgroundColor: OFFLINE_TABLE.borderColor }}
        />

        {/* Arena color swatch */}
        <div
          className="w-14 h-14 rounded-2xl border-2 flex-shrink-0 shadow-md"
          style={{
            backgroundColor: OFFLINE_TABLE.feltColor,
            borderColor: OFFLINE_TABLE.borderColor,
            boxShadow: `0 0 14px ${OFFLINE_TABLE.borderColor}60`,
          }}
        >
          <div className="w-full h-full rounded-2xl flex items-center justify-center">
            <div
              className="w-6 h-6 rounded-full border-2"
              style={{ backgroundColor: OFFLINE_TABLE.boardColor, borderColor: OFFLINE_TABLE.borderColor }}
            />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: OFFLINE_TABLE.borderColor }} />
            <h3 className="font-display text-base font-black text-slate-950">{OFFLINE_TABLE.name}</h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full">FREE</span>
          </div>
          <p className="text-[11px] text-slate-700 font-semibold">{OFFLINE_TABLE.tagline}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600 font-bold">
            <span>🎯 5 pucks per side</span>
            <span>⚡ Simultaneous play</span>
          </div>
        </div>
      </div>

      {/* AI Difficulty Selection */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          SELECT AI DIFFICULTY
        </h3>
        <div className="flex flex-col gap-3">
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
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-md active:scale-98 ${
                  isSelected
                    ? `${diff.border} ring-2 ring-blue-500/40`
                    : 'border-[#f8edeb]/80 hover:border-[#f8edeb]'
                }`}
                style={{ background: 'rgba(248, 237, 235, 0.50)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl border ${diff.bg} ${diff.border} ${diff.color} flex-shrink-0`}>
                    <Icon size={20} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-black ${diff.color}`}>{diff.name}</h4>
                      <span className="text-[10px] text-slate-700 font-semibold">{diff.desc}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{diff.detail}</p>
                  </div>

                  {/* Radio */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-400 bg-transparent'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="mt-1 w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Play size={18} fill="currentColor" />
        <span>START SLING PUCK — {selectedDifficulty}</span>
      </button>
    </div>
  );
};
