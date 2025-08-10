const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/', vehicleController.listVehicles);
router.get('/export', vehicleController.exportVehicles);
router.get('/new', vehicleController.newVehicleForm);
router.post('/', vehicleController.createVehicle);
router.get('/:id/edit', vehicleController.editVehicleForm);
router.put('/:id', vehicleController.updateVehicle);

module.exports = router;


