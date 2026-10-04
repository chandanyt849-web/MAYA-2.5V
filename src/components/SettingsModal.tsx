import React from 'react';
import { AssistantSettings } from '../types';
import { X, Sliders, Volume2, Mic, User, Sparkles, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: Partial<AssistantSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Maya Settings</h3>
              <p className="text-[11px] text-slate-400">Personalize Chandan's voice experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Maya Voice Profile */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Female English Voice Profile</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Kore', name: 'Maya • Kore', desc: 'Warm, clear, intelligent female voice (Default)' },
                { id: 'Aoede', name: 'Maya • Aoede', desc: 'Breezy, lively, cheerful tone' },
              ].map((v) => {
                const isSelected = settings.voice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onUpdateSettings({ voice: v.id as any })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-pink-500/15 border-pink-500/40 text-white shadow-sm'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{v.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-pink-400" />}
                    </div>
                    <p className="text-[10px] leading-tight text-slate-400">{v.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Address Style */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>How Maya Addresses You</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Chandan', 'Boss', 'Chandan Sir'].map((title) => {
                const isSelected = settings.userNickname === title;
                return (
                  <button
                    key={title}
                    onClick={() => onUpdateSettings({ userNickname: title })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hands-Free Mode Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hands-Free Auto Detection</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automatically listen again after Maya finishes speaking
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ handsFree: !settings.handsFree })}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                settings.handsFree ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.handsFree ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Futuristic Audio SFX Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Futuristic Sound Effects</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Subtle connection chimes & activation pings
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ soundEffects: !settings.soundEffects })}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                settings.soundEffects ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundEffects ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-colors"
          >
            Save & Done
          </button>
        </div>
      </div>
    </div>
  );
};
