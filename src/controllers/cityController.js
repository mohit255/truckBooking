const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.listCities = async (req, res) => {
  const cities = await prisma.city.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  res.render('cities/index', { cities });
};

exports.newCityForm = (req, res) => {
  res.render('cities/new');
};

exports.createCity = async (req, res) => {
  try {
    const { name, state } = req.body;
    await prisma.city.create({ data: { name, state: state || null, isActive: true } });
    req.flash('success', 'City created');
  } catch (e) {
    if (e.code === 'P2002') req.flash('error', 'City name already exists');
    else req.flash('error', 'Failed to create city');
  }
  res.redirect('/cities');
};

exports.editCityForm = async (req, res) => {
  const id = Number(req.params.id);
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) return res.status(404).send('Not found');
  res.render('cities/edit', { city });
};

exports.updateCity = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { name, state, isActive } = req.body;
    await prisma.city.update({ where: { id }, data: { name, state: state || null, isActive: isActive === 'on' } });
    req.flash('success', 'City updated');
  } catch (e) {
    if (e.code === 'P2002') req.flash('error', 'City name already exists');
    else req.flash('error', 'Failed to update city');
  }
  res.redirect('/cities');
};

exports.toggleActive = async (req, res) => {
  const id = Number(req.params.id);
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) return res.status(404).send('Not found');
  await prisma.city.update({ where: { id }, data: { isActive: !city.isActive } });
  req.flash('success', 'City status updated');
  res.redirect('/cities');
};


