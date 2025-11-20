import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Mic, MessageCircle, Timer, BarChart, Sword, Sparkles, RefreshCw, Globe } from 'lucide-react';
import { generateDailyIdiom, IdiomData } from '../services/gemini';

const Dashboard: React.FC = () => {
  const [idiom, setIdiom] = useState<IdiomData | null>(null);

  useEffect(() => {
    const fetchIdiom = async () => {
      const data = await generateDailyIdiom();
      setIdiom(data);
    };
    fetchIdiom();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-secondary/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="text-center mb-16 relative z-10">
        <span className="inline-block py-1 px-3 rounded-full bg-surfaceHighlight border border-slate-600 text-secondary text-xs font-bold tracking-wider mb-4">
          POWERED BY GEMINI 2.5
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
          Level Up Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary neon-text">English</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Immersive AI-powered tools to boost your reading speed, speaking confidence, and vocabulary.
        </p>
      </div>

      {/* Idiom Widget */}
      <div className="mb-12 relative z-10 max-w-2xl mx-auto">
         <div className="bg-slate-900/80 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 neon-box relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-orange-500"></div>
             <div className="flex items-start justify-between">
               <div>
                 <h4 className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                   <Sparkles className="w-3 h-3" /> Daily Idiom
                 </h4>
                 {idiom ? (
                   <>
                     <h3 className="text-2xl font-bold text-white mb-1">"{idiom.idiom}"</h3>
                     <p className="text-slate-400 text-sm italic mb-3">{idiom.meaning}</p>
                     <p className="text-slate-300 text-sm border-l-2 border-slate-700 pl-3">
                       Ex: {idiom.example}
                     </p>
                   </>
                 ) : (
                   <div className="flex items-center gap-2 text-slate-500 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading daily wisdom...
                   </div>
                 )}
               </div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Accent Coach (New) */}
        <Link to="/accent" className="block bg-surface border border-slate-700 rounded-2xl p-6 hover:border-pink-500 transition-colors duration-300 group relative overflow-hidden text-left">
           <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
           <div className="relative z-10">
             <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4 text-pink-500 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Accent Coach</h3>
             <p className="text-slate-400 text-sm mb-6">
               Perfect your Australian accent. Read difficult sentences and get AI analysis on your vowels.
             </p>
             <div className="flex items-center text-pink-500 font-semibold text-sm group-hover:gap-2 transition-all">
               Start Training <ArrowRight className="w-4 h-4 ml-1" />
             </div>
           </div>
        </Link>

        {/* Drills Card */}
        <Link to="/drills" className="block bg-surface border border-slate-700 rounded-2xl p-6 hover:border-secondary transition-colors duration-300 group relative overflow-hidden text-left">
           <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
           <div className="relative z-10">
             <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4 text-secondary group-hover:scale-110 transition-transform">
                <Timer className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Rapid Drills</h3>
             <p className="text-slate-400 text-sm mb-6">
               60-second speaking challenges with random topics to force your brain to think faster.
             </p>
             <div className="flex items-center text-secondary font-semibold text-sm group-hover:gap-2 transition-all">
               Start Challenge <ArrowRight className="w-4 h-4 ml-1" />
             </div>
           </div>
        </Link>

        {/* Roleplay Card */}
        <Link to="/roleplay" className="block bg-surface border border-slate-700 rounded-2xl p-6 hover:border-orange-500 transition-colors duration-300 group relative overflow-hidden text-left">
           <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
           <div className="relative z-10">
             <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4 text-orange-500 group-hover:scale-110 transition-transform">
                <Sword className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Roleplay Dojo</h3>
             <p className="text-slate-400 text-sm mb-6">
               Simulate real-world scenarios like interviews or travel. Gamified interaction with scoring.
             </p>
             <div className="flex items-center text-orange-500 font-semibold text-sm group-hover:gap-2 transition-all">
               Enter Arena <ArrowRight className="w-4 h-4 ml-1" />
             </div>
           </div>
        </Link>

        {/* Live Conversation Card */}
        <Link to="/live-speak" className="block bg-surface border border-slate-700 rounded-2xl p-6 hover:border-green-500 transition-colors duration-300 group relative overflow-hidden text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 text-green-500 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Voice</h3>
            <p className="text-slate-400 text-sm mb-6">
               Real-time, low-latency voice chat with Gemini 2.5. Like a phone call with a tutor.
            </p>
            <div className="flex items-center text-green-500 font-semibold text-sm group-hover:gap-2 transition-all">
              Start Talking <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>

        {/* Speed Reading Card */}
        <Link to="/speed-read" className="block bg-surface border border-slate-700 rounded-2xl p-6 hover:border-primary transition-colors duration-300 group relative overflow-hidden text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                <BarChart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Speed Reader</h3>
            <p className="text-slate-400 text-sm mb-6">
               Train with AI passages. Measure WPM and listen to native pronunciation.
            </p>
            <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all">
              Practice Reading <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>

        {/* AI Tutor Card */}
        <Link to="/tutor" className="block bg-surface border border-slate-700 rounded-2xl p-6 hover:border-purple-500 transition-colors duration-300 group relative overflow-hidden text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-500 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tutor Chat</h3>
            <p className="text-slate-400 text-sm mb-6">
               Text-based chat for grammar corrections and deep explanations using Gemini 3 Pro.
            </p>
            <div className="flex items-center text-purple-500 font-semibold text-sm group-hover:gap-2 transition-all">
              Ask Questions <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
};

export default Dashboard;
