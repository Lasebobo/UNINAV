import pkg from 'pg';
const { Client } = pkg;
import { CAMPUS_DATA } from './data/campusData';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function sync() {
  const client = new Client({
    connectionString: 'postgresql://postgres.weaisrpqcfphiskvbdel:Lasebobo%4010@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require'
  });
  
  await client.connect();
  console.log('Connected to PostgreSQL!');
  
  // Create a parameterized query for upserting
  const query = `
    INSERT INTO "Location" (id, name, aliases, type, description, "coordsX", "coordsY", lat, lng, "imageUrl", "imageData", verified, "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      aliases = EXCLUDED.aliases,
      type = EXCLUDED.type,
      description = EXCLUDED.description,
      "coordsX" = EXCLUDED."coordsX",
      "coordsY" = EXCLUDED."coordsY",
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      "imageUrl" = EXCLUDED."imageUrl",
      "imageData" = EXCLUDED."imageData",
      verified = EXCLUDED.verified,
      "updatedAt" = EXCLUDED."updatedAt";
  `;
  
  for (const loc of CAMPUS_DATA.locations) {
    try {
      await client.query(query, [
        loc.id,
        loc.name,
        loc.aliases || [],
        loc.type,
        loc.description || '',
        loc.coords?.x ?? null,
        loc.coords?.y ?? null,
        loc.lat ?? null,
        loc.lng ?? null,
        loc.imageUrl ?? null,
        loc.imageData ?? null,
        true,
        new Date().toISOString()
      ]);
      console.log(`Upserted ${loc.id}`);
    } catch (e) {
      console.error(`Failed to upsert ${loc.id}:`, e);
    }
  }
  
  await client.end();
  console.log('Done!');
}

sync().catch(console.error);
