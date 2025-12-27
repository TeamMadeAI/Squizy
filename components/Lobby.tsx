
import React, { useState } from 'react';
import { Player, AVATARS } from '../types';

interface LobbyProps {
  onHost: () => void;
  onJoin: (code: string, name: string, avatar: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onHost, onJoin }) => {
  const [view, setView] = useState<'INITIAL' | 'JOIN'>('INITIAL');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);

  if (view === 'JOIN') {
    return (
      <div className="animate-pop space-y-8 flex flex-col h-full items-center justify-center">
        <h2 className="text-4xl font-black text-indigo-950">Doe mee aan de Quiz!</h2>
        
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">Room Code</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={4}
              className="w-full px-6 py-4 rounded-2xl border-4 border-indigo-100 focus:border-indigo-500 outline-none text-3xl font-black text-center text-indigo-900 placeholder:text-indigo-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">Jouw Naam</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Naam..."
              maxLength={12}
              className="w-full px-6 py-4 rounded-2xl border-4 border-indigo-100 focus:border-indigo-500 outline-none text-xl font-bold"
            />
          </div>

          <div className="space-y-2 text-center">
            <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">Kies je Avatar</label>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {AVATARS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAvatar(a.id)}
                  className={`text-3xl p-2 rounded-xl transition-all ${selectedAvatar === a.id ? 'bg-indigo-500 scale-125 shadow-lg' : 'bg-indigo-50 hover:bg-indigo-100'}`}
                >
                  {a.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => setView('INITIAL')} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black">TERUG</button>
            <button 
              onClick={() => onJoin(code, name, selectedAvatar)}
              disabled={!code || !name}
              className="flex-[2] bg-emerald-500 text-indigo-950 py-4 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-400 disabled:opacity-50"
            >
              IK DOE MEE!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pop flex flex-col h-full items-center justify-center gap-10 py-10">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-indigo-950 leading-tight">Welkom bij SQUIZY!</h2>
        <p className="text-indigo-500 font-medium text-lg">De meest interactieve AI-quiz ervaring ooit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-6">
        <button 
          onClick={onHost}
          className="bg-white border-4 border-indigo-600 p-8 rounded-[3rem] text-center space-y-4 hover:bg-indigo-50 transition-all hover:scale-105 group shadow-2xl shadow-indigo-200"
        >
          <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto group-hover:bg-indigo-600 transition-colors">
            <i className="fas fa-desktop text-4xl text-indigo-600 group-hover:text-white"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-950">MAAK QUIZ</div>
            <div className="text-indigo-400 font-bold text-sm">Ik ben de host (Hoofdscherm)</div>
          </div>
        </button>

        <button 
          onClick={() => setView('JOIN')}
          className="bg-indigo-600 border-4 border-indigo-600 p-8 rounded-[3rem] text-center space-y-4 hover:bg-indigo-700 transition-all hover:scale-105 group shadow-2xl shadow-indigo-300"
        >
          <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center mx-auto group-hover:bg-white transition-colors">
            <i className="fas fa-mobile-screen-button text-4xl text-white group-hover:text-indigo-600"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-white">DOE MEE</div>
            <div className="text-indigo-200 font-bold text-sm">Ik ben een speler (Controller)</div>
          </div>
        </button>
      </div>
    </div>
  );
};
