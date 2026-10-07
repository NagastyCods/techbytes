/**
 * Load .env once, then export typed settings the rest of the app can import.
 * If a required value is missing, we fail fast so you don't debug a half-booted server.
 */
require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env.`);
  }
  return value;
}

const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: required('MONGODB_URI'),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  siteUrl: (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  siteName: process.env.SITE_NAME || 'TechBytes',
  siteTagline: process.env.SITE_TAGLINE || 'Tech news without the noise',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || process.env.SITE_NAME || 'TechBytes'
};

env.isProd = env.nodeEnv === 'production';

module.exports = env;
