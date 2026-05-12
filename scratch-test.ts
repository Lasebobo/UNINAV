import "dotenv/config";
import { prisma } from './services/dbService';

async function testQueries() {
  try {
    console.log("🔍 Testing connection to Supabase...");
    
    console.log("\n1️⃣ Fetching Locations (limit 3)...");
    const locations = await prisma.location.findMany({ take: 3 });
    console.log(locations.map(l => `- ${l.name} (Aliases: ${l.aliases.join(', ')})`).join('\n'));

    console.log("\n2️⃣ Fetching Routes (limit 3)...");
    const routes = await prisma.route.findMany({ take: 3 });
    console.log(routes.map(r => `- Route from ${r.fromId} to ${r.toId} (${r.distance}, ${r.timeWalking})`).join('\n'));

    console.log("\n3️⃣ Fetching General Info (limit 2)...");
    const info = await prisma.generalInfo.findMany({ take: 2 });
    console.log(info.map(i => `- ${i.content}`).join('\n'));

    console.log("\n✅ All queries executed successfully!");
  } catch (error) {
    console.error("❌ Error running queries:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries();
