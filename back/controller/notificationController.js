import Notification from '../models/Notification.js';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { title, message, type, recipients } = req.body;

    // Validate required fields
    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, message and type are required'
      });
    }

    let usersToNotify = [];

    // If recipients is 'all', get all users who have notifications enabled
    if (recipients === 'all') {
      const settings = await UserSettings.find({ emailNotifications: true })
        .select('userId');
      
      usersToNotify = settings.map(setting => setting.userId);
    } else if (Array.isArray(recipients)) {
      usersToNotify = recipients;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipients format'
      });
    }

    // Create notifications for each user
    const notifications = await Promise.all(
      usersToNotify.map(userId => 
        Notification.create({
          recipient: userId,
          title,
          message,
          type,
          read: false,
          createdAt: new Date()
        })
      )
    );

    res.status(201).json({
      success: true,
      message: 'Notifications created successfully',
      count: notifications.length
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification'
    });
  }
};

// Get all notifications (admin only)
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('recipient', 'email name')
      .sort('-createdAt');

    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

// Get user's notifications
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    }).sort('-createdAt');

    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification'
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
};