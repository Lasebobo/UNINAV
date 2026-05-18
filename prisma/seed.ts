import "dotenv/config";
import { prisma } from '../services/dbService';
import { CAMPUS_DATA } from '../data/campusData';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Starting to seed the database...');

  // Helper function to get image data
  const getImageData = (imageUrl?: string): string | null => {
    if (!imageUrl || !imageUrl.startsWith('images/')) return null;
    const imagePath = path.join(__dirname, '..', 'public', imageUrl);
    if (fs.existsSync(imagePath)) {
      const buffer = fs.readFileSync(imagePath);
      return buffer.toString('base64');
    }
    return null;
  };

  // 1. Seed Locations
  console.log('Seeding Locations...');
  for (const loc of CAMPUS_DATA.locations) {
    const imageData = getImageData(loc.imageUrl);
    await prisma.location.upsert({
      where: { id: loc.id },
      update: {
        name: loc.name,
        aliases: loc.aliases,
        type: loc.type,
        description: loc.description,
        coordsX: loc.coords.x,
        coordsY: loc.coords.y,
        lat: loc.lat,
        lng: loc.lng,
        imageUrl: loc.imageUrl,
        imageData: imageData,
      },
      create: {
        id: loc.id,
        name: loc.name,
        aliases: loc.aliases,
        type: loc.type,
        description: loc.description,
        coordsX: loc.coords.x,
        coordsY: loc.coords.y,
        lat: loc.lat,
        lng: loc.lng,
        imageUrl: loc.imageUrl,
        imageData: imageData,
      },
    });
  }

  // 2. Seed Routes
  console.log('Seeding Routes...');
  for (const route of CAMPUS_DATA.routes) {
    await prisma.route.upsert({
      where: { id: route.id },
      update: {
        fromId: route.fromId,
        toId: route.toId,
        distance: route.distance,
        timeWalking: route.timeWalking,
        shuttleAvailable: route.shuttleAvailable,
        shuttleFare: route.shuttleFare,
        description: route.description,
      },
      create: {
        id: route.id,
        fromId: route.fromId,
        toId: route.toId,
        distance: route.distance,
        timeWalking: route.timeWalking,
        shuttleAvailable: route.shuttleAvailable,
        shuttleFare: route.shuttleFare,
        description: route.description,
      },
    });
  }

  // 3. Seed General Info
  console.log('Seeding General Info...');
  // Clear existing to prevent duplicates on re-seed since we don't have static IDs
  await prisma.generalInfo.deleteMany();
  for (const info of CAMPUS_DATA.generalInfo) {
    await prisma.generalInfo.create({
      data: {
        content: info,
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
