const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.listPayments);
router.get('/export', paymentController.exportPayments);
router.get('/:bookingId', paymentController.viewPaymentByBooking);
router.post('/:bookingId/party-pay', paymentController.recordPartyPayment);
router.post('/:bookingId/malik-pay', paymentController.recordMalikPayment);

module.exports = router;


