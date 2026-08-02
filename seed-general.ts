import "dotenv/config";
import { prisma } from './services/dbService';
import { CAMPUS_DATA } from './data/campusData';

async function main() {
  console.log('Seeding General Info only...');
  // Clear existing to prevent duplicates on re-seed since we don't have static IDs
  await prisma.generalInfo.deleteMany();
  for (const info of CAMPUS_DATA.generalInfo) {
    await prisma.generalInfo.create({
      data: {
        content: info,
      },
    });
  }
  console.log('General Info seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
