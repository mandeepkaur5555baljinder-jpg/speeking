import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, Volume2, Clock, Zap } from 'lucide-react';
import { generateReadingPassage, playTextToSpeech } from '../services/gemini';

const SpeedReading: React.FC = () => {
  const [passage, setPassage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);
  
  // playingIndex tracks which word is currently fetching OR playing
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    loadNewPassage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNewPassage = async () => {
    setIsLoading(true);
    setPassage("");
    setWpm(0);
    stopTimer();
    setTimeElapsed(0);
    setPlayingIndex(null);
    
    const text = await generateReadingPassage();
    setPassage(text);
    setIsLoading(false);
  };

  const startReading = () => {
    setIsReading(true);
    setTimeElapsed(0);
    setWpm(0);
    setPlayingIndex(null);
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(prev => prev + 0.1);
    }, 100);
  };

  const stopReading = () => {
    stopTimer();
    setIsReading(false);
    calculateWPM();
  };

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const calculateWPM = () => {
    if (timeElapsed === 0) return;
    const wordCount = passage.split(' ').length;
    const minutes = timeElapsed / 60;
    const calculatedWpm = Math.round(wordCount / minutes);
    setWpm(calculatedWpm);
  };

  const handleSpeakPassage = async () => {
    if (!passage) return;
    await playTextToSpeech(passage);
  };

  const handleWordClick = async (word: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Guard: Only allow clicking if we are NOT blurred
    if (isBlurred) return;

    const textToPlay = word.trim();
    if (!textToPlay) return;

    setPlayingIndex(index);
    try {
      // This will wait until the audio finishes playing
      await playTextToSpeech(textToPlay);
    } catch (error) {
      console.error("Error playing word:", error);
    } finally {
      setPlayingIndex(null);
    }
  };

  const isBlurred = !isReading && wpm === 0;

  // Split passage reliably
  const words = passage ? passage.trim().split(/\s+/) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Speed Reader</h1>
        <button 
          onClick={loadNewPassage}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-surface border border-slate-600 rounded-lg hover:bg-surfaceHighlight disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          New Passage
        </button>
      </div>

      <div className="bg-surface border border-slate-700 rounded-2xl p-8 min-h-[300px] relative shadow-2xl">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
               <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="text-slate-400 animate-pulse">Generating text...</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`prose prose-invert prose-lg max-w-none mb-8 transition-all duration-300 ${isBlurred ? 'blur-sm select-none opacity-50' : 'blur-none opacity-100'}`}>
              <p className="leading-relaxed text-slate-200 font-medium flex flex-wrap gap-x-1.5 gap-y-1">
                {words.map((word, index) => (
                  <span 
                    key={index} 
                    onClick={(e) => handleWordClick(word, index, e)}
                    className={`rounded px-1 py-0.5 transition-all cursor-pointer border border-transparent
                      ${playingIndex === index 
                        ? 'bg-secondary text-black font-bold scale-110 shadow-lg animate-pulse' 
                        : 'hover:bg-surfaceHighlight hover:border-slate-600'}
                      ${isBlurred ? 'pointer-events-none' : ''}
                    `}
                  >
                    {word}
                  </span>
                ))}
              </p>
            </div>
            
            {isBlurred && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                 <button 
                  onClick={startReading}
                  className="bg-primary hover:bg-blue-600 text-white text-lg font-bold py-4 px-10 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] transform transition hover:scale-105 flex items-center gap-2"
                 >
                   <Play className="w-6 h-6" /> Start Reading
                 </button>
              </div>
            )}

            {!isBlurred && !isReading && (
               <div className="absolute top-4 right-4 text-xs text-secondary flex items-center gap-1 animate-bounce pointer-events-none bg-surfaceHighlight/50 px-2 py-1 rounded-full">
                  <Volume2 className="w-3 h-3" /> Click words to listen
               </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-6 rounded-xl border border-slate-700 flex items-center gap-4">
           <div className="p-3 bg-slate-800 rounded-full">
             <Clock className="w-6 h-6 text-secondary" />
           </div>
           <div>
             <p className="text-sm text-slate-400">Time</p>
             <p className="text-2xl font-bold text-white">{timeElapsed.toFixed(1)}s</p>
           </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-slate-700 flex items-center gap-4">
           <div className="p-3 bg-slate-800 rounded-full">
             <Zap className="w-6 h-6 text-primary" />
           </div>
           <div>
             <p className="text-sm text-slate-400">Speed</p>
             <p className="text-2xl font-bold text-white">{wpm > 0 ? `${wpm} WPM` : '--'}</p>
           </div>
        </div>

        <div className="flex items-center justify-center">
          {isReading ? (
            <button 
              onClick={stopReading}
              className="w-full h-full bg-accent hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg transition-colors flex flex-col items-center justify-center p-4"
            >
              <span className="text-xl">I'm Done!</span>
              <span className="text-sm opacity-90 font-normal">Click to finish</span>
            </button>
          ) : (
            <button 
              onClick={handleSpeakPassage}
              disabled={!passage || isLoading}
              className="w-full h-full bg-surfaceHighlight hover:bg-slate-600 border border-slate-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex flex-col items-center justify-center p-4"
            >
              <Volume2 className="w-8 h-8 mb-1 text-secondary" />
              <span className="text-sm">Read Full Text</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeedReading;