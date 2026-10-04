import React, { useState } from 'react';
import { ChatMessage, AssistantMode } from '../types';
import {
  X,
  Volume2,
  Copy,
  Check,
  Trash2,
  MessageSquare,
  Sparkles,
  Bot,
  User,
  Search,
} from 'lucide-react';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onPlayAudio: (message: ChatMessage) => void;
  currentlyPlayingId: string | null;
  onClearHistory: () => void;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onPlayAudio,
  currentlyPlayingId,
  onClearHistory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMessages = messages.filter((m) =>
    m.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-lg h-full bg-slate-950/95 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-[0_0_12px_rgba(236,72,153,0.3)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Chandan & Maya Logs
              </h2>
              <p className="text-[11px] text-slate-400">
                {messages.length} conversation {messages.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                onClick={onClearHistory}
                title="Clear conversation logs"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {messages.length > 3 && (
          <div className="px-5 py-2.5 border-b border-slate-800/60 bg-slate-900/30">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search knowledge logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-3 border border-slate-800">
                <MessageSquare className="w-6 h-6 text-indigo-400/60" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No transcripts yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Speak with Maya or select a quick topic to start generating insights.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              const isPlaying = currentlyPlayingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isAssistant ? 'items-start' : 'items-end'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                    {isAssistant ? (
                      <>
                        <Bot className="w-3.5 h-3.5 text-pink-400" />
                        <span className="font-semibold text-pink-300">Maya</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-indigo-300">Chandan</span>
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                      </>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md backdrop-blur-md ${
                      isAssistant
                        ? 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm'
                        : 'bg-indigo-600 text-white rounded-tr-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                    {/* Action Footer for Assistant Messages */}
                    {isAssistant && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onPlayAudio(msg)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              isPlaying
                                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                            <span>{isPlaying ? 'Playing...' : 'Play Voice'}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors p-1"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
