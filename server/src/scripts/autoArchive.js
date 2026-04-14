require('dotenv').config();
const { autoArchiveInactive } = require('../services/archive.service');

const run = async () => {
  try {
    console.log('Starting auto-archive job...');

    const results = await autoArchiveInactive();

    console.log(`Auto-archive completed. Archived: ${results.archived}, Failed: ${results.failed}`);
    process.exit(0);
  } catch (err) {
    console.error('Auto-archive job failed:', err);
    process.exit(1);
  }
};

run();
