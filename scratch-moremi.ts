import "dotenv/config";
import { prisma } from './services/dbService.js';
async function run() {
  const loc = await prisma.location.findUnique({ where: { id: 'moremi' } });
  console.log('Location moremi:', loc);
  const loc2 = await prisma.location.findUnique({ where: { id: 'moremi_hall' } });
  console.log('Location moremi_hall:', loc2);
  
  // also delete routes that have fromId='moremi' or toId='moremi'
  const delRoutes = await prisma.route.deleteMany({
    where: { OR: [{ fromId: 'moremi' }, { toId: 'moremi' }] }
  });
  console.log('Deleted routes with moremi:', delRoutes);

  // also delete routes that have fromId='moremi_hall' or toId='moremi_hall'
  const delRoutes2 = await prisma.route.deleteMany({
    where: { OR: [{ fromId: 'moremi_hall' }, { toId: 'moremi_hall' }] }
  });
  console.log('Deleted routes with moremi_hall:', delRoutes2);
  
  // now delete location
  const delLoc = await prisma.location.deleteMany({
    where: { id: 'moremi' }
  });
  console.log('Deleted location moremi:', delLoc);
  
  const delLoc2 = await prisma.location.deleteMany({
    where: { id: 'moremi_hall' }
  });
  console.log('Deleted location moremi_hall:', delLoc2);
}
run().catch(console.error).finally(() => prisma.$disconnect());
