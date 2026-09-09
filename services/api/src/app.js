const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const routes = require('./routes');
const { env } = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');

const app = express();

const allowedOrigins = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const DEV_LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function isOriginAllowed(origin) {
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    return true;
  }

  if (env.nodeEnv === 'development' && DEV_LOCAL_ORIGIN_PATTERN.test(origin)) {
    return true;
  }

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
app.use('/v1/uploads', express.static(path.resolve(env.uploadDir)));

app.use('/v1', routes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
