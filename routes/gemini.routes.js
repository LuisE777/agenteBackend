const express = require('express');
const router = express.Router();
const {start, question,evaluation} = require('../controllers/gemini.controller');

router.get('/prompts', question);
router.get('/evaluation/formative', evaluation);
router.get('/', start);

module.exports = router;
