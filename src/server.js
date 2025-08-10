const path = require('path');
const express = require('express');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const morgan = require('morgan');
require('dotenv').config();

const vehicleRoutes = require('./routes/vehicles');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const { requireLogin, attachUser } = require('./middleware/auth');
const reportController = require('./controllers/reportController');
const cityRoutes = require('./routes/cities');

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'devsecret',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());
app.use(attachUser);

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.get('/', (req, res) => {
  if (!req.session?.user) return res.redirect('/login');
  return reportController.dashboard(req, res);
});

app.use(authRoutes);
app.use('/vehicles', requireLogin, vehicleRoutes);
app.use('/bookings', requireLogin, bookingRoutes);
app.use('/payments', requireLogin, paymentRoutes);
app.use('/reports', requireLogin, reportRoutes);
app.use('/cities', requireLogin, cityRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


