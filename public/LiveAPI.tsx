import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { CAMPUS_DATA } from '../data/campusData';
import { fetchBothRoutes, RouteResult } from '../services/routeService';
import { LatLng } from '../utils/locationUtils';

/**
 * Voice interface to UniNav.
 *
 * The model does not answer from its own knowledge. It is given four tools that
 * call the same services the text chat uses, so voice and text always agree:
 *
 *   find_campus_location  -> searches CAMPUS_DATA (incl. aliases)
 *   get_directions        -> calls fetchBothRoutes(), same as the text path
 *   switch_map_view       -> actually flips the map view in App state
 *   show_location_on_map  -> actually drops a pin / focuses the map
 *
 * Because the tools return real data, the model can be told "never invent" and
 * the instruction is enforceable rather than aspirational.
 */

interface LiveAPIProps {
  visible: boolean;
  onClose: () => void;
  onTranscript: (role: 'user' | 'bot', text: string) => void;

  /** Current user position, used as routing origin. */
  userLocation: LatLng | null;

  /** Called when the model computes a route, so the panel/map can render it. */
  onRouteComputed: (route: RouteResult, destinationName: string) => void;

  /** Called when the model is asked to switch map view. */
  onSwitchMapView: (view: 'campus' | 'google') => void;

  /** Called when the model is asked to focus a location on the map. */
  onFocusLocation: (locationId: string) => void;
}

type Status = 'connecting' | 'connected' | 'error';

export const LiveAPI: React.FC<LiveAPIProps> = ({
  visible,
  onClose,
  onTranscript,
  userLocation,
  onRouteComputed,
  onSwitchMapView,
  onFocusLocation,
}) => {
  const [status, setStatus] = useState<Status>('connecting');
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sinkRef = useRef<GainNode | null>(null);

  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const mutedRef = useRef(false);

  // Transcript buffers — flushed on turnComplete so chat gets whole utterances.
  const userBufRef = useRef('');
  const botBufRef = useRef('');

  // Latest props for use inside the long-lived session callbacks.
  const propsRef = useRef({ userLocation, onRouteComputed, onSwitchMapView, onFocusLocation });
  useEffect(() => {
    propsRef.current = { userLocation, onRouteComputed, onSwitchMapView, onFocusLocation };
  }, [userLocation, onRouteComputed, onSwitchMapView, onFocusLocation]);

  useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);

  // ── Tool implementations ────────────────────────────────────────────────
  // These run locally and return real data from the same services the text
  // chat uses. The model never sees coordinates it could read aloud.

  const runTool = useCallback(async (name: string, args: any): Promise<any> => {
    setActiveTool(name);
    try {
      switch (name) {
        case 'find_campus_location': {
          const q = String(args?.query ?? '').toLowerCase().trim();
          if (!q) return { found: false, reason: 'empty query' };

          const match = CAMPUS_DATA.locations.find((loc: any) => {
            const names = [loc.name, ...(loc.aliases ?? [])].map((n: string) => n.toLowerCase());
            return names.some((n) => n === q || n.includes(q) || q.includes(n));
          });

          if (!match) {
            return {
              found: false,
              suggestions: CAMPUS_DATA.locations.slice(0, 5).map((l: any) => l.name),
            };
          }
          return {
            found: true,
            id: match.id,
            name: match.name,
            type: match.type,
            description: match.description,
            aliases: match.aliases ?? [],
          };
        }

        case 'get_directions': {
          const { userLocation: origin, onRouteComputed: emitRoute } = propsRef.current;
          if (!origin) {
            return { success: false, reason: 'User location unavailable. Ask them to enable location access.' };
          }

          const q = String(args?.destination ?? '').toLowerCase().trim();
          const dest = CAMPUS_DATA.locations.find((loc: any) => {
            const names = [loc.name, ...(loc.aliases ?? [])].map((n: string) => n.toLowerCase());
            return names.some((n) => n === q || n.includes(q) || q.includes(n));
          });

          if (!dest) return { success: false, reason: `No campus location matching "${args?.destination}".` };

          const { osrmRoute, googleRoute } = await fetchBothRoutes(
            origin,
            { lat: dest.lat, lng: dest.lng }
          );
          const route = osrmRoute ?? googleRoute;
          if (!route) return { success: false, reason: 'Routing engine unavailable.' };

          // Render on screen immediately — voice and UI stay in sync.
          emitRoute(route, dest.name);

          return {
            success: true,
            destination: dest.name,
            total_distance: route.totalDistance,
            total_duration: route.totalDuration,
            step_count: route.steps.length,
            // Only the first three steps are exposed, so the model physically
            // cannot read out more than it should.
            first_steps: route.steps.slice(0, 3).map((s) => ({
              instruction: s.instruction,
              distance: s.distance,
            })),
          };
        }

        case 'switch_map_view': {
          const view = args?.view === 'google' ? 'google' : 'campus';
          propsRef.current.onSwitchMapView(view);
          return { success: true, current_view: view };
        }

        case 'show_location_on_map': {
          const q = String(args?.name ?? '').toLowerCase().trim();
          const loc = CAMPUS_DATA.locations.find((l: any) => {
            const names = [l.name, ...(l.aliases ?? [])].map((n: string) => n.toLowerCase());
            return names.some((n) => n === q || n.includes(q) || q.includes(n));
          });
          if (!loc) return { success: false, reason: 'Location not found.' };
          propsRef.current.onFocusLocation(loc.id);
          return { success: true, name: loc.name };
        }

        default:
          return { error: `Unknown tool: ${name}` };
      }
    } catch (e: any) {
      console.error(`[LiveAPI] tool ${name} failed:`, e);
      return { success: false, reason: 'Tool execution failed.' };
    } finally {
      setActiveTool(null);
    }
  }, []);

  // ── Session lifecycle ───────────────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const start = async () => {
      try {
        setStatus('connecting');
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not configured.');

        const ai = new GoogleGenAI({ apiKey });
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;

        const inputCtx: AudioContext = new Ctx({ sampleRate: 16000 });
        const outputCtx: AudioContext = new Ctx({ sampleRate: 24000 });
        inputCtxRef.current = inputCtx;
        outputCtxRef.current = outputCtx;

        // Safari suspends contexts until a user gesture; opening the modal is one.
        if (inputCtx.state === 'suspended') await inputCtx.resume();
        if (outputCtx.state === 'suspended') await outputCtx.resume();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        // AudioWorklet replaces the deprecated ScriptProcessorNode: capture runs
        // on the audio thread, so React re-renders can't cause dropouts.
        await inputCtx.audioWorklet.addModule('/pcm-capture-processor.js');

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              if (cancelled) return;
              setStatus('connected');

              const source = inputCtx.createMediaStreamSource(stream);
              sourceRef.current = source;

              const worklet = new AudioWorkletNode(inputCtx, 'pcm-capture-processor');
              workletRef.current = worklet;

              worklet.port.onmessage = (event) => {
                const { pcm, rms } = event.data as { pcm: Int16Array; rms: number };
                setVolume(rms);
                if (mutedRef.current) return;

                sessionPromise.then((session) => {
                  session.sendRealtimeInput({
                    media: { data: int16ToBase64(pcm), mimeType: 'audio/pcm;rate=16000' },
                  });
                });
              };

              // Terminate the graph in a muted sink instead of ctx.destination,
              // so the mic is never routed back to the speakers.
              const sink = inputCtx.createGain();
              sink.gain.value = 0;
              sinkRef.current = sink;

              source.connect(worklet);
              worklet.connect(sink);
              sink.connect(inputCtx.destination);
            },

            onmessage: async (msg: LiveServerMessage) => {
              const m = msg as any;

              // ── Tool calls ──────────────────────────────────────────────
              const calls = m.toolCall?.functionCalls;
              if (calls?.length) {
                const responses = await Promise.all(
                  calls.map(async (c: any) => ({
                    id: c.id,
                    name: c.name,
                    response: await runTool(c.name, c.args ?? {}),
                  }))
                );
                const session = await sessionPromise;
                session.sendToolResponse({ functionResponses: responses });
                return;
              }

              // ── Transcripts (correct field paths) ───────────────────────
              const userText = m.serverContent?.inputTranscription?.text;
              if (userText) userBufRef.current += userText;

              const botText = m.serverContent?.outputTranscription?.text;
              if (botText) botBufRef.current += botText;

              // ── Bot audio ───────────────────────────────────────────────
              const audioData = m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && outputCtxRef.current) {
                const ctx = outputCtxRef.current;
                const buffer = decodePCM(base64ToBytes(audioData), ctx);
                const src = ctx.createBufferSource();
                src.buffer = buffer;
                src.connect(ctx.destination);

                const now = ctx.currentTime;
                if (nextStartTimeRef.current < now) nextStartTimeRef.current = now;
                src.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;

                sourcesRef.current.add(src);
                src.onended = () => sourcesRef.current.delete(src);
              }

              // ── Barge-in ────────────────────────────────────────────────
              if (m.serverContent?.interrupted) {
                sourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                botBufRef.current = '';
              }

              // ── Flush completed turn into chat history ──────────────────
              if (m.serverContent?.turnComplete) {
                if (userBufRef.current.trim()) {
                  onTranscript('user', userBufRef.current.trim());
                  userBufRef.current = '';
                }
                if (botBufRef.current.trim()) {
                  onTranscript('bot', botBufRef.current.trim());
                  botBufRef.current = '';
                }
              }
            },

            onclose: () => { if (!cancelled) setStatus('error'); },
            onerror: (err) => { console.error('[LiveAPI] session error:', err); setStatus('error'); },
          },

          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },

            tools: [{
              functionDeclarations: [
                {
                  name: 'find_campus_location',
                  description:
                    'Look up a place at OAU by official name or informal alias (e.g. "Spider", "Motion Ground"). ' +
                    'Call this before describing ANY location. Never describe a place without calling this first.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: { query: { type: Type.STRING, description: 'The place the user named.' } },
                    required: ['query'],
                  },
                },
                {
                  name: 'get_directions',
                  description:
                    'Compute a walking route from the user to a campus destination and display it on their screen. ' +
                    'Returns total distance, total time, and the first three steps only.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: { destination: { type: Type.STRING, description: 'Destination name or alias.' } },
                    required: ['destination'],
                  },
                },
                {
                  name: 'switch_map_view',
                  description: 'Switch the on-screen map between the campus-roads view and the Google satellite view.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: { view: { type: Type.STRING, description: 'Either "campus" or "google".' } },
                    required: ['view'],
                  },
                },
                {
                  name: 'show_location_on_map',
                  description: 'Focus the on-screen map on a campus location without computing a route.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING, description: 'Location name or alias.' } },
                    required: ['name'],
                  },
                },
              ],
            }],

            systemInstruction: `You are the UniNav voice guide for Obafemi Awolowo University, Ile-Ife.

You have no knowledge of OAU yourself. Everything you say about campus must come from a tool result in this conversation. If a tool has not told you something, you do not know it.

DESCRIBING A PLACE
Call find_campus_location first. Then give at most three short spoken sentences using only what the tool returned. Close with: "Say 'get directions' if you'd like me to take you there." Never speak walking steps in this mode.

GIVING DIRECTIONS
Call get_directions. It puts the full route on the user's screen and returns the first three steps. Say the total distance and total time exactly as returned, read those three steps, then say: "I've put the full route on your screen." Never read a fourth step — you will not have one.

CHANGING THE VIEW
When asked to switch map views, call switch_map_view and then confirm. Do not claim the screen changed unless the tool succeeded.

IF A TOOL FAILS
Say plainly that you couldn't get it and suggest they check the screen. Never fill the gap with a guess.

NEVER speak latitude or longitude. NEVER invent a landmark, a step, a distance, or a time. Keep replies short and natural — this is speech, not writing.`,
          },
        });

        sessionRef.current = sessionPromise;
      } catch (e) {
        console.error('[LiveAPI] startup failed:', e);
        if (!cancelled) setStatus('error');
      }
    };

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      workletRef.current?.disconnect();
      sourceRef.current?.disconnect();
      sinkRef.current?.disconnect();
      inputCtxRef.current?.close();
      outputCtxRef.current?.close();
      sessionRef.current?.then((s: any) => s.close()).catch(() => {});
      sourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
      sourcesRef.current.clear();
      nextStartTimeRef.current = 0;
    };
  }, [visible, runTool, onTranscript]);

  if (!visible) return null;

  const label =
    status === 'connecting' ? 'Connecting…'
    : status === 'error' ? 'Connection failed'
    : activeTool === 'get_directions' ? 'Finding your route…'
    : activeTool ? 'Checking campus data…'
    : isMuted ? 'Microphone muted'
    : 'Listening…';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <button
        onClick={onClose}
        aria-label="Close voice chat"
        className="absolute top-10 right-6 md:top-8 md:right-8 p-4 text-white/60 hover:text-white transition-colors"
      >
        <span className="text-2xl font-bold">✕</span>
      </button>

      <div className="flex flex-col items-center gap-8 w-full max-w-md px-8">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-150
            ${status === 'connected' ? 'bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.6)]' : 'bg-gray-700'}`}
          style={{ transform: status === 'connected' && !isMuted ? `scale(${1 + Math.min(volume * 2.5, 0.35)})` : 'scale(1)' }}
        >
          {status === 'connecting' ? (
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          ) : status === 'error' ? (
            <div className="text-red-400 text-3xl font-bold">!</div>
          ) : (
            <div className="w-4 h-4 bg-white rounded-full" />
          )}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-white text-2xl font-bold">Live Voice Chat</h2>
          <p className="text-gray-400" aria-live="polite">{label}</p>
          {status === 'error' && (
            <p className="text-red-400 text-sm mt-2">Check microphone permissions and your API key.</p>
          )}
        </div>

        {status === 'connected' && (
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="px-6 py-3 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors"
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Audio helpers ─────────────────────────────────────────────────────────

function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = '';
  const CHUNK = 0x8000; // avoid arg-count limits on large buffers
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodePCM(data: Uint8Array, ctx: AudioContext): AudioBuffer {
  // Copy into an aligned buffer — the byteOffset is not guaranteed to be even.
  const aligned = new Uint8Array(data.length);
  aligned.set(data);
  const int16 = new Int16Array(aligned.buffer);

  const buffer = ctx.createBuffer(1, int16.length, 24000);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < int16.length; i++) channel[i] = int16[i] / 32768;
  return buffer;
}
