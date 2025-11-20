import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cache for TTS AudioBuffers to reduce latency on repeated words
const audioCache = new Map<string, AudioBuffer>();
let currentSource: AudioBufferSourceNode | null = null;

// Global AudioContext for TTS
let ttsAudioContext: AudioContext | null = null;

// Helper to ensure variety
const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// --- Generators ---

export const generateRandomTopic = async (difficulty: string): Promise<string> => {
  try {
    const categories = ["Travel", "Technology", "Food", "Culture", "Childhood", "Future", "Nature", "Hobbies"];
    const randomCat = getRandomElement(categories);
    
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Generate a unique, random, engaging topic for English speaking practice about ${randomCat}. Difficulty level: ${difficulty}. 
      Return ONLY the topic title and a short 2-sentence description. Keep it fun and surprising. (Random Seed: ${Date.now()})`,
    });
    return response.text || "Could not generate topic.";
  } catch (error) {
    console.error("Error generating topic:", error);
    return "Error generating topic. Please try again.";
  }
};

export const generateDrillTopic = async (): Promise<string> => {
  try {
    const types = ["Controversial Opinion", "Would You Rather", "Hypothetical Scenario", "Ethical Dilemma"];
    const randomType = getRandomElement(types);

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Give me a unique '${randomType}' topic that is fun to argue about. Return ONLY the question. (Random Seed: ${Date.now()})`,
    });
    return response.text || "Cats vs Dogs: Which is better?";
  } catch (error) {
    console.error("Error generating drill:", error);
    return "Is a hotdog a sandwich?";
  }
};

export const generateReadingPassage = async (): Promise<string> => {
  try {
    const topics = [
      "Space Exploration", "Deep Sea Mysteries", "Ancient Civilizations", 
      "Future Technology", "Strange Animal Behaviors", "The Science of Cooking",
      "Extreme Weather Phenomena", "The History of Music", "Psychology Facts", "Robotics"
    ];
    const randomTopic = getRandomElement(topics);

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Write a short, fun, and unique paragraph (approx 100 words) about a specific interesting fact or story related to: ${randomTopic}. 
      It is for reading practice. Ensure it is different from previous responses. (Timestamp: ${Date.now()})`,
    });
    return response.text || "Error generating passage.";
  } catch (error) {
    console.error("Error generating passage:", error);
    return "Error generating passage.";
  }
};

export interface IdiomData {
  idiom: string;
  meaning: string;
  example: string;
}

export const generateDailyIdiom = async (): Promise<IdiomData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Generate a cool, useful English idiom or slang phrase. Return valid JSON with keys: "idiom", "meaning", "example". (Random Seed: ${Date.now()})`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { idiom: "Break a leg", meaning: "Good luck", example: "Break a leg on your test!" };
  }
};

// --- Accent Coach ---

export const generateAccentPractice = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Generate a single sentence that is difficult to say in an Australian accent. 
      It should contain words with broad vowels (like 'No', 'Day', 'Buy') or non-rhotic endings (like 'Car', 'Water').
      Return ONLY the sentence.`,
    });
    return response.text || "The rain in Spain stays mainly in the plain.";
  } catch (e) {
    return "G'day mate, how are you going today?";
  }
};

export interface AccentFeedback {
  score: number;
  phonetics: string;
  advice: string;
}

export const analyzeAccent = async (audioBase64: string, sentence: string): Promise<AccentFeedback> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm; codecs=opus",
              data: audioBase64
            }
          },
          {
            text: `You are an Australian Accent Coach. Listen to the user say: "${sentence}".
            Analyze their accent specifically for Australian traits (e.g., vowel shifts, dropping 'r' at end of words).
            
            Return JSON:
            {
              "score": number (0-100, how authentic is the Aussie accent?),
              "phonetics": string (Explain how they sounded vs how they should sound),
              "advice": string (Specific tip to improve the accent)
            }`
          }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { score: 0, phonetics: "Error", advice: "Could not analyze audio." };
  }
};

// --- Roleplay ---

export interface RoleplayResponse {
  aiMessage: string;
  feedback?: string;
  score?: number;
  isComplete: boolean;
}

export const startRoleplaySession = async (scenario: string, history: {role: string, parts: {text: string}[]}[]): Promise<RoleplayResponse> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `You are an actor in a roleplay scenario: "${scenario}". 
        1. Stay in character 100%.
        2. If this is the first message, set the scene briefly and ask the user a question.
        3. If the user responds, reply as your character.
        4. ALSO provide a "score" (0-10) based on their politeness/grammar, and short "feedback".
        5. Return JSON: { "aiMessage": string, "feedback": string, "score": number, "isComplete": boolean }
        6. Set "isComplete" to true only if the conversation reaches a logical end.
        `
      }
    });

    // If history is empty, we trigger the start
    const msg = history.length === 0 ? "Start the scenario now." : "Continue.";
    const result = await chat.sendMessage({ message: msg });
    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Roleplay error:", error);
    return { aiMessage: "System Error. Try again.", isComplete: false };
  }
};


// --- Chat ---

export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        systemInstruction: "You are an encouraging English tutor. Correct grammar gently and keep the conversation fun.",
      }
    });
    
    const result = await chat.sendMessage({ message });
    return result.text || "I didn't catch that.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I'm having trouble connecting right now.";
  }
};

// --- Text to Speech ---

// Helper to decode base64 string
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert Raw PCM 16-bit to AudioBuffer
async function pcmToAudioBuffer(
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

export const playTextToSpeech = async (text: string): Promise<void> => {
  if (!text || !text.trim()) return;
  const cacheKey = text.trim().toLowerCase();

  try {
    // 1. Initialize / Resume Audio Context
    if (!ttsAudioContext) {
      ttsAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ttsAudioContext.state === 'suspended') {
      await ttsAudioContext.resume();
    }

    // 2. Stop any currently playing sound (prevents overlap when clicking fast)
    if (currentSource) {
      try { currentSource.stop(); } catch (e) {}
      currentSource = null;
    }

    // 3. Check Cache
    let audioBuffer = audioCache.get(cacheKey);

    // 4. Fetch if not in cache
    if (!audioBuffer) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data returned");

      const byteArray = decode(base64Audio);
      audioBuffer = await pcmToAudioBuffer(byteArray, ttsAudioContext, 24000, 1);
      
      // Store in cache
      audioCache.set(cacheKey, audioBuffer);
    }

    // 5. Play
    return new Promise((resolve) => {
        if (!ttsAudioContext || !audioBuffer) {
            resolve(); 
            return;
        }
        
        const source = ttsAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ttsAudioContext.destination);
        
        // Keep track so we can stop it if needed
        currentSource = source;

        source.onended = () => {
            if (currentSource === source) {
                currentSource = null;
            }
            resolve();
        };
        
        source.start();
    });
    
  } catch (error) {
    console.error("TTS Error:", error);
  }
};

// --- Speech Analysis ---

export interface SpeechFeedback {
  score: number;
  grammar: string;
  fluency: string;
  advice: string;
  is_relevant: boolean;
}

export const analyzeSpeech = async (audioBase64: string, topic: string): Promise<SpeechFeedback> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm; codecs=opus",
              data: audioBase64
            }
          },
          {
            text: `You are an English Speaking Coach. Listen to the attached audio. The user was asked to speak about: "${topic}".
            
            Analyze their speech and provide feedback in this exact JSON format:
            {
              "score": number (0-100 based on clarity and relevance),
              "grammar": "string (Highlight one major grammar mistake or say 'Perfect' if none)",
              "fluency": "string (e.g., 'Very confident', 'A bit hesitant', 'Too fast')",
              "advice": "string (One actionable tip to improve)",
              "is_relevant": boolean (Did they actually talk about the topic?)
            }
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SpeechFeedback;
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("Analysis error:", error);
    return {
      score: 0,
      grammar: "Analysis failed",
      fluency: "Unknown",
      advice: "Could not analyze audio. Please ensure your microphone is working and try again.",
      is_relevant: false
    };
  }
};
