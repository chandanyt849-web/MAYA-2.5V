export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type AssistantMode = 'balanced' | 'code' | 'brainstorm' | 'stem' | 'companion';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  timestamp: Date;
  mode?: AssistantMode;
  audioDuration?: number;
}

export interface AssistantSettings {
  userName: string;
  userNickname: string;
  voice: 'Kore' | 'Aoede' | 'Zephyr';
  mode: AssistantMode;
  handsFree: boolean;
  soundEffects: boolean;
  voiceSpeed: number;
}

export interface ModeConfig {
  id: AssistantMode;
  label: string;
  icon: string;
  description: string;
  gradient: string;
}
