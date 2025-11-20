import React from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1 roughly
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume }) => {
  // Create 5 bars
  const bars = Array.from({ length: 5 });
  
  return (
    <div className="flex items-center justify-center gap-1.5 h-12 w-24">
      {bars.map((_, i) => {
        // Calculate dynamic height based on volume and index for a wave effect
        const baseHeight = 20;
        const randomVar = isActive ? Math.random() * 30 : 0;
        const dynamicHeight = isActive ? Math.min(100, baseHeight + (volume * 200) + randomVar) : 10;
        
        return (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-75 ease-in-out shadow-[0_0_10px_rgba(6,182,212,0.5)] ${isActive ? 'bg-secondary' : 'bg-slate-700'}`}
            style={{ height: `${dynamicHeight}%` }}
          />
        );
      })}
    </div>
  );
};

export default AudioVisualizer;