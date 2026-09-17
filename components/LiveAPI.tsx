import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { CAMPUS_DATA } from '../data/campusData';
import { fetchBothRoutes, RouteResult } from '../services/routeService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveAPIProps {
  visible: boolean;
  onClose: () => void;
  onTranscript: (role: 'user' | 'bot', text: string) => void;
  /** The same position value used as routing origin in the text chat */
  userLocation?: { lat: number; lng: number };
  /** Called once a route has been computed — App should render it on the map */
  onRouteComputed: (
    route: { osrmRoute: RouteResult | null; googleRoute: RouteResult | null },
    destinationName: string
  ) => void;
  /** Switch the map between campus-road schematic and Google Maps */
  onSwitchMapView: (view: 'campus' | 'google') => void;
  /** Focus / highlight a marker on CampusMap by location id */
  onFocusLocation: (locationId: string) => void;
}

// ─── Campus data helpers ──────────────────────────────────────────────────────

type RawLoc = {
  id: string; name: string; type: string;
  description: string; aliases: string[];
  lat?: number; lng?: number;
};

const LOCATIONS = CAMPUS_DATA.locations as RawLoc[];

function findLocation(query: string): RawLoc | null {
  const q = query.toLowerCase().trim();
  // 1. exact name
  let hit = LOCATIONS.find(l => l.name.toLowerCase() === q);
  if (hit) return hit;
  // 2. exact alias
  hit = LOCATIONS.find(l => l.aliases?.some(a => a.toLowerCase() === q));
  if (hit) return hit;
  // 3. name substring
  hit = LOCATIONS.find(l => l.name.toLowerCase().includes(q) || q.includes(l.name.toLowerCase()));
  if (hit) return hit;
  // 4. alias substring
  hit = LOCATIONS.find(l => l.aliases?.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase())));
  return hit ?? null;
}

// ─── Audio utilities ──────────────────────────────────────────────────────────

/** Int16Array (from AudioWorklet) → base64 string for Gemini sendRealtimeInput */
function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** base64 string → Uint8Array */
function b64ToU8(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Raw PCM Int16 bytes → AudioBuffer at 24 kHz (Gemini output rate) */
function pcmToAudioBuffer(data: Uint8Array, ctx: AudioContext): AudioBuffer {
  const i16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const buf = ctx.createBuffer(1, i16.length, 24000);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < i16.length; i++) ch[i] = i16[i] / 32768.0;
  return buf;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LiveAPI: React.FC<LiveAPIProps> = ({
  visible, onClose, onTranscript,
  userLocation, onRouteComputed, onSwitchMapView, onFocusLocation,
}) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);

  // Input audio
  const inputCtxRef  = useRef<AudioContext | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const workletRef   = useRef<AudioWorkletNode | null>(null);
  const sourceRef    = useRef<MediaStreamAudioSourceNode | null>(null);

  // Output audio
  const outputCtxRef = useRef<AudioContext | null>(null);
  const nextStartRef = useRef(0);
  const sourcesRef   = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Session
  const sessionRef  = useRef<any>(null);   // resolved Live session object
  const botBufRef   = useRef('');          // accumulates streamed output transcript

  // Keep userLocation current inside callbacks without re-running the effect
  const userLocRef = useRef(userLocation);
  useEffect(() => { userLocRef.current = userLocation; }, [userLocation]);

  // Keep callbacks current (avoid stale closures in long-lived onmessage)
  const onTranscriptRef       = useRef(onTranscript);
  const onRouteComputedRef    = useRef(onRouteComputed);
  const onSwitchMapViewRef    = useRef(onSwitchMapView);
  const onFocusLocationRef    = useRef(onFocusLocation);
  useEffect(() => { onTranscriptRef.current    = onTranscript;    }, [onTranscript]);
  useEffect(() => { onRouteComputedRef.current = onRouteComputed; }, [onRouteComputed]);
  useEffect(() => { onSwitchMapViewRef.current = onSwitchMapView; }, [onSwitchMapView]);
  useEffect(() => { onFocusLocationRef.current = onFocusLocation; }, [onFocusLocation]);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const startSession = async () => {
      try {
        setStatus('connecting');
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set');

        const ai = new GoogleGenAI({ apiKey });
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;

        // Create audio contexts (Safari fallback omits sampleRate constraint)
        let inputCtx: AudioContext;
        let outputCtx: AudioContext;
        try {
          inputCtx  = new AudioCtx({ sampleRate: 16000 });
          outputCtx = new AudioCtx({ sampleRate: 24000 });
        } catch {
          inputCtx  = new AudioCtx();
          outputCtx = new AudioCtx();
        }
        inputCtxRef.current  = inputCtx;
        outputCtxRef.current = outputCtx;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
        });
        streamRef.current = stream;
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        // ── Connect to Gemini Live ─────────────────────────────────────────
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {

            // ── Session opened ─────────────────────────────────────────────
            onopen: async () => {
              if (cancelled) return;
              setStatus('connected');

              // Resolve and cache the session so tool responses can be sent
              const session = await sessionPromise;
              sessionRef.current = session;

              // Set up AudioWorklet (must happen after context is running)
              await inputCtx.audioWorklet.addModule('/pcm-capture-processor.js');
              const worklet = new AudioWorkletNode(inputCtx, 'pcm-capture-processor');
              workletRef.current = worklet;

              worklet.port.onmessage = (e: MessageEvent<{ pcm: Int16Array; rms: number }>) => {
                const { pcm, rms } = e.data;
                setVolume(rms);
                // Transfer PCM to Gemini
                sessionRef.current?.sendRealtimeInput({
                  media: { data: int16ToBase64(pcm), mimeType: 'audio/pcm;rate=16000' },
                });
              };

              const src = inputCtx.createMediaStreamSource(stream);
              sourceRef.current = src;
              src.connect(worklet);
              // Intentionally NOT connected to destination — prevents mic feedback
            },

            // ── Server message ─────────────────────────────────────────────
            onmessage: async (msg: LiveServerMessage) => {
              const any = msg as any;

              // User speech transcript (requires inputAudioTranscription in config)
              const userText: string | undefined = any.serverContent?.inputTranscription?.text;
              if (userText?.trim()) {
                onTranscriptRef.current('user', userText.trim());
              }

              // Bot audio playback
              const audioB64: string | undefined =
                msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioB64) {
                const ctx = outputCtxRef.current;
                if (ctx) {
                  const bytes = b64ToU8(audioB64);
                  const buf   = pcmToAudioBuffer(bytes, ctx);
                  const node  = ctx.createBufferSource();
                  node.buffer = buf;
                  node.connect(ctx.destination);
                  // Gapless scheduling
                  const now = ctx.currentTime;
                  if (nextStartRef.current < now) nextStartRef.current = now;
                  node.start(nextStartRef.current);
                  nextStartRef.current += buf.duration;
                  sourcesRef.current.add(node);
                  node.onended = () => sourcesRef.current.delete(node);
                }
              }

              // Bot output transcript (requires outputAudioTranscription in config)
              const outText: string | undefined = any.serverContent?.outputTranscription?.text;
              if (outText) botBufRef.current += outText;
              if (any.serverContent?.turnComplete && botBufRef.current.trim()) {
                onTranscriptRef.current('bot', botBufRef.current.trim());
                botBufRef.current = '';
              }

              // Interruption — stop queued audio, discard partial transcript
              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => { try { s.stop(); } catch {} });
                sourcesRef.current.clear();
                nextStartRef.current = 0;
                botBufRef.current = '';
              }

              // ── Function calls ─────────────────────────────────────────
              const toolCall = any.toolCall;
              if (toolCall?.functionCalls?.length) {
                const responses: any[] = [];

                for (const fc of toolCall.functionCalls) {
                  let output: unknown;
                  try {
                    if (fc.name === 'find_campus_location') {
                      const loc = findLocation(String(fc.args?.query ?? ''));
                      if (loc) {
                        onFocusLocationRef.current(loc.id);
                        output = {
                          id: loc.id, name: loc.name,
                          type: loc.type, description: loc.description,
                        };
                      } else {
                        output = { error: 'Location not found in campus database' };
                      }

                    } else if (fc.name === 'compute_route') {
                      const dest   = findLocation(String(fc.args?.destination_name ?? ''));
                      const origin = userLocRef.current;
                      if (!dest) {
                        output = { error: `"${fc.args?.destination_name}" not found in campus database` };
                      } else if (!origin) {
                        output = { error: 'User location is not available yet' };
                      } else if (!dest.lat || !dest.lng) {
                        output = { error: 'GPS coordinates not available for that location' };
                      } else {
                        const route = await fetchBothRoutes(
                          origin,
                          { lat: dest.lat, lng: dest.lng }
                        );
                        onRouteComputedRef.current(route, dest.name);
                        const active = route.osrmRoute ?? route.googleRoute;
                        output = {
                          success: true,
                          totalDistance: active?.totalDistance ?? 'unknown',
                          totalDuration: active?.totalDuration ?? 'unknown',
                          firstThreeSteps: (active?.steps ?? [])
                            .slice(0, 3)
                            .map(s => s.instruction),
                          totalSteps: active?.steps?.length ?? 0,
                        };
                      }

                    } else if (fc.name === 'switch_map_view') {
                      const view = String(fc.args?.view ?? 'campus') as 'campus' | 'google';
                      onSwitchMapViewRef.current(view);
                      output = { success: true, view };

                    } else {
                      output = { error: `Unknown tool: ${fc.name}` };
                    }
                  } catch (err) {
                    output = { error: String(err) };
                  }

                  responses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { output: JSON.stringify(output) },
                  });
                }

                sessionRef.current?.sendToolResponse({ functionResponses: responses });
              }
            },

            onclose: () => { console.log('[LiveAPI] session closed'); },
            onerror: (err: any) => {
              console.error('[LiveAPI] error:', err);
              if (!cancelled) setStatus('error');
            },
          },

          // ── Session config ─────────────────────────────────────────────
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription:  {},   // enables inputTranscription messages
            outputAudioTranscription: {},   // enables outputTranscription messages
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'find_campus_location',
                    description:
                      'Look up a campus location by name or alias. Call this when the user asks "where is X", "what is X", or "tell me about X". Returns id, name, type, and description.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        query: {
                          type: Type.STRING,
                          description:
                            'The location name or common alias (e.g. "Spider Building", "library", "amphi")',
                        },
                      },
                      required: ['query'],
                    },
                  },
                  {
                    name: 'compute_route',
                    description:
                      "Compute a walking route from the user's current GPS location to a campus destination and display it on screen. Call this when the user says 'get directions', 'how do I get to X', or 'take me to X'. After receiving the result, speak total distance, total time, and ONLY the first 3 steps verbatim. End with \"I've loaded the full route on your screen.\" NEVER invent or estimate steps, distances, or times.",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        destination_name: {
                          type: Type.STRING,
                          description:
                            'Name or alias of the destination (e.g. "Spider Building", "library")',
                        },
                      },
                      required: ['destination_name'],
                    },
                  },
                  {
                    name: 'switch_map_view',
                    description:
                      'Switch the on-screen map. Call with view="google" when the user says "switch to Google Maps". Call with view="campus" when the user says "switch to campus roads" or "use campus roads".',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        view: {
                          type: Type.STRING,
                          enum: ['campus', 'google'],
                          description: '"campus" = campus schematic, "google" = Google Maps satellite',
                        },
                      },
                      required: ['view'],
                    },
                  },
                ],
              },
            ],
            systemInstruction: `You are the OAU Campus Voice Guide for Obafemi Awolowo University, Ile-Ife.
You have three tools: find_campus_location, compute_route, switch_map_view.

TOOL USAGE:
• "where is X" / "what is X" / "tell me about X" → call find_campus_location(query=X).
  Describe in 3 natural sentences: what it is, where on campus, one useful detail.
  End with: "Say 'get directions' if you'd like turn-by-turn navigation."

• "get directions" / "directions to X" / "how do I get to X" / "take me to X" → call compute_route(destination_name=X).
  After the tool responds, say "I've loaded the route." Then speak:
    – total distance and total time exactly as returned.
    – ONLY the first 3 steps, word for word.
  End with: "I've loaded the full route on your screen."
  NEVER invent, estimate, or reword steps, distances, or times.

• "switch to Google Maps" / "use Google Maps" → call switch_map_view(view="google"), then confirm.
• "switch to campus roads" / "use campus roads" → call switch_map_view(view="campus"), then confirm.

STRICT RULES:
– NEVER invent or estimate route steps, distances, or times.
– NEVER mention raw GPS coordinates.
– NEVER mention locations not in the campus database.
– If a tool returns an error, apologise briefly and suggest the user try the text chat.
– Keep all responses concise and natural for voice.`,
          },
        });

      } catch (e) {
        if (!cancelled) {
          console.error('[LiveAPI]', e);
          setStatus('error');
        }
      }
    };

    startSession();

    // ── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      workletRef.current?.disconnect();
      sourceRef.current?.disconnect();
      inputCtxRef.current?.close().catch(() => {});
      outputCtxRef.current?.close().catch(() => {});
      sourcesRef.current.forEach(s => { try { s.stop(); } catch {} });
      sourcesRef.current.clear();
      try { sessionRef.current?.close?.(); } catch {}
      sessionRef.current = null;
      botBufRef.current  = '';
    };
  }, [visible]);

  // ─── UI ─────────────────────────────────────────────────────────────────────

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-10 right-6 md:top-8 md:right-8 p-4 text-white/60 hover:text-white transition-colors"
      >
        <span className="text-2xl font-bold">✕</span>
      </button>

      <div className="flex flex-col items-center gap-8 w-full max-w-md px-8">
        {/* Visualiser */}
        <div
          className={[
            'w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200',
            status === 'connected'
              ? 'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.6)]'
              : 'bg-gray-700',
          ].join(' ')}
          style={{ transform: status === 'connected' ? `scale(${1 + volume * 0.2})` : 'scale(1)' }}
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
            {status === 'connecting' ? 'Connecting to Gemini…' :
             status === 'connected'  ? 'Listening…'           :
             status === 'error'      ? 'Connection Failed'    : 'Ready'}
          </p>
          {status === 'error' && (
            <p className="text-red-400 text-sm mt-2">
              Check your microphone permissions and API key.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
