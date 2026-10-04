// Utility functions for audio capture, playback, and synthesis

let sfxAudioContext: AudioContext | null = null;

function getSfxContext(): AudioContext {
  if (!sfxAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sfxAudioContext = new AudioContextClass();
  }
  if (sfxAudioContext.state === 'suspended') {
    sfxAudioContext.resume();
  }
  return sfxAudioContext;
}

/**
 * High-tech subtle sound effects using Web Audio API synthesis
 */
export function playSfx(type: 'connect' | 'start_listen' | 'stop_listen' | 'chime' | 'pop') {
  try {
    const ctx = getSfxContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'connect') {
      // Futuristic ascending chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'start_listen') {
      // Soft high ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.08);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'stop_listen') {
      // Subtle down tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'chime') {
      // Harmonic warmth chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (err) {
    console.debug('SFX audio error:', err);
  }
}

/**
 * Converts Float32 channel data from mic input (e.g. 16kHz) to 16-bit PCM little-endian Base64
 */
export function floatTo16BitPcmBase64(input: Float32Array): string {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(output.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 WAV data into a Blob URL
 */
export function base64WavToBlobUrl(base64: string): string {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Plays a 24kHz raw PCM chunk seamlessly via AudioContext
 */
export function schedulePcmChunk(
  audioCtx: AudioContext,
  base64Pcm: string,
  timelineRef: { nextStartTime: number; activeSources: AudioBufferSourceNode[] }
) {
  try {
    const binary = atob(base64Pcm);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    const currentTime = audioCtx.currentTime;
    const startTime = Math.max(currentTime, timelineRef.nextStartTime);
    source.start(startTime);
    timelineRef.nextStartTime = startTime + audioBuffer.duration;

    timelineRef.activeSources.push(source);
    source.onended = () => {
      const idx = timelineRef.activeSources.indexOf(source);
      if (idx !== -1) timelineRef.activeSources.splice(idx, 1);
    };
  } catch (err) {
    console.error('Error scheduling PCM chunk:', err);
  }
}
