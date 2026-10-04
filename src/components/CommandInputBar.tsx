import React, { useState } from 'react';
import { Send, Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { AssistantState } from '../types';

interface CommandInputBarProps {
  onSendMessage: (text: string) => void;
  state: AssistantState;
  onToggleVoice: () => void;
  disabled?: boolean;
}

export const CommandInputBar: React.FC<CommandInputBarProps> = ({
  onSendMessage,
  state,
  onToggleVoice,
  disabled,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl flex items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl focus-within:border-indigo-500/70 transition-all"
    >
      {/* Big Mic / Voice Action Button */}
      <button
        type="button"
        onClick={onToggleVoice}
        disabled={disabled}
        aria-label={isListening ? 'Stop listening' : 'Start speaking'}
        className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
          isListening
            ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse'
            : isSpeaking
            ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]'
            : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-md hover:scale-105 active:scale-95'
        }`}
      >
        {isListening ? (
          <MicOff className="w-5 h-5 animate-pulse" />
        ) : isSpeaking ? (
          <Volume2 className="w-5 h-5 animate-bounce" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Text Input for typing queries */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          isListening
            ? 'Listening to Chandan...'
            : isSpeaking
            ? 'Maya is speaking... Type or tap mic to interrupt'
            : 'Ask Maya anything (code, ideas, science)...'
        }
        disabled={disabled || isListening}
        className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-60"
      />

      {/* Send Button */}
      <button
        type="submit"
        disabled={!input.trim() || disabled || isListening}
        className="p-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 disabled:bg-transparent text-slate-400 hover:text-white disabled:text-slate-600 transition-all"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
