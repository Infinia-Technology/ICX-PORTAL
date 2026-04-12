const mongoose = require('mongoose');

const dcPhasingScheduleSchema = new mongoose.Schema({
  dcSiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'DcSite', required: true },
  month: { type: Date, required: true },
  itLoadMw: Number,
  cumulativeItLoadMw: Number,
  scopeOfWorks: String,
  estimatedCapexMusd: Number,
  phase: { type: String, enum: ['Original Phase', 'Expansion 1', 'Expansion 2'] },
  minLeaseDurationYrs: Number,
  nrcRequestMusd: Number,
  initialDepositMusd: Number,
  mrcRequestPerKw: Number,
  mrcInclusions: String,
}, { timestamps: true });

module.exports = mongoose.model('DcPhasingSchedule', dcPhasingScheduleSchema);
