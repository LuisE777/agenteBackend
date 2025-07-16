const express = require('express');
const router = express.Router();
const {evaluation} = require('../controllers/openai.controller');

router.get('/prompts', evaluation);

module.exports = router;
