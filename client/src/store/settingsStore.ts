import { create } from 'zustand';
import { soundEffects } from '../audio/SoundEffects';

export type QualitySetting = 'LOW' | 'MEDIUM' | 'HIGH';

interface SettingsState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  quality: QualitySetting;
  volume: number;  // 0.0 - 1.0 (maps to 0 - 2.0 in audio engine for extra loudness)
  toggleSound: () => void;
  toggleMusic: () => void;
  setQuality: (quality: QualitySetting) => void;
  setVolume: (vol: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: true,
  musicEnabled: true,
  quality: 'HIGH',
  volume: 0.75,  // 75% = maps to 1.5 gain (louder than before)

  toggleSound: () => {
    set((state) => {
      const next = !state.soundEnabled;
      soundEffects.setSoundEnabled(next);
      return { soundEnabled: next };
    });
  },

  toggleMusic: () => {
    set((state) => {
      const next = !state.musicEnabled;
      soundEffects.setMusicEnabled(next);
      return { musicEnabled: next };
    });
  },

  setQuality: (quality) => set({ quality }),

  setVolume: (vol: number) => {
    soundEffects.setVolume(vol);
    set({ volume: vol });
  },
}));
