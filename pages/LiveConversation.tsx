import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, RefreshCw, Camera, Sparkles } from 'lucide-react';
import { useLiveSession } from '../hooks/useLiveSession';
import { generateRandomTopic } from '../services/gemini';

const LiveConversation: React.FC = () => {
  const { isConnected, isConnecting, connect, disconnect, volume, sendVideoFrame } = useLiveSession();
  const [topic, setTopic] = useState<string>("");
  const [loadingTopic, setLoadingTopic] = useState(false);
  
  // Call State
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // This is a UI state, real mute requires deeper stream manipulation in hook
  
  // Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Generate a default topic on mount
    handleTopicGen();
    
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopicGen = async () => {
    setLoadingTopic(true);
    const t = await generateRandomTopic("General Conversation");
    setTopic(t);
    setLoadingTopic(false);
  };

  // --- Video Handling ---

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Start sending frames
      intervalRef.current = window.setInterval(() => {
        captureAndSendFrame();
      }, 500); // Send frame every 500ms (2 FPS)
      
      setIsVideoEnabled(true);
    } catch (e) {
      console.error("Camera error:", e);
      alert("Could not access camera.");
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoEnabled(false);
  };

  const toggleVideo = () => {
    if (isVideoEnabled) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const captureAndSendFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isConnected) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Draw video to canvas
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Convert to base64
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6);
    const base64 = dataUrl.split(',')[1];
    
    // Send to Gemini
    sendVideoFrame(base64);
  };

  // Disconnect wrapper to also stop camera
  const handleEndCall = () => {
    stopCamera();
    disconnect();
  };

  // --- Rendering ---

  // 1. Pre-Call Setup Screen
  if (!isConnected && !isConnecting) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[600px]">
        <div className="bg-surface border border-slate-700 rounded-3xl p-8 w-full text-center shadow-2xl relative overflow-hidden">
           {/* Background Glow */}
           <div className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 w-64 h-64 bg-green-500/20 rounded-full blur-[80px] pointer-events-none"></div>
           
           <div className="relative z-10">
             <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center border border-slate-600 shadow-lg">
               <Phone className="w-8 h-8 text-green-400" />
             </div>
             
             <h1 className="text-3xl font-bold text-white mb-2">Start Conversation</h1>
             <p className="text-slate-400 mb-8">Real-time voice & video chat with AI.</p>

             {/* Topic Card */}
             <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 mb-8 max-w-md mx-auto">
               <p className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center justify-center gap-1">
                 <Sparkles className="w-3 h-3" /> Suggested Topic
               </p>
               {loadingTopic ? (
                 <div className="h-6 bg-slate-700/50 rounded w-2/3 mx-auto animate-pulse"></div>
               ) : (
                 <p className="text-white font-medium text-lg">"{topic}"</p>
               )}
               <button 
                 onClick={handleTopicGen}
                 className="mt-3 text-xs text-primary hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
               >
                 <RefreshCw className="w-3 h-3" /> Shuffle Topic
               </button>
             </div>

             <button 
               onClick={connect}
               className="bg-green-500 hover:bg-green-400 text-black font-bold text-xl py-4 px-12 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-105 transition-all duration-200 flex items-center gap-3 mx-auto"
             >
               <Phone className="w-6 h-6 fill-current" /> Call Gemini
             </button>
           </div>
        </div>
      </div>
    );
  }

  // 2. Active Call Screen
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col h-[100dvh] w-full">
      {/* Hidden Elements for Video Processing */}
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
      
      {/* Main Visual Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        
        {/* Video Layer */}
        {isVideoEnabled && (
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted 
             className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
           />
        )}

        {/* Avatar / Pulse Layer (Visible when video is off or transparent overlay) */}
        <div className={`relative z-10 flex flex-col items-center justify-center transition-all duration-500 ${isVideoEnabled ? 'scale-75 mt-auto mb-24 ml-auto mr-4' : ''}`}>
          {/* Connection Status Indicator */}
          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/50 backdrop-blur-sm w-full h-full">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-green-400 font-bold tracking-widest animate-pulse">CONNECTING...</p>
            </div>
          )}

          {!isConnecting && (
            <>
              {/* Pulse Animation based on Volume */}
              <div className={`relative flex items-center justify-center ${isVideoEnabled ? 'w-24 h-24' : 'w-64 h-64'}`}>
                  <div className={`absolute inset-0 bg-green-500 rounded-full mix-blend-screen filter blur-[40px] opacity-30 transition-all duration-100`}
                       style={{ transform: `scale(${1 + volume * 2})` }}>
                  </div>
                  <div className={`absolute inset-0 border-2 border-green-500/30 rounded-full animate-ping opacity-20`}></div>
                  
                  {/* Central Avatar */}
                  <div className={`bg-slate-900 border-2 border-green-500/50 rounded-full flex items-center justify-center shadow-2xl relative z-20 ${isVideoEnabled ? 'w-20 h-20' : 'w-48 h-48'}`}>
                    {isVideoEnabled ? (
                      <Camera className="text-green-500 w-8 h-8" />
                    ) : (
                      <Mic className="text-green-500 w-16 h-16" />
                    )}
                  </div>
              </div>

              {!isVideoEnabled && (
                <div className="mt-12 text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">Gemini Live</h2>
                  <p className="text-green-400 font-mono tracking-widest text-sm">{topic || "CONVERSATION"}</p>
                  <p className="text-slate-500 text-xs mt-2 animate-pulse">00:{String(Math.floor(Date.now() / 1000) % 60).padStart(2, '0')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-t border-slate-800 p-6 pb-8">
        <div className="max-w-lg mx-auto flex items-center justify-around">
           {/* Toggle Video */}
           <button 
             onClick={toggleVideo}
             className={`p-4 rounded-full transition-all duration-200 ${isVideoEnabled ? 'bg-white text-black' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
           >
             {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
           </button>

           {/* Toggle Mute (UI Only for demo, real mute would require track disabling) */}
           <button 
             onClick={() => setIsMuted(!isMuted)}
             className={`p-4 rounded-full transition-all duration-200 ${isMuted ? 'bg-white text-black' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
           >
             {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
           </button>

           {/* End Call */}
           <button 
             onClick={handleEndCall}
             className="p-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transform hover:scale-110 transition-all duration-200"
           >
             <PhoneOff className="w-8 h-8 fill-current" />
           </button>
        </div>
      </div>

    </div>
  );
};

export default LiveConversation;