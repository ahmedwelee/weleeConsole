
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TriviaQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to decode base64 string to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

function normalizeTriviaQuestions(questions: TriviaQuestion[]): TriviaQuestion[] {
  return questions.map((question) => {
    const optionCount = Array.isArray(question.options) ? question.options.length : 0;
    const options = Array.isArray(question.options) ? question.options : [];
    const rawAnswer = Number(question.correctAnswer);
    const correctOption = typeof question.correctOption === 'string' ? question.correctOption.trim() : '';

    let correctAnswer = options.findIndex(option => option.trim() === correctOption);
    if (correctAnswer < 0) {
      correctAnswer = Number.isFinite(rawAnswer) ? rawAnswer : 0;
    }
    if (correctAnswer < 0 || correctAnswer >= optionCount) {
      correctAnswer = 0;
    }

    return {
      ...question,
      correctAnswer,
      correctOption: options[correctAnswer] || correctOption || undefined
    };
  });
}

export const generateQuizBattle = async (lang: string, diff: string): Promise<TriviaQuestion[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 20 quiz questions in ${lang}. Difficulty: ${diff}. Subject: General Knowledge. JSON format. Each question must include exactly 4 options, a zero-based correctAnswer index (0, 1, 2, or 3), and a correctOption field that exactly matches one of the option strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.INTEGER },
            correctOption: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer"]
        }
      }
    }
  });
  return normalizeTriviaQuestions(JSON.parse(response.text || '[]'));
};

// Fix: Added missing generateTriviaQuestions function required by TriviaGame component
export const generateTriviaQuestions = async (theme: string): Promise<TriviaQuestion[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 5 trivia questions about ${theme}. JSON format. Each question must include exactly 4 options, a zero-based correctAnswer index (0, 1, 2, or 3), and a correctOption field that exactly matches one of the option strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.INTEGER },
            correctOption: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer"]
        }
      }
    }
  });
  return normalizeTriviaQuestions(JSON.parse(response.text || '[]'));
};

// Fix: Added missing generateSketchPrompt function required by SketchGame component
export const generateSketchPrompt = async (): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide one short, fun thing to draw for a quick sketching game (e.g. 'A cat on a unicycle'). Return just the text."
  });
  return (response.text || '').trim();
};

export const generateSpyWord = async (): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide one single common noun for a social deduction game. Return just the word."
  });
  return (response.text || '').trim();
};

// Fix: Updated to follow standard speech generation and decoding patterns
export const speakMessage = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;
    
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioCtx,
      24000,
      1
    );

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (err) { console.error("TTS failed", err); }
};
