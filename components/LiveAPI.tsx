import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface LiveAPIProps {
  visible: boolean;
  onClose: () => void;
  onTranscript: (role: 'user' | 'bot', text: string) => void;
}

export const LiveAPI: React.FC<LiveAPIProps> = ({ visible, onClose, onTranscript }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);

  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Output Audio
  const nextStartTimeRef = useRef<number>(0);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Connection
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) return;

    const startSession = async () => {
      try {
        setStatus('connecting');
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("No API Key configured. Please add VITE_GEMINI_API_KEY to your environment.");

        const ai = new GoogleGenAI({ apiKey });
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

        let inputCtx: AudioContext;
        let outputCtx: AudioContext;
        try {
          inputCtx = new AudioContextClass({ sampleRate: 16000 });
          outputCtx = new AudioContextClass({ sampleRate: 24000 });
        } catch (e) {
          // Safari/iOS fallback
          inputCtx = new AudioContextClass();
          outputCtx = new AudioContextClass();
        }

        audioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        streamRef.current = stream;

        // Connect to Live API
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('connected');

              // Setup Input Processing
              const source = inputCtx.createMediaStreamSource(stream);
              sourceRef.current = source;

              // Buffer size 4096, 1 input channel, 1 output channel
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);

                // Volume viz
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length));

                // Send to Gemini
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(processor);
              processor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              // Handle Audio Output
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData) {
                const ctx = outputAudioContextRef.current;
                if (!ctx) return;

                const binary = atob(audioData);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

                // Decode PCM
                const buffer = decodePCMToAudioBuffer(bytes, ctx);

                const src = ctx.createBufferSource();
                src.buffer = buffer;
                src.connect(ctx.destination);

                // Scheduling for gapless playback
                const currentTime = ctx.currentTime;
                if (nextStartTimeRef.current < currentTime) {
                  nextStartTimeRef.current = currentTime;
                }
                src.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;

                sourcesRef.current.add(src);
                src.onended = () => sourcesRef.current.delete(src);
              }

              // Handle Interruption
              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }

              // Handle Transcripts
              // The SDK types might differ slightly, checking structure based on docs
              // We cast to any to access properties that might not be in the strict type definition yet
              const anyMsg = msg as any;

              // User Input Transcription
              // Note: The structure might be different, checking documentation pattern
              // If the model sends back user input transcription, it's usually in a specific field
              // For now, we'll log it to see structure if needed, but let's try to access it

              // Model Output Transcription (if available)
              // This is usually in the modelTurn parts if modality includes TEXT, but for AUDIO only, 
              // we rely on the audio.

              // If we want text updates in the chat, we might need to enable TEXT modality too, 
              // but the native audio model is optimized for AUDIO-only low latency.
              // Let's stick to AUDIO for now and focus on the voice experience.
            },
            onclose: () => {
              console.log("Session closed");
              // Don't set error if closed intentionally
            },
            onerror: (err) => {
              console.error("Session error:", err);
              setStatus('error');
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: "You are a helpful OAU Campus guide. You can assist with navigation both within the campus and from outside locations to the campus. Chat naturally with the student. Keep responses concise."
          }
        });

        sessionRef.current = sessionPromise;

      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    };

    startSession();

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
      }

      if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
      }

      sourcesRef.current.forEach(s => s.stop());
      sourcesRef.current.clear();
    };
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-10 right-6 md:top-8 md:right-8 p-4 text-white/60 hover:text-white transition-colors"
      >
        <span className="text-2xl font-bold">✕</span>
      </button>

      <div className="flex flex-col items-center gap-8 w-full max-w-md px-8">
        {/* Visualizer Circle */}
        <div
          className={`
                w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200
                ${status === 'connected' ? 'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.6)]' : 'bg-gray-700'}
            `}
          style={{
            transform: status === 'connected' ? `scale(${1 + (volume * 0.2)})` : 'scale(1)'
          }}
        >
          {status === 'connecting' ? (
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          ) : status === 'error' ? (
            <div className="text-red-500 text-3xl">!</div>
          ) : (
            <div className="w-4 h-4 bg-white rounded-full" />
          )}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-white text-2xl font-bold">Live Voice Chat</h2>
          <p className="text-gray-400">
            {status === 'connecting' ? 'Connecting to Gemini...' :
              status === 'connected' ? 'Listening...' :
                status === 'error' ? 'Connection Failed' : 'Ready'}
          </p>

          {status === 'error' && (
            <p className="text-red-400 text-sm mt-2">
              Please check your microphone permissions and API key.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Utils ---

// Convert Float32 Audio Data to Base64 PCM (Int16)
function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp and scale
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Convert Int16Array to binary string
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  const b64 = btoa(binary);

  return {
    data: b64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Decode Raw PCM (Int16) to AudioBuffer
function decodePCMToAudioBuffer(data: Uint8Array, ctx: AudioContext) {
  const sampleRate = 24000; // Gemini Native Audio output rate
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;

  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    // Convert Int16 to Float32 [-1, 1]
    channelData[i] = dataInt16[i] / 32768.0;
  }

  return buffer;
}
