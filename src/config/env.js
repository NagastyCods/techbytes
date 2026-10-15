/**
 * Load .env once, then export typed settings the rest of the app can import.
 * If a required value is missing, we fail fast so you don't debug a half-booted server.
 */
require('dotenv').config();

/**
 * Vercel’s env editor keeps a trailing newline when a value is pasted.
 * A newline on MONGODB_URI makes Mongo reject the string immediately,
 * and every page then 500s — including /admin/login and /favicon.ico.
 */
function readEnv(name) {
  const raw = process.env[name];
  if (raw == null) return '';
  let value = String(raw).replace(/^\uFEFF/, '').replace(/[\r\n]+/g, '').trim();
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function required(name) {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env.`);
  }
  return value;
}

/** Percent-encode userinfo so a password containing @ or : still parses. */
function encodeUserInfo(value) {
  if (!value) return '';
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  return encodeURIComponent(decoded);
}

function normalizeMongoUri(uri) {
  const match = String(uri).match(/^(mongodb(?:\+srv)?:\/\/)([\s\S]*)$/i);
  if (!match) return uri;
  const rest = match[2];
  const at = rest.lastIndexOf('@');
  if (at <= 0) return uri;
  const auth = rest.slice(0, at);
  const colon = auth.indexOf(':');
  if (colon <= 0) return uri;
  const user = auth.slice(0, colon);
  const pass = auth.slice(colon + 1);
  return `${match[1]}${encodeUserInfo(user)}:${encodeUserInfo(pass)}@${rest.slice(at + 1)}`;
}

function siteUrl() {
  const configured = readEnv('SITE_URL');
  if (configured) return configured.replace(/\/+$/, '');
  // Preview and production hostnames Vercel injects (no protocol).
  const productionHost = readEnv('VERCEL_PROJECT_PRODUCTION_URL');
  if (readEnv('VERCEL_ENV') === 'production' && productionHost) {
    return `https://${productionHost}`;
  }
  const vercelHost = readEnv('VERCEL_URL');
  if (vercelHost) return `https://${vercelHost}`;
  return 'http://localhost:3000';
}

const nodeEnv = readEnv('NODE_ENV') || 'development';
const isProd = nodeEnv === 'production';

function jwtSecret() {
  const value = readEnv('JWT_SECRET');
  if (isProd && (!value || value === 'dev-only-change-me')) {
    throw new Error('Set JWT_SECRET to a long random string before deploying.');
  }
  return value || 'dev-only-change-me';
}

const env = {
  port: Number(readEnv('PORT')) || 3000,
  nodeEnv,
  mongoUri: normalizeMongoUri(required('MONGODB_URI')),
  jwtSecret: jwtSecret(),
  jwtExpiresIn: readEnv('JWT_EXPIRES_IN') || '7d',
  siteUrl: siteUrl(),
  siteName: readEnv('SITE_NAME') || 'TechBytes',
  siteTagline: readEnv('SITE_TAGLINE') || 'Tech news without the noise',
  smtpHost: readEnv('SMTP_HOST'),
  smtpPort: Number(readEnv('SMTP_PORT')) || 587,
  smtpUser: readEnv('SMTP_USER'),
  smtpPass: readEnv('SMTP_PASS'),
  smtpFrom: readEnv('SMTP_FROM') || readEnv('SITE_NAME') || 'TechBytes',
  isProd
};

module.exports = env;
