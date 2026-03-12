const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

router.get('/my', auth, groupController.getMyGroups);
router.get('/member', auth, groupController.getMyMemberGroups);
router.get('/public-sessions', auth, groupController.getPublicSessions);
router.post('/', auth, groupController.createGroup);
router.delete('/:id', auth, groupController.deleteGroup);

router.get('/:id/members', auth, groupController.getGroupMembers);
router.post('/join', auth, groupController.joinGroupByCode);
router.post('/:id/leave', auth, groupController.leaveGroup);
router.delete('/:id/members/:memberId', auth, groupController.removeMember);

router.get('/:id/sessions', auth, groupController.getGroupSessions);
router.post('/:id/sessions', auth, groupController.createSession);
router.delete('/:id/sessions/:sessionId', auth, groupController.deleteSession);
router.put('/:id/sessions/:sessionId/toggle-public', auth, groupController.togglePublic);

router.post('/:id/sessions/:sessionId/signup', auth, groupController.signupSession);
router.put('/sessions/:sessionId/cancel', auth, groupController.cancelSignup);

module.exports = router;