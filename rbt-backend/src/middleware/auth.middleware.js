/**
 * Authentication Middleware
 * Verifikasi JWT token di setiap request yang membutuhkan autentikasi
 */
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';

/**
 * Middleware: Verifikasi JWT dari header Authorization
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token autentikasi diperlukan.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token telah kedaluwarsa. Silakan login kembali.',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid.',
    });
  }
}

/**
 * Middleware: Verifikasi role admin
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang diizinkan.',
    });
  }
}

module.exports = { authenticateToken, requireAdmin };
