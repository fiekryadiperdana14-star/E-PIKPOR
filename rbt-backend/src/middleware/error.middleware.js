/**
 * Error Handling Middleware
 * Menangani semua error secara terpusat
 */

/**
 * Middleware: Not Found (404)
 */
function notFound(req, res, next) {
  const error = new Error(`Endpoint tidak ditemukan: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

/**
 * Middleware: Global Error Handler
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal server';

  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
