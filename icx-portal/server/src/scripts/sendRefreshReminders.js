require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../config/db');
const DcApplication = require('../models/DcApplication');
const GpuClusterListing = require('../models/GpuClusterListing');
const User = require('../models/User');
const { notifyRefreshReminder } = require('../services/notification.service');

const run = async () => {
  try {
    console.log('Starting send refresh reminders job...');

    await db();

    // Lookback period: 15-30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Find DC Applications that haven't been updated in 15-30 days and are approved
    const dcListings = await DcApplication.find({
      status: 'APPROVED',
      isArchived: false,
      lastActivityAt: { $gte: thirtyDaysAgo, $lte: fifteenDaysAgo },
    }).populate('organizationId', '_id');

    console.log(`Found ${dcListings.length} DC listings needing refresh reminder`);

    for (const listing of dcListings) {
      try {
        const user = await User.findOne({ organizationId: listing.organizationId._id });
        if (user) {
          const daysInactive = Math.floor(
            (new Date() - new Date(listing.lastActivityAt)) / (1000 * 60 * 60 * 24),
          );
          await notifyRefreshReminder({
            userId: user._id,
            organizationId: listing.organizationId._id,
            listingName: listing.companyLegalEntity || 'Your DC Listing',
            listingType: 'DC',
            listingId: listing._id,
            daysInactive,
          });
          console.log(`Sent refresh reminder for DC listing ${listing._id}`);
        }
      } catch (err) {
        console.error(`Failed to send reminder for DC listing ${listing._id}:`, err);
      }
    }

    // Find GPU Cluster Listings that haven't been updated in 15-30 days and are approved
    const gpuListings = await GpuClusterListing.find({
      status: 'APPROVED',
      isArchived: false,
      lastActivityAt: { $gte: thirtyDaysAgo, $lte: fifteenDaysAgo },
    }).populate('organizationId', '_id');

    console.log(`Found ${gpuListings.length} GPU listings needing refresh reminder`);

    for (const listing of gpuListings) {
      try {
        const user = await User.findOne({ organizationId: listing.organizationId._id });
        if (user) {
          const daysInactive = Math.floor(
            (new Date() - new Date(listing.lastActivityAt)) / (1000 * 60 * 60 * 24),
          );
          await notifyRefreshReminder({
            userId: user._id,
            organizationId: listing.organizationId._id,
            listingName: listing.vendorName || 'Your GPU Listing',
            listingType: 'GPU',
            listingId: listing._id,
            daysInactive,
          });
          console.log(`Sent refresh reminder for GPU listing ${listing._id}`);
        }
      } catch (err) {
        console.error(`Failed to send reminder for GPU listing ${listing._id}:`, err);
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
