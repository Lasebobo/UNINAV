import type { RouteResult } from './services/routeService';

/**
 * Holds both routing engine results so the UI can toggle between
 * OSRM campus-road view and Google Maps street-name view without a
 * second API call.
 */
export interface DirectionsPayload {
  locationId: string;
  locationName: string;
  /** On-campus OSRM route (may be null if OSRM failed) */
  osrmRoute: RouteResult | null;
  /** Google Maps route via /api/route proxy (may be null if off-campus or API failed) */
  googleRoute: RouteResult | null;
}

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  retrievedContext?: string[]; // To show what the RAG system found
  groundingMetadata?: any; // For Maps/Search links
  suggestedLocationId?: string; // Optional suggested location pointer
  /** Present when the message is a MODE B directions response */
  directionsPayload?: DirectionsPayload;
  /** True for MODE A messages — renders "Get Directions" button */
  isDescriptionMode?: boolean;
  /** Optional transient directions status while fetching */
  directionsStatus?: 'loading' | 'retrying' | 'error';
  /** How many retry attempts have been made so far (informational) */
  directionsRetryCount?: number;
}

export interface CampusLocation {
  id: string;
  name: string;
  aliases: string[];
  type: 'academic' | 'facility' | 'transport' | 'residential' | 'landmark' | 'health' | 'custom';
  description: string;
  coords: { x: number; y: number }; // Percentage 0-100 on schematic
  lat?: number; // Real-world Latitude
  lng?: number; // Real-world Longitude
  imageUrl?: string; // Preview image
  imageData?: string; // Base64 encoded image data
}

export interface RouteInfo {
  id: string;
  fromId: string;
  toId: string;
  distance: string; // e.g., "500m"
  timeWalking: string; // e.g., "6 mins"
  shuttleAvailable: boolean;
  shuttleFare?: string;
  description: string;
}

// The structure of our Knowledge Base
export interface KnowledgeBase {
  locations: CampusLocation[];
  routes: RouteInfo[];
  generalInfo: string[]; // General rules, opening hours, etc.
}

// For our simulated Retrieval engine
export interface SearchResult {
  content: string;
  score: number;
  source: string;
}