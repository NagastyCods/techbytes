const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const { exposeLocals } = require('./middleware/locals');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { attachUser } = require('./middleware/auth');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const { htmlHeaders, noIndexAdmin } = require('./middleware/cacheHeaders');

const app = express();

// Root /views so Vercel's Express builder includes the templates (it traces views/**).
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', 1);

// Security headers. 'unsafe-inline' is needed for the tiny theme FOUC script in <head>.
app.use(
  helmet({
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'https:'],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:']
      }
    }
  })
);
app.use(compression());
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(cors({ origin: env.siteUrl, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// Serverless instances must connect per cold start and reuse the pool after that.
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    next(err);
  }
});
app.use(attachUser);

app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    maxAge: env.isProd ? '7d' : 0,
    etag: true
  })
);

app.use(exposeLocals);
app.use(htmlHeaders);
app.use('/', publicRoutes);
app.use('/admin', noIndexAdmin, adminRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
