const express = require('express');
const { getInvite, acceptInvite } = require('../controllers/invite.controller');

const router = express.Router();

// Public routes — no authentication required (invite link is the credential)
router.get('/:token', getInvite);
router.post('/:token/accept', acceptInvite);

module.exports = router;
