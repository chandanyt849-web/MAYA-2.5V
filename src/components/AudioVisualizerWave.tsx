import React from 'react';
import { AssistantState } from '../types';

interface AudioVisualizerWaveProps {
  state: AssistantState;
  volume: number; // 0 to 1
  barsCount?: number;
}

export const AudioVisualizerWave: React.FC<AudioVisualizerWaveProps> = ({
  state,
  volume,
  barsCount = 24,
}) => {
  const bars = Array.from({ length: barsCount }, (_, i) => {
    // Generate organic wave shape heights based on index and volume
    const distanceToCenter = Math.abs(i - barsCount / 2) / (barsCount / 2);
    const baseCurve = Math.cos(distanceToCenter * (Math.PI / 2));
    
    let heightPercent = 12;
    if (state === 'listening') {
      const wobble = Math.sin(Date.now() * 0.015 + i * 0.6) * 0.25 + 0.75;
      heightPercent = Math.max(12, Math.min(95, baseCurve * volume * 100 * wobble + 12));
    } else if (state === 'speaking') {
      const wobble = Math.sin(Date.now() * 0.02 + i * 0.8) * 0.35 + 0.65;
      heightPercent = Math.max(14, Math.min(100, baseCurve * (volume * 80 + 20) * wobble));
    } else if (state === 'thinking') {
      const wave = Math.sin(Date.now() * 0.008 + i * 0.5) * 0.5 + 0.5;
      heightPercent = 10 + wave * 30;
    } else {
      // Idle gentle subtle breathing
      const idleWave = Math.sin(Date.now() * 0.003 + i * 0.3) * 0.5 + 0.5;
      heightPercent = 8 + idleWave * 12;
    }

    return heightPercent;
  });

  const getBarColor = (index: number) => {
    if (state === 'listening') {
      return 'bg-gradient-to-t from-emerald-600 via-teal-400 to-cyan-300';
    } else if (state === 'speaking') {
      return 'bg-gradient-to-t from-purple-600 via-pink-500 to-rose-300';
    } else if (state === 'thinking') {
      return 'bg-gradient-to-t from-indigo-600 via-violet-400 to-fuchsia-300';
    }
    return 'bg-slate-700/60';
  };

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-12 px-4 py-2 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-inner">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-1 sm:w-1.5 rounded-full transition-all duration-75 ${getBarColor(i)}`}
          style={{
            height: `${height}%`,
            opacity: state === 'idle' ? 0.35 : 0.9,
          }}
        />
      ))}
    </div>
  );
};
