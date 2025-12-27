
export enum GameMode {
  INDIVIDUAL = 'INDIVIDUAL',
  TEAMS = 'TEAMS'
}

export enum GameLength {
  NORMAL = 5,
  LONG = 10,
  CUSTOM = 0
}

export enum RoundType {
  NORMAL = 'NORMAL',
  DOE = 'DOE',
  RAADSEL = 'RAADSEL',
  MUZIEK = 'MUZIEK'
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isReady?: boolean;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  score: number;
}

export interface Question {
  id: string;
  type: RoundType;
  text: string;
  options?: string[];
  answer: string;
  explanation?: string;
  imageHint?: string;
  timer: number;
}

export interface Round {
  number: number;
  theme: string;
  type: RoundType;
  questions: Question[];
}

export interface GameState {
  roomCode?: string;
  role?: 'HOST' | 'PLAYER';
  playerId?: string;
  players: Player[];
  teams: Team[];
  mode: GameMode;
  length: GameLength;
  currentRoundIndex: number;
  currentQuestionIndex: number;
  rounds: Round[];
  status: 'LOBBY' | 'SETUP' | 'CATEGORY_SELECTION' | 'PLAYING' | 'FINISHED' | 'WAITING_FOR_PLAYERS';
  quizMasterEnabled: boolean;
  currentAnswerId?: string; // Voor sync van antwoorden
  showAnswer?: boolean;
  timeLeft?: number;
}

export const AVATARS = [
  { id: 'broccoli', icon: '🥦', name: 'Meneer Broccoli' },
  { id: 'violin', icon: '🎻', name: 'Victor Viool' },
  { id: 'dog', icon: '🐶', name: 'Davy de Hond' },
  { id: 'cat', icon: '🐱', name: 'Kato de Kat' },
  { id: 'mario', icon: '🍄', name: 'Mario Bro' },
  { id: 'alien', icon: '👽', name: 'Zorg de Alien' },
  { id: 'princess', icon: '👑', name: 'Prinses Parel' },
  { id: 'taco', icon: '🌮', name: 'Timo Taco' },
  { id: 'robot', icon: '🤖', name: 'Robo-Bob' },
  { id: 'unicorn', icon: '🦄', name: 'Uli de Eenhoorn' }
];
