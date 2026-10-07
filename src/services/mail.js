const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass }
    });
  }
  return transporter;
}

/** Sends mail when SMTP is configured. Never throws — signup should still succeed. */
async function sendMail({ to, subject, text, html }) {
  const mailer = getTransporter();
  if (!mailer) return { skipped: true };
  try {
    await mailer.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text,
      html: html || text
    });
    return { sent: true };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { skipped: true, error: err.message };
  }
}

async function sendWelcomeEmail(email) {
  return sendMail({
    to: email,
    subject: `You’re on the ${env.siteName} briefing list`,
    text: `Thanks for subscribing to ${env.siteName}. We’ll send occasional tech news — not a daily firehose.\n\n${env.siteUrl}`
  });
}

module.exports = { sendMail, sendWelcomeEmail };
