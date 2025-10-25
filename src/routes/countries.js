const express = require('express');
const router = express.Router();
const controller = require('../controllers/countriesController');

router.post('/refresh', controller.refresh);
router.post('/', controller.createOne);
router.get('/image', controller.getImage);
router.get('/', controller.getAll);
router.get('/:name', controller.getOne);
router.put('/:name', controller.updateOne);
router.delete('/:name', controller.deleteOne);

module.exports = router;
