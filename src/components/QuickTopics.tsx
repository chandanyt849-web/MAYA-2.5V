import React from 'react';
import { Sparkles, Terminal, Lightbulb, Atom, Flame, MessageCircleHeart } from 'lucide-react';
import { AssistantMode } from '../types';

interface QuickTopicsProps {
  onSelectTopic: (prompt: string, mode?: AssistantMode) => void;
  disabled?: boolean;
}

export const QuickTopics: React.FC<QuickTopicsProps> = ({ onSelectTopic, disabled }) => {
  const topics = [
    {
      label: 'Morning Briefing',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      prompt: "Good morning Maya! What is my daily briefing, tech spark, and top inspiration for today?",
      mode: 'balanced' as AssistantMode,
      color: 'hover:border-amber-500/40 hover:bg-amber-500/10',
    },
    {
      label: 'Full-Stack Architecture',
      icon: <Terminal className="w-3.5 h-3.5 text-cyan-400" />,
      prompt: "Maya, help me review best architectural patterns for scalable full-stack TypeScript applications with real-time features.",
      mode: 'code' as AssistantMode,
      color: 'hover:border-cyan-500/40 hover:bg-cyan-500/10',
    },
    {
      label: 'Startup Brainstorm',
      icon: <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />,
      prompt: "Let's brainstorm 3 high-leverage AI product ideas with defensible moats that I can build right now.",
      mode: 'brainstorm' as AssistantMode,
      color: 'hover:border-emerald-500/40 hover:bg-emerald-500/10',
    },
    {
      label: 'Quantum & Deep Tech',
      icon: <Atom className="w-3.5 h-3.5 text-purple-400" />,
      prompt: "Maya, give me a deep yet intuitive breakdown of quantum entanglement and quantum computing superposition.",
      mode: 'stem' as AssistantMode,
      color: 'hover:border-purple-500/40 hover:bg-purple-500/10',
    },
    {
      label: 'Motivation Sparks',
      icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
      prompt: "Maya, give me a high-octane motivational pep talk to conquer my coding goals today!",
      mode: 'companion' as AssistantMode,
      color: 'hover:border-rose-500/40 hover:bg-rose-500/10',
    },
    {
      label: 'Casual Chat',
      icon: <MessageCircleHeart className="w-3.5 h-3.5 text-pink-400" />,
      prompt: "Hey Maya, how are you doing? Tell me what you've been pondering about recently.",
      mode: 'companion' as AssistantMode,
      color: 'hover:border-pink-500/40 hover:bg-pink-500/10',
    },
  ];

  return (
    <div className="w-full max-w-2xl px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Chandan's Quick Topics
        </span>
        <span className="text-[10px] text-slate-500">Tap to ask Maya directly</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {topics.map((t, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectTopic(t.prompt, t.mode)}
            className={`flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left transition-all duration-200 text-xs text-slate-300 font-medium active:scale-[0.98] ${t.color} disabled:opacity-50 disabled:cursor-not-allowed group`}
          >
            <div className="p-1 rounded-lg bg-slate-800/60 group-hover:scale-110 transition-transform">
              {t.icon}
            </div>
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
