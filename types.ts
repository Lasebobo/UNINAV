export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  retrievedContext?: string[]; // To show what the RAG system found
  groundingMetadata?: any; // For Maps/Search links
  suggestedLocationId?: string; // Optional suggested location pointer
}

export interface CampusLocation {
  id: string;
  name: string;
  aliases: string[];
  type: 'academic' | 'facility' | 'transport' | 'residential' | 'custom';
  description: string;
  coords: { x: number; y: number }; // Percentage 0-100 on schematic
  lat?: number; // Real-world Latitude
  lng?: number; // Real-world Longitude
  imageUrl?: string; // Preview image
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