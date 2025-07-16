const express = require('express');
const router = express.Router();
const {start,question,evaluation,openingProcess} = require('../controllers/croq.controller');

router.get('/', start);
router.get('/question', question);
router.get('/opening_process', openingProcess);
router.get('/evaluation/formative', evaluation);

module.exports = router;
