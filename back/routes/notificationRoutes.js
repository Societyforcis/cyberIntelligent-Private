import express from 'express';
import { verifyJWT, isAdmin } from '../middleware/auth.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// User routes
router.get('/my', verifyJWT, notificationController.getUserNotifications);
router.put('/:id/read', verifyJWT, notificationController.markAsRead);
router.delete('/:id', verifyJWT, notificationController.deleteNotification);

// Admin routes
router.post('/create', verifyJWT, isAdmin, notificationController.createNotification);
router.get('/all', verifyJWT, isAdmin, notificationController.getAllNotifications);

export default router;