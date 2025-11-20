import React, { useState, useRef, useEffect } from 'react';
import { Sword, MessageSquare, RefreshCcw, Star, User, Bot, ArrowUpCircle } from 'lucide-react';
import { startRoleplaySession, RoleplayResponse } from '../services/gemini';

interface Message {
  role: 'user' | 'model';
  text: string;
  score?: number;
  feedback?: string;
}

const RoleplayDojo: React.FC = () => {
  const scenarios = [
    { id: 'coffee', title: 'Ordering Coffee', desc: 'You are at a busy NYC cafe. The barista is grumpy.', icon: '☕' },
    { id: 'interview', title: 'Job Interview', desc: 'Tech startup interview. Impress the CTO.', icon: '💼' },
    { id: 'doctor', title: 'Doctor Visit', desc: 'Explain your strange symptoms to a skeptical doctor.', icon: '🏥' },
    { id: 'police', title: 'Police Stop', desc: 'You were speeding. Talk your way out of a ticket.', icon: '🚔' },
  ];

  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const startScenario = async (scenarioTitle: string) => {
    setActiveScenario(scenarioTitle);
    setIsLoading(true);
    setMessages([]);
    setIsComplete(false);

    const res: RoleplayResponse = await startRoleplaySession(scenarioTitle, []);
    setMessages([{ role: 'model', text: res.aiMessage }]);
    setIsLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || isComplete) return;

    const userMsg: Message = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Build History for API
    // We filter out metadata (score/feedback) for the history array passed to Gemini
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
    // Add current user message to history context
    history.push({ role: 'user', parts: [{ text: userMsg.text }] });

    const res: RoleplayResponse = await startRoleplaySession(activeScenario!, history);
    
    const botMsg: Message = {
      role: 'model',
      text: res.aiMessage,
      score: res.score,
      feedback: res.feedback
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
    
    if (res.isComplete) {
      setIsComplete(true);
    }
  };

  const reset = () => {
    setActiveScenario(null);
    setMessages([]);
  };

  if (!activeScenario) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
             <Sword className="text-orange-500 w-10 h-10" /> Roleplay Dojo
          </h1>
          <p className="text-slate-400">Choose a scenario. Test your skills. Survive the conversation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => startScenario(s.title)}
              className="bg-surface border border-slate-700 hover:border-orange-500 p-8 rounded-2xl text-left transition-all hover:scale-[1.02] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400">{s.title}</h3>
              <p className="text-slate-400">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3">
           <div className="bg-orange-500/20 p-2 rounded-lg">
             <Sword className="w-6 h-6 text-orange-500" />
           </div>
           <div>
             <h2 className="text-white font-bold">{activeScenario}</h2>
             <span className="text-xs text-slate-400 uppercase tracking-wider">In Simulation</span>
           </div>
        </div>
        <button onClick={reset} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
          <RefreshCcw className="w-4 h-4" /> Exit
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide mb-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
              msg.role === 'model' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {msg.role === 'model' ? <Bot size={20} /> : <User size={20} />}
            </div>

            <div className="flex flex-col gap-2 max-w-[80%]">
              <div className={`p-5 rounded-2xl shadow-md ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-surface border border-slate-700 text-slate-200 rounded-tl-none'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* Feedback Panel (Only for AI messages) */}
              {msg.role === 'model' && msg.feedback && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 animate-float">
                   <div className="flex items-center gap-2 mb-1">
                      <Star className={`w-4 h-4 ${ (msg.score || 0) > 7 ? 'text-green-400' : 'text-yellow-400' }`} />
                      <span className={`text-xs font-bold uppercase ${ (msg.score || 0) > 7 ? 'text-green-400' : 'text-yellow-400' }`}>
                        Move Score: {msg.score}/10
                      </span>
                   </div>
                   <p className="text-xs text-slate-400 italic">"{msg.feedback}"</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-500 text-sm ml-14">
             <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
             <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-100"></div>
             <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-200"></div>
             <span>Roleplayer is thinking...</span>
          </div>
        )}
        
        {isComplete && (
           <div className="text-center py-8">
              <div className="inline-block bg-green-900/30 border border-green-500 text-green-400 px-6 py-2 rounded-full font-bold animate-pulse">
                 SCENARIO COMPLETE
              </div>
              <div className="mt-4">
                 <button onClick={reset} className="text-white underline hover:text-orange-400">Choose another Scenario</button>
              </div>
           </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your response..."
            className="w-full bg-surface border border-slate-700 rounded-full pl-6 pr-14 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:bg-slate-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            <ArrowUpCircle size={24} />
          </button>
        </form>
      )}
    </div>
  );
};

export default RoleplayDojo;