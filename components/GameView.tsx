
import React, { useState, useEffect, useRef } from 'react';
import { GameState, RoundType, Question, AVATARS } from '../types';
import { speak, stopSpeaking } from '../geminiService';
import { db } from '../firebase';
import { ref, update } from "firebase/database";

interface GameViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onExit: () => void;
}

export const GameView: React.FC<GameViewProps> = ({ gameState, setGameState, onExit }) => {
  const isHost = gameState.role === 'HOST';
  const currentRound = gameState.rounds[gameState.currentRoundIndex];
  const currentQuestion = currentRound?.questions[gameState.currentQuestionIndex];
  
  if (!currentQuestion) return null;

  // Sync Timer en Spraak (Alleen Host)
  useEffect(() => {
    if (!isHost) return;
    
    let isMounted = true;
    stopSpeaking();
    
    // Reset status in DB
    update(ref(db, `rooms/${gameState.roomCode}`), {
      timeLeft: currentQuestion.timer,
      showAnswer: false
    });

    const startQuestion = async () => {
      if (gameState.quizMasterEnabled) {
        const intro = gameState.currentQuestionIndex === 0 
          ? `Ronde ${gameState.currentRoundIndex + 1}: ${currentRound.theme}.`
          : ``;
        await speak(`${intro} ${currentQuestion.text}`);
      }
    };

    startQuestion();
    return () => {
      stopSpeaking();
    };
  }, [gameState.currentQuestionIndex, gameState.currentRoundIndex, isHost]);

  // Timer Logica (Alleen Host)
  useEffect(() => {
    if (!isHost || gameState.showAnswer) return;

    const timer = setInterval(() => {
      if (gameState.timeLeft && gameState.timeLeft > 0) {
        update(ref(db, `rooms/${gameState.roomCode}`), {
          timeLeft: gameState.timeLeft - 1
        });
      } else if (gameState.timeLeft === 0) {
        revealAnswer();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isHost, gameState.timeLeft, gameState.showAnswer]);

  const revealAnswer = async () => {
    if (!isHost) return;
    stopSpeaking();
    update(ref(db, `rooms/${gameState.roomCode}`), { showAnswer: true });
    
    if (gameState.quizMasterEnabled) {
      const responseText = currentRound.type === RoundType.DOE 
        ? `Tijd is om! ${currentQuestion.answer}.`
        : `Het juiste antwoord is: ${currentQuestion.answer}. ${currentQuestion.explanation || ''}`;
      speak(responseText);
    }
  };

  const handleScore = (teamId: string, points: number) => {
    if (!isHost) return;
    const newTeams = gameState.teams.map(t => t.id === teamId ? { ...t, score: t.score + points } : t);
    update(ref(db, `rooms/${gameState.roomCode}`), { teams: newTeams });
  };

  const nextQuestion = () => {
    if (!isHost) return;
    stopSpeaking();
    if (gameState.currentQuestionIndex < currentRound.questions.length - 1) {
      update(ref(db, `rooms/${gameState.roomCode}`), { currentQuestionIndex: gameState.currentQuestionIndex + 1 });
    } else if (gameState.currentRoundIndex < gameState.rounds.length - 1) {
      update(ref(db, `rooms/${gameState.roomCode}`), { 
        currentRoundIndex: gameState.currentRoundIndex + 1,
        currentQuestionIndex: 0
      });
    } else {
      update(ref(db, `rooms/${gameState.roomCode}`), { status: 'FINISHED' });
    }
  };

  const submitAnswer = (optionIdx: number) => {
    // Spelers kunnen hier hun antwoord sturen, voor nu markeren we dat ze geantwoord hebben
    // In een uitgebreide versie zou je de 'currentAnswerId' in de DB syncen om te zien wie als eerste was
  };

  if (gameState.role === 'PLAYER') {
    return (
      <div className="h-full flex flex-col gap-6 animate-pop py-4">
        <div className="bg-indigo-900 p-6 rounded-[2.5rem] text-center">
          <div className="text-indigo-300 font-black text-xs uppercase tracking-widest mb-1">Controller Mode</div>
          <div className="text-white text-2xl font-black">{gameState.players.find(p => p.id === gameState.playerId)?.name}</div>
        </div>

        {!gameState.showAnswer && currentQuestion.options ? (
          <div className="grid grid-cols-2 gap-4 flex-1">
            {currentQuestion.options.map((opt, i) => (
              <button 
                key={i}
                onClick={() => submitAnswer(i)}
                className={`rounded-[2rem] border-4 p-4 text-4xl font-black flex flex-col items-center justify-center gap-4 transition-all active:scale-90 shadow-xl
                  ${i === 0 ? 'bg-rose-500 border-rose-300 text-white' : ''}
                  ${i === 1 ? 'bg-indigo-600 border-indigo-400 text-white' : ''}
                  ${i === 2 ? 'bg-amber-400 border-amber-200 text-indigo-950' : ''}
                  ${i === 3 ? 'bg-emerald-500 border-emerald-300 text-white' : ''}
                `}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                <div className="text-xs uppercase opacity-80">{opt}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-indigo-50 rounded-[3rem] border-4 border-dashed border-indigo-200">
            <i className={`fas ${gameState.showAnswer ? 'fa-eye' : 'fa-hourglass-start'} text-6xl text-indigo-300 mb-6 animate-pulse`}></i>
            <h3 className="text-2xl font-black text-indigo-900">
              {gameState.showAnswer ? 'KIJK NAAR HET SCHERM!' : 'ANTWOORD NU OP JE GSM!'}
            </h3>
            <p className="text-indigo-400 font-bold mt-2">Wacht op de volgende actie...</p>
          </div>
        )}
      </div>
    );
  }

  // HOST VIEW (Het hoofdscherm)
  return (
    <div className="flex flex-col h-full space-y-6 animate-pop">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-md p-4 rounded-[2rem] border border-indigo-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-xl transform rotate-3">
            <i className={`fas fa-star`}></i>
          </div>
          <div>
            <div className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em]">{currentRound.theme}</div>
            <div className="font-black text-indigo-950 text-xl leading-none">Vraag {gameState.currentQuestionIndex + 1}</div>
          </div>
        </div>
        
        <div className={`relative w-16 h-16 flex items-center justify-center`}>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-indigo-50" />
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
              strokeDasharray={176} 
              strokeDashoffset={176 - (176 * (gameState.timeLeft || 0)) / currentQuestion.timer}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${(gameState.timeLeft || 0) < 5 ? 'text-rose-500' : 'text-indigo-600'}`} 
            />
          </svg>
          <span className={`text-xl font-black ${(gameState.timeLeft || 0) < 5 ? 'text-rose-500 animate-pulse' : 'text-indigo-950'}`}>{gameState.timeLeft}</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[3rem] p-10 shadow-2xl border-b-[12px] border-indigo-100/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"></div>
        <h2 className="text-4xl md:text-5xl font-black text-indigo-950 leading-[1.15] tracking-tight z-10">
          {currentQuestion.text}
        </h2>

        {currentQuestion.options && !gameState.showAnswer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto mt-6 z-10">
            {currentQuestion.options.map((opt, i) => (
              <div key={i} className="p-6 bg-indigo-50/50 rounded-3xl border-2 border-indigo-100 text-xl font-black text-indigo-900 flex items-center gap-4">
                <span className={`w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg
                  ${i === 0 ? 'bg-rose-500' : ''}
                  ${i === 1 ? 'bg-indigo-600' : ''}
                  ${i === 2 ? 'bg-amber-400' : ''}
                  ${i === 3 ? 'bg-emerald-500' : ''}
                `}>
                  {String.fromCharCode(65 + i)}
                </span>
                <div className="flex-1 text-left">{opt}</div>
              </div>
            ))}
          </div>
        )}

        {gameState.showAnswer && (
          <div className="animate-pop p-10 bg-emerald-50 rounded-[3rem] border-4 border-emerald-400 shadow-xl space-y-4 max-w-2xl mx-auto z-10">
            <div className="text-emerald-500 font-black tracking-[0.3em] text-xs uppercase">ANTWOORD</div>
            <div className="text-5xl font-black text-emerald-900 uppercase leading-none">{currentQuestion.answer}</div>
            {currentQuestion.explanation && (
              <div className="text-emerald-800 font-bold text-lg max-w-md mx-auto italic mt-4">
                "{currentQuestion.explanation}"
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-indigo-950 p-6 rounded-[3rem] shadow-2xl flex flex-col gap-5 border-t-4 border-white/10">
        <div className="flex justify-between items-center px-4">
           <button 
            onClick={gameState.showAnswer ? nextQuestion : revealAnswer}
            className={`px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 ${gameState.showAnswer ? 'bg-indigo-600 text-white' : 'bg-yellow-400 text-indigo-950'}`}
           >
            {gameState.showAnswer ? 'VOLGENDE VRAAG' : 'ONTNUL HET ANTWOORD'}
           </button>
           <div className="text-white font-black text-xs tracking-widest flex gap-2">
             {gameState.players.map(p => (
               <span key={p.id} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">{AVATARS.find(a => a.id === p.avatar)?.icon}</span>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gameState.teams.map((team) => (
            <div key={team.id} className="bg-white/5 p-4 rounded-3xl flex flex-col items-center gap-2 border border-white/10 relative">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{team.name}</div>
              <div className="text-2xl font-black text-white">{team.score}</div>
              <button 
                onClick={() => handleScore(team.id, 10)}
                className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
