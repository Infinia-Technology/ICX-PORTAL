const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
