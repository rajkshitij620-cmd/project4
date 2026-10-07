import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useGameStore } from './store/gameStore';
import { socketService } from './services/socketService';
import { HeaderBar } from './components/HeaderBar';
import { Navigation, NavTab } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { PlayOfflinePage } from './pages/PlayOfflinePage';
import { FriendsPage } from './pages/FriendsPage';
import { TablesPage } from './pages/TablesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthModal } from './components/AuthModal';
import { IncomingInviteModal } from './components/IncomingInviteModal';
import { PhysicsWorld } from './game/physics/PhysicsWorld';
import { GameOverlay } from './components/GameOverlay';
import { GameOverModal } from './components/GameOverModal';
import { TableConfig } from '@shared/types';
import { soundEffects } from './audio/SoundEffects';

export const App: React.FC = () => {
  const { initGuest } = useAuthStore();
  const {
    phase,
    mode,
    table,
    pieces,
    playerA,
    playerB,
    currentTurn,
    myRole,
    pendingExternalShot,
    clearPendingExternalShot,
    registerShot,
    handleSimulationSettled,
    handlePiecePocketed,
    startOfflineMatch,
    resetGame
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOfflineLauncherOpen, setIsOfflineLauncherOpen] = useState(false);

  useEffect(() => {
    initGuest();
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, [initGuest]);

  const isGameActive = phase === 'PLAYING' || phase === 'SIMULATING' || phase === 'GAME_OVER';

  const handleShoot = (dirX: number, dirZ: number, power: number) => {
    registerShot(dirX, dirZ, power);
    if (mode === 'ONLINE') {
      socketService.sendShoot('active_room', dirX, dirZ, power);
    }
  };

  const handlePocket = (pieceId: string, intoOpponentGoal: boolean) => {
    handlePiecePocketed(pieceId, intoOpponentGoal);
    if (mode === 'ONLINE') {
      socketService.syncPocketedPiece('active_room', pieceId, intoOpponentGoal);
    }
  };

  const handleSettled = () => {
    handleSimulationSettled();
    if (mode === 'ONLINE') {
      socketService.syncSettled('active_room');
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col relative overflow-hidden select-none">
      {/* Real-time Game Invitation Pop-up */}
      <IncomingInviteModal />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* 3D ACTIVE GAME VIEW */}
      {isGameActive ? (
        <div className="relative w-full h-full">
          <PhysicsWorld
            table={table}
            pieces={pieces}
            playerAColor={playerA.color}
            playerBColor={playerB.color}
            currentTurn={currentTurn}
            isMyTurn={currentTurn === myRole}
            isSimulating={phase === 'SIMULATING'}
            pendingExternalShot={pendingExternalShot}
            onClearExternalShot={clearPendingExternalShot}
            onShoot={handleShoot}
            onSimulationSettled={handleSettled}
            onPiecePocketed={handlePocket}
          />

          <GameOverlay onExitMatch={resetGame} />

          {phase === 'GAME_OVER' && (
            <GameOverModal
              onPlayAgain={() => startOfflineMatch(table)}
              onBackToLobby={resetGame}
            />
          )}
        </div>
      ) : (
        /* MAIN APPLICATION MENU VIEW */
        <div className="w-full h-full flex flex-col">
          <HeaderBar onOpenAuth={() => setIsAuthOpen(true)} />

          <main className="flex-1 w-full relative overflow-hidden">
            {isOfflineLauncherOpen ? (
              <PlayOfflinePage onBack={() => setIsOfflineLauncherOpen(false)} />
            ) : activeTab === 'home' ? (
              <HomePage
                onStartOffline={() => setIsOfflineLauncherOpen(true)}
                onNavigateTab={(tab) => {
                  if (tab === 'home') setIsOfflineLauncherOpen(false);
                  setActiveTab(tab);
                }}
              />
            ) : activeTab === 'friends' ? (
              <FriendsPage onOpenAuth={() => setIsAuthOpen(true)} />
            ) : activeTab === 'tables' ? (
              <TablesPage
                onSelectTablePlay={(selectedTable: TableConfig) => {
                  startOfflineMatch(selectedTable);
                }}
              />
            ) : (
              <ProfilePage onOpenAuth={() => setIsAuthOpen(true)} />
            )}
          </main>

          <Navigation activeTab={activeTab} onChangeTab={(tab) => {
            setIsOfflineLauncherOpen(false);
            setActiveTab(tab);
          }} />
        </div>
      )}
    </div>
  );
};

export default App;

