import React, { useState, useEffect, useRef } from 'react';
import { Mic, Play, RotateCcw, Globe, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import { generateAccentPractice, analyzeAccent, AccentFeedback } from '../services/gemini';

const AccentCoach: React.FC = () => {
  const [sentence, setSentence] = useState<string>("Generating...");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<AccentFeedback | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadNewSentence();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadNewSentence = async () => {
    setFeedback(null);
    setSentence("Generating aussie sentence...");
    const text = await generateAccentPractice();
    setSentence(text);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        analyzeAudio(blob);
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      
    } catch (e) {
      console.error("Mic access denied", e);
      alert("Please allow microphone access to use the Accent Coach.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const analyzeAudio = async (blob: Blob) => {
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
       const base64 = (reader.result as string).split(',')[1];
       const result = await analyzeAccent(base64, sentence);
       setFeedback(result);
       setIsAnalyzing(false);
    };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Globe className="w-10 h-10 text-pink-500" /> Australian Accent Coach
        </h1>
        <p className="text-slate-400">Practice your vowels and 'R' drops. Good luck, mate!</p>
      </div>

      <div className="bg-surface border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="mb-10 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4">Read this aloud</p>
          <h2 className="text-2xl md:text-3xl font-medium text-white leading-relaxed neon-text transition-all">
            "{sentence}"
          </h2>
          <button 
            onClick={loadNewSentence}
            className="mt-6 text-pink-500 hover:text-pink-400 text-sm flex items-center justify-center gap-1 mx-auto"
          >
            <RotateCcw className="w-3 h-3" /> New Sentence
          </button>
        </div>

        <div className="flex justify-center mb-8">
          {!isRecording && !isAnalyzing && (
            <button 
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center justify-center transition-all hover:scale-110"
            >
              <Mic className="w-8 h-8" />
            </button>
          )}
          
          {isRecording && (
            <button 
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center animate-pulse"
            >
              <div className="w-8 h-8 bg-white rounded-sm" />
            </button>
          )}

          {isAnalyzing && (
             <div className="flex flex-col items-center gap-2 text-pink-400">
               <Loader className="w-10 h-10 animate-spin" />
               <span>Analyzing phonetics...</span>
             </div>
          )}
        </div>

        {feedback && (
           <div className="bg-slate-900/50 border border-pink-500/30 rounded-xl p-6 animate-float">
              <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-4">
                 <h3 className="text-lg font-bold text-white">Accent Feedback</h3>
                 <div className={`px-3 py-1 rounded-full text-sm font-bold border ${feedback.score > 70 ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'}`}>
                    Score: {feedback.score}/100
                 </div>
              </div>
              
              <div className="space-y-4">
                <div>
                   <p className="text-xs text-slate-500 uppercase font-bold mb-1">Coach's Analysis</p>
                   <p className="text-slate-300 text-sm leading-relaxed">{feedback.phonetics}</p>
                </div>
                <div className="bg-pink-900/20 p-3 rounded-lg border border-pink-500/20">
                   <p className="text-xs text-pink-300 uppercase font-bold mb-1 flex items-center gap-1">
                     <CheckCircle className="w-3 h-3" /> Quick Tip
                   </p>
                   <p className="text-slate-200 text-sm italic">"{feedback.advice}"</p>
                </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default AccentCoach;
