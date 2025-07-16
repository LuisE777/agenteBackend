const express = require('express');
const router = express.Router();
const {evaluation} = require('../controllers/huggingFace.controller');


router.get('/evaluation/formative', evaluation);

module.exports = router;
