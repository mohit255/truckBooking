const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/', reportController.dashboard);
router.get('/details', reportController.detailsJson);
router.get('/export/bookings.csv', reportController.exportBookingsCsv);
router.get('/bookings', reportController.bookingsReport);

module.exports = router;


