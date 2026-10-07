const jwt = require('jsonwebtoken');
const env = require('../config/env');

const COOKIE_NAME = 'tb_token';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function signUserToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verifyUserToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript on the page cannot read this — helps against XSS stealing the session
    secure: env.isProd, // HTTPS-only cookies in production
    sameSite: 'lax',
    maxAge: WEEK_MS,
    path: '/'
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

module.exports = {
  COOKIE_NAME,
  signUserToken,
  verifyUserToken,
  setAuthCookie,
  clearAuthCookie
};
