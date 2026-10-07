import React from 'react';
import { Lock, Play, Layers } from 'lucide-react';
import { GAME_TABLES, TableConfig } from '@shared/types';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { soundEffects } from '../audio/SoundEffects';

interface TablesPageProps {
  onSelectTablePlay: (table: TableConfig) => void;
}

/* ─── Sling-Puck Board SVG (Renders as the Card Itself) ─────────────────── */
const BoardPreview: React.FC<{ table: TableConfig }> = ({ table }) => {
  const W = 280;
  const H = 460;
  const rail = 16;                    // rail thickness
  const innerW = W - rail * 2;       // 248
  const innerH = H - rail * 2;       // 428
  const cx = W / 2;                  // 140
  const divY = H / 2;                // 230 center divider
  const gateW = innerW * 0.28;       // ~69.4 gate opening
  const gateLeft = cx - gateW / 2;
  const gateRight = cx + gateW / 2;
  const puckR = 14;

  // Elastic pegs & string positions
  const pegY_top = 80;
  const pegY_bot = 380;
  const pegX = cx;

  // Opponent pucks (top, red) — triangle formation between peg and divider
  const puckColGap = 42;
  const topPucks = [
    { x: cx - puckColGap, y: 108 },
    { x: cx + puckColGap, y: 108 },
    { x: cx - puckColGap * 0.5, y: 142 },
    { x: cx + puckColGap * 0.5, y: 142 },
    { x: cx, y: 176 },
  ];

  // Player pucks (bottom, blue) — triangle formation between divider and peg
  const bottomPucks = [
    { x: cx, y: 284 },
    { x: cx - puckColGap * 0.5, y: 318 },
    { x: cx + puckColGap * 0.5, y: 318 },
    { x: cx - puckColGap, y: 352 },
    { x: cx + puckColGap, y: 352 },
  ];

  const glowOpacity = table.theme === 'neon' ? 0.6 : table.theme === 'cyber' ? 0.5 : 0.25;
  const dividerColor = table.theme === 'neon' ? '#22d3ee'
    : table.theme === 'cyber' ? '#a78bfa'
    : table.theme === 'royal' ? '#fde047'
    : '#b45309';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Board frame gradient */}
        <linearGradient id={`frame-${table.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={table.boardColor} stopOpacity="1" />
          <stop offset="100%" stopColor={table.boardColor} stopOpacity="0.75" />
        </linearGradient>
        {/* Felt surface gradient */}
        <radialGradient id={`felt-${table.id}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={table.feltColor} stopOpacity="1" />
          <stop offset="100%" stopColor={table.feltColor} stopOpacity="0.9" />
        </radialGradient>
        {/* Puck gradient A */}
        <radialGradient id={`puckA-${table.id}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
        {/* Puck gradient B */}
        <radialGradient id={`puckB-${table.id}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#b91c1c" />
        </radialGradient>
        {/* Gate glow */}
        <filter id={`glow-${table.id}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Board Frame (rails) ────────────────────────────────── */}
      <rect x={0} y={0} width={W} height={H} rx={24} ry={24}
        fill={`url(#frame-${table.id})`} />

      {/* ── Playing Surface ────────────────────────────────────── */}
      <rect x={rail} y={rail} width={innerW} height={innerH}
        rx={16} ry={16}
        fill={`url(#felt-${table.id})`} />

      {/* ── Center court circle ─────────────────────────────────── */}
      <circle cx={cx} cy={divY} r={innerW * 0.16}
        fill="none" stroke={dividerColor} strokeWidth={1.5}
        strokeOpacity={0.35} strokeDasharray="4 4" />

      {/* ── Center Divider (left segment) ─────────────────────── */}
      <rect x={rail} y={divY - 2} width={gateLeft - rail} height={4}
        fill={dividerColor} opacity={0.9} rx={1} />

      {/* ── Center Divider (right segment) ────────────────────── */}
      <rect x={gateRight} y={divY - 2} width={W - rail - gateRight} height={4}
        fill={dividerColor} opacity={0.9} rx={1} />

      {/* ── Gate Glow ─────────────────────────────────────────── */}
      <rect x={gateLeft} y={divY - 4} width={gateW} height={8}
        rx={3} ry={3}
        fill={table.goalGlowColor} opacity={glowOpacity + 0.2}
        filter={`url(#glow-${table.id})`} />

      {/* ── Gate markers (small pins) ─────────────────────────── */}
      <circle cx={gateLeft}  cy={divY} r={3.5} fill={table.goalGlowColor} opacity={0.95} />
      <circle cx={gateRight} cy={divY} r={3.5} fill={table.goalGlowColor} opacity={0.95} />

      {/* ── Elastic Pegs (top) ────────────────────────────────── */}
      <circle cx={pegX} cy={pegY_top} r={7}
        fill={table.boardColor} stroke={dividerColor} strokeWidth={2} opacity={0.95} />
      {/* Elastic band (top) */}
      <line x1={rail + 3} y1={pegY_top} x2={W - rail - 3} y2={pegY_top}
        stroke={dividerColor} strokeWidth={1.5} strokeOpacity={0.5}
        strokeDasharray="4 3" />

      {/* ── Elastic Pegs (bottom) ─────────────────────────────── */}
      <circle cx={pegX} cy={pegY_bot} r={7}
        fill={table.boardColor} stroke={dividerColor} strokeWidth={2} opacity={0.95} />
      {/* Elastic band (bottom) */}
      <line x1={rail + 3} y1={pegY_bot} x2={W - rail - 3} y2={pegY_bot}
        stroke={dividerColor} strokeWidth={1.5} strokeOpacity={0.5}
        strokeDasharray="4 3" />

      {/* ── Opponent Pucks (top — red) ─────────────────────────── */}
      {topPucks.map((p, i) => (
        <g key={`top-${i}`}>
          <circle cx={p.x} cy={p.y} r={puckR}
            fill={`url(#puckB-${table.id})`}
            stroke="#f87171" strokeWidth={1} strokeOpacity={0.8} />
          <circle cx={p.x - puckR * 0.25} cy={p.y - puckR * 0.28} r={puckR * 0.3}
            fill="white" opacity={0.4} />
        </g>
      ))}

      {/* ── Player Pucks (bottom — blue) ──────────────────────── */}
      {bottomPucks.map((p, i) => (
        <g key={`bot-${i}`}>
          <circle cx={p.x} cy={p.y} r={puckR}
            fill={`url(#puckA-${table.id})`}
            stroke="#60a5fa" strokeWidth={1} strokeOpacity={0.8} />
          <circle cx={p.x - puckR * 0.25} cy={p.y - puckR * 0.28} r={puckR * 0.3}
            fill="white" opacity={0.4} />
        </g>
      ))}

      {/* ── Rail edge highlight border ─────────────────────────── */}
      <rect x={0} y={0} width={W} height={H} rx={24} ry={24}
        fill="none" stroke={table.borderColor} strokeWidth={2} strokeOpacity={0.85} />
    </svg>
  );
};

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export const TablesPage: React.FC<TablesPageProps> = ({ onSelectTablePlay }) => {
  const { user } = useAuthStore();
  const coins = user?.coins || 1000;

  return (
    <div className="w-full h-full flex flex-col px-4 pt-4 pb-24 max-w-xl mx-auto gap-3 select-none overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0">
        <h2 className="font-display text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Layers size={18} className="text-cyan-400" />
          ARENA TABLES
        </h2>
      </div>

      {/* Horizontal snap-scroll carousel */}
      <div
        className="flex flex-row gap-5 overflow-x-auto snap-x snap-mandatory flex-1 items-center pb-2 scrollbar-hide px-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {GAME_TABLES.map((table) => {
          const isLocked = !table.unlockedByDefault && coins < table.minCoinsRequired;

          return (
            <div
              key={table.id}
              className={`snap-center flex-shrink-0 relative rounded-[24px] overflow-hidden flex flex-col justify-between shadow-2xl transition-all ${
                isLocked ? 'opacity-85' : ''
              }`}
              style={{
                width: '280px',
                maxWidth: '82vw',
                height: '100%',
                maxHeight: '460px',
                aspectRatio: '280 / 460',
                boxShadow: `0 16px 36px rgba(0,0,0,0.6), 0 0 24px ${table.borderColor}40`,
              }}
            >
              {/* ── The Game Board (entire card body) ── */}
              <BoardPreview table={table} />

              {/* ── Top: Arena Name & Price overlay ── */}
              <div className="relative z-10 m-3 px-3 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: table.borderColor }}
                  />
                  <h3 className="font-display text-sm font-black text-white truncate tracking-wide">
                    {table.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md ${
                      table.entryFee === 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {table.entryFee === 0 ? 'FREE' : `🪙 ${table.entryFee.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* ── Locked Center Overlay (if locked) ── */}
              {isLocked && (
                <div
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 p-4"
                  style={{ background: 'rgba(10,10,15,0.78)', backdropFilter: 'blur(5px)' }}
                >
                  <div className="w-12 h-12 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 mb-1 shadow-lg">
                    <Lock size={24} />
                  </div>
                  <span className="text-xs font-black text-yellow-300 tracking-wider">ARENA LOCKED</span>
                  <span className="text-[11px] text-amber-200 font-semibold bg-black/60 px-3 py-1 rounded-full border border-amber-400/20">
                    🪙 {table.minCoinsRequired.toLocaleString()} coins needed
                  </span>
                </div>
              )}

              {/* ── Bottom: Enter Arena Button overlay ── */}
              <div className="relative z-10 m-3">
                <button
                  onClick={() => {
                    if (isLocked) return;
                    soundEffects.playClick();
                    onSelectTablePlay(table);
                  }}
                  disabled={isLocked}
                  className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    isLocked
                      ? 'bg-yellow-400/20 text-yellow-400/70 cursor-not-allowed border border-yellow-500/30'
                      : 'bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-400/30 active:scale-98'
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Lock size={13} />
                      <span>LOCKED</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} fill="currentColor" />
                      <span>ENTER ARENA</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
