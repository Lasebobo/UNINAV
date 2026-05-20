import { supabase } from '../utils/supabase';
import { SearchResult, CampusLocation, Message, DirectionsPayload } from '../types';
import { generateGeminiResponse, GeminiResponse } from './geminiService';
import { fetchBothRoutes } from './routeService';
import { isUserOnCampus, OAU_MAIN_GATE } from '../utils/locationUtils';

const retrieveDocuments = async (query: string, allLocations: CampusLocation[] = []): Promise<SearchResult[]> => {
  const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const results: SearchResult[] = [];

  allLocations.forEach(loc => {
    let score = 0;
    const content = `Location: ${loc.name}. Type: ${loc.type}. Details: ${loc.description}. Aliases: ${loc.aliases.join(', ')}`;
    const contentLower = content.toLowerCase();
    queryTokens.forEach(token => { if (contentLower.includes(token)) score += 3; });
    if (score > 0) results.push({ content, score, source: 'Location DB' });
  });

  const { data: dbRoutes } = await supabase.from('Route').select('*');
  (dbRoutes || []).forEach(route => {
    let score = 0;
    const fromLoc = allLocations.find(l => l.id === route.fromId)?.name || route.fromId;
    const toLoc = allLocations.find(l => l.id === route.toId)?.name || route.toId;
    const content = `Route: ${fromLoc} to ${toLoc}. Distance: ${route.distance}. Time: ${route.timeWalking}. Shuttle: ${route.shuttleAvailable ? 'Yes' : 'No'}. Details: ${route.description}`;
    const contentLower = content.toLowerCase();
    queryTokens.forEach(token => { if (contentLower.includes(token)) score += 2; });
    if (score > 0) results.push({ content, score, source: 'Route DB' });
  });

  const { data: dbInfo } = await supabase.from('GeneralInfo').select('*');
  (dbInfo || []).forEach(info => {
    let score = 0;
    const infoLower = info.content.toLowerCase();
    queryTokens.forEach(token => { if (infoLower.includes(token)) score += 1; });
    if (score > 0) results.push({ content: info.content, score, source: 'General Info' });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 3);
};

const findLocationInQuery = (query: string, locations: CampusLocation[]): string | undefined => {
  const lowerQuery = query.toLowerCase();
  // Sort by name length descending to match specific names before substrings if any
  const sorted = [...locations].sort((a,b) => b.name.length - a.name.length);
  
  for (const loc of sorted) {
    if (lowerQuery.includes(loc.name.toLowerCase())) return loc.id;
    for (const alias of loc.aliases) {
      if (lowerQuery.includes(alias.toLowerCase())) return loc.id;
    }
  }
  return undefined;
};

const generateFallbackResponse = async (userQuery: string, allLocations: CampusLocation[]): Promise<{ answer: string; context: string[]; suggestedLocationId?: string }> => {
  const searchResults = await retrieveDocuments(userQuery, allLocations);
  const suggestedLocationId = findLocationInQuery(userQuery, allLocations);
  
  if (searchResults.length === 0) {
    return {
      answer: "I couldn't find any information in the local database, and the AI service is currently unavailable to search further. You can try asking about a specific location or building. \n\n[Search Google](https://www.google.com/search?q=" + encodeURIComponent(userQuery + " OAU") + ")",
      context: ["Local DB Fallback (No results)"],
      suggestedLocationId
    };
  }

  let fallbackAnswer = "The AI service is currently unavailable, but I found this information in the local database:\n\n";
  searchResults.forEach((r, idx) => {
    fallbackAnswer += `**Result ${idx + 1}:** ${r.content}\n\n`;
  });

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(userQuery + " Obafemi Awolowo University")}`;
  fallbackAnswer += `[For more details, you can Search Google for this.](${searchUrl})`;

  return {
    answer: fallbackAnswer,
    context: searchResults.map(r => `[${r.source}] ${r.content}`),
    suggestedLocationId
  };
};

// ---------------------------------------------------------------------------
// INTENT DETECTION
// ---------------------------------------------------------------------------

type LocationIntent = 'description' | 'directions' | 'none';

/**
 * Classifies whether the user wants a description of a place (Mode A)
 * or turn-by-turn directions to it (Mode B).
 *
 * Cast as wide a net as possible for directions — it is far safer to route
 * a description query through Mode B (which falls back cleanly) than to let
 * a navigation query reach the LLM and get fabricated steps.
 */
export function detectLocationIntent(query: string): LocationIntent {
  const q = query.toLowerCase();

  // ── MODE B: directions / navigation ───────────────────────────────────────
  // Cast an extremely wide net. It is safer to route a description query through
  // Mode B (which falls back cleanly) than to let any navigation query reach the
  // LLM and get fabricated steps.
  const directionsPatterns = [
    /\bhow\s+do\s+i\s+get\b/,
    /\bhow\s+to\s+get\b/,
    /\bhow\s+can\s+i\s+get\b/,
    /\bdirections?\s+to\b/,
    /\bnavigate\s+to\b/,
    /\broute\s+to\b/,
    /\bget\s+directions\b/,
    /\btake\s+me\s+to\b/,
    /\bway\s+to\s+(the\s+)?\w/,
    /\bpath\s+to\b/,
    /\bguide\s+me\s+to\b/,
    /\bshow\s+me\s+how\s+to\s+get\b/,
    /\bshow\s+me\s+the\s+way\b/,
    /\bi\s+need\s+directions\b/,
    /\bi\s+want\s+to\s+go\s+to\b/,
    /\bwalk\s+to\b/,
    /\bwalking\s+to\b/,
    /\bhead\s+to\b/,
    /\blead\s+me\s+to\b/,
    /\bfind\s+my\s+way\b/,
    /\bfind\s+a\s+route\b/,
    /\bget\s+me\s+to\b/,
    /\bcan\s+you\s+(take|show|guide)\s+me\b/,
    /\bnearest\s+route\b/,
    /\bgoing\s+to\s+the\b/,
    /\bi\s+want\s+directions\b/,
  ];

  if (
    directionsPatterns.some(p => p.test(q)) ||
    q.startsWith('directions') ||
    /^to\s+the\s+/.test(q)
  ) {
    return 'directions';
  }

  // ── MODE A: description / location lookup ─────────────────────────────────
  const descriptionPatterns = [
    /\bwhere\s+is\b/,
    /\bwhere's\b/,
    /\bwhere\s+s\b/,
    /\bwhere\s+are\b/,
    /\bwhat\s+is\b/,
    /\bwhat's\b/,
    /\btell\s+me\s+about\b/,
    /\binformation\s+(on|about)\b/,
    /\bdescribe\b/,
    /\blocate\b/,
    /\bwhat\s+do\s+you\s+know\s+about\b/,
    /\bdetails\s+(of|about|on)\b/,
    // "show me X" but NOT "show me how to get" (that's directions)
    /\bshow\s+me\b(?!\s+how\s+to)/,
    // "find X" but NOT "find my way / find a route" (those are directions)
    /\bfind\b(?!\s+(my\s+way|a\s+route))/,
  ];

  if (descriptionPatterns.some(p => p.test(q))) {
    return 'description';
  }

  return 'none';
}


// ---------------------------------------------------------------------------

export const processQuery = async (
  userQuery: string, 
  history: Message[] = [],
  customLocations: CampusLocation[] = [],
  userLocation?: { lat: number, lng: number }
): Promise<{ answer: string; context: string[]; groundingMetadata?: any; suggestedLocationId?: string; directionsPayload?: DirectionsPayload; isDescriptionMode?: boolean }> => {
  
  const lowerQuery = userQuery.toLowerCase();
  
  // Fetch locations once per query
  const { data: dbLocations } = await supabase.from('Location').select('*');
  const allLocations: CampusLocation[] = [
    ...(dbLocations || []).map(l => ({ 
        id: l.id,
        name: l.name,
        aliases: l.aliases,
        type: l.type as any,
        description: l.description,
        coords: { x: l.coordsX, y: l.coordsY },
        lat: l.lat ?? undefined,
        lng: l.lng ?? undefined,
        imageUrl: l.imageUrl ?? undefined,
        imageData: l.imageData ?? undefined
    })), 
    ...customLocations
  ];
  
  const getSuggestedLocation = (answerText: string = "") => {
    let locId = findLocationInQuery(userQuery, allLocations);
    if (!locId && answerText) locId = findLocationInQuery(answerText, allLocations);
    return locId;
  };

  const formatHistory = (currentPrompt: string) => {
    let finalPrompt = currentPrompt;
    if (userLocation) {
       finalPrompt += `\n\n[System Note: The user's GPS coordinates are Lat ${userLocation.lat}, Lng ${userLocation.lng}. These are for routing engine use only. NEVER describe or guess the user's location — do not say where they currently are.]`;
    }

    const formatted: { role: string; parts: { text: string }[] }[] = [];
    
    for (const msg of history) {
      const role = msg.role === 'bot' ? 'model' : 'user';
      
      // Gemini requires the first message to be from the user
      if (formatted.length === 0 && role === 'model') {
        continue;
      }

      if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
        // Merge with previous message of the same role
        formatted[formatted.length - 1].parts[0].text += `\n\n${msg.content}`;
      } else {
        formatted.push({
          role,
          parts: [{ text: msg.content }]
        });
      }
    }

    // Append current prompt
    if (formatted.length > 0 && formatted[formatted.length - 1].role === 'user') {
      formatted[formatted.length - 1].parts[0].text += `\n\n${finalPrompt}`;
    } else {
      formatted.push({ role: 'user', parts: [{ text: finalPrompt }] });
    }

    return formatted;
  };

  // --- EXACT MATCH INTERCEPTS ---
  if (lowerQuery === 'i need directions') {
    return {
      answer: "I can help you get directions! To provide the best route, I need to know:\n\n1. Where you're starting from\n2. Where you want to go\n\nFor example: 'How do I get from the main gate to the library?', 'Directions from Student Union to Sports Complex', or 'How do I get to OAU from Lagos?'",
      context: ["Preset directions prompt triggered"]
    };
  }

  if (lowerQuery === 'show me all campus locations') {
    const defaultAnswer = `Here are the main locations on campus:

**📚 Buildings:**  
• Hezekiah Oluwasanmi Library  
• Education Trust Fund Building  
• Fajuyi Hall  
• Alumni Hall  

**🏢 Facilities:**  
• Sports Complex  
• Student Union Building  
• University Health Center  
• OAU Conference Center  

**🎓 Departments:**  
• Computer Science Department  

**🏛️ Landmarks:**  
• Oduduwa Hall (Main Amphitheatre)  `;

    // Inject any missing DB items directly dynamically
    let extraAnswer = "";
    (dbLocations || []).forEach(loc => {
       if (!defaultAnswer.includes(loc.name)) {
         extraAnswer += `• ${loc.name}  \n`;
       }
    });

    let finalAnswer = defaultAnswer;
    if (extraAnswer) {
      finalAnswer += `\n\n**📍 Other DB Locations:**  \n${extraAnswer}`;
    }

    return {
      answer: finalAnswer,
      context: ["Generated dynamically from requested template"],
    };
  }

  // --- INTENT ROUTING ---

  // ─────────────────────────────────────────────────────────────────────────
  // CURRENT LOCATION INTERCEPT
  // Handles "where am I", "what's my location", "my current location" etc.
  // Answers from real GPS data — NEVER guesses or invents a position.
  // ─────────────────────────────────────────────────────────────────────────
  const isLocationSelfQuery = /\b(where\s+a*m\s+i|where\s+i\s+a*m|my\s+(current\s+)?location|current\s+location|where\s+are\s+we|my\s+position)\b/i.test(lowerQuery);

  if (isLocationSelfQuery) {
    if (!userLocation) {
      return {
        answer: "I don't have access to your GPS location. Please enable location permissions in your browser so I can tell you where you are.",
        context: ['Self-location query — no GPS data'],
      };
    }
    const onCampus = isUserOnCampus(userLocation);
    let locationNote = '';

    if (onCampus) {
      locationNote = `You are currently **on the OAU campus** (Obafemi Awolowo University, Ile-Ife).`;
    } else {
      // Try to reverse geocode to give a better location than just "off campus"
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`);
        const data = await res.json();
        const place = data.address?.city || data.address?.town || data.address?.state || data.address?.country || 'an off-campus location';
        locationNote = `You appear to be in **${place}** — outside the OAU campus perimeter.`;
      } catch (e) {
        locationNote = `You appear to be **off campus** — outside the OAU campus perimeter.`;
      }
    }

    // Find nearest named location using simple proximity (best-effort from DB)
    let nearestNote = '';
    const locationsWithCoords = allLocations.filter(l => l.lat && l.lng);
    if (locationsWithCoords.length > 0) {
      const nearest = locationsWithCoords.reduce((best, loc) => {
        const d = Math.hypot((loc.lat! - userLocation.lat), (loc.lng! - userLocation.lng));
        const bd = Math.hypot((best.lat! - userLocation.lat), (best.lng! - userLocation.lng));
        return d < bd ? loc : best;
      });
      const distDeg = Math.hypot((nearest.lat! - userLocation.lat), (nearest.lng! - userLocation.lng));
      const distMeters = Math.round(distDeg * 111320);
      if (distMeters < 500) {
        nearestNote = ` The nearest known location in the campus data is **${nearest.name}** (~${distMeters} m away).`;
      }
    }

    return {
      answer: `${locationNote}${nearestNote} You can tap **View on Map** or ask "How do I get to [place name]?" for directions.`,
      context: ['Self-location query — GPS data used'],
      suggestedLocationId: undefined,
    };
  }

  const intent = detectLocationIntent(userQuery);

  // =========================================================================
  // MODE A — DESCRIPTION ONLY
  // User asked "where is X" / "what is X" — give a description and offer directions.
  // =========================================================================
  const suggestedLocationId = getSuggestedLocation();

  if (intent === 'description' && suggestedLocationId) {
    // Build context from local DB first
    const searchResults = await retrieveDocuments(userQuery, allLocations);
    const contextStrings = searchResults.map(r => `[${r.source}] ${r.content}`);

    const modeASystemInstruction = `You are the OAU Campus Navigation Guide.

When a user asks "where is X" or "what is X", respond in EXACTLY this format:
1. One sentence identifying what the place is.
2. One sentence on its general campus position — use ONLY landmarks that exist in the knowledge-base context provided. NEVER invent landmark positions.
3. One relevant detail (facilities, hours, or primary use).
Do NOT include a 4th line or any directions.

RULES (strictly enforced):
- NEVER generate walking steps or turn-by-turn directions.
- NEVER mention landmarks that are not in the provided context.
- NEVER estimate distances or times.
- NEVER display raw latitude/longitude coordinates.
- Keep the total response to 3 sentences.`;

    const prompt = `Context:
${contextStrings.join('\n')}

Question: ${userQuery}`;

    const response = await generateGeminiResponse(formatHistory(prompt), {
      modelType: 'balanced',
      systemInstruction: modeASystemInstruction
    });

    if (response.isError) return generateFallbackResponse(userQuery, allLocations);

    // Resolve AFTER getting the response so the image matches what the model described,
    // not an accidental alias match in the raw user query.
    const suggestedLocationId = getSuggestedLocation(response.text);

    return {
      answer: response.text,
      context: contextStrings,
      suggestedLocationId,
      isDescriptionMode: true,       // Signals the UI to show "Get Directions" button
    };
  }

  // =========================================================================
  // MODE B — DIRECTIONS
  // User asked "how do I get to X" / "directions to X" / tapped Get Directions.
  // Steps ALWAYS come from the routing engine — NEVER from the LLM.
  // =========================================================================
  if (intent === 'directions') {
    const destLoc = suggestedLocationId ? allLocations.find(l => l.id === suggestedLocationId) : null;

    // Resolve origin & destination coordinates
    const origin = userLocation;
    const destination = destLoc?.lat && destLoc?.lng
      ? { lat: destLoc.lat, lng: destLoc.lng }
      : null;

    // If we have real coordinates for both, hit the routing engines in parallel
    let directionsPayload: DirectionsPayload | undefined;

    if (origin && destination) {
      const { osrmRoute, googleRoute } = await fetchBothRoutes(origin, destination);
      directionsPayload = {
        locationId:   suggestedLocationId ?? '',
        locationName: destLoc?.name ?? userQuery,
        osrmRoute,
        googleRoute,
      };
    }

    // Build the text portion of the response
    let answerText: string;
    const locationName = destLoc?.name ?? 'your destination';

    if (!directionsPayload || (!directionsPayload.osrmRoute && !directionsPayload.googleRoute)) {
      // Both engines failed — use the prescribed fallback message
      answerText = `I couldn't load directions right now. Tap **View on Map** to navigate to **${locationName}**.`;
    } else {
      // Show a brief intro — the actual numbered steps are rendered by the UI component
      const route = directionsPayload.osrmRoute ?? directionsPayload.googleRoute!;
      answerText = `Here are walking directions to **${locationName}** (${route.totalDistance} · ${route.totalDuration}).`;
    }

    return {
      answer: answerText,
      context: directionsPayload ? ['Routing engine (OSRM + Google Maps)'] : ['Routing engine unavailable'],
      suggestedLocationId,
      directionsPayload,
    };
  }

  // =========================================================================
  // NAVIGATION SAFETY GUARD
  // =========================================================================
  // Any query that reaches here with navigation-flavoured keywords gets routed
  // through the routing engine — NEVER through the LLM.
  // This is the final catch-all; the LLM must NEVER generate walking steps.
  // =========================================================================
  const isNavigationQuery = lowerQuery.match(
    /\b(directions?|route|navigate|how\s+to\s+get|how\s+do\s+i\s+get|take\s+me\s+to|guide\s+me|get\s+to|walk\s+to|travel\s+to)\b/
  );

  if (isNavigationQuery) {
    // Resolve destination from query; fetch from routing engine only.
    // The LLM is NOT called here under any circumstances.
    const navLocationId = getSuggestedLocation();
    const navDest = navLocationId ? allLocations.find(l => l.id === navLocationId) : null;
    const navOrigin = userLocation;
    const navDestCoords = navDest?.lat && navDest?.lng
      ? { lat: navDest.lat, lng: navDest.lng }
      : null;

    let navPayload: DirectionsPayload | undefined;
    if (navOrigin && navDestCoords) {
      const { osrmRoute, googleRoute } = await fetchBothRoutes(navOrigin, navDestCoords);
      navPayload = {
        locationId:   navLocationId ?? '',
        locationName: navDest?.name ?? 'your destination',
        osrmRoute,
        googleRoute,
      };
    }

    const navName = navDest?.name ?? 'your destination';

    if (!navPayload || (!navPayload.osrmRoute && !navPayload.googleRoute)) {
      return {
        answer: navDest
          ? `I couldn't load directions right now. Tap **View on Map** to navigate to **${navName}**.`
          : `I couldn't find a route for that. Try asking "How do I get to [location name]?" or open the map to browse all locations.`,
        context: ['Navigation safety guard — routing engine required'],
        suggestedLocationId: navLocationId,
      };
    }

    const navRoute = navPayload.osrmRoute ?? navPayload.googleRoute!;
    return {
      answer: `Here are walking directions to **${navName}** (${navRoute.totalDistance} · ${navRoute.totalDuration}).`,
      context: ['Routing engine (OSRM + Google Maps) — safety guard path'],
      suggestedLocationId: navLocationId,
      directionsPayload: navPayload,
    };
  }


  // 2. SEARCH/NEWS INTENT
  // Keywords: news, latest, event, what happened, online, search
  if (lowerQuery.match(/\b(news|latest|event|happened|search|google)\b/)) {
    const response = await generateGeminiResponse(formatHistory(userQuery), {
      modelType: 'search',
      systemInstruction: "You are a smart assistant. Use Google Search to find the latest information."
    });

    if (response.isError) return generateFallbackResponse(userQuery, allLocations);

    return { 
        answer: response.text, 
        context: ["Used Google Search Grounding"], 
        groundingMetadata: response.groundingMetadata,
        suggestedLocationId: getSuggestedLocation(response.text)
    };
  }

  // 3. COMPLEX/REASONING INTENT
  // Keywords: plan, calculate, reason, itinerary, optimize, why
  if (lowerQuery.match(/\b(plan|calculate|itinerary|optimize|compare)\b/) || userQuery.split(' ').length > 15) {
     // Retrieve context first to help the thinking model
     const searchResults = await retrieveDocuments(userQuery, allLocations);
     const contextStrings = searchResults.map(r => r.content);
     const prompt = `Context:\n${contextStrings.join('\n')}\n\nQuery: ${userQuery}`;
     
     const response = await generateGeminiResponse(formatHistory(prompt), {
       modelType: 'thinking',
       systemInstruction: "You are an expert campus planner. Think deeply to provide a comprehensive answer. Use the provided context to answer if possible. If the context does not contain the answer, use your built-in knowledge or Google Search to find the information. Do not say 'the provided context does not include information'. NEVER output raw latitude/longitude coordinates; always use descriptive landmarks."
     });

     if (response.isError) return generateFallbackResponse(userQuery, allLocations);

     return { 
         answer: response.text, 
         context: [...contextStrings, "Used Gemini 3 Pro Thinking"],
         suggestedLocationId: getSuggestedLocation(response.text)
     };
  }

  // 4. STANDARD RAG (FAST/BALANCED)
  const searchResults = await retrieveDocuments(userQuery, allLocations);
  let contextStrings = searchResults.map(r => `[${r.source}] ${r.content}`);
  
  if (contextStrings.length === 0) {
    contextStrings = ["No local database matches found."];
  }

  const systemInstruction = `
    You are the OAU Campus Guide. Answer questions about campus life, departments, facilities, history, and events.
    Use the provided context to answer if possible. If the context does not contain the answer, use your built-in knowledge.
    Do not say "the provided context does not include information" — just give the best answer you can.

    STRICT RULES:
    - NEVER generate walking directions, route steps, or turn-by-turn navigation. If a user asks how to get somewhere, say "Please ask for directions and I will load them from the routing engine."
    - NEVER estimate distances or walking times.
    - NEVER state or guess the user's current location.
    - NEVER display raw latitude/longitude coordinates.
    - Keep responses concise and factual.
  `;
  const prompt = `Context:\n${contextStrings.join('\n')}\n\nQuestion about Obafemi Awolowo University (OAU): ${userQuery}`;

  // Use Lite for very simple greetings, else Balanced (3 Flash)
  const isGreeting = /^(hi|hello|hey|greetings|morning|afternoon|evening|yo)$/i.test(userQuery.trim());
  const modelType = isGreeting ? 'fast' : 'balanced';

  const response = await generateGeminiResponse(formatHistory(prompt), {
    modelType,
    systemInstruction
  });

  if (response.isError) return generateFallbackResponse(userQuery, allLocations);

  return {
    answer: response.text,
    context: contextStrings,
    suggestedLocationId: getSuggestedLocation(response.text)
  };
};