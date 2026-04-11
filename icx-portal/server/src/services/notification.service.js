const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('./email.service');

/**
 * Create a notification for a user
 */
const createNotification = async ({
  userId,
  organizationId,
  type,
  title,
  message,
  actionData,
  link,
  sendEmail = false,
}) => {
  const notification = new Notification({
    userId,
    organizationId,
    type,
    title,
    message,
    actionData,
    link,
  });

  await notification.save();

  // Send email if requested
  if (sendEmail) {
    const user = await User.findById(userId);
    if (user?.email) {
      try {
        await sendNotificationEmail({
          email: user.email,
          title,
          message,
          actionLink: link,
        });
        notification.sentVia = ['in-app', 'email'];
        notification.sentAt = new Date();
        await notification.save();
      } catch (err) {
        console.error(`Failed to send email notification to ${user.email}:`, err);
      }
    }
  }

  return notification;
};

/**
 * Create notifications for multiple users
 */
const createNotificationBatch = async (users, notificationData) => {
  const results = [];

  for (const userId of users) {
    try {
      const notif = await createNotification({
        userId,
        ...notificationData,
      });
      results.push(notif);
    } catch (err) {
      console.error(`Failed to create notification for user ${userId}:`, err);
    }
  }

  return results;
};

/**
 * Notify listing approval
 */
const notifyListingApproved = async ({
  userId, organizationId, listingName, listingType, listingId,
}) => {
  return createNotification({
    userId,
    organizationId,
    type: 'LISTING_APPROVED',
    title: `${listingType} Listing Approved`,
    message: `Your ${listingType.toLowerCase()} listing "${listingName}" has been approved and is now visible in the marketplace.`,
    actionData: { targetModel: listingType === 'DC' ? 'DcApplication' : 'GpuClusterListing', targetId: listingId },
    link: listingType === 'DC' ? `/supplier/dc-listings/${listingId}` : `/supplier/gpu-clusters/${listingId}`,
    sendEmail: true,
  });
};

/**
 * Notify listing rejection
 */
const notifyListingRejected = async ({
  userId, organizationId, listingName, listingType, listingId, reason,
}) => {
  return createNotification({
    userId,
    organizationId,
    type: 'LISTING_REJECTED',
    title: `${listingType} Listing Rejected`,
    message: `Your ${listingType.toLowerCase()} listing "${listingName}" has been rejected. Reason: ${reason}`,
    actionData: { targetModel: listingType === 'DC' ? 'DcApplication' : 'GpuClusterListing', targetId: listingId },
    link: listingType === 'DC' ? `/supplier/dc-listings/${listingId}` : `/supplier/gpu-clusters/${listingId}`,
    sendEmail: true,
  });
};

/**
 * Notify listing archived
 */
const notifyListingArchived = async ({
  userId, organizationId, listingName, listingType, listingId, reason,
}) => {
  return createNotification({
    userId,
    organizationId,
    type: 'LISTING_ARCHIVED',
    title: `${listingType} Listing Archived`,
    message: `Your ${listingType.toLowerCase()} listing "${listingName}" has been archived. Reason: ${reason}`,
    actionData: { targetModel: listingType === 'DC' ? 'DcApplication' : 'GpuClusterListing', targetId: listingId },
    link: listingType === 'DC' ? `/supplier/dc-listings/${listingId}` : `/supplier/gpu-clusters/${listingId}`,
    sendEmail: true,
  });
};

/**
 * Notify admins of new submission
 */
const notifyAdminsNewSubmission = async ({
  listingName, listingType, listingId, organizationName,
}) => {
  const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isActive: true });
  const adminIds = admins.map((a) => a._id);

  const notificationData = {
    type: 'NEW_SUBMISSION',
    title: `New ${listingType} Listing Submitted`,
    message: `${organizationName} has submitted a new ${listingType.toLowerCase()} listing: "${listingName}"`,
    actionData: { targetModel: listingType === 'DC' ? 'DcApplication' : 'GpuClusterListing', targetId: listingId },
    link: `/admin/${listingType === 'DC' ? 'dc-listings' : 'gpu-clusters'}/${listingId}`,
    sendEmail: true,
  };

  return createNotificationBatch(adminIds, notificationData);
};

/**
 * Notify refresh reminder
 */
const notifyRefreshReminder = async ({
  userId, organizationId, listingName, listingType, listingId, daysInactive,
}) => {
  return createNotification({
    userId,
    organizationId,
    type: 'REFRESH_REMINDER',
    title: 'Refresh Your Listing',
    message: `Your ${listingType.toLowerCase()} listing "${listingName}" hasn't been updated in ${daysInactive} days. Consider refreshing it to stay relevant.`,
    actionData: { targetModel: listingType === 'DC' ? 'DcApplication' : 'GpuClusterListing', targetId: listingId },
    link: listingType === 'DC' ? `/supplier/dc-listings/${listingId}/edit` : `/supplier/gpu-clusters/${listingId}/edit`,
    sendEmail: true,
  });
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId) => {
  return Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true },
  );
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { userId, read: false },
    { read: true },
  );
};

/**
 * Get unread notifications count
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, read: false });
};

/**
 * Delete old notifications (older than 90 days)
 */
const deleteOldNotifications = async () => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  return Notification.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
};

module.exports = {
  createNotification,
  createNotificationBatch,
  notifyListingApproved,
  notifyListingRejected,
  notifyListingArchived,
  notifyAdminsNewSubmission,
  notifyRefreshReminder,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteOldNotifications,
};
