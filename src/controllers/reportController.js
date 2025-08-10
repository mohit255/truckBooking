const { PrismaClient } = require('@prisma/client');
const { stringify } = require('csv-stringify');
const prisma = new PrismaClient();

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function parseDateRange(query) {
  const { from, to } = query || {};
  const now = new Date();
  let start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  let end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // If no time part in input, normalize to start/end of day respectively
  if (from && !String(from).includes('T')) start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
  if (to && !String(to).includes('T')) end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);

  if (isNaN(start)) start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  if (isNaN(end)) end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end, from: toDatetimeLocalValue(start), to: toDatetimeLocalValue(end) };
}

exports.bookingsReport = async (req, res) => {
  const { start, end, from, to } = parseDateRange(req.query);
  const where = { bookingDate: { gte: start, lte: end } };

  const [bookings, bookingSums, paymentSums] = await Promise.all([
    prisma.booking.findMany({ 
      where, 
      include: { 
        payment: true,
        sourceCity: true,
        destinationCity: true
      }, 
      orderBy: { bookingDate: 'desc' } 
    }),
    prisma.booking.aggregate({ where, _sum: { partyRate: true, malikRate: true, commission: true } }),
    prisma.payment.aggregate({ where: { booking: { bookingDate: { gte: start, lte: end } } }, _sum: { totalFromParty: true, paidByParty: true, amountPayableMalik: true, paidToMalik: true } })
  ]);

  const totals = {
    totalBookings: bookings.length,
    sumPartyRate: Number(bookingSums._sum.partyRate || 0),
    sumMalikRate: Number(bookingSums._sum.malikRate || 0),
    sumCommission: Number(bookingSums._sum.commission || 0),
    sumPartyPaid: Number(paymentSums._sum.paidByParty || 0),
    sumMalikPaid: Number(paymentSums._sum.paidToMalik || 0),
    partyOutstanding: Number(paymentSums._sum.totalFromParty || 0) - Number(paymentSums._sum.paidByParty || 0),
    malikOutstanding: Number(paymentSums._sum.amountPayableMalik || 0) - Number(paymentSums._sum.paidToMalik || 0)
  };

  res.render('reports/bookings', { bookings, totals, range: { from, to } });
};
async function computeSummary() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [totalBookings, todayBookings, monthBookings, monthlyCommission, paymentStatusGroup] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { bookingDate: { gte: startOfToday, lte: endOfToday } } }),
    prisma.booking.count({ where: { bookingDate: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.booking.aggregate({ _sum: { commission: true }, where: { bookingDate: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.payment.groupBy({ by: ['paymentStatus'], _count: { _all: true } })
  ]);

  const paymentStatusCounts = { ALL_PAID: 0, PARTY_PENDING: 0, MALIK_PENDING: 0 };
  for (const row of paymentStatusGroup) paymentStatusCounts[row.paymentStatus] = row._count._all;

  return {
    totalBookings,
    todayBookings,
    monthBookings,
    commissionThisMonth: monthlyCommission._sum.commission || 0,
    paymentStatusCounts
  };
}

async function computeDetails() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [partyProfitTopGroup, vehicleUsageTopGroup, partyPendingSums, malikPendingSums] = await Promise.all([
    prisma.booking.groupBy({ by: ['partyName'], _sum: { commission: true }, where: { bookingDate: { gte: startOfMonth, lte: endOfMonth } }, orderBy: { _sum: { commission: 'desc' } }, take: 5 }),
    prisma.booking.groupBy({ by: ['vehicleId'], _count: { id: true }, where: { vehicleId: { not: null } }, orderBy: { _count: { id: 'desc' } }, take: 5 }),
    prisma.payment.aggregate({ where: { paymentStatus: 'PARTY_PENDING' }, _sum: { totalFromParty: true, paidByParty: true } }),
    prisma.payment.aggregate({ where: { paymentStatus: 'MALIK_PENDING' }, _sum: { amountPayableMalik: true, paidToMalik: true } })
  ]);

  const partyWiseProfit = partyProfitTopGroup.map(p => ({ partyName: p.partyName, profit: Number(p._sum.commission || 0) }));

  const vehicleIds = vehicleUsageTopGroup.map(v => v.vehicleId).filter(Boolean);
  const vehicles = vehicleIds.length ? await prisma.vehicle.findMany({ where: { id: { in: vehicleIds } } }) : [];
  const idToVehicle = new Map(vehicles.map(v => [v.id, v]));
  const vehicleUsage = vehicleUsageTopGroup.map(v => ({
    vehicleNumber: idToVehicle.get(v.vehicleId)?.vehicleNumber || 'Unassigned',
    ownerName: idToVehicle.get(v.vehicleId)?.ownerName || '',
    count: v._count.id
  }));

  const partyOutstanding = Number(partyPendingSums._sum.totalFromParty || 0) - Number(partyPendingSums._sum.paidByParty || 0);
  const malikOutstanding = Number(malikPendingSums._sum.amountPayableMalik || 0) - Number(malikPendingSums._sum.paidToMalik || 0);

  return { partyWiseProfit, vehicleUsage, partyOutstanding, malikOutstanding };
}

exports.dashboard = async (req, res) => {
  const summary = await computeSummary();
  res.render('reports/dashboard', { ...summary });
};

exports.detailsJson = async (req, res) => {
  try {
    const details = await computeDetails();
    res.json(details);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load details' });
  }
};

exports.exportBookingsCsv = async (req, res) => {
  const { start, end } = parseDateRange(req.query);
  const bookings = await prisma.booking.findMany({ 
    where: { bookingDate: { gte: start, lte: end } }, 
    include: { 
      vehicle: true, 
      payment: true,
      sourceCity: true,
      destinationCity: true
    }, 
    orderBy: { bookingDate: 'desc' } 
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
  const stringifier = stringify({ header: true, columns: [
    'ID','Date','Party','Source','Destination','PickupAddress','DropAddress','VehicleNumber','MalikRate','PartyRate','Commission','PaidByParty','PaidToMalik','PartyDue','MalikDue','Status'
  ]});
  stringifier.pipe(res);
  for (const b of bookings) {
    const paidByParty = Number(b.payment?.paidByParty || 0);
    const paidToMalik = Number(b.payment?.paidToMalik || 0);
    const partyDue = Number(b.partyRate) - paidByParty;
    const malikDue = Number(b.malikRate) - paidToMalik;
    stringifier.write([
      b.id,
      b.bookingDate.toISOString().slice(0,10),
      b.partyName,
      b.sourceCity?.name || '',
      b.destinationCity?.name || '',
      b.pickupAddress || '',
      b.dropAddress || '',
      b.vehicle?.vehicleNumber || '',
      b.malikRate,
      b.partyRate,
      b.commission,
      paidByParty,
      paidToMalik,
      partyDue,
      malikDue,
      b.status
    ]);
  }
  stringifier.end();
};


