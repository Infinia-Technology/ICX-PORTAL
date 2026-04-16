const prisma = require('../config/prisma');

/**
 * Create a queue item and assign to all active admins/superadmins.
 * Also creates in-app notifications for each assigned admin.
 */
const createQueueItem = async ({ type, referenceId, referenceModel, priority = 0 }) => {
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'superadmin'] },
      isActive: true,
    },
    select: { id: true }
  });

  const assignedToIds = admins.map((a) => a.id);

  const item = await prisma.queueItem.create({
    data: {
      type,
      reference_id: referenceId,
      reference_model: referenceModel,
      priority,
      status: 'NEW',
      assigned_to: {
        connect: assignedToIds.map(id => ({ id }))
      }
    },
  });

  // Create notifications for each admin
  if (assignedToIds.length > 0) {
    await prisma.notification.createMany({
      data: assignedToIds.map((adminId) => ({
        user_id: adminId,
        type: 'NEW_QUEUE_ITEM',
        title: 'New item in review queue',
        message: `A new ${type.replace(/_/g, ' ')} submission is awaiting review.`,
        link: `/admin/queue/${item.id}`,
        sent_via: ['in-app']
      }))
    });
  }

  return { ...item, _id: item.id };
};

/**
 * Update queue item status when admin takes action.
 */
const updateQueueStatus = async (referenceId, referenceModel, status) => {
  await prisma.queueItem.updateMany({
    where: { reference_id: referenceId, reference_model: referenceModel },
    data: { status }
  });
};

module.exports = { createQueueItem, updateQueueStatus };
