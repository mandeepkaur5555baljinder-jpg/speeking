import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/gemini';

const TutorChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello! I'm your AI English Tutor. Ask me about grammar, vocabulary, or just practice chatting!", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare history for API
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await sendChatMessage(history, userMsg.text);
    
    const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
              msg.role === 'model' ? 'bg-secondary text-black' : 'bg-slate-700 text-slate-300'
            }`}>
              {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
            </div>
            
            <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3 shadow-md ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-surface border border-slate-700 text-slate-200 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-secondary text-black flex items-center justify-center">
                <Bot size={16} />
             </div>
             <div className="bg-surface border border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
               <div className="flex gap-1">
                 <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-secondary rounded-full animate-bounce delay-100"></div>
                 <div className="w-2 h-2 bg-secondary rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-surface border-t border-slate-700 p-4">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-background text-white placeholder-slate-500 border border-slate-700 rounded-full px-6 py-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary text-white p-4 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TutorChat;