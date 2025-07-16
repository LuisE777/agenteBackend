const express = require('express');
const router = express.Router();
const {evaluation} = require('../controllers/novita.controller');


router.get('/evaluation/formative', evaluation);

module.exports = router;
