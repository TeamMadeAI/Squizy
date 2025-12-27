
import React, { useState } from 'react';
import { Player, Team, GameMode, GameLength } from '../types';

interface SetupProps {
  players: Player[];
  onComplete: (mode: GameMode, length: GameLength, teams: Team[]) => void;
  onBack: () => void;
  isHost: boolean;
}

export const Setup: React.FC<SetupProps> = ({ players, onComplete, onBack, isHost }) => {
  const [mode, setMode] = useState<GameMode>(GameMode.INDIVIDUAL);
  const [length, setLength] = useState<GameLength>(GameLength.NORMAL);
  const [team1Name, setTeam1Name] = useState('Team Alpha');
  const [team2Name, setTeam2Name] = useState('Team Omega');

  const handleStart = () => {
    if (!isHost) return;
    let teams: Team[] = [];
    if (mode === GameMode.INDIVIDUAL) {
      teams = players.map(p => ({
        id: p.id,
        name: p.name,
        players: [p],
        score: 0
      }));
    } else {
      teams = [
        { id: 't1', name: team1Name, players: [players[0], players[1] || players[0]], score: 0 },
        { id: 't2', name: team2Name, players: [players[2] || players[0], players[3] || players[0]], score: 0 }
      ];
    }
    onComplete(mode, length, teams);
  };

  if (!isHost) {
    return (
      <div className="animate-pop h-full flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 bg-indigo-100 rounded-[2.5rem] flex items-center justify-center">
          <i className="fas fa-tools text-5xl text-indigo-600 animate-pulse"></i>
        </div>
        <h2 className="text-3xl font-black text-indigo-900">De host stelt de quiz in...</h2>
        <p className="text-indigo-500 font-medium">Even geduld, we gaan bijna beginnen!</p>
      </div>
    );
  }

  return (
    <div className="animate-pop space-y-8 flex flex-col h-full">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-indigo-900 mb-2">Spelinstellingen</h2>
        <p className="text-indigo-600">Configureer hoe je wilt spelen.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="text-lg font-bold text-indigo-800 flex items-center gap-2">
            <i className="fas fa-users text-indigo-500"></i> Spelmodus
          </label>
          <div className="flex flex-col gap-2">
            <button onClick={() => setMode(GameMode.INDIVIDUAL)} className={`p-4 rounded-2xl border-2 transition-all text-left flex justify-between items-center ${mode === GameMode.INDIVIDUAL ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-indigo-100 text-indigo-800'}`}>
              <div><div className="font-bold">Iedereen voor zich</div></div>
              <i className="fas fa-user"></i>
            </button>
            <button onClick={() => setMode(GameMode.TEAMS)} className={`p-4 rounded-2xl border-2 transition-all text-left flex justify-between items-center ${mode === GameMode.TEAMS ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-indigo-100 text-indigo-800'}`}>
              <div><div className="font-bold">Team Verdeling</div></div>
              <i className="fas fa-users"></i>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-lg font-bold text-indigo-800 flex items-center gap-2">
            <i className="fas fa-hourglass-half text-indigo-500"></i> Spelduur
          </label>
          <div className="flex flex-col gap-2">
            <button onClick={() => setLength(GameLength.NORMAL)} className={`p-4 rounded-2xl border-2 transition-all text-left flex justify-between items-center ${length === GameLength.NORMAL ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-indigo-100 text-indigo-800'}`}>
              <div><div className="font-bold">Normaal (5 rondes)</div></div>
              <i className="fas fa-stopwatch"></i>
            </button>
            <button onClick={() => setLength(GameLength.LONG)} className={`p-4 rounded-2xl border-2 transition-all text-left flex justify-between items-center ${length === GameLength.LONG ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-indigo-100 text-indigo-800'}`}>
              <div><div className="font-bold">Lang (10 rondes)</div></div>
              <i className="fas fa-history"></i>
            </button>
            <button onClick={() => setLength(GameLength.CUSTOM)} className={`p-4 rounded-2xl border-2 transition-all text-left flex justify-between items-center ${length === GameLength.CUSTOM ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-indigo-100 text-indigo-800'}`}>
              <div><div className="font-bold">Thema Keuze</div></div>
              <i className="fas fa-sliders"></i>
            </button>
          </div>
        </div>
      </div>

      {mode === GameMode.TEAMS && (
        <div className="bg-indigo-50 p-6 rounded-3xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" value={team1Name} onChange={e => setTeam1Name(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-indigo-100 outline-none" placeholder="Team 1" />
            <input type="text" value={team2Name} onChange={e => setTeam2Name(e.target.value)} className="w-full px-4 py-2 rounded-xl border-2 border-indigo-100 outline-none" placeholder="Team 2" />
          </div>
        </div>
      )}

      <div className="mt-auto flex gap-4">
        <button onClick={onBack} className="bg-white border-2 border-indigo-100 text-indigo-600 px-8 py-4 rounded-2xl font-bold">ANNULEREN</button>
        <button onClick={handleStart} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold text-xl shadow-xl">START DE QUIZ</button>
      </div>
    </div>
  );
};
