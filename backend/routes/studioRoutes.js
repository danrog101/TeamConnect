const express = require('express');
const router = express.Router();
const studioController = require('../controllers/studioController');
const auth = require('../middleware/auth');

// Studios
router.get('/my', auth, studioController.getMyStudios);
router.get('/member', auth, studioController.getMyMemberStudios);
router.post('/', auth, studioController.createStudio);
router.delete('/:id', auth, studioController.deleteStudio);

// Members
router.get('/:id/members', auth, studioController.getStudioMembers);
router.post('/:id/members', auth, studioController.addMember);
router.delete('/:id/members/:memberId', auth, studioController.removeMember);

// Sessions
router.get('/:id/sessions', auth, studioController.getStudioSessions);
router.post('/:id/sessions', auth, studioController.createSession);
router.delete('/:id/sessions/:sessionId', auth, studioController.deleteSession);

// Signups
router.post('/:id/sessions/:sessionId/signup', auth, studioController.signupSession);
router.put('/sessions/:sessionId/cancel', auth, studioController.cancelSignup);

module.exports = router;