/**
 * Auth Routes
 * /api/auth/*
 */
const express = require('express');
const router = express.Router();
const { googleLogin, getProfile, updateProfile, devLogin } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/google', googleLogin);

// Dev-only login bypass (hanya NODE_ENV=development)
router.post('/dev-login', devLogin);

// Protected routes (memerlukan JWT)
router.get('/me', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;

