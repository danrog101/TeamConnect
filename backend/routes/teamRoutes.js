const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

// ✅ Get all teams - PUBLIC route (everyone can see)
router.get('/', teamController.getAllTeams);

// ✅ Get MY teams - PRIVATE route (must be BEFORE /:id!)
router.get('/my', auth, teamController.getMyTeams);

// ✅ Get single team - PUBLIC route
router.get('/:id', teamController.getTeamById);

// ✅ Create team - PRIVATE route
router.post('/', auth, teamController.createTeam);

// ✅ Join team - PRIVATE route
router.post('/:id/join', auth, teamController.joinTeam);

// ✅ Leave team - PRIVATE route
router.post('/:id/leave', auth, teamController.leaveTeam);

// ✅ Update team - PRIVATE route
router.put('/:id', auth, teamController.updateTeam);

// ✅ Delete team - PRIVATE route
router.delete('/:id', auth, teamController.deleteTeam);

// ✅ Get team messages - PRIVATE route
router.get('/:id/messages', auth, teamController.getTeamMessages);

// ✅ Send team message - PRIVATE route
router.post('/:id/messages', auth, teamController.sendTeamMessage);

// ✅ Get team stats - PUBLIC route
router.get('/:id/stats', teamController.getTeamStats);

// ✅ Get team members - PRIVATE route (for team creator to see registered players)
router.get('/:id/members', auth, teamController.getTeamMembers);

module.exports = router;