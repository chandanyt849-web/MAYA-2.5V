import React from 'react';
import { AssistantMode, ModeConfig } from '../types';
import { Sparkles, Code, Lightbulb, Atom, Heart } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: AssistantMode;
  onSelectMode: (mode: AssistantMode) => void;
  disabled?: boolean;
}

export const MODES: ModeConfig[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    icon: 'Sparkles',
    description: 'High-knowledge friendly general intelligence',
    gradient: 'from-indigo-500 to-cyan-500',
  },
  {
    id: 'code',
    label: 'Code & Tech',
    icon: 'Code',
    description: 'Full-stack engineering & architecture master',
    gradient: 'from-cyan-500 to-emerald-500',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    icon: 'Lightbulb',
    description: 'Co-founder strategy & creative ideation',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'stem',
    label: 'Deep STEM',
    icon: 'Atom',
    description: 'Physics, math, quantum & system logic',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'companion',
    label: 'Companion',
    icon: 'Heart',
    description: 'Warm, empathetic & motivational vibe',
    gradient: 'from-pink-500 to-rose-500',
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  disabled,
}) => {
  const getIcon = (id: AssistantMode) => {
    switch (id) {
      case 'code':
        return <Code className="w-3.5 h-3.5" />;
      case 'brainstorm':
        return <Lightbulb className="w-3.5 h-3.5" />;
      case 'stem':
        return <Atom className="w-3.5 h-3.5" />;
      case 'companion':
        return <Heart className="w-3.5 h-3.5" />;
      case 'balanced':
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-inner max-w-full overflow-x-auto no-scrollbar">
      {MODES.map((m) => {
        const isSelected = currentMode === m.id;
        return (
          <button
            key={m.id}
            disabled={disabled}
            onClick={() => onSelectMode(m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSelected
                ? 'bg-gradient-to-r ' + m.gradient + ' text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {getIcon(m.id)}
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};
