const { body, validationResult } = require('express-validator');
const { Subscriber } = require('../../models');
const { wantsJson } = require('../../utils/http');
const { sendWelcomeEmail } = require('../../services/mail');

const subscribeValidators = [
  body('email').trim().isEmail().withMessage('invalid').normalizeEmail()
];

function safeRedirect(value) {
  const path = String(value || '/');
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

function reply(req, res, { code, status, message }) {
  if (wantsJson(req)) {
    return res.status(code).json({ ok: code < 400, status, message });
  }
  const redirectTo = safeRedirect(req.body.redirect);
  const sep = redirectTo.includes('?') ? '&' : '?';
  res.redirect(`${redirectTo}${sep}newsletter=${status}`);
}

async function subscribe(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return reply(req, res, {
        code: 400,
        status: 'invalid',
        message: 'Please enter a valid email address.'
      });
    }

    const email = String(req.body.email).trim().toLowerCase();
    const existing = await Subscriber.findOne({ email });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.subscribedAt = new Date();
        await existing.save();
        sendWelcomeEmail(email);
        return reply(req, res, {
          code: 200,
          status: 'ok',
          message: 'You’re back on the list. Welcome aboard.'
        });
      }
      return reply(req, res, {
        code: 200,
        status: 'exists',
        message: 'That email is already subscribed.'
      });
    }

    await Subscriber.create({ email, subscribedAt: new Date() });
    sendWelcomeEmail(email);
    return reply(req, res, {
      code: 201,
      status: 'ok',
      message: 'You’re on the list. Welcome aboard.'
    });
  } catch (err) {
    if (err.code === 11000) {
      return reply(req, res, {
        code: 200,
        status: 'exists',
        message: 'That email is already subscribed.'
      });
    }
    next(err);
  }
}

module.exports = { subscribe, subscribeValidators };
