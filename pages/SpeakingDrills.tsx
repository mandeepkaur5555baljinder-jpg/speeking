import React, { useState, useEffect, useRef } from 'react';
import { Mic, Play, RotateCcw, Timer, CheckCircle, AlertTriangle, BarChart2, Loader } from 'lucide-react';
import { generateDrillTopic, analyzeSpeech, SpeechFeedback } from '../services/gemini';

const SpeakingDrills: React.FC = () => {
  const [topic, setTopic] = useState<string>("Click Start to get a topic!");
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [micPermission, setMicPermission] = useState(false);
  
  // Refs for Recording and Audio Context
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopDrill(false); // Cleanup without analyzing if unmounting
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Analyzer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      
      // Setup Recorder
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };
      mediaRecorderRef.current = recorder;

      setMicPermission(true);
      drawVisualizer();
    } catch (e) {
      console.error("Mic error", e);
      alert("Microphone permission is needed for drills.");
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // Cyberpunk colors
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#06B6D4'); // Cyan
        gradient.addColorStop(1, '#3B82F6'); // Blue

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const startDrill = async () => {
    if (!micPermission) await initAudio();
    
    setIsLoading(true);
    setFeedback(null);
    audioChunksRef.current = []; // Reset chunks
    
    const newTopic = await generateDrillTopic();
    setTopic(newTopic);
    
    setIsLoading(false);
    setIsActive(true);
    setTimeLeft(60);

    // Start Recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start();
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopDrill(true); // Stop and analyze
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopDrill = (shouldAnalyze: boolean) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    
    // Stop Recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      if (shouldAnalyze) {
        setIsAnalyzing(true);
        mediaRecorderRef.current.stop(); // This triggers onstop handler
      } else {
        mediaRecorderRef.current.stop();
        // We won't analyze if manually cancelled without finishing? 
        // Actually let's allow analyzing if manually stopped too, but we need to handle state
        // Current logic: manual stop calls stopDrill(true) from button
      }
    }
  };

  const handleManualStop = () => {
    stopDrill(true);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
  };

  const processAudio = async (blob: Blob) => {
    try {
      const base64 = await blobToBase64(blob);
      const result = await analyzeSpeech(base64, topic);
      setFeedback(result);
    } catch (error) {
      console.error("Processing error", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Rapid Fire Drills</h1>
        <p className="text-slate-400">Speak about the topic for up to 60s. The AI will grade you!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Card 1: Topic & Timer */}
        <div className="bg-surface border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col justify-between">
           {/* Timer Background */}
           {isActive && (
             <div 
                className="absolute bottom-0 left-0 h-2 bg-secondary transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
             />
           )}

           <div>
             <div className="flex justify-between items-start mb-8">
               <div className="bg-slate-700 p-2 rounded-lg">
                 <Timer className={`w-6 h-6 ${isActive ? 'text-secondary animate-pulse' : 'text-slate-400'}`} />
               </div>
               <span className="text-4xl font-mono font-bold text-white">{timeLeft}s</span>
             </div>

             <div className="space-y-4">
               <p className="text-slate-400 text-sm uppercase tracking-wider font-bold">Your Topic</p>
               {isLoading ? (
                 <div className="animate-pulse h-8 bg-slate-700 rounded w-3/4"></div>
               ) : (
                 <h2 className="text-3xl font-bold text-white leading-tight neon-text">{topic}</h2>
               )}
             </div>
           </div>

           <div className="mt-8">
             {!isActive && !isAnalyzing ? (
               <button 
                 onClick={startDrill}
                 className="w-full py-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2"
               >
                 {timeLeft === 0 || feedback ? <RotateCcw /> : <Play />} 
                 {timeLeft === 0 || feedback ? 'New Drill' : 'Start Drill'}
               </button>
             ) : isAnalyzing ? (
               <div className="w-full py-4 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center justify-center gap-3 cursor-wait">
                 <Loader className="animate-spin w-5 h-5 text-secondary" /> Analyzing Speech...
               </div>
             ) : (
               <button 
                 onClick={handleManualStop}
                 className="w-full py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-500 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
               >
                 Stop & Grade
               </button>
             )}
           </div>
        </div>

        {/* Card 2: Visualizer OR Feedback */}
        <div className="bg-surface/50 border border-slate-800 rounded-3xl p-8 flex flex-col relative overflow-hidden">
          {feedback ? (
             <div className="flex flex-col h-full animate-float">
               <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <BarChart2 className="text-secondary" /> AI Report Card
                 </h3>
                 <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
                   feedback.score >= 70 ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-yellow-900/50 border-yellow-500 text-yellow-400'
                 }`}>
                   Score: {feedback.score}/100
                 </div>
               </div>
               
               <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide">
                 <div className="bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Relevance</p>
                    <div className="flex items-center gap-2">
                      {feedback.is_relevant ? (
                        <span className="text-green-400 flex items-center gap-1 text-sm"><CheckCircle size={16} /> On Topic</span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1 text-sm"><AlertTriangle size={16} /> Off Topic</span>
                      )}
                    </div>
                 </div>

                 <div>
                    <p className="text-xs text-slate-400 uppercase font-bold mb-2">Grammar Check</p>
                    <p className="text-sm text-slate-200 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                      {feedback.grammar}
                    </p>
                 </div>

                 <div>
                    <p className="text-xs text-slate-400 uppercase font-bold mb-2">Fluency</p>
                    <p className="text-sm text-slate-200 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                      {feedback.fluency}
                    </p>
                 </div>

                 <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                    <p className="text-xs text-blue-300 uppercase font-bold mb-2">Coach's Tip</p>
                    <p className="text-sm text-blue-100 italic">"{feedback.advice}"</p>
                 </div>
               </div>
             </div>
          ) : (
            // VISUALIZER VIEW
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center relative">
                 {!micPermission && !isActive && (
                    <div className="text-slate-500 text-center">
                      <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Microphone visualization will appear here</p>
                    </div>
                  )}
                  <canvas 
                    ref={canvasRef} 
                    width="300" 
                    height="200" 
                    className="w-full h-full object-contain"
                  />
              </div>
              <div className="h-8 flex items-center justify-center text-sm text-slate-400">
                {isActive ? "Listening..." : isAnalyzing ? "Processing..." : "Waiting to start..."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingDrills;