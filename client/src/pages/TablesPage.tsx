import React from 'react';
import { Lock, Play, Zap, Droplets, Layers } from 'lucide-react';
import { GAME_TABLES, TableConfig } from '@shared/types';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { soundEffects } from '../audio/SoundEffects';

interface TablesPageProps {
  onSelectTablePlay: (table: TableConfig) => void;
}

/* ─── Mini Sling-Puck Board SVG Preview ─────────────────────────────────── */
const BoardPreview: React.FC<{ table: TableConfig; size?: number }> = ({ table, size = 140 }) => {
  const W = size;
  const H = size * 1.65;
  const rail = size * 0.085;          // rail thickness
  const innerW = W - rail * 2;
  const innerH = H - rail * 2;
  const cx = W / 2;
  const divY = H / 2;                 // center divider Y
  const gateW = innerW * 0.28;        // gate opening width
  const gateLeft = cx - gateW / 2;
  const gateRight = cx + gateW / 2;
  const puckR = size * 0.075;

  // Puck positions (5 per side) — triangle 2-2-1 layout
  const puckRowGap = innerH * 0.115;
  const puckColGap = innerW * 0.28;
  const mkPucks = (yBase: number, dir: 1 | -1) => [
    { x: cx - puckColGap, y: yBase + dir * puckRowGap * 0 },
    { x: cx + puckColGap, y: yBase + dir * puckRowGap * 0 },
    { x: cx - puckColGap * 0.5, y: yBase + dir * puckRowGap * 1.1 },
    { x: cx + puckColGap * 0.5, y: yBase + dir * puckRowGap * 1.1 },
    { x: cx,                     y: yBase + dir * puckRowGap * 2.2 },
  ];

  const topPucks    = mkPucks(rail + puckRowGap * 0.6, 1);   // opponent side (top)
  const bottomPucks = mkPucks(H - rail - puckRowGap * 0.6, -1); // player side (bottom)

  // Elastic peg positions (small circles on rails)
  const pegY_top = rail + innerH * 0.10;
  const pegY_bot = H - rail - innerH * 0.10;
  const pegX = cx;

  // Theme-specific accent
  const glowOpacity = table.theme === 'neon' ? 0.55 : table.theme === 'cyber' ? 0.45 : 0.2;
  const dividerColor = table.theme === 'neon' ? '#22d3ee'
    : table.theme === 'cyber' ? '#a78bfa'
    : table.theme === 'royal' ? '#fde047'
    : '#b45309';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ display: 'block', filter: `drop-shadow(0 4px 18px ${table.borderColor}55)` }}
    >
      <defs>
        {/* Board frame gradient */}
        <linearGradient id={`frame-${table.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={table.boardColor} stopOpacity="1" />
          <stop offset="100%" stopColor={table.boardColor} stopOpacity="0.7" />
        </linearGradient>
        {/* Felt surface gradient */}
        <radialGradient id={`felt-${table.id}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={table.feltColor} stopOpacity="1" />
          <stop offset="100%" stopColor={table.feltColor} stopOpacity="0.85" />
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
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Board Frame (rails) ────────────────────────────────── */}
      <rect x={0} y={0} width={W} height={H} rx={size * 0.08} ry={size * 0.08}
        fill={`url(#frame-${table.id})`} />

      {/* ── Playing Surface ────────────────────────────────────── */}
      <rect x={rail} y={rail} width={innerW} height={innerH}
        rx={size * 0.04} ry={size * 0.04}
        fill={`url(#felt-${table.id})`} />

      {/* ── Subtle court center circle ─────────────────────────── */}
      <circle cx={cx} cy={divY} r={innerW * 0.14}
        fill="none" stroke={dividerColor} strokeWidth={1}
        strokeOpacity={0.3} strokeDasharray="3 4" />

      {/* ── Center Divider (left segment) ─────────────────────── */}
      <rect x={rail} y={divY - 1.5} width={gateLeft - rail} height={3}
        fill={dividerColor} opacity={0.85} />

      {/* ── Center Divider (right segment) ────────────────────── */}
      <rect x={gateRight} y={divY - 1.5} width={W - rail - gateRight} height={3}
        fill={dividerColor} opacity={0.85} />

      {/* ── Gate Glow ─────────────────────────────────────────── */}
      <rect x={gateLeft} y={divY - 3} width={gateW} height={6}
        rx={2} ry={2}
        fill={table.goalGlowColor} opacity={glowOpacity + 0.15}
        filter={`url(#glow-${table.id})`} />

      {/* ── Gate markers (small pins) ─────────────────────────── */}
      <circle cx={gateLeft}  cy={divY} r={2.5} fill={table.goalGlowColor} opacity={0.9} />
      <circle cx={gateRight} cy={divY} r={2.5} fill={table.goalGlowColor} opacity={0.9} />

      {/* ── Elastic Pegs (top) ────────────────────────────────── */}
      <circle cx={pegX} cy={pegY_top} r={size * 0.028}
        fill={table.boardColor} stroke={dividerColor} strokeWidth={1.5} opacity={0.9} />
      {/* Elastic band (top) */}
      <line x1={rail + 2} y1={pegY_top} x2={W - rail - 2} y2={pegY_top}
        stroke={dividerColor} strokeWidth={1} strokeOpacity={0.4}
        strokeDasharray="3 3" />

      {/* ── Elastic Pegs (bottom) ─────────────────────────────── */}
      <circle cx={pegX} cy={pegY_bot} r={size * 0.028}
        fill={table.boardColor} stroke={dividerColor} strokeWidth={1.5} opacity={0.9} />
      {/* Elastic band (bottom) */}
      <line x1={rail + 2} y1={pegY_bot} x2={W - rail - 2} y2={pegY_bot}
        stroke={dividerColor} strokeWidth={1} strokeOpacity={0.4}
        strokeDasharray="3 3" />

      {/* ── Opponent Pucks (top — red) ─────────────────────────── */}
      {topPucks.map((p, i) => (
        <g key={`top-${i}`}>
          <circle cx={p.x} cy={p.y} r={puckR}
            fill={`url(#puckB-${table.id})`}
            stroke="#f87171" strokeWidth={0.8} strokeOpacity={0.6} />
          <circle cx={p.x - puckR * 0.25} cy={p.y - puckR * 0.28} r={puckR * 0.28}
            fill="white" opacity={0.35} />
        </g>
      ))}

      {/* ── Player Pucks (bottom — blue) ──────────────────────── */}
      {bottomPucks.map((p, i) => (
        <g key={`bot-${i}`}>
          <circle cx={p.x} cy={p.y} r={puckR}
            fill={`url(#puckA-${table.id})`}
            stroke="#60a5fa" strokeWidth={0.8} strokeOpacity={0.6} />
          <circle cx={p.x - puckR * 0.25} cy={p.y - puckR * 0.28} r={puckR * 0.28}
            fill="white" opacity={0.35} />
        </g>
      ))}

      {/* ── Rail edge highlight ────────────────────────────────── */}
      <rect x={0} y={0} width={W} height={H} rx={size * 0.08} ry={size * 0.08}
        fill="none" stroke={table.borderColor} strokeWidth={1.5} strokeOpacity={0.7} />
    </svg>
  );
};

/* ─── Stat Pill ────────────────────────────────────────────────────────────── */
const StatPill: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({
  icon: Icon, label, value, color
}) => (
  <div className="flex items-center gap-1.5">
    <Icon size={11} style={{ color }} />
    <span className="text-[10px] text-slate-600 font-medium">{label}</span>
    <span className="text-[10px] font-black" style={{ color }}>{value}</span>
  </div>
);

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export const TablesPage: React.FC<TablesPageProps> = ({ onSelectTablePlay }) => {
  const { user } = useAuthStore();
  const coins = user?.coins || 1000;

  return (
    <div className="w-full h-full flex flex-col px-4 pt-4 pb-24 max-w-xl mx-auto gap-4 select-none overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0">
        <h2 className="font-display text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Layers size={18} className="text-cyan-400" />
          ARENA TABLES
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Swipe left/right · Each arena has unique physics, board colours &amp; lighting
        </p>
      </div>

      {/* Horizontal snap-scroll carousel */}
      <div
        className="flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory flex-1 pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {GAME_TABLES.map((table) => {
          const isLocked = !table.unlockedByDefault && coins < table.minCoinsRequired;

          return (
            <div
              key={table.id}
              className={`min-w-[82%] snap-center rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-all relative ${
                isLocked ? 'opacity-70' : ''
              }`}
              style={{
                borderColor: isLocked ? 'rgba(200,190,190,0.5)' : table.borderColor + 'aa',
                background: 'rgba(54, 29, 46, 0.88)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}
            >
              {/* Theme glow blob */}
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: table.borderColor, opacity: 0.18 }}
              />

              {/* ── Board Preview ── */}
              <div
                className="flex items-center justify-center py-5 relative z-10"
                style={{ background: `linear-gradient(135deg, ${table.boardColor}22, ${table.feltColor}18)` }}
              >
                <BoardPreview table={table} size={130} />

                {isLocked && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-t-3xl"
                    style={{ background: 'rgba(10,10,15,0.60)', backdropFilter: 'blur(4px)' }}
                  >
                    <Lock size={28} className="text-amber-400" />
                    <span className="text-[11px] font-black text-amber-300 tracking-wider">LOCKED</span>
                    <span className="text-[10px] text-amber-200 font-semibold">🪙 {table.minCoinsRequired.toLocaleString()} coins needed</span>
                  </div>
                )}
              </div>

              {/* ── Card Info ── */}
              <div className="flex flex-col gap-3 px-4 pt-3 pb-4 relative z-10">

                {/* Name + Entry Fee */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: table.borderColor }} />
                      <h3 className="font-display text-base font-black text-white">{table.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold mt-0.5 leading-snug">{table.tagline}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Entry</span>
                    <span
                      className={`text-sm font-black ${table.entryFee === 0 ? 'text-emerald-400' : 'text-amber-300'}`}
                    >
                      {table.entryFee === 0 ? '🆓 FREE' : `🪙 ${table.entryFee.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* Physics stats */}
                <div
                  className="rounded-xl border border-[#361D2E]/60 px-3 py-2 flex flex-col gap-1.5"
                  style={{ background: 'rgba(54, 29, 46, 0.75)', backdropFilter: 'blur(6px)' }}
                >
                  <StatPill
                    icon={Droplets}
                    label="Surface Glide:"
                    value={table.friction <= 0.06 ? 'Ultra Smooth ⚡' : table.friction <= 0.08 ? 'Very Slick' : 'Standard Felt'}
                    color={table.borderColor}
                  />
                  <StatPill
                    icon={Zap}
                    label="Cushion Bounce:"
                    value={`${Math.round(table.restitution * 100)}%`}
                    color={table.borderColor}
                  />
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (isLocked) return;
                    soundEffects.playClick();
                    onSelectTablePlay(table);
                  }}
                  disabled={isLocked}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isLocked
                      ? 'bg-amber-100 text-amber-700 cursor-not-allowed border border-amber-300'
                      : 'text-white shadow-lg active:scale-98'
                  }`}
                  style={
                    !isLocked
                      ? {
                          background: `linear-gradient(135deg, ${table.boardColor}, ${table.borderColor})`,
                          boxShadow: `0 4px 20px ${table.borderColor}55`,
                        }
                      : undefined
                  }
                >
                  {isLocked ? (
                    <>
                      <Lock size={13} />
                      <span>REQUIRES 🪙 {table.minCoinsRequired.toLocaleString()}</span>
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
