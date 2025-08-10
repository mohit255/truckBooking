const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');

router.get('/', cityController.listCities);
router.get('/new', cityController.newCityForm);
router.post('/', cityController.createCity);
router.get('/:id/edit', cityController.editCityForm);
router.post('/:id/toggle', cityController.toggleActive);
router.put('/:id', cityController.updateCity);

module.exports = router;


