import React, { useState } from 'react';
import { X, Sparkles, Gift, Coins, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/apiService';
import { soundEffects } from '../audio/SoundEffects';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, initGuest, isGuest, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  if (!isOpen) return null;

  // Handle Guest Play
  const handlePlayAsGuest = () => {
    soundEffects.playClick();
    if (!user) {
      initGuest();
    }
    onClose();
  };

  // Trigger Google Login
  const handleGoogleClick = () => {
    soundEffects.playClick();
    setError(null);
    setShowGooglePrompt(true);
  };

  // Submit Google Login with one-click or custom email
  const handleCompleteGoogleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emailToUse = (googleEmail.trim() || 'player.google@gmail.com').toLowerCase();
    const nameToUse = googleName.trim() || emailToUse.split('@')[0] || 'Google Player';

    setIsLoading(true);
    setError(null);
    soundEffects.playClick();

    try {
      const data = await apiService.googleLogin({
        email: emailToUse,
        name: nameToUse,
        avatar: '⚡'
      });
      login(data.user, data.token);
      soundEffects.playCoin();
      setShowGooglePrompt(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none overflow-y-auto">
      {/* Vertical Mobile Game Card */}
      <div 
        className="relative w-full max-w-sm border border-[#361D2E] rounded-3xl p-5 shadow-2xl flex flex-col justify-between items-center min-h-[580px] overflow-hidden"
        style={{ background: '#361D2E' }}
      >
        
        {/* Subtle glow background effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div 
            className="w-full h-full"
            style={{
              background: 'radial-gradient(circle at 50% 25%, #4a2640 0%, #361D2E 65%, transparent 100%)'
            }}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-[#261220] border border-yellow-400/30 text-yellow-300 hover:text-white active:scale-90 transition-all"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* ── TOP SECTION: LOGO & FLAMING TITLE ── */}
        <div className="w-full flex flex-col items-center text-center mt-2 relative z-10">
          {/* Glowing Emblem */}
          <div className="relative mb-2">
            <div className="absolute -inset-3 bg-yellow-400/20 rounded-full blur-xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-yellow-400 p-[2px] shadow-xl relative z-10 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
                ⚡
              </div>
            </div>
          </div>

          {/* Game Title with 3D Style */}
          <h1 className="font-display text-3xl font-black tracking-wider text-white drop-shadow-sm leading-none">
            DISK SLAM 3D
          </h1>
          <p className="text-[10px] font-bold tracking-widest text-yellow-300 uppercase mt-1">
            MULTIPLAYER ARENA
          </p>
        </div>

        {/* ── MIDDLE SECTION: REWARD CARD ── */}
        <div 
          className="w-full relative z-10 my-4 p-4 rounded-2xl border border-yellow-400/30 shadow-md flex flex-col items-center text-center"
          style={{ background: '#261220' }}
        >
          {/* Floating gifts & rewards illustrations */}
          <div className="flex items-center justify-center gap-6 mb-2">
            <div className="p-2.5 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 shadow-md animate-bounce">
              <Gift size={26} />
            </div>
            <div className="p-2.5 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 shadow-md">
              <Coins size={26} />
            </div>
          </div>

          <h2 className="font-display text-lg font-black text-white tracking-wide leading-tight">
            Play with your friends!
          </h2>
          <p className="text-xs text-amber-100 font-semibold mt-0.5">
            Claim <span className="text-yellow-400 font-black">1,000 FREE coins</span> &amp; online rewards!
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#361D2E] border border-yellow-400/30 text-[10px] font-black text-yellow-300">
            <Sparkles size={12} className="text-yellow-400" />
            <span>REAL-TIME 1v1 MATCHMAKING</span>
          </div>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="w-full mb-3 p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {/* ── GOOGLE SIGN-IN PROMPT POPUP (If clicked Google) ── */}
        {showGooglePrompt ? (
          <div 
            className="w-full relative z-10 p-4 rounded-2xl border border-yellow-400/30 shadow-xl flex flex-col gap-3 my-2"
            style={{ background: '#261220' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google Sign-In
              </span>
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                className="text-amber-100 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCompleteGoogleLogin} className="flex flex-col gap-2.5">
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="Enter your Gmail address"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-yellow-400 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 shadow-sm"
                autoFocus
              />
              <input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="Display Name (optional)"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-yellow-400 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 shadow-sm"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-900 font-black text-xs uppercase tracking-wider shadow-md shadow-yellow-400/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ── ACTION BUTTONS ── */
          <div className="w-full flex flex-col gap-3 relative z-10">
            {/* BUTTON 1: GOOGLE LOGIN */}
            <button
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 font-black text-sm tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 border border-yellow-400/40"
            >
              {/* Google SVG Logo */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Login with Google</span>
            </button>

            {/* BUTTON 2: PLAY AS GUEST */}
            <button
              onClick={handlePlayAsGuest}
              className="w-full py-3.5 px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-900 font-black text-sm tracking-wide shadow-lg shadow-yellow-400/30 active:scale-95 transition-all flex items-center justify-center gap-2.5 border border-yellow-300"
            >
              <div className="w-5 h-5 rounded-full bg-slate-900/10 flex items-center justify-center flex-shrink-0">
                <UserIcon size={13} className="text-slate-900" />
              </div>
              <span>Play as Guest</span>
            </button>
          </div>
        )}

        {/* ── BOTTOM DISCLAIMER ── */}
        <div className="w-full mt-4 text-center relative z-10 px-1">
          <p className="text-[10px] text-amber-100/80 font-medium leading-relaxed">
            Guest users have progress stored locally and you can lose it if the game is cleared.
            You can use <span className="text-yellow-400 font-bold">Google login</span> to prevent this.
          </p>
        </div>

      </div>
    </div>
  );
};
