
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameMode, GameLength, Player, Team, AVATARS, Round, RoundType } from './types';
import { generateRounds, speak, stopSpeaking, fetchSuggestedThemes } from './geminiService';
import { Lobby } from './components/Lobby';
import { Setup } from './components/Setup';
import { GameView } from './components/GameView';
import { Dashboard } from './components/Dashboard';
import { CategorySelection } from './components/CategorySelection';
import { db } from './firebase';
import { ref, onValue, set, update, push } from "firebase/database";

const SquidBulbLogo = () => (
  <div className="relative w-12 h-12 flex items-center justify-center group cursor-pointer">
    <div className="absolute inset-0 bg-yellow-400 blur-md rounded-full opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
    <svg viewBox="0 0 100 120" className="w-full h-full relative z-10 filter drop-shadow-md">
      <path d="M50,10 C30,10 15,25 15,45 C15,60 25,75 35,80 L35,90 L65,90 L65,80 C75,75 85,60 85,45 C85,25 70,10 50,10 Z" fill="#ffffff" stroke="#4f46e5" strokeWidth="4"/>
      <path d="M40,40 Q50,20 60,40 Q50,60 40,40" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" className="animate-pulse"/>
      <circle cx="50" cy="42" r="6" fill="#f59e0b" />
      <rect x="38" y="90" width="24" height="6" fill="#94a3b8" />
      <rect x="40" y="96" width="20" height="4" fill="#64748b" />
      <path d="M30,100 Q20,115 25,120" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
      <path d="M40,100 Q40,118 35,120" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
      <path d="M60,100 Q60,118 65,120" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
      <path d="M70,100 Q80,115 75,120" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="50" r="3" fill="#4f46e5" />
      <circle cx="60" cy="50" r="3" fill="#4f46e5" />
    </svg>
  </div>
);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    teams: [],
    mode: GameMode.INDIVIDUAL,
    length: GameLength.NORMAL,
    currentRoundIndex: -1,
    currentQuestionIndex: -1,
    rounds: [],
    status: 'LOBBY',
    quizMasterEnabled: true
  });

  const [loading, setLoading] = useState(false);
  const [suggestedThemes, setSuggestedThemes] = useState<string[]>([]);

  // Real-time synchronisatie
  useEffect(() => {
    if (!gameState.roomCode) return;

    const gameRef = ref(db, `rooms/${gameState.roomCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(prev => {
          // We overschrijven alleen als het niet lokaal veranderd is door een actie
          // maar in multiplayer is de DB leidend
          return { ...prev, ...data };
        });
      }
    });

    return () => unsubscribe();
  }, [gameState.roomCode]);

  const startNewGame = useCallback(() => {
    stopSpeaking();
    setGameState({
      players: [],
      teams: [],
      mode: GameMode.INDIVIDUAL,
      length: GameLength.NORMAL,
      currentRoundIndex: -1,
      currentQuestionIndex: -1,
      rounds: [],
      status: 'LOBBY',
      quizMasterEnabled: true
    });
  }, []);

  const onHostRoom = async () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const initialGame: Partial<GameState> = {
      roomCode: code,
      role: 'HOST',
      status: 'WAITING_FOR_PLAYERS',
      players: [],
      teams: [],
      currentRoundIndex: -1,
      currentQuestionIndex: -1,
      quizMasterEnabled: true
    };
    await set(ref(db, `rooms/${code}`), initialGame);
    setGameState(prev => ({ ...prev, ...initialGame as GameState }));
  };

  const onJoinRoom = async (code: string, name: string, avatar: string) => {
    const playerId = Math.random().toString(36).substring(2, 9);
    const newPlayer: Player = { id: playerId, name, avatar, score: 0 };
    
    // Check of room bestaat
    const gameRef = ref(db, `rooms/${code}`);
    // Hier voegen we onszelf toe aan de spelerlijst in Firebase
    // Let op: in een echte productie app zou je dit via een transactie doen
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.status === 'WAITING_FOR_PLAYERS') {
        const players = data.players ? [...data.players] : [];
        if (!players.find(p => p.id === playerId)) {
          players.push(newPlayer);
          update(gameRef, { players });
        }
      }
    }, { onlyOnce: true });

    setGameState(prev => ({ 
      ...prev, 
      roomCode: code, 
      role: 'PLAYER', 
      playerId, 
      status: 'WAITING_FOR_PLAYERS' 
    }));
  };

  const onPlayersReady = () => {
    if (gameState.role === 'HOST') {
      const updates = { status: 'SETUP' };
      update(ref(db, `rooms/${gameState.roomCode}`), updates);
    }
  };

  const onSetupComplete = async (mode: GameMode, length: GameLength, teams: Team[]) => {
    if (length === GameLength.CUSTOM) {
      setLoading(true);
      const themes = await fetchSuggestedThemes();
      setSuggestedThemes(themes);
      const updates = { mode, length, teams, status: 'CATEGORY_SELECTION' };
      update(ref(db, `rooms/${gameState.roomCode}`), updates);
      setLoading(false);
    } else {
      setLoading(true);
      const defaultThemes = ['Actualiteit', 'Netflix', 'Nostalgie', 'Sport', 'Wetenschap', 'Muziek', 'Eten', 'Reizen', 'Gen Z', 'Technologie'];
      const rounds = await generateRounds(length, defaultThemes, length * 5);
      const updates = {
        mode,
        length,
        teams,
        rounds,
        status: 'PLAYING',
        currentRoundIndex: 0,
        currentQuestionIndex: 0
      };
      update(ref(db, `rooms/${gameState.roomCode}`), updates);
      setLoading(false);
    }
  };

  const onCategoriesSelected = async (selectedThemes: string[], questionCount: number) => {
    setLoading(true);
    const rounds = await generateRounds(selectedThemes.length, selectedThemes, questionCount);
    const updates = {
      rounds,
      status: 'PLAYING',
      currentRoundIndex: 0,
      currentQuestionIndex: 0
    };
    update(ref(db, `rooms/${gameState.roomCode}`), updates);
    setLoading(false);
  };

  const toggleQuizMaster = () => {
    const newState = !gameState.quizMasterEnabled;
    if (!newState) {
      stopSpeaking();
    }
    update(ref(db, `rooms/${gameState.roomCode}`), { quizMasterEnabled: newState });
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative">
        <div className="gradient-bg p-4 flex justify-between items-center text-white shadow-md">
          <div className="flex items-center gap-3 cursor-pointer" onClick={startNewGame}>
            <SquidBulbLogo />
            <h1 className="text-3xl font-black tracking-tighter drop-shadow-sm">SQUIZY</h1>
          </div>
          <div className="flex items-center gap-4">
            {gameState.roomCode && (
              <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Code: <span className="text-yellow-300">{gameState.roomCode}</span>
              </div>
            )}
            <button 
              onClick={toggleQuizMaster}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${gameState.quizMasterEnabled ? 'bg-emerald-500' : 'bg-gray-400'}`}
            >
              <i className={`fas ${gameState.quizMasterEnabled ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              {gameState.quizMasterEnabled ? 'MASTER AAN' : 'MASTER UIT'}
            </button>
            {gameState.status !== 'LOBBY' && (
              <button onClick={startNewGame} className="text-white hover:text-indigo-200 transition-colors">
                <i className="fas fa-home text-lg"></i>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 border-8 border-indigo-100 rounded-full"></div>
                <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-lightbulb text-indigo-600 text-2xl animate-pulse"></i>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-indigo-900 mb-2">SQUIZY bereidt zich voor...</h3>
                <p className="text-indigo-500 font-medium animate-pulse">De Quizmaster schrijft unieke vragen voor jullie op!</p>
              </div>
            </div>
          ) : (
            <>
              {gameState.status === 'LOBBY' && (
                <Lobby onHost={onHostRoom} onJoin={onJoinRoom} />
              )}
              {gameState.status === 'WAITING_FOR_PLAYERS' && (
                <div className="text-center space-y-8 animate-pop py-10">
                  <h2 className="text-4xl font-black text-indigo-950">Wachten op spelers...</h2>
                  <div className="flex justify-center gap-4 flex-wrap">
                    {gameState.players.map(p => (
                      <div key={p.id} className="bg-indigo-100 p-6 rounded-3xl flex flex-col items-center gap-2 border-4 border-white shadow-xl">
                        <span className="text-6xl">{AVATARS.find(a => a.id === p.avatar)?.icon}</span>
                        <span className="font-black text-indigo-800">{p.name}</span>
                      </div>
                    ))}
                    {[...Array(Math.max(0, 4 - gameState.players.length))].map((_, i) => (
                      <div key={i} className="bg-indigo-50/50 border-4 border-dashed border-indigo-200 p-6 rounded-3xl flex flex-col items-center justify-center w-32 h-40">
                        <i className="fas fa-user-clock text-4xl text-indigo-200"></i>
                      </div>
                    ))}
                  </div>
                  {gameState.role === 'HOST' && (
                    <button 
                      onClick={onPlayersReady}
                      disabled={gameState.players.length < 1}
                      className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 disabled:opacity-50"
                    >
                      START SETUP
                    </button>
                  )}
                  {gameState.role === 'PLAYER' && (
                    <p className="text-indigo-500 font-bold animate-pulse">De host start zo de quiz!</p>
                  )}
                </div>
              )}
              {gameState.status === 'SETUP' && (
                <Setup 
                  players={gameState.players} 
                  onComplete={onSetupComplete} 
                  onBack={startNewGame} 
                  isHost={gameState.role === 'HOST'}
                />
              )}
              {gameState.status === 'CATEGORY_SELECTION' && (
                <CategorySelection 
                  themes={suggestedThemes} 
                  onComplete={onCategoriesSelected} 
                  onBack={startNewGame}
                  isHost={gameState.role === 'HOST'}
                />
              )}
              {gameState.status === 'PLAYING' && (
                <GameView 
                  gameState={gameState} 
                  setGameState={setGameState} 
                  onExit={startNewGame}
                />
              )}
              {gameState.status === 'FINISHED' && (
                <Dashboard 
                  gameState={gameState} 
                  onRestart={startNewGame}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
