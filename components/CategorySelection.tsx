
import React, { useState } from 'react';

interface CategorySelectionProps {
  themes: string[];
  onComplete: (selected: string[], questionCount: number) => void;
  onBack: () => void;
  isHost: boolean;
}

export const CategorySelection: React.FC<CategorySelectionProps> = ({ themes, onComplete, onBack, isHost }) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState(20);

  const toggleTheme = (index: number) => {
    if (!isHost) return;
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else if (selectedIndices.length < 4) {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleConfirm = () => {
    if (isHost && selectedIndices.length >= 1) {
      onComplete(selectedIndices.map(i => themes[i]), questionCount);
    }
  };

  if (!isHost) {
    return (
      <div className="animate-pop h-full flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 bg-indigo-100 rounded-[2.5rem] flex items-center justify-center">
          <i className="fas fa-list-check text-5xl text-indigo-600 animate-pulse"></i>
        </div>
        <h2 className="text-3xl font-black text-indigo-900">Thema's worden gekozen...</h2>
        <p className="text-indigo-500 font-medium">Blijf stand-by op je toestel!</p>
      </div>
    );
  }

  return (
    <div className="animate-pop space-y-6 flex flex-col h-full">
      <div className="text-center">
        <h2 className="text-3xl font-black text-indigo-900 mb-1">Stel je eigen Quiz samen!</h2>
        <p className="text-indigo-600 font-medium">Kies <span className="text-indigo-800 font-bold">1 tot 4 categorieën</span>.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {themes.map((theme, idx) => {
          const isSelected = selectedIndices.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => toggleTheme(idx)}
              className={`p-5 rounded-3xl border-4 transition-all flex flex-col items-center justify-center gap-2 text-center relative group overflow-hidden ${
                isSelected 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl scale-105 z-10' 
                : 'bg-white border-indigo-50 text-indigo-800 hover:border-indigo-200'
              }`}
            >
              <span className="font-black text-xs uppercase tracking-tight leading-tight">{theme}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-indigo-50 p-6 rounded-[2.5rem] border-2 border-indigo-100 space-y-4">
        <div className="flex justify-between items-center px-2">
          <label className="text-indigo-900 font-black uppercase text-sm">Vragen: {questionCount}</label>
        </div>
        <input type="range" min="5" max="40" step="5" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full accent-indigo-600" />
      </div>

      <div className="bg-indigo-900 text-white p-6 rounded-[2.5rem] flex gap-4 justify-between items-center shadow-xl">
        <button onClick={onBack} className="text-white/60 font-bold">ANNULEREN</button>
        <button disabled={selectedIndices.length < 1} onClick={handleConfirm} className="bg-emerald-500 text-indigo-950 font-black px-8 py-3 rounded-2xl disabled:opacity-30">BEVESTIG</button>
      </div>
    </div>
  );
};
