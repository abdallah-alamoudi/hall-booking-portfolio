const express = require('express');
const hallController = require('./halls.controller');

const router = express.Router();

router.get('/halls', hallController.getHalls);
router.get('/halls/:id', hallController.getHallById);
router.get('/services', hallController.getServices);

module.exports = router;
