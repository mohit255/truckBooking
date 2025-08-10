const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Cities
  const cities = ['Pune', 'Mumbai', 'Nagpur', 'Bengaluru', 'Hyderabad'];
  for (const name of cities) {
    await prisma.city.upsert({ where: { name }, update: {}, create: { name, isActive: true } });
  }
  const pune = await prisma.city.upsert({ where: { name: 'Pune' }, update: {}, create: { name: 'Pune' } });
  const mumbai = await prisma.city.upsert({ where: { name: 'Mumbai' }, update: {}, create: { name: 'Mumbai' } });

  const v1 = await prisma.vehicle.upsert({
    where: { vehicleNumber: 'MH12AB1234' },
    update: {},
    create: {
      vehicleNumber: 'MH12AB1234',
      vehicleType: 'CONTAINER_32FT',
      ownerName: 'Rahul Sharma',
      ownerContact: '9876543210',
      preferredRouteSourceCityId: pune.id,
      preferredRouteDestinationCityId: mumbai.id
    }
  });

  const booking = await prisma.booking.create({
    data: {
      partyName: 'ABC Traders',
      partyContact: '9999912345',

      requestedVehicle: 'CONTAINER_32FT',
      vehicleId: v1.id,
      malikName: v1.ownerName,
      malikRate: 18000,
      partyRate: 20000,
      commission: 2000,
      status: 'PENDING'
    }
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      totalFromParty: booking.partyRate,
      amountPayableMalik: booking.malikRate,
      commissionEarned: booking.commission,
      paymentStatus: 'PARTY_PENDING'
    }
  });

  console.log('Seeded');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());


