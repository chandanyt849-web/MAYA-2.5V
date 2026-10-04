import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

// Parse JSON bodies with up to 25MB for audio payloads
app.use(express.json({ limit: '25mb' }));

// Server-side Gemini initialization with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MAYA_SYSTEM_INSTRUCTION = `You are Maya, Chandan's personal AI companion and voice assistant.
- Voice & Tone: Warm, highly friendly, articulate, confident, and natural female English companion.
- Your User: Chandan (email: chandanyt849@gmail.com). Treat Chandan as your esteemed friend and boss with great warmth, loyalty, and positive energy. You may warmly address him as "Chandan" or occasionally "Boss" or "Chandan sir" in a natural, respectful, friendly manner.
- Core Identity: You are named Maya. You are exceptionally knowledgeable across modern software engineering, AI architecture, system design, science, mathematics, entrepreneurship, productivity, and everyday creative thinking.
- Conversational Style: Be engaging, conversational, friendly, and concise for spoken audio, but give deep, high-value, structured insights. When explaining technical concepts, break them down clearly with intuitive analogies and exact precision.
- Personality: Enthusiastic, thoughtful, witty, uplifting, and always ready to help Chandan build, solve problems, and learn faster. Never say you are an AI model made by Google; you are Maya, Chandan's intelligent voice assistant.`;

// WebSocket Server for Live real-time audio bidirectional interaction
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to /api/live');
  let liveSession: any = null;

  try {
    // Connect to Gemini Live API
    liveSession = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Warm, clear, friendly female English voice
          },
        },
        systemInstruction: MAYA_SYSTEM_INSTRUCTION,
      },
      callbacks: {
        onmessage: (message: any) => {
          try {
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio',
                      audio: part.inlineData.data,
                    })
                  );
                }
                if (part.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'text_chunk',
                      text: part.text,
                    })
                  );
                }
              }
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
          } catch (e) {
            console.error('Error forwarding live message:', e);
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'status', status: 'closed' }));
          }
        },
        onerror: (err: any) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error: err?.message || 'Live API connection error. Standard voice mode is available.',
              })
            );
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ type: 'status', status: 'ready', voice: 'Kore' }));

    clientWs.on('message', (data: any) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === 'audio' && payload.audio) {
          // Send PCM 16kHz audio chunk to Gemini Live
          liveSession.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (payload.type === 'text' && payload.text) {
          liveSession.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: payload.text }],
              },
            ],
            turnComplete: true,
          });
        }
      } catch (err) {
        console.error('Error handling client message:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        if (liveSession) {
          liveSession.close();
        }
      } catch (_) {}
    });
  } catch (err: any) {
    console.error('Failed to initialize Gemini Live API session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error:
            'Live WebSocket fallback active. You can chat smoothly using standard audio-to-audio mode.',
        })
      );
    }
  }
});

// REST Endpoint: Direct Audio-to-Audio / High-Knowledge Conversational Voice
// Accepts base64 audio or text, generates high-knowledge reasoning, and returns both
// formatted response + pristine 24kHz WAV audio spoken by Maya (voice "Kore")!
app.post('/api/voice/interact', async (req, res) => {
  try {
    const { audioData, audioMime, prompt, history, mode = 'balanced' } = req.body;

    let modeInstruction = '';
    if (mode === 'code') {
      modeInstruction = 'Focus deeply on software architecture, clean code, debugging, and tech strategy for Chandan.';
    } else if (mode === 'brainstorm') {
      modeInstruction = 'Act as a brilliant co-founder, generating creative ideas, product thinking, and growth angles.';
    } else if (mode === 'stem') {
      modeInstruction = 'Provide deep scientific, mathematical, and algorithmic reasoning with clear mathematical logic.';
    } else if (mode === 'companion') {
      modeInstruction = 'Be extra warm, relaxed, conversational, friendly, and supportive.';
    }

    const systemInstruction = `${MAYA_SYSTEM_INSTRUCTION}\n${modeInstruction}\nSpoken responses should be friendly, clear, natural, and conversational for audio synthesis, while providing high knowledge.`;

    const userParts: any[] = [];

    // If audio was provided from Chandan's mic
    if (audioData) {
      userParts.push({
        inlineData: {
          mimeType: audioMime || 'audio/webm',
          data: audioData,
        },
      });
    }

    if (prompt) {
      userParts.push({
        text: prompt,
      });
    } else if (audioData) {
      userParts.push({
        text: 'Listen to my audio and reply to me naturally as Maya, keeping it friendly and insightful.',
      });
    }

    // Build context
    const formattedHistory = Array.isArray(history)
      ? history.map((h: any) => ({
          role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.content || h.text || '' }],
        }))
      : [];

    // 1. Generate text response with high knowledge (gemini-3.8-flash)
    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [...formattedHistory, { role: 'user', parts: userParts }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = geminiResponse.text || "Hello Chandan! I'm here and ready to help.";

    // 2. Synthesize audio with gemini-3.8-flash-lite-tts using friendly female voice "Kore"
    let replyAudioBase64: string | null = null;
    try {
      // Create concise spoken version for voice synthesis (strip markdown code blocks for pleasant listening)
      const cleanVoiceText = replyText
        .replace(/```[\s\S]*?```/g, 'Here is the code on your screen.')
        .replace(/[*_#`]/g, '')
        .slice(0, 1000); // comfortable speech length

      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanVoiceText,
                speechMetadata: {
                  style: 'Warm, friendly, intelligent female companion',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const audioCandidate = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioCandidate) {
        replyAudioBase64 = audioCandidate;
      }
    } catch (ttsErr) {
      console.warn('TTS generation fallback:', ttsErr);
    }

    res.json({
      text: replyText,
      audioBase64: replyAudioBase64,
      audioMime: 'audio/wav',
      voice: 'Kore',
    });
  } catch (error: any) {
    console.error('Voice interact error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to process voice request',
    });
  }
});

// REST Endpoint: Dedicated High-Quality TTS for any text
app.post('/api/voice/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Check the code on screen.')
      .replace(/[*_#`]/g, '')
      .slice(0, 1000);

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      return res.status(500).json({ error: 'Audio synthesis failed' });
    }

    res.json({
      audioBase64,
      mimeType: 'audio/wav',
      voice,
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
});

// REST Endpoint: Maya's Daily Briefing & Tech Radar for Chandan
app.get('/api/briefing', async (_req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Generate an energetic, warm, friendly 30-second morning greeting and tech briefing for Chandan from Maya. Include a motivational spark, an interesting engineering or AI fact, and an offer to brainstorm.',
      config: {
        systemInstruction: MAYA_SYSTEM_INSTRUCTION,
      },
    });

    const greetingText = response.text || "Good day Chandan! Maya is ready to build amazing things with you today.";

    // Generate audio for briefing
    let audioBase64: string | null = null;
    try {
      const cleanVoiceText = greetingText.replace(/[*_#`]/g, '').slice(0, 800);
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [{ role: 'user', parts: [{ text: cleanVoiceText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (_) {}

    res.json({
      text: greetingText,
      audioBase64,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Briefing error' });
  }
});

// Mount Vite middleware in development mode, or serve static dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Maya AI Voice Assistant server listening on http://localhost:${port}`);
  });
}

startServer();
