/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MayaOrb } from './components/MayaOrb';
import { AudioVisualizerWave } from './components/AudioVisualizerWave';
import { ModeSelector } from './components/ModeSelector';
import { QuickTopics } from './components/QuickTopics';
import { CommandInputBar } from './components/CommandInputBar';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { SettingsModal } from './components/SettingsModal';
import { useMayaVoice } from './hooks/useMayaVoice';
import { AssistantSettings, AssistantMode } from './types';
import { Sparkles, Volume2, ShieldCheck, Cpu } from 'lucide-react';

const DEFAULT_SETTINGS: AssistantSettings = {
  userName: 'Chandan',
  userNickname: 'Chandan',
  voice: 'Kore',
  mode: 'balanced',
  handsFree: false,
  soundEffects: true,
  voiceSpeed: 1.0,
};

export default function App() {
  const [settings, setSettings] = useState<AssistantSettings>(() => {
    try {
      const saved = localStorage.getItem('maya_assistant_settings');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_SETTINGS;
  });

  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maya_assistant_settings', JSON.stringify(settings));
    } catch (_) {}
  }, [settings]);

  const {
    state,
    volumeLevel,
    messages,
    isLiveConnected,
    currentlyPlayingId,
    startListening,
    stopListening,
    toggleListening,
    sendToMaya,
    playMessageAudio,
    stopAudioPlayback,
    triggerBriefing,
    clearHistory,
  } = useMayaVoice(settings);

  // Update specific settings
  const handleUpdateSettings = (newSettings: Partial<AssistantSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Switch assistant mode
  const handleSelectMode = (mode: AssistantMode) => {
    handleUpdateSettings({ mode });
  };

  // Handle Quick Topic click
  const handleSelectTopic = (prompt: string, mode?: AssistantMode) => {
    const targetMode = mode || settings.mode;
    if (mode && mode !== settings.mode) {
      handleUpdateSettings({ mode });
    }
    sendToMaya({ prompt, mode: targetMode });
  };

  // Keyboard shortcut: Spacebar to toggle listening when not typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (e.code === 'Space' && !isInput && !isSettingsOpen && !isTranscriptOpen) {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isTranscriptOpen, toggleListening]);

  // Latest message from assistant
  const latestAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="min-h-screen bg-radial-vignette flex flex-col justify-between text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[380px] h-[380px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTranscript={() => setIsTranscriptOpen(true)}
        onTriggerBriefing={triggerBriefing}
        messageCount={messages.length}
        isLiveConnected={isLiveConnected}
        settings={settings}
        disabled={state === 'thinking'}
      />

      {/* Main Core Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-4 max-w-4xl mx-auto w-full z-10">
        {/* Mode Selector Capsule */}
        <div className="mb-2 sm:mb-4">
          <ModeSelector
            currentMode={settings.mode}
            onSelectMode={handleSelectMode}
            disabled={state === 'thinking'}
          />
        </div>

        {/* Central Maya Quantum Orb */}
        <div className="relative">
          <MayaOrb
            state={state}
            volumeLevel={volumeLevel}
            onOrbClick={toggleListening}
          />
        </div>

        {/* Real-time Frequency Waveform Bars */}
        <div className="mt-1 mb-3">
          <AudioVisualizerWave state={state} volume={volumeLevel} />
        </div>

        {/* Live Spoken Speech Display Card (Highlights Maya's voice in real-time) */}
        {latestAssistantMessage && (
          <div className="w-full max-w-xl mb-3 px-4 py-3 bg-slate-900/70 border border-slate-800/90 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-pink-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Maya to {settings.userNickname}
              </span>
              <button
                onClick={() => playMessageAudio(latestAssistantMessage)}
                className="text-[11px] text-slate-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
                title="Replay Voice"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 line-clamp-3 leading-relaxed">
              {latestAssistantMessage.text}
            </p>
          </div>
        )}

        {/* Quick Topics Grid for Chandan */}
        <div className="w-full flex justify-center">
          <QuickTopics
            onSelectTopic={handleSelectTopic}
            disabled={state === 'thinking'}
          />
        </div>
      </main>

      {/* Bottom Command Bar Area */}
      <footer className="w-full pb-5 pt-2 px-4 flex flex-col items-center gap-2 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20">
        <CommandInputBar
          onSendMessage={(text) => sendToMaya({ prompt: text })}
          state={state}
          onToggleVoice={toggleListening}
          disabled={state === 'thinking'}
        />

        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
          <span className="hidden sm:inline">Spacebar to speak</span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-400" />
            Gemini Audio Architecture
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Private to Chandan
          </span>
        </div>
      </footer>

      {/* Conversation Logs Drawer */}
      <TranscriptDrawer
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
        messages={messages}
        onPlayAudio={playMessageAudio}
        currentlyPlayingId={currentlyPlayingId}
        onClearHistory={clearHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
