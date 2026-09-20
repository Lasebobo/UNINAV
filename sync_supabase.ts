import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { CAMPUS_DATA } from './data/campusData';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
  console.log(`Syncing ${CAMPUS_DATA.locations.length} locations to Supabase...`);
  
  for (const loc of CAMPUS_DATA.locations) {
    const payload = {
      id: loc.id,
      name: loc.name,
      aliases: loc.aliases || [],
      type: loc.type,
      description: loc.description || '',
      coordsX: loc.coords?.x ?? null,
      coordsY: loc.coords?.y ?? null,
      lat: loc.lat ?? null,
      lng: loc.lng ?? null,
      imageUrl: loc.imageUrl ?? null,
      imageData: loc.imageData ?? null,
      verified: true
    };
    
    const { error } = await supabase
      .from('Location')
      .upsert(payload, { onConflict: 'id' });
      
    if (error) {
      console.error(`Error upserting ${loc.name}:`, error);
    } else {
      console.log(`Successfully synced: ${loc.name}`);
    }
  }
  
  console.log("Sync complete!");
}

sync().catch(console.error);
