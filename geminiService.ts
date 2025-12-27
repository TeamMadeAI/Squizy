
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RoundType, Question, Round } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

let activeAudioSource: AudioBufferSourceNode | null = null;
let audioContext: AudioContext | null = null;
let ttsAbortController: AbortController | null = null;

export async function fetchSuggestedThemes(): Promise<string[]> {
  const prompt = `Genereer 12 unieke, uiteenlopende en uitdagende quiz-thema's in het Nederlands voor een quiz genaamd SQUIZY. 
  Denk aan: Actualiteit 2025, Nostalgie, Gen Z slang, Netflix hits, Wetenschap, Reizen, Sport, Eten, etc.
  Zorg dat ze geschikt zijn voor de leeftijd 12 tot 67. Geef alleen een JSON lijst van strings terug.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return ['Actualiteit', 'Muziek', 'Sport', 'Film & TV', 'Wetenschap', 'Geschiedenis', 'Eten & Drinken', 'Aardrijkskunde'];
  }
}

export async function generateRounds(roundCount: number, themes: string[], totalQuestions: number): Promise<Round[]> {
  const prompt = `Gegenereer een uitgebreide SQUIZY quiz.
  Rondes (Aantal: ${roundCount}): ${themes.slice(0, roundCount).join(', ')}.
  TOTAAL AANTAL VRAGEN over alle rondes samen: ${totalQuestions}.
  
  BELANGRIJKE REGELS VOOR DE QUIZMASTER (SQUIZY):
  1. Verdeel de ${totalQuestions} vragen over de ${roundCount} rondes.
  2. Varieer de types per ronde:
     - 'NORMAL': Kennisvragen.
     - 'DOE': Prestatie-opdrachten / actie.
     - 'RAADSEL': Tekstuele puzzels.
     - 'MUZIEK': Muziekfeiten of artiesten.
  3. Zorg dat de taal Nederlands is, enthousiast en geschikt voor leeftijden 12-67.
  4. Elke ronde moet een uniek thema uit de lijst hebben.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            number: { type: Type.INTEGER },
            theme: { type: Type.STRING },
            type: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  timer: { type: Type.INTEGER },
                },
                required: ['id', 'text', 'answer', 'timer']
              }
            }
          },
          required: ['number', 'theme', 'type', 'questions']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Vragen genereren mislukt", e);
    return [];
  }
}

export function stopSpeaking() {
  if (ttsAbortController) {
    ttsAbortController.abort();
    ttsAbortController = null;
  }
  if (activeAudioSource) {
    try {
      activeAudioSource.stop();
    } catch (e) {}
    activeAudioSource = null;
  }
}

export async function speak(text: string): Promise<void> {
  stopSpeaking();
  ttsAbortController = new AbortController();

  return new Promise(async (resolve) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `SQUIZY zegt: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      if (ttsAbortController?.signal.aborted) {
        resolve();
        return;
      }

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContext) {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const audioData = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        activeAudioSource = source;
        source.onended = () => {
          if (activeAudioSource === source) activeAudioSource = null;
          resolve();
        };
        
        source.start();
      } else {
        resolve();
      }
    } catch (error) {
      console.error("TTS Fout", error);
      resolve();
    }
  });
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
