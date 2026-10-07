import React from 'react';
import { Home, Users, Layers, User as UserIcon } from 'lucide-react';
import { soundEffects } from '../audio/SoundEffects';

export type NavTab = 'home' | 'friends' | 'tables' | 'profile';

interface NavigationProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'HOME', icon: Home },
    { id: 'friends' as NavTab, label: 'FRIENDS', icon: Users },
    { id: 'tables' as NavTab, label: 'TABLES', icon: Layers },
    { id: 'profile' as NavTab, label: 'PROFILE', icon: UserIcon }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-6 flex items-center justify-around z-30 shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              soundEffects.playClick();
              onChangeTab(tab.id);
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isActive ? 'text-yellow-400 scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-yellow-400/20 text-yellow-300 shadow-lg shadow-yellow-400/20' : ''
              }`}
            >
              <Icon size={20} />
            </div>
            <span className="text-[10px] font-bold tracking-wider">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

