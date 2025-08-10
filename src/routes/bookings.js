const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/', bookingController.listBookings);
router.get('/export', bookingController.exportBookings);
router.get('/new', bookingController.newBookingForm);
router.post('/', bookingController.createBooking);
router.get('/:id/edit', bookingController.editBookingForm);
router.put('/:id', bookingController.updateBookingStatus);

module.exports = router;


