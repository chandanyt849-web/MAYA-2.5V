import { useState, useRef, useEffect, useCallback } from 'react';
import { AssistantState, AssistantSettings, ChatMessage, AssistantMode } from '../types';
import {
  playSfx,
  floatTo16BitPcmBase64,
  base64WavToBlobUrl,
  schedulePcmChunk,
} from '../utils/audioUtils';

export function useMayaVoice(settings: AssistantSettings) {
  const [state, setState] = useState<AssistantState>('idle');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  // References for live audio streaming & recording
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const pcmTimelineRef = useRef<{ nextStartTime: number; activeSources: AudioBufferSourceNode[] }>({
    nextStartTime: 0,
    activeSources: [],
  });
  const animFrameRef = useRef<number | null>(null);
  const liveAudioCtxRef = useRef<AudioContext | null>(null);

  // Stop currently playing voice
  const stopAudioPlayback = useCallback(() => {
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current = null;
    }
    // Stop PCM chunks
    if (pcmTimelineRef.current.activeSources.length > 0) {
      pcmTimelineRef.current.activeSources.forEach((src) => {
        try {
          src.stop();
        } catch (_) {}
      });
      pcmTimelineRef.current.activeSources = [];
      pcmTimelineRef.current.nextStartTime = 0;
    }
    setCurrentlyPlayingId(null);
  }, []);

  // Monitor audio volume level for visualizer
  const startVolumeTracking = useCallback((analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      // Normalize to 0 - 1
      const normalized = Math.min(1, Math.max(0, avg / 85));
      setVolumeLevel(normalized);
      animFrameRef.current = requestAnimationFrame(update);
    };
    update();
  }, []);

  const stopVolumeTracking = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setVolumeLevel(0);
  }, []);

  // Initialize Live WebSocket connection
  const connectLiveWs = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Gemini Live WebSocket open');
        setIsLiveConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'audio' && data.audio) {
            // Play streamed PCM chunk
            if (!liveAudioCtxRef.current) {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              liveAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
            }
            if (liveAudioCtxRef.current.state === 'suspended') {
              liveAudioCtxRef.current.resume();
            }
            setState('speaking');
            schedulePcmChunk(liveAudioCtxRef.current, data.audio, pcmTimelineRef.current);
          } else if (data.type === 'interrupted') {
            stopAudioPlayback();
            setState('idle');
          } else if (data.type === 'turnComplete') {
            setState('idle');
            if (settings.handsFree) {
              setTimeout(() => {
                startListening();
              }, 600);
            }
          }
        } catch (e) {
          console.error('Error handling WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsLiveConnected(false);
      };

      ws.onerror = (err) => {
        console.warn('WS error, using standard audio-to-audio pipeline:', err);
        setIsLiveConnected(false);
      };
    } catch (e) {
      console.warn('Could not establish WebSocket, fallback active:', e);
      setIsLiveConnected(false);
    }
  }, [settings.handsFree, stopAudioPlayback]);

  // Connect on mount
  useEffect(() => {
    connectLiveWs();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopAudioPlayback();
      stopVolumeTracking();
    };
  }, [connectLiveWs, stopAudioPlayback, stopVolumeTracking]);

  // Play audio file for a given message
  const playMessageAudio = useCallback(
    async (message: ChatMessage) => {
      stopAudioPlayback();
      if (!message.audioUrl) {
        // If message has no audioUrl yet, request TTS from server
        try {
          setState('thinking');
          const res = await fetch('/api/voice/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message.text, voice: settings.voice }),
          });
          const data = await res.json();
          if (data.audioBase64) {
            const url = base64WavToBlobUrl(data.audioBase64);
            message.audioUrl = url;
          }
        } catch (err) {
          console.error('TTS request error:', err);
          setState('idle');
          return;
        }
      }

      if (message.audioUrl) {
        const audio = new Audio(message.audioUrl);
        activeAudioElementRef.current = audio;
        setCurrentlyPlayingId(message.id);
        setState('speaking');

        // Setup audio analysis for volume
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          const source = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyser.connect(ctx.destination);
          startVolumeTracking(analyser);
        } catch (_) {}

        audio.onended = () => {
          stopVolumeTracking();
          setCurrentlyPlayingId(null);
          setState('idle');
          activeAudioElementRef.current = null;
        };

        audio.onerror = () => {
          stopVolumeTracking();
          setCurrentlyPlayingId(null);
          setState('idle');
          activeAudioElementRef.current = null;
        };

        audio.play().catch((e) => {
          console.warn('Audio play error (user interaction might be needed):', e);
          setState('idle');
          setCurrentlyPlayingId(null);
        });
      }
    },
    [settings.voice, startVolumeTracking, stopAudioPlayback, stopVolumeTracking]
  );

  // Send request to server for processing audio or text
  const sendToMaya = useCallback(
    async ({
      prompt,
      audioBlob,
      mode = settings.mode,
    }: {
      prompt?: string;
      audioBlob?: Blob;
      mode?: AssistantMode;
    }) => {
      setState('thinking');

      let audioBase64: string | undefined;
      let audioMime: string | undefined;

      if (audioBlob) {
        audioMime = audioBlob.type || 'audio/webm';
        const buffer = await audioBlob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        audioBase64 = btoa(binary);
      }

      // Add user message to UI
      const userMsgId = 'user_' + Date.now();
      const userText = prompt || (audioBlob ? '🎙️ [Spoken audio message]' : '');
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        text: userText,
        timestamp: new Date(),
        mode,
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await fetch('/api/voice/interact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: audioBase64,
            audioMime,
            prompt,
            mode,
            history: messages.slice(-8), // Send recent context
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from Maya');
        }

        const data = await response.json();
        let audioUrl: string | undefined;

        if (data.audioBase64) {
          audioUrl = base64WavToBlobUrl(data.audioBase64);
        }

        const assistantMsg: ChatMessage = {
          id: 'maya_' + Date.now(),
          role: 'assistant',
          text: data.text,
          audioUrl,
          timestamp: new Date(),
          mode,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-play Maya's voice response
        if (audioUrl) {
          if (settings.soundEffects) {
            playSfx('chime');
          }
          await playMessageAudio(assistantMsg);
        } else {
          setState('idle');
        }
      } catch (err: any) {
        console.error('Error talking to Maya:', err);
        const errorMsg: ChatMessage = {
          id: 'error_' + Date.now(),
          role: 'assistant',
          text: `I ran into an issue processing that: ${err?.message || 'Server error'}. Please try again, Chandan!`,
          timestamp: new Date(),
          mode,
        };
        setMessages((prev) => [...prev, errorMsg]);
        setState('idle');
      }
    },
    [messages, playMessageAudio, settings.mode, settings.soundEffects]
  );

  // Start recording from user mic
  const startListening = useCallback(async () => {
    // If currently speaking, interrupt
    stopAudioPlayback();

    try {
      if (settings.soundEffects) {
        playSfx('start_listen');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      startVolumeTracking(analyser);

      // Setup MediaRecorder for standard turn-based audio-to-audio
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);

      // Also support ScriptProcessor for Live WebSocket if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        source.connect(processor);
        processor.connect(ctx.destination);

        processor.onaudioprocess = (e) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const channel = e.inputBuffer.getChannelData(0);
            const base64 = floatTo16BitPcmBase64(channel);
            wsRef.current.send(JSON.stringify({ type: 'audio', audio: base64 }));
          }
        };
      }

      setState('listening');
    } catch (err: any) {
      console.error('Error starting microphone:', err);
      alert('Microphone access was denied or is not available. Please allow mic permissions.');
      setState('idle');
    }
  }, [settings.soundEffects, startVolumeTracking, stopAudioPlayback]);

  // Stop recording user mic and send audio to Maya
  const stopListening = useCallback(() => {
    if (state !== 'listening') return;

    if (settings.soundEffects) {
      playSfx('stop_listen');
    }

    stopVolumeTracking();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
        processorRef.current = null;
      } catch (_) {}
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
        audioContextRef.current = null;
      } catch (_) {}
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (audioBlob.size > 500) {
          sendToMaya({ audioBlob });
        } else {
          setState('idle');
        }
      };
      recorder.stop();
    } else {
      setState('idle');
    }
  }, [sendToMaya, settings.soundEffects, state, stopVolumeTracking]);

  // Toggle listening button
  const toggleListening = useCallback(() => {
    if (state === 'listening') {
      stopListening();
    } else if (state === 'speaking') {
      stopAudioPlayback();
      setState('idle');
    } else {
      startListening();
    }
  }, [startListening, state, stopAudioPlayback, stopListening]);

  // Fetch daily morning briefing
  const triggerBriefing = useCallback(async () => {
    stopAudioPlayback();
    setState('thinking');
    if (settings.soundEffects) {
      playSfx('connect');
    }

    try {
      const res = await fetch('/api/briefing');
      const data = await res.json();

      let audioUrl: string | undefined;
      if (data.audioBase64) {
        audioUrl = base64WavToBlobUrl(data.audioBase64);
      }

      const msg: ChatMessage = {
        id: 'briefing_' + Date.now(),
        role: 'assistant',
        text: data.text,
        audioUrl,
        timestamp: new Date(),
        mode: 'balanced',
      };

      setMessages((prev) => [...prev, msg]);

      if (audioUrl) {
        await playMessageAudio(msg);
      } else {
        setState('idle');
      }
    } catch (err) {
      console.error('Failed briefing:', err);
      setState('idle');
    }
  }, [playMessageAudio, settings.soundEffects, stopAudioPlayback]);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    stopAudioPlayback();
    setMessages([]);
    if (settings.soundEffects) {
      playSfx('pop');
    }
  }, [settings.soundEffects, stopAudioPlayback]);

  return {
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
  };
}
