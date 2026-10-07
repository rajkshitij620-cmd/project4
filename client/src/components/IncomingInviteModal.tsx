import React from 'react';
import { Gamepad2, Check, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socketService';
import { GAME_TABLES } from '@shared/types';
import { soundEffects } from '../audio/SoundEffects';

export const IncomingInviteModal: React.FC = () => {
  const { incomingInvite, setIncomingInvite } = useAuthStore();

  if (!incomingInvite) return null;

  const table = GAME_TABLES.find((t) => t.id === incomingInvite.tableId) || GAME_TABLES[0];

  const handleAccept = () => {
    soundEffects.playClick();
    socketService.respondToInvite(incomingInvite.roomId, true);
    setIncomingInvite(null);
  };

  const handleDecline = () => {
    soundEffects.playClick();
    socketService.respondToInvite(incomingInvite.roomId, false);
    setIncomingInvite(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div 
        className="border border-[#361D2E] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{ background: '#361D2E' }}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#261220] border border-yellow-400/30 text-yellow-300 mx-auto flex items-center justify-center mb-4 shadow-sm">
          <Gamepad2 size={32} />
        </div>

        <h3 className="font-display text-xl font-black text-white mb-1">GAME INVITATION</h3>
        <p className="text-xs text-amber-100 font-medium mb-4">
          <span className="font-black text-yellow-300">{incomingInvite.fromUsername}</span> invited you to a match in{' '}
          <span className="font-black text-yellow-200">{table.name}</span>!
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 py-2.5 rounded-xl bg-yellow-400/20 text-yellow-300 font-bold hover:bg-yellow-400/30 border border-yellow-400/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <X size={16} />
            <span>DECLINE</span>
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-400/30 active:scale-95 transition-all"
          >
            <Check size={16} />
            <span>ACCEPT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

