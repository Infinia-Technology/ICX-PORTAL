require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../config/db');
const { autoArchiveInactive } = require('../services/archive.service');

const run = async () => {
  try {
    console.log('Starting auto-archive job...');

    await db();

    const results = await autoArchiveInactive();

    console.log(`Auto-archive completed. Archived: ${results.archived}, Failed: ${results.failed}`);
    process.exit(0);
  } catch (err) {
    console.error('Auto-archive job failed:', err);
    process.exit(1);
  }
};

run();
