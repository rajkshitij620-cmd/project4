import { create } from 'zustand';
import { soundEffects } from '../audio/SoundEffects';

export type QualitySetting = 'LOW' | 'MEDIUM' | 'HIGH';

interface SettingsState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  quality: QualitySetting;
  toggleSound: () => void;
  toggleMusic: () => void;
  setQuality: (quality: QualitySetting) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  soundEnabled: true,
  musicEnabled: true,
  quality: 'HIGH',

  toggleSound: () => {
    const next = !get().soundEnabled;
    soundEffects.setSoundEnabled(next);
    set({ soundEnabled: next });
  },

  toggleMusic: () => {
    const next = !get().musicEnabled;
    soundEffects.setMusicEnabled(next);
    set({ musicEnabled: next });
  },

  setQuality: (quality) => set({ quality })
}));

