const resend = require('../config/resend');

const EMAIL_FROM = process.env.EMAIL_FROM || 'support@iamsaif.ai';

const sendEmail = async (to, subject, html) => {
  const { data, error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });

  if (error) {
    console.error('[EMAIL] Send failed:', { to, subject, error });
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  console.log('[EMAIL] Sent:', { to, subject, id: data?.id });
  return data;
};

const sendOtpEmail = async (to, code) => {
  await sendEmail(to, 'ICX Portal — Your Verification Code', `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e;">ICX Portal</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f4f4f8; border-radius: 8px; margin: 24px 0;">
        ${code}
      </div>
      <p style="color: #666;">This code expires in 5 minutes. Do not share it with anyone.</p>
    </div>
  `);
};

const sendRegistrationConfirmation = async (to, role) => {
  await sendEmail(to, 'ICX Portal — Registration Received', `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e;">ICX Portal</h2>
      <p>Thank you for registering as a <strong>${role}</strong>.</p>
      <p>Your application is under review. You will receive an email once your account has been verified.</p>
    </div>
  `);
};

const sendKycApproved = async (to) => {
  await sendEmail(to, 'ICX Portal — Account Approved', `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e;">ICX Portal</h2>
      <p>Your account has been <strong>approved</strong>. You can now log in and start using the platform.</p>
      <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; padding: 12px 24px; background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">Log In</a>
    </div>
  `);
};

const sendKycRejected = async (to, reason) => {
  await sendEmail(to, 'ICX Portal — Account Application Update', `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e;">ICX Portal</h2>
      <p>Unfortunately, your account application has been <strong>rejected</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have questions, please contact our support team.</p>
    </div>
  `);
};

const sendRevisionRequested = async (to, flaggedFields) => {
  const fieldList = flaggedFields.map(f => `<li>${f}</li>`).join('');
  await sendEmail(to, 'ICX Portal — Revision Requested', `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e;">ICX Portal</h2>
      <p>Your submission requires revisions. Please update the following fields:</p>
      <ul>${fieldList}</ul>
      <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; padding: 12px 24px; background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 16px;">Log In to Revise</a>
    </div>
  `);
};

module.exports = {
  sendOtpEmail,
  sendEmail,
  sendRegistrationConfirmation,
  sendKycApproved,
  sendKycRejected,
  sendRevisionRequested,
};
