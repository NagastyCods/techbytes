const { body, validationResult } = require('express-validator');
const { User } = require('../../models');
const { signUserToken, setAuthCookie, clearAuthCookie } = require('../../utils/jwt');

const loginValidators = [
  body('email').trim().isEmail().withMessage('Enter a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

function loginForm(req, res) {
  if (req.user) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    pageTitle: 'Staff login',
    error: req.query.error || '',
    next: req.query.next || '/admin'
  });
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('admin/login', {
        pageTitle: 'Staff login',
        error: errors.array()[0].msg,
        next: req.body.next || '/admin'
      });
    }

    const email = String(req.body.email).toLowerCase();
    const user = await User.findOne({ email, isActive: true }).select('+passwordHash');
    const ok = user && (await user.comparePassword(req.body.password));
    if (!ok) {
      return res.status(401).render('admin/login', {
        pageTitle: 'Staff login',
        error: 'Email or password is incorrect.',
        next: req.body.next || '/admin'
      });
    }

    setAuthCookie(res, signUserToken(user));
    const nextUrl = String(req.body.next || '/admin');
    // Only allow relative redirects so an attacker cannot send staff to another site
    res.redirect(nextUrl.startsWith('/') && !nextUrl.startsWith('//') ? nextUrl : '/admin');
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  res.redirect('/admin/login');
}

module.exports = { loginValidators, loginForm, login, logout };
