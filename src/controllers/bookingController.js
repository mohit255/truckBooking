const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateCommission(partyRate, malikRate) {
  return Number(partyRate) - Number(malikRate);
}

exports.listBookings = async (req, res) => {
  const { 
    fromDate, 
    toDate, 
    partyName, 
    status, 
    vehicleType, 
    sourceCityId, 
    destinationCityId, 
    malikName, 
    vehicleNumber, 
    minAmount, 
    maxAmount,
    paymentStatus,
    q
  } = req.query;

  // Build where clause for filtering
  const where = {};
  
  if (fromDate) {
    where.bookingDate = { ...where.bookingDate, gte: new Date(fromDate) };
  }
  
  if (toDate) {
    where.bookingDate = { ...where.bookingDate, lte: new Date(toDate + 'T23:59:59') };
  }
  
  if (partyName) {
    where.partyName = { contains: partyName.trim() };
  }
  
  if (status) {
    where.status = status;
  }
  
  if (vehicleType) {
    where.requestedVehicle = vehicleType;
  }
  
  if (paymentStatus) {
    where.payment = { paymentStatus: paymentStatus };
  }
  
  if (sourceCityId) {
    where.sourceCityId = Number(sourceCityId);
  }
  
  if (destinationCityId) {
    where.destinationCityId = Number(destinationCityId);
  }
  
  if (malikName) {
    where.malikName = { contains: malikName.trim() };
  }
  
  if (vehicleNumber) {
    where.vehicle = { vehicleNumber: { contains: vehicleNumber.trim() } };
  }
  
  if (minAmount || maxAmount) {
    where.partyRate = {};
    if (minAmount) where.partyRate.gte = Number(minAmount);
    if (maxAmount) where.partyRate.lte = Number(maxAmount);
  }
  
  if (q) {
    where.OR = [
      { partyName: { contains: q.trim() } },
      { partyContact: { contains: q.trim() } },
      { malikName: { contains: q.trim() } },
      { pickupAddress: { contains: q.trim() } },
      { dropAddress: { contains: q.trim() } },
      { requestedVehicle: { contains: q.trim() } },
      { vehicle: { vehicleNumber: { contains: q.trim() } } },
      { sourceCity: { name: { contains: q.trim() } } },
      { destinationCity: { name: { contains: q.trim() } } },
      { notes: { contains: q.trim() } }
    ];
  }

  const [bookings, cities] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { 
        vehicle: true, 
        payment: true,
        sourceCity: true,
        destinationCity: true
      },
      orderBy: { id: 'desc' }
    }),
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);

  res.render('bookings/index', { 
    bookings, 
    cities, 
    query: req.query 
  });
};

exports.exportBookings = async (req, res) => {
  const { 
    fromDate, 
    toDate, 
    partyName, 
    status, 
    vehicleType, 
    sourceCityId, 
    destinationCityId, 
    malikName, 
    vehicleNumber, 
    minAmount, 
    maxAmount,
    paymentStatus,
    q
  } = req.query;

  // Build where clause for filtering (same as listBookings)
  const where = {};
  
  if (fromDate) {
    where.bookingDate = { ...where.bookingDate, gte: new Date(fromDate) };
  }
  
  if (toDate) {
    where.bookingDate = { ...where.bookingDate, lte: new Date(toDate + 'T23:59:59') };
  }
  
  if (partyName) {
    where.partyName = { contains: partyName.trim() };
  }
  
  if (status) {
    where.status = status;
  }
  
  if (vehicleType) {
    where.requestedVehicle = vehicleType;
  }
  
  if (paymentStatus) {
    where.payment = { paymentStatus: paymentStatus };
  }
  
  if (sourceCityId) {
    where.sourceCityId = Number(sourceCityId);
  }
  
  if (destinationCityId) {
    where.destinationCityId = Number(destinationCityId);
  }
  
  if (malikName) {
    where.malikName = { contains: malikName.trim() };
  }
  
  if (vehicleNumber) {
    where.vehicle = { vehicleNumber: { contains: vehicleNumber.trim() } };
  }
  
  if (minAmount || maxAmount) {
    where.partyRate = {};
    if (minAmount) where.partyRate.gte = Number(minAmount);
    if (maxAmount) where.partyRate.lte = Number(maxAmount);
  }
  
  if (q) {
    where.OR = [
      { partyName: { contains: q.trim() } },
      { partyContact: { contains: q.trim() } },
      { malikName: { contains: q.trim() } },
      { pickupAddress: { contains: q.trim() } },
      { dropAddress: { contains: q.trim() } },
      { requestedVehicle: { contains: q.trim() } },
      { vehicle: { vehicleNumber: { contains: q.trim() } } },
      { sourceCity: { name: { contains: q.trim() } } },
      { destinationCity: { name: { contains: q.trim() } } }
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { 
      vehicle: true, 
      sourceCity: true,
      destinationCity: true
    },
    orderBy: { id: 'desc' }
  });

  // Generate CSV
  const csvStringifier = require('csv-stringify');
  const csvData = bookings.map(b => ({
    'Booking ID': b.id,
    'Date': new Date(b.bookingDate).toISOString().slice(0,10),
    'Party Name': b.partyName || '',
    'Party Contact': b.partyContact || '',
    'Source City': b.sourceCity?.name || '',
    'Destination City': b.destinationCity?.name || '',
    'Pickup Address': b.pickupAddress || '',
    'Drop Address': b.dropAddress || '',
    'Vehicle Type': b.requestedVehicle,
    'Vehicle Number': b.vehicle?.vehicleNumber || '',
    'Malik Name': b.malikName || '',
    'Malik Rate': b.malikRate,
    'Party Rate': b.partyRate,
    'Commission': b.commission,
    'Status': b.status,
    'Notes': b.notes || ''
  }));

  csvStringifier.stringify(csvData, { header: true }, (err, output) => {
    if (err) {
      res.status(500).send('Error generating CSV');
      return;
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bookings_${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(output);
  });
};

exports.newBookingForm = async (req, res) => {
  const [vehicles, cities] = await Promise.all([
    prisma.vehicle.findMany({ where: { isActive: true } }),
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);
  res.render('bookings/new', { vehicles, cities });
};

exports.createBooking = async (req, res) => {
  try {
    const data = req.body;
    const vehicleId = data.vehicleId ? Number(data.vehicleId) : null;
    let malikName = data.malikName || null;
    let selectedVehicle = null;
    if (vehicleId) {
      selectedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (selectedVehicle) {
        malikName = selectedVehicle.ownerName;
      }
    }
    // Cities by ID
    const sourceCityId = data.sourceCityId ? Number(data.sourceCityId) : null;
    const destinationCityId = data.destinationCityId ? Number(data.destinationCityId) : null;
    
    // Validate contact number (if provided)
    if (data.partyContact && data.partyContact.length !== 10) {
      req.flash('error', 'Contact number must be exactly 10 digits');
      return res.redirect('/bookings/new');
    }
    
    const commission = calculateCommission(data.partyRate, data.malikRate);

    const booking = await prisma.booking.create({
      data: {
        bookingDate: data.bookingDate ? new Date(data.bookingDate) : new Date(),
        partyName: data.partyName,
        partyContact: data.partyContact || null,
        sourceCityId,
        destinationCityId,
        pickupAddress: data.pickupAddress || null,
        dropAddress: data.dropAddress || null,
        requestedVehicle: data.requestedVehicle,
        vehicleId,
        malikName,
        malikRate: data.malikRate,
        partyRate: data.partyRate,
        commission,
        status: data.status || 'PENDING',
        notes: data.notes || null
      }
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        totalFromParty: data.partyRate,
        amountPayableMalik: data.malikRate,
        commissionEarned: commission,
        paymentStatus: 'PARTY_PENDING'
      }
    });

    req.flash('success', 'Booking created');
    res.redirect('/bookings');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Failed to create booking');
    res.redirect('/bookings/new');
  }
};

exports.editBookingForm = async (req, res) => {
  const adminRole = req?.session?.user?.role;
  console.log(adminRole);
  const id = Number(req.params.id);
  const booking = await prisma.booking.findUnique({ 
    where: { id }, 
    include: { 
      vehicle: true,
      sourceCity: true,
      destinationCity: true
    } 
  });
  const [vehicles, cities] = await Promise.all([
    prisma.vehicle.findMany({ where: { isActive: true } }),
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);
  if (!booking) return res.status(404).send('Not found');
  res.render('bookings/edit', { adminRole, booking, vehicles, cities });
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const vehicleId = data.vehicleId ? Number(data.vehicleId) : null;
    let malikName = data.malikName || null;
    if (vehicleId) {
      const selectedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (selectedVehicle) malikName = selectedVehicle.ownerName;
    }
    // Optional city changes
    const sourceCityId = data.sourceCityId ? Number(data.sourceCityId) : undefined;
    const destinationCityId = data.destinationCityId ? Number(data.destinationCityId) : undefined;
    
    // Validate contact number (if provided)
    if (data.partyContact && data.partyContact.length !== 10) {
      req.flash('error', 'Contact number must be exactly 10 digits');
      return res.redirect(`/bookings/${id}/edit`);
    }
    
    const updateData = {
      partyName: data.partyName,
      partyContact: data.partyContact || null,
      vehicleId,
      malikName,
      status: data.status,
      pickupAddress: data.pickupAddress || null,
      dropAddress: data.dropAddress || null,
      notes: data.notes || null
    };
    if (sourceCityId !== undefined) {
      updateData.sourceCityId = sourceCityId;
    }
    if (destinationCityId !== undefined) {
      updateData.destinationCityId = destinationCityId;
    }

    const updated = await prisma.booking.update({ where: { id }, data: updateData });
    req.flash('success', 'Booking updated');
    res.redirect('/bookings');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Failed to update booking');
    res.redirect(`/bookings/${req.params.id}/edit`);
  }
};


