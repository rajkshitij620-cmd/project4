import React from 'react';
import { Layers, Lock, Play, Sparkles, ShieldCheck } from 'lucide-react';
import { GAME_TABLES, TableConfig } from '@shared/types';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { soundEffects } from '../audio/SoundEffects';

interface TablesPageProps {
  onSelectTablePlay: (table: TableConfig) => void;
}

export const TablesPage: React.FC<TablesPageProps> = ({ onSelectTablePlay }) => {
  const { user } = useAuthStore();
  const coins = user?.coins || 1000;

  return (
    <div className="w-full h-full flex flex-col px-4 pt-4 pb-24 max-w-xl mx-auto gap-4 select-none overflow-hidden">
      <div className="flex-shrink-0">
        <h2 className="font-display text-xl font-bold text-white tracking-wide">
          ARENA TABLES
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Select an arena table with unique physics friction and dynamic lighting
        </p>
      </div>

      {/* Horizontal snap scroll container */}
      <div
        className="flex flex-row gap-4 overflow-x-auto snap-x snap-mandatory flex-1 pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {GAME_TABLES.map((table) => {
          const isLocked = !table.unlockedByDefault && coins < table.minCoinsRequired;

          return (
            <div
              key={table.id}
              className={`min-w-[85%] snap-center rounded-3xl border p-5 transition-all relative overflow-hidden flex flex-col justify-between shadow-xl ${
                isLocked
                  ? 'border-slate-300 opacity-60'
                  : 'border-[#f8edeb]/80'
              }`}
              style={{ background: 'rgba(248, 237, 235, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              {/* Background Theme Glow */}
              <div
                className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: table.borderColor }}
              />

              <div className="relative z-10 flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: table.borderColor }}
                    />
                    <h3 className="font-display text-lg font-black text-slate-950">{table.name}</h3>
                  </div>
                  <p className="text-xs text-slate-700 font-semibold mt-1">{table.tagline}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider block">
                    Entry Fee
                  </span>
                  <span className="text-sm font-black text-rose-950">
                    {table.entryFee === 0 ? 'FREE' : `🪙 ${table.entryFee.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Table Attributes / Physics */}
              <div 
                className="relative z-10 grid grid-cols-2 gap-2 mb-4 py-2 px-3 rounded-xl border border-[#f8edeb]/60 text-[11px] shadow-inner"
                style={{ background: 'rgba(248, 237, 235, 0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              >
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Surface Glide:</span>
                  <span className="font-black text-slate-950">
                    {table.friction <= 0.08 ? 'Ultra Smooth' : 'Standard Felt'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Cushion Bounce:</span>
                  <span className="font-black text-slate-950">
                    {Math.round(table.restitution * 100)}%
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  if (isLocked) return;
                  soundEffects.playClick();
                  onSelectTablePlay(table);
                }}
                disabled={isLocked}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isLocked
                    ? 'bg-amber-200 text-amber-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25 active:scale-98'
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock size={15} />
                    <span>REQUIRES 🪙 {table.minCoinsRequired.toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <Play size={15} fill="currentColor" />
                    <span>ENTER ARENA</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

