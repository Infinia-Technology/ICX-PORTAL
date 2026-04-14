const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ where: { role: 'supplier' }, take: 1 });
  if (users.length === 0) return console.log('No supplier found');
  
  const userId = users[0].id;
  const listings = await prisma.listing.findMany({ where: { supplier_id: userId }, include: { supplier: true } });
  
  console.log('--- SAMPLED LISTING ---');
  if (listings.length > 0) {
    const item = listings[0];
    const mapped = {
      ...item,
      _id: item.id,
      totalUnits: item.total_units,
      bookedUnits: item.booked_units,
      availableUnits: item.available_units,
      pricePerUnit: item.price,
      pricingPeriod: item.contract_duration,
      createdAt: item.created_at,
    };
    console.log(JSON.stringify(mapped, null, 2));
  } else {
    console.log('No listings found for supplier', userId);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
