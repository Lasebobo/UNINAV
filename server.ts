import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Groq from 'groq-sdk';

const rawApiKey = process.env.GROQ_API_KEY || process.env.API_KEY;
const apiKey = rawApiKey ? rawApiKey.trim() : null;

if (!apiKey) {
  console.error("CRITICAL: GROQ_API_KEY is missing from environment variables.");
} else {
  console.log("GROQ_API_KEY is present and loaded.");
}

const groq = apiKey ? new Groq({ apiKey }) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", apiKeyPresent: !!apiKey });
  });

  app.get('/api/route', async (req, res) => {
    const { originLat, originLng, destLat, destLng } = req.query;

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=walking&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.routes?.length) {
        return res.status(404).json({ error: 'No route found', status: data.status });
      }

      const route = data.routes[0];
      const leg   = route.legs[0];

      res.json({
        polyline:      route.overview_polyline.points,
        steps:         leg.steps.map((step: any) => ({
          instruction: step.html_instructions,          // HTML — stripped client-side
          distance:    step.distance?.text  ?? '',
          duration:    step.duration?.text  ?? '',
          maneuver:    step.maneuver        ?? '',      // e.g. "turn-left"
        })),
        totalDistance: leg.distance?.text  ?? '',
        totalDuration: leg.duration?.text  ?? '',
        startAddress:  leg.start_address   ?? '',
        endAddress:    leg.end_address     ?? '',
      });
    } catch (err) {
      console.error('Route Proxy Error:', err);
      res.status(500).json({ error: 'Failed to fetch route' });
    }
  });

  // Fetch OAU campus road + building data from OpenStreetMap (free, no billing)
  app.get('/api/campus-roads', async (req, res) => {
    try {
      // OAU campus bounding box: south, west, north, east
      const bbox = '7.505,4.510,7.535,4.535';
      const query = `[out:json][timeout:30];(way["highway"](${bbox});way["building"](${bbox});way["landuse"~"grass|park|garden|recreation_ground"](${bbox}););out geom;`;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) throw new Error(`Overpass error: ${response.status}`);
      const data = await response.json();
      // Cache for 1 hour
      res.set('Cache-Control', 'public, max-age=3600');
      res.json(data);
    } catch (err) {
      console.error('Campus roads error:', err);
      res.status(500).json({ error: 'Failed to fetch campus roads', elements: [] });
    }
  });


  app.post("/api/chat", async (req, res) => {
    if (!groq) {
      return res.status(500).json({ text: "API Key is missing. Please configure it in your environment variables." });
    }

    const maxRetries = 3;
    let attempt = 0;
    let currentModel = '';

    while (attempt <= maxRetries) {
      try {
        const { prompt, options } = req.body;
        
        let baseModel = 'llama-3.3-70b-versatile'; 

        switch (options.modelType) {
          case 'fast':
            baseModel = 'llama-3.1-8b-instant';
            break;
          case 'thinking':
          case 'maps':
          case 'search':
          case 'balanced':
          default:
            baseModel = 'llama-3.3-70b-versatile'; 
            break;
        }

        let model = baseModel;

        // Fallback logic: If we've failed before, try a different model
        if (attempt > 0) {
          if (attempt === 1) {
            // First retry: Try a slightly older or Lite version
            if (baseModel === 'llama-3.3-70b-versatile') model = 'llama-3.1-8b-instant';
            else if (baseModel === 'llama-3.1-8b-instant') model = 'mixtral-8x7b-32768';
          } else if (attempt === 2) {
            // Second retry: Try the lightest model
            model = 'mixtral-8x7b-32768';
          } else {
            // Final retry: Safest lite model
            model = 'mixtral-8x7b-32768';
          }
        }
        
        currentModel = model;

        const messages: any[] = [];

        /**
         * SYSTEM INSTRUCTION POLICY (enforced by ragService.ts)
         * -------------------------------------------------------
         * The systemInstruction passed in options is set by ragService.ts
         * per-call and enforces the following strict rules for ALL model types:
         *
         * MODE A (description queries — "where is X"):
         *   - 3 sentences max: what it is / campus position / one detail.
         *   - NEVER generate walking steps or directions.
         *
         * MODE B (directions — "how do I get to X"):
         *   - Direction steps ALWAYS come from the routing engine (OSRM / Google Maps).
         *   - NEVER generate, estimate, or invent steps, distances, or times.
         *   - If routing fails: prescribed fallback message only.
         *
         * ALL MODES:
         *   - NEVER display raw lat/lng coordinates.
         *   - NEVER mention landmarks not in the campus knowledge base.
         *   - NEVER mention bus stops / transport points not in campus data.
         */
        if (options.systemInstruction) {
          messages.push({ role: 'system', content: options.systemInstruction });
        }
        
        if (Array.isArray(prompt)) {
          prompt.forEach(msg => {
            const role = msg.role === 'model' ? 'assistant' : 'user';
            let contentStr = '';
            if (msg.parts && Array.isArray(msg.parts)) {
              contentStr = msg.parts.map((p: any) => String(p.text || '')).join('\n');
            } else if (typeof msg === 'string') {
              contentStr = msg;
            } else {
              contentStr = JSON.stringify(msg);
            }
            messages.push({ role, content: String(contentStr) });
          });
        } else {
          messages.push({ role: 'user', content: String(prompt) });
        }

        console.log("Sending messages to Groq:", JSON.stringify(messages, null, 2));

        const response = await groq.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
        });

        return res.json({
          text: response.choices[0]?.message?.content || "No response generated.",
          modelUsed: model
        });
      } catch (error: any) {
        attempt++;
        
        // If it's a rate limit error and we have retries left, wait and try again
        const isRateLimit = error?.status === 429 || 
                      error?.message?.includes("429") || 
                      error?.message?.includes("Rate limit");

        if (isRateLimit && attempt <= maxRetries) {
          console.warn(`Groq rate limit error on ${currentModel}, retrying (attempt ${attempt}/${maxRetries})...`);
          // Exponential backoff: 3s, 9s, 27s
          const waitTime = Math.pow(3, attempt) * 1000; 
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        console.error("Groq Error:", error);
        
        let errorMessage = "I encountered an error connecting to the campus network.";
        
        if (error?.message?.includes("Invalid API Key")) {
          errorMessage = "The Groq API key is invalid. Please update your API key in the application settings.";
        } else if (isRateLimit) {
          errorMessage = "The AI service quota has been exceeded. Please try again later or check your Groq API limits.";
        } else if (error?.status === 503 || error?.message?.includes("high demand") || error?.message?.includes("UNAVAILABLE")) {
          errorMessage = "The AI model is currently experiencing high demand. I tried multiple times but the service is still overloaded. Please try again in a minute.";
        } else if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
          errorMessage = "Authentication or configuration error with the AI service. Please check your API key.";
        }

        return res.status(500).json({ text: errorMessage });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
