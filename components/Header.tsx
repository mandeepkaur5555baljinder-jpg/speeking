import React from 'react';
import { NavLink } from 'react-router-dom';
import { Zap, BookOpen, MessageCircle, Mic, Menu, X, Timer, Sword, Globe } from 'lucide-react';
import { useState } from 'react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Hub', icon: <Zap className="w-5 h-5" /> },
    { path: '/speed-read', label: 'Read', icon: <BookOpen className="w-5 h-5" /> },
    { path: '/live-speak', label: 'Live', icon: <Mic className="w-5 h-5" /> },
    { path: '/drills', label: 'Drills', icon: <Timer className="w-5 h-5" /> },
    { path: '/roleplay', label: 'Dojo', icon: <Sword className="w-5 h-5" /> },
    { path: '/accent', label: 'Accent', icon: <Globe className="w-5 h-5" /> },
    { path: '/tutor', label: 'Tutor', icon: <MessageCircle className="w-5 h-5" /> },
  ];

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-surfaceHighlight sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary to-blue-600 rounded-lg p-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                 <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight neon-text">SpeedSpeak AI</span>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-1 items-center">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-surfaceHighlight shadow-inner border border-slate-600'
                      : 'text-slate-400 hover:text-white hover:bg-surfaceHighlight/50'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-surfaceHighlight focus:outline-none"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden bg-surface border-b border-surfaceHighlight">
          <div className="pt-2 pb-3 space-y-1 px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 block px-3 py-4 rounded-md text-base font-medium ${
                    isActive
                      ? 'text-white bg-surfaceHighlight'
                      : 'text-slate-400 hover:text-white hover:bg-surfaceHighlight/50'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
