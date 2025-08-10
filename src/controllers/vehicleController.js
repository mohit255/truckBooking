const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dayjs = require('dayjs');

function getDocumentStatus(vehicle) {
  if (!vehicle.isActive) return 'Inactive';
  const today = dayjs();
  const expired = [vehicle.rcValidTill, vehicle.permitValidTill, vehicle.insuranceValidTill]
    .some((d) => d && dayjs(d).isBefore(today, 'day'));
  return expired ? 'Documents Expired' : 'Active';
}

exports.listVehicles = async (req, res) => {
  const { 
    type, 
    vehicleNumber: rawVehicleNumber,
    sourceCity, 
    destinationCity, 
    malik: rawMalik, 
    contact: rawContact, 
    firm: rawFirm, 
    status: rawStatus,
    q: rawQ 
  } = req.query;
  
  const malik = rawMalik ? rawMalik.trim() : undefined;
  const contact = rawContact ? rawContact.trim() : undefined;
  const firm = rawFirm ? rawFirm.trim() : undefined;
  const vehicleNumber = rawVehicleNumber ? rawVehicleNumber.trim() : undefined;
  const status = rawStatus ? rawStatus.trim() : undefined;
  const q = rawQ ? rawQ.trim() : undefined;
  
  const where = {
    AND: [
      type ? { vehicleType: type } : {},
      vehicleNumber ? { vehicleNumber: { contains: vehicleNumber } } : {},
      sourceCity ? { preferredRouteSourceCityId: Number(sourceCity) } : {},
      destinationCity ? { preferredRouteDestinationCityId: Number(destinationCity) } : {},
      malik ? { ownerName: { contains: malik } } : {},
      contact ? { ownerContact: { contains: contact } } : {},
      firm ? { firm: { contains: firm } } : {},
      status ? { isActive: status === 'active' } : {},
      q ? {
        OR: [
          { vehicleNumber: { contains: q } },
          { firm: { contains: q } },
          { ownerName: { contains: q } },
          { ownerContact: { contains: q } },
          { preferredRouteSourceCity: { name: { contains: q } } },
          { preferredRouteDestinationCity: { name: { contains: q } } }
        ]
      } : {}
    ]
  };
  
  const [vehicles, cities] = await Promise.all([
    prisma.vehicle.findMany({ 
      where, 
      orderBy: { id: 'desc' }, 
      include: { 
        preferredRouteSourceCity: true, 
        preferredRouteDestinationCity: true 
      } 
    }),
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);
  
  const withStatus = vehicles.map(v => ({ ...v, status: getDocumentStatus(v) }));
  res.render('vehicles/index', { vehicles: withStatus, query: req.query || {}, cities });
};

exports.newVehicleForm = async (req, res) => {
  const cities = await prisma.city.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.render('vehicles/new', { cities });
};

exports.createVehicle = async (req, res) => {
  try {
    const data = req.body;
    const preferredRouteSourceCityId = data.preferredRouteSourceCityId ? Number(data.preferredRouteSourceCityId) : null;
    const preferredRouteDestinationCityId = data.preferredRouteDestinationCityId ? Number(data.preferredRouteDestinationCityId) : null;
    await prisma.vehicle.create({
      data: {
        vehicleNumber: data.vehicleNumber,
        vehicleType: data.vehicleType,
        firm: data.firm || null,
        ownerName: data.ownerName,
        ownerContact: data.ownerContact,
        preferredRouteSourceCityId,
        preferredRouteDestinationCityId
      }
    });
    req.flash('success', 'Vehicle created');
    res.redirect('/vehicles');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Failed to create vehicle');
    res.redirect('/vehicles/new');
  }
};

exports.editVehicleForm = async (req, res) => {
  const id = Number(req.params.id);
  const [vehicle, cities] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id } }),
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);
  if (!vehicle) return res.status(404).send('Not found');
  res.render('vehicles/edit', { vehicle, cities });
};

exports.updateVehicle = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const preferredRouteSourceCityId = data.preferredRouteSourceCityId ? Number(data.preferredRouteSourceCityId) : null;
    const preferredRouteDestinationCityId = data.preferredRouteDestinationCityId ? Number(data.preferredRouteDestinationCityId) : null;
    await prisma.vehicle.update({
      where: { id },
      data: {
        vehicleNumber: data.vehicleNumber,
        vehicleType: data.vehicleType,
        firm: data.firm || null,
        ownerName: data.ownerName,
        ownerContact: data.ownerContact,
        preferredRouteSourceCityId,
        preferredRouteDestinationCityId,
        isActive: data.isActive === 'on'
      }
    });
    req.flash('success', 'Vehicle updated');
    res.redirect('/vehicles');
  } catch (e) {
    console.error(e);
    if (e.code === 'P2002') {
      req.flash('error', 'Vehicle number already exists');
    } else {
      req.flash('error', 'Failed to update vehicle');
    }
    res.redirect(`/vehicles/${req.params.id}/edit`);
  }
};

exports.exportVehicles = async (req, res) => {
  try {
    const { 
      type, 
      vehicleNumber: rawVehicleNumber,
      sourceCity, 
      destinationCity, 
      malik: rawMalik, 
      contact: rawContact, 
      firm: rawFirm, 
      status: rawStatus,
      q: rawQ 
    } = req.query;
    
    const malik = rawMalik ? rawMalik.trim() : undefined;
    const contact = rawContact ? rawContact.trim() : undefined;
    const firm = rawFirm ? rawFirm.trim() : undefined;
    const vehicleNumber = rawVehicleNumber ? rawVehicleNumber.trim() : undefined;
    const status = rawStatus ? rawStatus.trim() : undefined;
    const q = rawQ ? rawQ.trim() : undefined;
    
    const where = {
      AND: [
        type ? { vehicleType: type } : {},
        vehicleNumber ? { vehicleNumber: { contains: vehicleNumber } } : {},
        sourceCity ? { preferredRouteSourceCityId: Number(sourceCity) } : {},
        destinationCity ? { preferredRouteDestinationCityId: Number(destinationCity) } : {},
        malik ? { ownerName: { contains: malik } } : {},
        contact ? { ownerContact: { contains: contact } } : {},
        firm ? { firm: { contains: firm } } : {},
        status ? { isActive: status === 'active' } : {},
        q ? {
          OR: [
            { vehicleNumber: { contains: q } },
            { firm: { contains: q } },
            { ownerName: { contains: q } },
            { ownerContact: { contains: q } },
            { preferredRouteSourceCity: { name: { contains: q } } },
            { preferredRouteDestinationCity: { name: { contains: q } } }
          ]
        } : {}
      ]
    };
    
    const vehicles = await prisma.vehicle.findMany({ 
      where, 
      orderBy: { id: 'desc' }, 
      include: { 
        preferredRouteSourceCity: true, 
        preferredRouteDestinationCity: true 
      } 
    });
    
    const csvData = vehicles.map(v => ({
      'Vehicle ID': v.id,
      'Vehicle Number': v.vehicleNumber,
      'Vehicle Type': v.vehicleType,
      'Firm': v.firm || '',
      'Owner Name': v.ownerName,
      'Owner Contact': v.ownerContact,
      'Source City': v.preferredRouteSourceCity?.name || '',
      'Destination City': v.preferredRouteDestinationCity?.name || '',
      'Route': v.preferredRouteSourceCity && v.preferredRouteDestinationCity ? 
        `${v.preferredRouteSourceCity.name} → ${v.preferredRouteDestinationCity.name}` : '',
      'Status': v.isActive ? 'Active' : 'Inactive',
      'Created Date': new Date(v.createdAt).toISOString().slice(0,10)
    }));
    
    const csv = require('csv-stringify');
    csv.stringify(csvData, { header: true }, (err, output) => {
      if (err) {
        console.error('CSV generation error:', err);
        return res.status(500).send('Failed to generate CSV');
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="vehicles_${new Date().toISOString().slice(0,10)}.csv"`);
      res.send(output);
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).send('Export failed');
  }
};


