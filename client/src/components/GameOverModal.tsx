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
        style={{ background: '#361D2E' }}
      >
        {/* Glow Header Accent */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isWinner ? 'bg-yellow-400/20' : 'bg-red-400/20'
          }`}
        />

        {/* Trophy / Result Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 shadow-xl ${
              isWinner
                ? 'bg-yellow-400 border-yellow-300 text-slate-900 shadow-yellow-400/30'
                : 'bg-slate-300 border-slate-400 text-slate-800'
            }`}
          >
            {isWinner ? <Trophy size={42} /> : <Award size={42} />}
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display text-3xl font-black uppercase tracking-wider mb-1 text-white">
          {isWinner ? 'VICTORY!' : 'DEFEAT'}
        </h2>
        <p className="text-sm font-semibold text-amber-100 mb-6">
          {isWinner
            ? `You cleared all your pieces into ${loserPlayer.name}'s goal!`
            : `${winnerPlayer.name} pocketed all pieces first.`}
        </p>

        {/* Coin Reward Banner */}
        {rewardCoins > 0 && (
          <div className="mb-6 py-2.5 px-4 rounded-xl bg-[#261220] border border-yellow-400/30 flex items-center justify-center gap-2 text-yellow-300 font-black text-base shadow-sm">
            <Coins size={18} className="text-yellow-400" />
            <span>+{rewardCoins} Coins Earned!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div 
            className="border border-yellow-400/20 rounded-2xl p-3 flex flex-col items-center shadow-sm"
            style={{ background: '#261220' }}
          >
            <div className="flex items-center gap-1.5 text-xs text-amber-100 font-bold mb-1">
              <Crosshair size={13} className="text-yellow-400" />
              <span>Pieces Pocketed</span>
            </div>
            <span className="text-lg font-black text-white">{pocketedCount} / 4</span>
          </div>

          <div 
            className="border border-yellow-400/20 rounded-2xl p-3 flex flex-col items-center shadow-sm"
            style={{ background: '#261220' }}
          >
            <div className="flex items-center gap-1.5 text-xs text-amber-100 font-bold mb-1">
              <Award size={13} className="text-yellow-400" />
              <span>Accuracy</span>
            </div>
            <span className="text-lg font-black text-white">{accuracy}%</span>
          </div>

          <div 
            className="border border-yellow-400/20 rounded-2xl p-3 flex flex-col items-center shadow-sm"
            style={{ background: '#261220' }}
          >
            <div className="flex items-center gap-1.5 text-xs text-amber-100 font-bold mb-1">
              <Trophy size={13} className="text-yellow-400" />
              <span>Total Shots</span>
            </div>
            <span className="text-lg font-black text-white">{shotsCount}</span>
          </div>

          <div 
            className="border border-yellow-400/20 rounded-2xl p-3 flex flex-col items-center shadow-sm"
            style={{ background: '#261220' }}
          >
            <div className="flex items-center gap-1.5 text-xs text-amber-100 font-bold mb-1">
              <Clock size={13} className="text-yellow-400" />
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
            className="flex-1 py-3 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-yellow-400/30 transition-all"
          >
            <RotateCcw size={16} />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              onBackToLobby();
            }}
            className="py-3 px-5 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all border border-yellow-400/40"
          >
            <Home size={16} />
            <span>LOBBY</span>
          </button>
        </div>
      </div>
    </div>
  );
};

