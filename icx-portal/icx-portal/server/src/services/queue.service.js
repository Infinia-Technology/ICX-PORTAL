const QueueItem = require('../models/QueueItem');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Create a queue item and assign to all active admins/superadmins.
 * Also creates in-app notifications for each assigned admin.
 */
const createQueueItem = async ({ type, referenceId, referenceModel, priority = 0 }) => {
  const admins = await User.find({
    role: { $in: ['admin', 'superadmin'] },
    isActive: true,
  }).select('_id');

  const assignedTo = admins.map((a) => a._id);

  const item = await QueueItem.create({
    type,
    referenceId,
    referenceModel,
    assignedTo,
    priority,
    status: 'NEW',
  });

  // Create notifications for each admin
  const notifications = assignedTo.map((adminId) => ({
    userId: adminId,
    type: 'NEW_QUEUE_ITEM',
    title: 'New item in review queue',
    message: `A new ${type.replace(/_/g, ' ')} submission is awaiting review.`,
    link: `/admin/queue/${item._id}`,
  }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  return item;
};

/**
 * Update queue item status when admin takes action.
 */
const updateQueueStatus = async (referenceId, referenceModel, status) => {
  await QueueItem.updateMany(
    { referenceId, referenceModel },
    { $set: { status } }
  );
};

module.exports = { createQueueItem, updateQueueStatus };
