import { supabase } from '../utils/supabase';
import { SearchResult, CampusLocation, Message } from '../types';
import { generateGeminiResponse, GeminiResponse } from './geminiService';

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

export const processQuery = async (
  userQuery: string, 
  history: Message[] = [],
  customLocations: CampusLocation[] = [],
  userLocation?: { lat: number, lng: number }
): Promise<{ answer: string; context: string[]; groundingMetadata?: any; suggestedLocationId?: string }> => {
  
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
       finalPrompt += `\n\n[System Note: The user's current GPS location is Latitude ${userLocation.lat}, Longitude ${userLocation.lng}. Use this for calculating routes, but NEVER display these raw coordinates in your response. Describe their location using nearby landmarks instead.]`;
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

  // 1. MAPS/NAVIGATION INTENT
  // Keywords: where is, find, locate, directions, map, near me, route
  if (lowerQuery.match(/\b(where|find|locate|directions|map|near|route)\b/)) {
    let mapsQuery = userQuery;
    if (!lowerQuery.includes('oau') && !lowerQuery.includes('obafemi')) {
      mapsQuery = `${userQuery} (context: Obafemi Awolowo University, Ile-Ife)`;
    }
    
    const response = await generateGeminiResponse(formatHistory(mapsQuery), {
      modelType: 'maps',
      location: userLocation,
      systemInstruction: "You are a helpful campus guide. Use the Google Maps tool to find real-world location info. You assist with navigation both within the Obafemi Awolowo University (OAU) campus and provide directions from outside locations (other cities, states, bus stops, etc.) to the campus. Be detailed with transport options and estimated times. IMPORTANT: Never display raw latitude and longitude coordinates in your response. Instead of using raw coordinates, use recognizable campus landmarks and context (e.g., 'opposite the Faculty of Pharmacy', 'near the main gate') to describe locations and give directions."
    });

    if (response.isError) return generateFallbackResponse(userQuery, allLocations);

    return { 
        answer: response.text, 
        context: ["Used Google Maps Grounding"], 
        groundingMetadata: response.groundingMetadata,
        suggestedLocationId: getSuggestedLocation(response.text)
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
    You are the OAU Campus Guide.
    Use the provided context to answer if possible. If the context does not contain the answer, use your built-in knowledge or Google Search to find the information. Do not say "the provided context does not include information". Provide the best possible answer or directions.
    IMPORTANT: Never display raw latitude and longitude coordinates in your response. Always use recognizable campus landmarks and context (e.g., 'opposite the Faculty of Pharmacy', 'near the main gate') to describe locations and give directions.
    Keep it concise.
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