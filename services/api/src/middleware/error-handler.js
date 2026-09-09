function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      details: {}
    }
  });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code =
    err.code ||
    (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const details = err.details || {};

  if (status >= 500) {
    console.error('[API ERROR]', err);
  }

  res.status(status).json({
    error: {
      code,
      message,
      details
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
