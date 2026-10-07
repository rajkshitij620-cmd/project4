import React, { useState } from 'react';
import { ArrowLeft, Target, Info } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { COLOR_PALETTE } from '@shared/types';
import { soundEffects } from '../audio/SoundEffects';

interface GameOverlayProps {
  onExitMatch: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ onExitMatch }) => {
  const {
    currentTurn,
    myRole,
    phase,
    playerA,
    playerB,
    pieces,
    table,
    mode
  } = useGameStore();

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isMyTurn = currentTurn === myRole;
  const isSimulating = phase === 'SIMULATING';

  // Count unpocketed pieces
  const remainingA = pieces.filter((p) => p.owner === 'playerA' && !p.isPocketed).length;
  const remainingB = pieces.filter((p) => p.owner === 'playerB' && !p.isPocketed).length;

  const colorDefA = COLOR_PALETTE[playerA.color];
  const colorDefB = COLOR_PALETTE[playerB.color];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4">
      {/* Top Header Section */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Top Bar: Back Button, Player Stats, Table Pill */}
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Back / Surrender Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              setShowExitConfirm(true);
            }}
            className="pointer-events-auto p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 active:scale-95 shadow-lg"
            title="Leave Match"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Players HUD */}
          <div 
            className="flex items-center gap-3 border border-[#361D2E]/90 px-4 py-2 rounded-2xl shadow-xl"
            style={{
              background: 'rgba(54, 29, 46, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            {/* Player A (You) */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2"
                style={{
                  backgroundColor: colorDefA?.hex || '#2563eb',
                  borderColor: currentTurn === 'playerA' ? '#ffffff' : 'transparent'
                }}
              >
                {playerA.avatar}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-white">{playerA.name}</span>
                <div className="flex items-center gap-1">
                  <Target size={11} className="text-slate-300" />
                  <span className="text-[11px] font-black text-cyan-400">
                    {remainingA} left
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs font-black text-rose-300 tracking-widest px-1">VS</div>

            {/* Player B (Opponent / Bot) */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-white">{playerB.name}</span>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[11px] font-black text-red-400">
                    {remainingB} left
                  </span>
                  <Target size={11} className="text-slate-300" />
                </div>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2"
                style={{
                  backgroundColor: colorDefB?.hex || '#dc2626',
                  borderColor: currentTurn === 'playerB' ? '#ffffff' : 'transparent'
                }}
              >
                {playerB.avatar}
              </div>
            </div>
          </div>

          {/* Table pill */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#361D2E] text-xs font-black text-white shadow-sm"
            style={{
              background: 'rgba(54, 29, 46, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: table.borderColor }} />
            <span>{table.name}</span>
          </div>
        </div>

        {/* Compact Action Badge (below HUD, keeping center gate completely open) */}
        <div className="flex items-center justify-center">
          {isSimulating ? (
            <div className="px-3.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Physics in motion...
            </div>
          ) : (
            <div className="px-3.5 py-1 rounded-full bg-blue-600/85 backdrop-blur-md border border-blue-400/50 text-white text-[11px] font-black tracking-wider uppercase shadow-lg flex items-center gap-1.5">
              <Target size={12} />
              SLING YOUR PUCKS!
            </div>
          )}
        </div>
      </div>

      {/* Bottom Hint Indicator */}
      <div className="flex flex-col items-center pb-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md border border-slate-800/60 text-[11px] text-slate-400">
          <Info size={13} className="text-cyan-400" />
          <span>Sling Puck: Clear your side first — sling all 5 pucks through the gate to WIN! 🏆</span>
        </div>
      </div>


      {/* Exit Match Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 pointer-events-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div 
            className="border border-[#361D2E] rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
            style={{
              background: 'rgba(54, 29, 46, 0.70)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <h3 className="text-lg font-black text-white mb-2">Leave Match?</h3>
            <p className="text-sm font-semibold text-slate-200 mb-6">
              Leaving the current game will forfeit the match. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowExitConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-slate-900 font-black active:scale-95 border border-amber-300"
              >
                Resume
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowExitConfirm(false);
                  onExitMatch();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black hover:bg-red-500 active:scale-95 shadow-md shadow-red-600/30"
              >
                Quit Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

