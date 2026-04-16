require('dotenv').config();
const prisma = require('../config/prisma');
const { notifyRefreshReminder } = require('../services/notification.service');

const run = async () => {
  try {
    console.log('Starting send refresh reminders job...');

    // Lookback period: 15-30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Find all listings (DC & GPU) that haven't been updated in 15-30 days and are approved
    const listings = await prisma.listing.findMany({
      where: {
        status: 'APPROVED',
        archived_at: null,
        updated_at: { gte: thirtyDaysAgo, lte: fifteenDaysAgo },
      }
    });

    console.log(`Found ${listings.length} listings needing refresh reminder`);

    for (const listing of listings) {
      try {
        // Find the owner user of the organization
        const user = await prisma.user.findFirst({ 
          where: { organization_id: listing.organization_id } 
        });
        
        if (user) {
          const daysInactive = Math.floor(
            (new Date() - new Date(listing.updated_at)) / (1000 * 60 * 60 * 24),
          );
          
          await notifyRefreshReminder({
            userId: user.id,
            organizationId: listing.organization_id,
            listingName: listing.data_center_name || listing.name || 'Your Listing',
            listingType: listing.type === 'DC_SITE' ? 'DC' : 'GPU',
            listingId: listing.id,
            daysInactive,
          });
          
          console.log(`Sent refresh reminder for ${listing.type} listing ${listing.id}`);
        }
      } catch (err) {
        console.error(`Failed to send reminder for listing ${listing.id}:`, err);
      }
    }

    console.log('Send refresh reminders job completed.');
    process.exit(0);
  } catch (err) {
    console.error('Send refresh reminders job failed:', err);
    process.exit(1);
  }
};

run();
