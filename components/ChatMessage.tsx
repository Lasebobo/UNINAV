import React, { useMemo, useState } from 'react';
import { Message, CampusLocation } from '../types';
import ReactMarkdown from 'react-markdown';
import { CAMPUS_DATA } from '../data/campusData';
import { ImageModal } from './ImageModal';
import { Map, Navigation, ArrowRight, RefreshCw, AlertCircle, Play, Square } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';

interface ChatMessageProps {
  message: Message;
  locations?: CampusLocation[];
  onViewMap?: () => void;
  /** Called when user taps "Get Directions" on a Mode A description message */
  onGetDirections?: (locationName: string) => void;
  /** Optional retry handler for failed directions */
  onRetryDirections?: (locationName: string) => void;
}

// Maneuver icon mapping for step arrows
const MANEUVER_ICONS: Record<string, string> = {
  'turn-left':       '↰',
  'turn-right':      '↱',
  'turn-sharp-left': '↺',
  'turn-sharp-right':'↻',
  'turn-slight-left':'↖',
  'turn-slight-right':'↗',
  'roundabout':      '⟳',
  'depart':          '▶',
  'arrive':          '🟦',
  'straight':        '↑',
};

function getManeuverIcon(maneuver: string, instruction?: string): string {
  const key = (maneuver || '').toLowerCase();
  if (MANEUVER_ICONS[key]) return MANEUVER_ICONS[key];

  // FIRST: use explicit cues from the human-readable instruction when present.
  // Prioritize explicit "turn left/right" calls over a generic 'head' or 'straight'.
  if (instruction) {
    const txt = instruction.toLowerCase();
    // If instruction explicitly directs a turn, respect it.
    if (txt.includes('turn right') || txt.includes('turn to the right') || txt.includes('head right')) return MANEUVER_ICONS['turn-right'];
    if (txt.includes('turn left') || txt.includes('turn to the left') || txt.includes('head left')) return MANEUVER_ICONS['turn-left'];
    if (txt.includes('roundabout')) return MANEUVER_ICONS['roundabout'];
    // If instruction explicitly uses straight/continue with no turn mentioned, prefer straight.
    if ((txt.includes('straight') || txt.includes('continue') || txt.includes('go straight') || txt.includes('keep straight') || txt.includes('head')) && !txt.includes('turn')) return MANEUVER_ICONS['straight'];
  }

  // If we have a maneuver token (even if not in the map), attempt heuristic mapping
  if (key) {
    if (key.includes('left')) return MANEUVER_ICONS['turn-left'];
    if (key.includes('right')) return MANEUVER_ICONS['turn-right'];
    if (key.includes('roundabout')) return MANEUVER_ICONS['roundabout'];
    if (key.includes('straight') || key.includes('continue') || key.includes('depart')) return MANEUVER_ICONS['straight'];
  }

  return '•';
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTIONS PANEL — renders inside a Mode B bot bubble
// ─────────────────────────────────────────────────────────────────────────────
const DirectionsPanel: React.FC<{
  message: Message;
  onViewMap?: () => void;
}> = ({ message, onViewMap }) => {
  const { directionsPayload } = message;
  const [view, setView] = useState<'campus' | 'google'>('campus');

  if (!directionsPayload) return null;

  const { osrmRoute, googleRoute, locationName } = directionsPayload;
  const hasOsrm   = !!osrmRoute;
  const hasGoogle = !!googleRoute;
  const canToggle = hasOsrm && hasGoogle;

  // Pick the currently active route
  const activeRoute = view === 'campus' ? (osrmRoute ?? googleRoute) : (googleRoute ?? osrmRoute);

  if (!activeRoute) {
    // Both engines failed — fallback message is already in message.content
    return null;
  }

  const {
    isNavigating,
    currentStepIndex,
    fallbackMode,
    startNavigation,
    stopNavigation,
  } = useNavigation(activeRoute.steps);

  return (
    <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      {/* Fallback Banner */}
      {isNavigating && fallbackMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium">
            Live navigation unavailable — advancing steps automatically
          </p>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2 text-blue-700">
          <Navigation className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
          <span className="text-xs font-semibold">
            {activeRoute.totalDistance} · {activeRoute.totalDuration}
          </span>
        </div>
        {/* Source badge */}
        <span className="text-[10px] font-medium text-blue-500 bg-white border border-blue-200 px-2 py-0.5 rounded-full">
          {view === 'campus' ? 'Campus Roads' : 'Google Maps'}
        </span>
      </div>

      {/* Numbered steps */}
      <ol className="divide-y divide-gray-100">
        {activeRoute.steps.map((step, i) => {
          const isActive = isNavigating && i === currentStepIndex;
          const isPast = isNavigating && i < currentStepIndex;
          return (
            <li
              key={i}
              className={`flex items-start gap-3 px-3.5 py-2.5 transition-colors ${
                isActive ? 'bg-blue-50/50' : isPast ? 'opacity-50' : ''
              }`}
            >
              {/* Step number / maneuver icon */}
              <span
                className={`mt-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-200'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[13px] leading-snug ${
                    isActive ? 'text-blue-900 font-medium' : 'text-gray-800'
                  }`}
                >
                  {step.instruction}
                </p>
                {(step.distance || step.duration) && (
                  <p
                    className={`text-[11px] mt-0.5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400'
                    }`}
                  >
                    {[step.distance, step.duration].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              {(() => {
                const steps = activeRoute.steps;
                const icon = i === 0
                  ? MANEUVER_ICONS['depart']
                  : i === steps.length - 1
                    ? MANEUVER_ICONS['arrive']
                    : getManeuverIcon(step.maneuver, step.instruction);
                const iconColorClass = icon === MANEUVER_ICONS['arrive']
                  ? (isActive ? 'text-blue-700' : 'text-blue-600')
                  : (isActive ? 'text-blue-700' : 'text-blue-600');
                return (
                  <span
                    className={`text-xl font-semibold shrink-0 ${iconColorClass}`}
                    aria-hidden
                  >
                    {icon}
                  </span>
                );
              })()}
            </li>
          );
        })}
      </ol>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-gray-100 bg-gray-50 flex-wrap">
        {/* Navigation Action */}
        {!isNavigating ? (
          <button
            onClick={startNavigation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 border border-green-700 rounded-lg hover:bg-green-700 transition-colors shadow-sm active:scale-95"
          >
            <Play className="w-3 h-3 fill-current" strokeWidth={2.5} />
            Start Navigation
          </button>
        ) : (
          <button
            onClick={stopNavigation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 border border-red-700 rounded-lg hover:bg-red-700 transition-colors shadow-sm active:scale-95"
          >
            <Square className="w-3 h-3 fill-blue-100" strokeWidth={2.5} />
            Stop Navigation
          </button>
        )}
        
        {/* Toggle */}
        {canToggle && (
          <button
            id={`directions-toggle-${message.id}`}
            onClick={() => setView(v => v === 'campus' ? 'google' : 'campus')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3 h-3" strokeWidth={2.5} />
            {view === 'campus' ? 'Switch to Google Maps view' : 'Switch to Campus Road view'}
          </button>
        )}
        {/* View on Map */}
        {onViewMap && (
          <button
            id={`view-on-map-${message.id}`}
            onClick={onViewMap}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-sm active:scale-95"
          >
            <Map className="w-3 h-3" strokeWidth={2.5} />
            View on Map
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  locations = [],
  onViewMap,
  onGetDirections,
}) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const isBot = message.role === 'bot';
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const locationImg = useMemo(() => {
    // If the bot provided a suggestedLocationId, prefer that image (existing behavior)
    if (isBot && message.suggestedLocationId) {
      const loc =
        locations.find(l => l.id === message.suggestedLocationId) ||
        CAMPUS_DATA.locations.find(l => l.id === message.suggestedLocationId);
      return loc?.imageData ? `data:image/jpeg;base64,${loc.imageData}` : loc?.imageUrl;
    }

    // If the bot is speaking about OAU as a whole (generic mentions), show the campus gate image
    if (isBot && !message.suggestedLocationId && !message.suppressGenericOauImage) {
      const text = (message.content || '').toLowerCase();
      const isOauGeneric = /\b(obafemi awolowo university|obafemi awolowo|\boau\b|o\.a\.u\b|the university)\b/i.test(text);
      if (isOauGeneric) {
        const gate = locations.find(l => l.id === 'campus_gate_bus_stop') || CAMPUS_DATA.locations.find(l => l.id === 'campus_gate_bus_stop');
        if (gate) return gate.imageData ? `data:image/jpeg;base64,${gate.imageData}` : gate.imageUrl;
      }
    }

    return null;
  }, [isBot, message.suggestedLocationId, locations]);

  // Resolve the location name for the "Get Directions" button
  const suggestedLocName = useMemo(() => {
    if (!message.suggestedLocationId) return null;
    const loc =
      locations.find(l => l.id === message.suggestedLocationId) ||
      CAMPUS_DATA.locations.find(l => l.id === message.suggestedLocationId);
    return loc?.name ?? null;
  }, [message.suggestedLocationId, locations]);

  const isDirectionsMode = !!message.directionsPayload;
  const isDescriptionMode = !!message.isDescriptionMode;

  return (
    <div className={`w-full mb-6 flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {/* Bot Avatar */}
      {isBot && (
        <img src="/logo.png" alt="Bot Avatar" className="w-8 h-8 rounded-full shadow-sm shrink-0 mt-1" />
      )}

      <div className={`max-w-[80%] flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>

        {/* Message Bubble */}
        <div
          className={`
            px-4 py-3 rounded-2xl shadow-sm w-full
            ${isBot
              ? 'bg-[#f3f4f6] text-gray-800 rounded-tl-sm'
              : 'bg-blue-600 text-white rounded-tr-sm'}
          `}
        >
          {locationImg && message.directionsStatus !== 'error' && (
            <div
              className="w-full h-36 mb-3 mt-1 rounded-lg overflow-hidden bg-gray-200 border border-gray-300/30 shadow-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsImageOpen(true)}
            >
              <img src={locationImg} alt="Location reference" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Bot text (description or brief directions intro) */}
          <div className={`prose prose-sm ${!isBot && 'prose-invert'} max-w-none prose-p:leading-relaxed`}>
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium no-underline border-b-2 border-blue-200/60 hover:border-blue-600 hover:text-blue-700 transition-all duration-300"
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Mode A — offer directions */}
          {isBot && isDescriptionMode && !isDirectionsMode && (
            <p className="text-[13px] text-gray-500 mt-2 italic">
              Would you like turn-by-turn directions to this location?
            </p>
          )}

          {/* Mode B — directions panel */}
          {isBot && isDirectionsMode && (
            <DirectionsPanel message={message} onViewMap={onViewMap} />
          )}

          {/* Transient loading / retry UI for directions fetch */}
          {isBot && !isDirectionsMode && (message.directionsStatus === 'loading' || message.directionsStatus === 'retrying') && (
            <div className="mt-3 flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-3 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 animate-spin" />
              <div className="text-sm text-gray-600">
                {message.content}
              </div>
            </div>
          )}

          {/* Directions error UI */}
          {isBot && !isDirectionsMode && message.directionsStatus === 'error' && (
            <div className="mt-3 w-full rounded-lg border border-red-100 bg-red-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-red-700">⚠️ Directions unavailable</h4>
                  <p className="text-xs text-red-600 mt-1">We couldn't load the route due to a network issue.</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    if (suggestedLocName && onGetDirections) onGetDirections(suggestedLocName);
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Retry Directions
                </button>
                <button
                  onClick={() => onViewMap && onViewMap()}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  View on Map
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-1 text-[11px] text-gray-400 font-medium px-1 flex items-center justify-between w-full">
          <span>{formattedTime}</span>
        </div>

        {/* ---- Action buttons row ---- */}
        <div className="flex flex-wrap gap-2 mt-1.5">

          {/* Mode A — Get Directions button */}
          {isBot && isDescriptionMode && !isDirectionsMode && suggestedLocName && onGetDirections && (
            <button
              id={`get-directions-${message.id}`}
              onClick={() => onGetDirections(suggestedLocName)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all w-fit shadow-sm hover:shadow active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" strokeWidth={2.5} />
              Get Directions
            </button>
          )}

          {/* View on Map — only show when the assistant actually suggested a specific location */}
          {isBot && !isDirectionsMode && suggestedLocName && onViewMap && (
            <button
              id={`view-map-${message.id}`}
              onClick={onViewMap}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-all w-fit border border-blue-200/50 shadow-sm hover:shadow active:scale-95"
            >
              <Map className="w-3.5 h-3.5" strokeWidth={2.5} />
              View on Map
            </button>
          )}
        </div>

        {/* Grounding Info (Maps/Search) */}
        {isBot && message.groundingMetadata && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.groundingMetadata.groundingChunks?.map((chunk: any, idx: number) => {
              if (chunk.web?.uri) {
                return (
                  <a
                    key={idx}
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {chunk.web.title || 'Source'}
                  </a>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {!isBot && (
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <span className="text-[13px] font-bold">U</span>
        </div>
      )}

      {isImageOpen && locationImg && (
        <ImageModal
          imageUrl={locationImg}
          altText="Location reference"
          onClose={() => setIsImageOpen(false)}
        />
      )}
    </div>
  );
};