const mongoose = require('mongoose');

const brokerDcCompanySchema = new mongoose.Schema({
  brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  legalEntity: { type: String, required: true },
  officeAddress: { type: String, required: true },
  countryOfIncorp: { type: String, required: true },
  contactName: String,
  contactEmail: String,
  contactMobile: String,
}, { timestamps: true });

module.exports = mongoose.model('BrokerDcCompany', brokerDcCompanySchema);
