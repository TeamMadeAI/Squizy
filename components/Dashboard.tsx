
import React, { useEffect } from 'react';
import { GameState, AVATARS } from '../types';

interface DashboardProps {
  gameState: GameState;
  onRestart: () => void;
}

declare const confetti: any;

export const Dashboard: React.FC<DashboardProps> = ({ gameState, onRestart }) => {
  const sortedTeams = [...gameState.teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];

  useEffect(() => {
    // Continue Confetti & Vuurwerk loop
    const end = Date.now() + (120 * 1000); // 2 minuten lang

    const frame = () => {
      // Confetti van de zijkanten
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#4f46e5', '#fbbf24', '#10b981', '#f43f5e']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#4f46e5', '#fbbf24', '#10b981', '#f43f5e']
      });

      // Willekeurig "Vuurwerk"
      if (Math.random() < 0.05) {
        confetti({
          particleCount: 40,
          startVelocity: 30,
          spread: 360,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          scalar: 1.2
        });
      }

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
    return () => {}; // Frame stopt als loop eindigt of component unmount
  }, []);

  return (
    <div className="animate-pop text-center space-y-8 flex flex-col items-center py-6">
      <div className="space-y-2">
        <i className="fas fa-trophy text-8xl text-yellow-400 animate-bounce"></i>
        <h2 className="text-4xl font-black text-indigo-900 uppercase">Gefeliciteerd!</h2>
        <p className="text-xl text-indigo-600 font-medium">De winnaars zijn de SQUIZY Koningen!</p>
      </div>

      <div className="w-full max-w-md bg-white border-4 border-yellow-400 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="bg-yellow-400 text-indigo-900 font-black py-2 rounded-t-xl absolute top-0 left-0 right-0 tracking-widest text-xs uppercase">
          WINNAAR
        </div>
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex -space-x-4">
            {winner.players.map(p => (
              <span key={p.id} className="text-7xl bg-indigo-50 w-28 h-28 rounded-full border-4 border-yellow-400 flex items-center justify-center shadow-xl">
                {AVATARS.find(a => a.id === p.avatar)?.icon}
              </span>
            ))}
          </div>
          <div className="text-3xl font-black text-indigo-900 uppercase tracking-tight">{winner.name}</div>
          <div className="bg-indigo-600 text-white px-8 py-2 rounded-2xl text-2xl font-black shadow-lg">
            {winner.score} PUNTEN
          </div>
        </div>
      </div>

      <div className="w-full space-y-4">
        <h3 className="font-black text-indigo-400 text-sm tracking-widest uppercase">Eindklassement</h3>
        <div className="space-y-3">
          {sortedTeams.map((team, idx) => (
            <div key={team.id} className={`flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all ${idx === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {idx + 1}
                </span>
                <div className="text-left">
                  <div className="font-black text-indigo-900 uppercase text-lg leading-none mb-1">{team.name}</div>
                  <div className="flex gap-2">
                    {team.players.map(p => (
                      <span key={p.id} className="text-xs text-indigo-400 font-bold flex items-center gap-1">
                        {AVATARS.find(a => a.id === p.avatar)?.icon} {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-3xl font-black text-indigo-900">{team.score}</div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={onRestart}
        className="w-full bg-indigo-900 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
      >
        SPEEL OPNIEUW <i className="fas fa-rotate-right"></i>
      </button>
    </div>
  );
};
