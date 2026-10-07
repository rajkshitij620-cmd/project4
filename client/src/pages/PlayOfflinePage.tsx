import React, { useState } from 'react';
import { ArrowLeft, Play, Shield, Zap, Flame } from 'lucide-react';
import { GAME_TABLES, TableConfig } from '@shared/types';
import { AIDifficulty } from '../game/ai/DiskSlamAI';
import { useGameStore } from '../store/gameStore';
import { soundEffects } from '../audio/SoundEffects';

interface PlayOfflinePageProps {
  onBack: () => void;
}

// Offline mode always uses Classic Arena (Free, unlocked for everyone)
const OFFLINE_TABLE = GAME_TABLES[0];

/* ─── Mini Sling-Puck Board SVG Preview ─────────────────────────────────── */
const BoardPreview: React.FC<{ table: TableConfig; size?: number }> = ({ table, size = 160 }) => {
  const W = size;
  const H = size * 1.65;
  const rail = size * 0.085;
  const innerW = W - rail * 2;
  const innerH = H - rail * 2;
  const cx = W / 2;
  const divY = H / 2;
  const gateW = innerW * 0.28;
  const gateLeft = cx - gateW / 2;
  const gateRight = cx + gateW / 2;
  const puckR = size * 0.075;

  const puckRowGap = innerH * 0.115;
  const puckColGap = innerW * 0.28;
  const mkPucks = (yBase: number, dir: 1 | -1) => [
    { x: cx - puckColGap, y: yBase + dir * puckRowGap * 0 },
    { x: cx + puckColGap, y: yBase + dir * puckRowGap * 0 },
    { x: cx - puckColGap * 0.5, y: yBase + dir * puckRowGap * 1.1 },
    { x: cx + puckColGap * 0.5, y: yBase + dir * puckRowGap * 1.1 },
    { x: cx,                     y: yBase + dir * puckRowGap * 2.2 },
  ];

  const topPucks    = mkPucks(rail + puckRowGap * 0.6, 1);
  const bottomPucks = mkPucks(H - rail - puckRowGap * 0.6, -1);

  const pegY_top = rail + innerH * 0.10;
  const pegY_bot = H - rail - innerH * 0.10;
  const dividerColor = '#b45309';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ display: 'block', filter: `drop-shadow(0 6px 22px ${table.borderColor}66)` }}
    >
      <defs>
        <linearGradient id="frame-offline" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={table.boardColor} />
          <stop offset="60%" stopColor="#b45309" />
          <stop offset="100%" stopColor={table.boardColor} stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id="felt-offline" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor={table.feltColor} />
        </radialGradient>
        <radialGradient id="puckA-offline" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
        <radialGradient id="puckB-offline" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#b91c1c" />
        </radialGradient>
        <filter id="glow-offline">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Board Frame */}
      <rect x={0} y={0} width={W} height={H} rx={size * 0.08} ry={size * 0.08}
        fill="url(#frame-offline)" />

      {/* Playing Surface */}
      <rect x={rail} y={rail} width={innerW} height={innerH}
        rx={size * 0.04} ry={size * 0.04}
        fill="url(#felt-offline)" />

      {/* Center circle dashed */}
      <circle cx={cx} cy={divY} r={innerW * 0.14}
        fill="none" stroke={dividerColor} strokeWidth={1}
        strokeOpacity={0.3} strokeDasharray="3 4" />

      {/* Divider left */}
      <rect x={rail} y={divY - 1.5} width={gateLeft - rail} height={3}
        fill={dividerColor} opacity={0.85} />

      {/* Divider right */}
      <rect x={gateRight} y={divY - 1.5} width={W - rail - gateRight} height={3}
        fill={dividerColor} opacity={0.85} />

      {/* Gate glow */}
      <rect x={gateLeft} y={divY - 3} width={gateW} height={6} rx={2} ry={2}
        fill={table.goalGlowColor} opacity={0.4}
        filter="url(#glow-offline)" />

      {/* Gate pin markers */}
      <circle cx={gateLeft}  cy={divY} r={2.5} fill={table.goalGlowColor} opacity={0.95} />
      <circle cx={gateRight} cy={divY} r={2.5} fill={table.goalGlowColor} opacity={0.95} />

      {/* Gate label */}
      <text x={cx} y={divY - 6} textAnchor="middle" fontSize={size * 0.065}
        fill={table.goalGlowColor} opacity={0.7} fontWeight="bold">GATE</text>

      {/* Elastic peg top */}
      <circle cx={cx} cy={pegY_top} r={size * 0.028}
        fill={table.boardColor} stroke={dividerColor} strokeWidth={1.5} opacity={0.95} />
      <line x1={rail + 4} y1={pegY_top} x2={W - rail - 4} y2={pegY_top}
        stroke={dividerColor} strokeWidth={1} strokeOpacity={0.35} strokeDasharray="4 3" />

      {/* Elastic peg bottom */}
      <circle cx={cx} cy={pegY_bot} r={size * 0.028}
        fill={table.boardColor} stroke={dividerColor} strokeWidth={1.5} opacity={0.95} />
      <line x1={rail + 4} y1={pegY_bot} x2={W - rail - 4} y2={pegY_bot}
        stroke={dividerColor} strokeWidth={1} strokeOpacity={0.35} strokeDasharray="4 3" />

      {/* AI pucks (top - red) */}
      {topPucks.map((p, i) => (
        <g key={`top-${i}`}>
          <circle cx={p.x} cy={p.y} r={puckR}
            fill="url(#puckB-offline)"
            stroke="#f87171" strokeWidth={0.8} strokeOpacity={0.5} />
          <circle cx={p.x - puckR * 0.25} cy={p.y - puckR * 0.28} r={puckR * 0.28}
            fill="white" opacity={0.3} />
        </g>
      ))}

      {/* Player pucks (bottom - blue) */}
      {bottomPucks.map((p, i) => (
        <g key={`bot-${i}`}>
          <circle cx={p.x} cy={p.y} r={puckR}
            fill="url(#puckA-offline)"
            stroke="#60a5fa" strokeWidth={0.8} strokeOpacity={0.5} />
          <circle cx={p.x - puckR * 0.25} cy={p.y - puckR * 0.28} r={puckR * 0.28}
            fill="white" opacity={0.3} />
        </g>
      ))}

      {/* "YOU" label at bottom side */}
      <text x={cx} y={H - rail * 0.3} textAnchor="middle" fontSize={size * 0.065}
        fill="#2563eb" opacity={0.7} fontWeight="bold">YOU ▲</text>

      {/* "BOT" label at top */}
      <text x={cx} y={rail * 0.85} textAnchor="middle" fontSize={size * 0.065}
        fill="#dc2626" opacity={0.7} fontWeight="bold">▼ BOT</text>

      {/* Rail border */}
      <rect x={0} y={0} width={W} height={H} rx={size * 0.08} ry={size * 0.08}
        fill="none" stroke={table.borderColor} strokeWidth={2} strokeOpacity={0.75} />
    </svg>
  );
};

/* ─── Main Page ────────────────────────────────────────────────────────────── */
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
    activeGrad: string;
  }[] = [
    {
      id: 'EASY',
      name: 'Easy',
      desc: 'Casual & Relaxed Pacing',
      detail: 'Bot shoots slowly (~3.5s delay), makes wide angle misses with gentle power. Perfect for practice!',
      icon: Shield,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
      border: 'border-emerald-400',
      activeGrad: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'MEDIUM',
      name: 'Medium',
      desc: 'Realistic Human Speed',
      detail: 'Bot shoots at a balanced pace (~2.2s delay) with moderate accuracy and tactical power.',
      icon: Zap,
      color: 'text-amber-700',
      bg: 'bg-amber-100',
      border: 'border-amber-400',
      activeGrad: 'from-amber-500 to-orange-500',
    },
    {
      id: 'HARD',
      name: 'Hard',
      desc: 'Fast & Competitive',
      detail: 'Bot shoots rapidly (~1.4s delay) with sharp aim right through the center gate slot.',
      icon: Flame,
      color: 'text-rose-700',
      bg: 'bg-rose-100',
      border: 'border-rose-400',
      activeGrad: 'from-rose-500 to-red-600',
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

      {/* ── Classic Arena Board Card ─────────────────────────────────────── */}
      <div
        className="rounded-3xl border overflow-hidden shadow-2xl"
        style={{
          borderColor: OFFLINE_TABLE.borderColor,
          background: '#361D2E',
        }}
      >
        {/* Board preview area */}
        <div
          className="flex items-center justify-center py-5 relative"
          style={{ background: `linear-gradient(135deg, ${OFFLINE_TABLE.boardColor}22, ${OFFLINE_TABLE.feltColor}28)` }}
        >
          {/* Theme glow */}
          <div
            className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ backgroundColor: OFFLINE_TABLE.borderColor }}
          />
          <BoardPreview table={OFFLINE_TABLE} size={160} />
        </div>

        {/* Arena info */}
        <div className="px-4 pb-4 pt-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: OFFLINE_TABLE.borderColor }} />
              <h3 className="font-display text-base font-black text-white">{OFFLINE_TABLE.name}</h3>
              <span className="text-[10px] font-bold text-slate-900 bg-yellow-400 border border-yellow-300 px-2 py-0.5 rounded-full">FREE</span>
            </div>
            <p className="text-xs text-amber-100 font-semibold mt-0.5">{OFFLINE_TABLE.tagline}</p>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-amber-200 font-bold">
              <span>🎯 5 pucks per side</span>
              <span>⚡ Simultaneous play</span>
              <span>🏆 Clear your side to win</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Difficulty Selection ─────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
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
                  isSelected ? `${diff.border} ring-2 ring-yellow-400/40` : 'border-[#361D2E]'
                }`}
                style={{ background: '#361D2E' }}
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
                      <span className="text-xs text-yellow-200 font-semibold">{diff.desc}</span>
                    </div>
                    <p className="text-xs text-amber-100 mt-0.5 leading-snug">{diff.detail}</p>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-yellow-400 bg-yellow-400' : 'border-amber-200/60 bg-transparent'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Start Button ──────────────────────────────────────────────────── */}
      <button
        onClick={handleStart}
        className="mt-1 w-full py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-900 font-black text-sm uppercase tracking-wider shadow-xl shadow-yellow-400/30 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Play size={18} fill="currentColor" />
        <span>START — {selectedDifficulty} MODE</span>
      </button>
    </div>
  );
};
