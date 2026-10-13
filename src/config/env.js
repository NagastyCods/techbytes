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

function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  // Preview and production hostnames Vercel injects (no protocol).
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

function jwtSecret() {
  const value = process.env.JWT_SECRET;
  if (isProd && (!value || value === 'dev-only-change-me')) {
    throw new Error('Set JWT_SECRET to a long random string before deploying.');
  }
  return value || 'dev-only-change-me';
}

const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv,
  mongoUri: required('MONGODB_URI'),
  jwtSecret: jwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  siteUrl: siteUrl(),
  siteName: process.env.SITE_NAME || 'TechBytes',
  siteTagline: process.env.SITE_TAGLINE || 'Tech news without the noise',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || process.env.SITE_NAME || 'TechBytes',
  isProd
};

module.exports = env;
