import "dotenv/config";
import { prisma } from '../services/dbService';
import { CAMPUS_DATA } from '../data/campusData';

async function main() {
  console.log('Starting to seed the database...');

  // 1. Seed Locations
  console.log('Seeding Locations...');
  for (const loc of CAMPUS_DATA.locations) {
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
