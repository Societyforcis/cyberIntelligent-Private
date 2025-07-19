import express from 'express';
import {
  createNotification,
  getAllNotifications,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controller/notificationController.js';

const router = express.Router();

// Public routes (for development)
router.get('/me', (req, res) => {
  // For development, use a default user ID or get from query params
  req.user = { _id: req.query.userId || '65f8e4b7d4f8a8c8f8f8f8f8' };
  return getUserNotifications(req, res);
});

router.get('/unread-count', (req, res) => {
  req.user = { _id: req.query.userId || '65f8e4b7d4f8a8c8f8f8f8f8' };
  return getUnreadCount(req, res);
});

router.patch('/:id/read', (req, res) => {
  req.user = { _id: req.query.userId || '65f8e4b7d4f8a8c8f8f8f8f8' };
  return markAsRead(req, res);
});

// Add mark all as read route
router.patch('/mark-all-read', (req, res) => {
  req.user = { _id: req.query.userId || '65f8e4b7d4f8a8c8f8f8f8f8' };
  return markAllAsRead(req, res);
});

// Admin routes (no authentication for development)
router.post('/ok', createNotification);
router.get('/all', getAllNotifications);
router.delete('/:id', deleteNotification);

export default router;
