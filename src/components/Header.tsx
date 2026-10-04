import React from 'react';
import { Sparkles, Sliders, MessageSquare, Radio, Sun } from 'lucide-react';
import { AssistantSettings } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenTranscript: () => void;
  onTriggerBriefing: () => void;
  messageCount: number;
  isLiveConnected: boolean;
  settings: AssistantSettings;
  disabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenTranscript,
  onTriggerBriefing,
  messageCount,
  isLiveConnected,
  settings,
  disabled,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl z-20">
      {/* Brand & Persona Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.35)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-pink-200 bg-clip-text text-transparent">
              MAYA
            </h1>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Chandan Edition
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-400"></span>
            Female English • {settings.voice}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Daily Briefing Quick Trigger */}
        <button
          onClick={onTriggerBriefing}
          disabled={disabled}
          title="Maya's Daily Briefing for Chandan"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Daily Briefing</span>
        </button>

        {/* Live Audio Status Indicator */}
        <div
          title={isLiveConnected ? 'Real-Time Gemini Live Connected' : 'High-Quality Audio-to-Audio Ready'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
            isLiveConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'animate-pulse text-emerald-400' : 'text-indigo-400'}`} />
          <span className="hidden md:inline">{isLiveConnected ? 'Live Audio' : 'Voice Pipeline'}</span>
        </div>

        {/* Conversation Logs Drawer Trigger */}
        <button
          onClick={onOpenTranscript}
          className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all active:scale-95"
          title="Open Conversation Transcripts"
        >
          <MessageSquare className="w-4 h-4" />
          {messageCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-pink-500 text-white shadow-sm">
              {messageCount}
            </span>
          )}
        </button>

        {/* Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all active:scale-95"
          title="Open Maya Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
