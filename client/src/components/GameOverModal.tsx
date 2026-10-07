import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Award, Clock, Crosshair, Coins } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { soundEffects } from '../audio/SoundEffects';

interface GameOverModalProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onPlayAgain, onBackToLobby }) => {
  const { winner, myRole, playerA, playerB, matchStats, table, mode } = useGameStore();
  const { updateCoins, updateStats } = useAuthStore();

  const isWinner = winner === myRole;
  const winnerPlayer = winner === 'playerA' ? playerA : playerB;
  const loserPlayer = winner === 'playerA' ? playerB : playerA;

  // Reward calculation: free tables give +150 bonus coins, fee tables return double the entry
  const rewardCoins = isWinner ? (table.entryFee > 0 ? table.entryFee * 2 : 150) : 0;

  useEffect(() => {
    // Record stats in store
    updateStats(isWinner);
    if (rewardCoins > 0) {
      const currentCoins = useAuthStore.getState().user?.coins || 1000;
      updateCoins(currentCoins + rewardCoins);
      soundEffects.playCoin();
    }

    if (isWinner) {
      // Fire confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isWinner, rewardCoins, updateCoins, updateStats]);

  const shotsCount = myRole === 'playerA' ? matchStats.shotsA : matchStats.shotsB;
  const pocketedCount = myRole === 'playerA' ? matchStats.pocketedA : matchStats.pocketedB;
  const accuracy = shotsCount > 0 ? Math.round((pocketedCount / shotsCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div 
        className="border border-[#361D2E] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300"
        style={{
          background: 'rgba(54, 29, 46, 1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        {/* Glow Header Accent */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isWinner ? 'bg-rose-400/30' : 'bg-red-400/20'
          }`}
        />

        {/* Trophy / Result Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 shadow-xl ${
              isWinner
                ? 'bg-gradient-to-tr from-rose-400 to-amber-300 border-[#361D2E] text-slate-950 shadow-rose-500/30'
                : 'bg-gradient-to-tr from-slate-300 to-slate-200 border-slate-400 text-slate-800'
            }`}
          >
            {isWinner ? <Trophy size={42} /> : <Award size={42} />}
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display text-3xl font-black uppercase tracking-wider mb-1 text-white">
          {isWinner ? 'VICTORY!' : 'DEFEAT'}
        </h2>
        <p className="text-sm font-semibold text-slate-200 mb-6">
          {isWinner
            ? `You cleared all your pieces into ${loserPlayer.name}'s goal!`
            : `${winnerPlayer.name} pocketed all pieces first.`}
        </p>

        {/* Coin Reward Banner */}
        {rewardCoins > 0 && (
          <div className="mb-6 py-2.5 px-4 rounded-xl bg-[#361D2E] border border-[#361D2E] flex items-center justify-center gap-2 text-amber-300 font-black text-base shadow-sm">
            <Coins size={18} className="text-amber-400" />
            <span>+{rewardCoins} Coins Earned!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div 
            className="border border-[#361D2E] rounded-2xl p-3 flex flex-col items-center shadow-sm"
            style={{
              background: 'rgba(54, 29, 46, 1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold mb-1">
              <Crosshair size={13} className="text-cyan-400" />
              <span>Pieces Pocketed</span>
            </div>
            <span className="text-lg font-black text-white">{pocketedCount} / 4</span>
          </div>

          <div 
            className="border border-[#361D2E] rounded-2xl p-3 flex flex-col items-center shadow-sm"
            style={{
              background: 'rgba(54, 29, 46, 1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold mb-1">
              <Award size={13} className="text-rose-400" />
              <span>Accuracy</span>
            </div>
            <span className="text-lg font-black text-white">{accuracy}%</span>
          </div>

          <div 
            className="border border-[#361D2E] rounded-2xl p-3 flex flex-col items-center shadow-sm"
            style={{
              background: 'rgba(54, 29, 46, 1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold mb-1">
              <Trophy size={13} className="text-amber-400" />
              <span>Total Shots</span>
            </div>
            <span className="text-lg font-black text-white">{shotsCount}</span>
          </div>

          <div 
            className="border border-[#361D2E] rounded-2xl p-3 flex flex-col items-center shadow-sm"
            style={{
              background: 'rgba(54, 29, 46, 1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold mb-1">
              <Clock size={13} className="text-emerald-400" />
              <span>Duration</span>
            </div>
            <span className="text-lg font-black text-white">{matchStats.durationSeconds}s</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              soundEffects.playClick();
              onPlayAgain();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-cyan-500/25 transition-all"
          >
            <RotateCcw size={16} />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              onBackToLobby();
            }}
            className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all border border-slate-700"
          >
            <Home size={16} />
            <span>LOBBY</span>
          </button>
        </div>
      </div>
    </div>
  );
};

