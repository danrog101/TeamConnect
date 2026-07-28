const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getConversations, getMessages, sendMessage } = require('../controllers/dmController');

router.get('/conversations', auth, getConversations);
router.get('/:otherId', auth, getMessages);
router.post('/send', auth, sendMessage);

module.exports = router;