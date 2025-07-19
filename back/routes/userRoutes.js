import express from 'express';
import { verifyJWT } from '../middleware/auth.js';
import * as userController from '../controller/userController.js';
import * as settingsController from '../controller/settingsController.js';
import * as notificationController from '../controller/notificationController.js';
import { profileValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/login', userController.login);
router.post('/signin', userController.signin);
router.post('/verify-account-otp', userController.verifyAccountOTP);
router.get('/verify-email', userController.verifyEmail);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOTP);
router.post('/reset-password', userController.resetPassword);

// Profile routes (protected)
router.get('/profile', verifyJWT, userController.getProfile);
router.put('/profile', 
  verifyJWT, 
  profileValidation,
  userController.updateProfile
);

// Settings routes
router.get('/settings', verifyJWT, settingsController.getUserSettings);
router.put('/settings', verifyJWT, settingsController.updateSettings);

// Notification routes
router.get('/notifications', verifyJWT, notificationController.getUserNotifications);
router.put('/notifications/:id/read', verifyJWT, notificationController.markAsRead);
router.delete('/notifications/:id', verifyJWT, notificationController.deleteNotification);

// Add this new route
router.get('/verify-token', verifyJWT, userController.verifyToken);

export default router;