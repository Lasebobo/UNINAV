# UniNav - OAU Navigation System

UniNav is an intelligent, voice-enabled campus navigation system for Obafemi Awolowo University (OAU). It combines a custom RAG (Retrieval-Augmented Generation) knowledge base with dual routing engines (OSRM for on-campus paths, Google Maps for off-campus routes) to help students and visitors find locations, understand campus landmarks, and get turn-by-turn walking directions.

## Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **AI/LLM:** Groq (Llama-3/Mistral/OpenAI wrappers) for chat & intent routing, Google Gemini 2.5 Flash Native Audio for voice interaction
- **Database:** Supabase (PostgreSQL) for route and general information, in-memory JSON for ultra-fast landmark lookups
- **Mapping & Routing:** Google Maps JavaScript API (satellite view), OSRM (campus road routing), Leaflet (schematic view)
- **Deployment:** Vercel (Frontend & Serverless Functions)

## Running Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   # LLM endpoints
   GROQ_API_KEY=your_groq_api_key
   VITE_GEMINI_API_KEY=your_gemini_api_key

   # Google Maps Directions & Satellite
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # Supabase DB (Routes & Info)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:4000` (or another port if 4000 is occupied).

## Live Deployment

The application is deployed and accessible at:
[https://uninav-lemon.vercel.app/](https://uninav-lemon.vercel.app/)