const cron = require('node-cron');
const prisma = require('./config/prisma');
const { autoArchiveInactive } = require('./services/archive.service');
const { notifyRefreshReminder } = require('./services/notification.service');

// Auto-archive inactive listings — runs daily at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Running auto-archive job...');
  try {
    const results = await autoArchiveInactive();
    console.log(`[CRON] Auto-archive complete: ${results.archived} archived, ${results.failed} failed`);
  } catch (err) {
    console.error('[CRON] Auto-archive failed:', err);
  }
});

// Send refresh reminders for stale listings — runs daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Running refresh reminders job...');
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const staleListings = await prisma.listing.findMany({
      where: {
        status: 'APPROVED',
        archived_at: null,
        updated_at: { gte: thirtyDaysAgo, lte: fifteenDaysAgo }
      },
      include: { supplier: true }
    });

    let sent = 0;
    for (const listing of staleListings) {
      try {
        const daysInactive = Math.floor((Date.now() - new Date(listing.updated_at)) / (1000 * 60 * 60 * 24));
        await notifyRefreshReminder({
          userId: listing.supplier_id,
          listingName: listing.data_center_name || listing.vendorName || 'Your Listing',
          listingType: listing.type,
          listingId: listing.id,
          daysInactive
        });
        sent++;
      } catch (err) {
        console.error(`[CRON] Refresh reminder failed for listing ${listing.id}:`, err.message);
      }
    }
    console.log(`[CRON] Refresh reminders sent: ${sent}`);
  } catch (err) {
    console.error('[CRON] Refresh reminders job failed:', err);
  }
});

console.log('[CRON] Scheduled jobs registered');
