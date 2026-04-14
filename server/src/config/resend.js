const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('WARNING: RESEND_API_KEY is not defined. Email functionality will be disabled.');
}

const resend = resendApiKey ? new Resend(resendApiKey) : {
  emails: {
    send: () => {
      console.warn('Attempted to send email but RESEND_API_KEY is missing.');
      return Promise.resolve({ data: null, error: 'Missing API Key' });
    }
  }
};

module.exports = resend;
