
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// LET OP: Voor lokaal testen moet je hier je eigen Firebase config plaatsen
// Maak een project aan op console.firebase.google.com
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey", 
  authDomain: "squizy-quiz.firebaseapp.com",
  databaseURL: "https://squizy-quiz-default-rtdb.firebaseio.com",
  projectId: "squizy-quiz",
  storageBucket: "squizy-quiz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
