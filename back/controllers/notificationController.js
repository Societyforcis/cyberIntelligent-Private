import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Get notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipient: req.user._id 
    }).sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching notifications" 
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
        message: "Notification not found" 
      });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error updating notification" 
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
        message: "Notification not found" 
      });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error deleting notification" 
    });
  }
};

// Admin: Create notification for specific users or all users
export const createNotification = async (req, res) => {
  try {
    const { recipients, title, message, type, link } = req.body;

    // Check if admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized" 
      });
    }

    let users;
    if (recipients === 'all') {
      users = await User.find({ isAdmin: false }).select('_id');
    } else if (Array.isArray(recipients)) {
      users = await User.find({ 
        _id: { $in: recipients }, 
        isAdmin: false 
      }).select('_id');
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid recipients" 
      });
    }

    const notifications = users.map(user => ({
      recipient: user._id,
      title,
      message,
      type: type || 'admin',
      link
    }));

    await Notification.insertMany(notifications);

    res.json({ 
      success: true, 
      message: `Notifications sent to ${users.length} users` 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error creating notifications" 
    });
  }
};

// Admin: Get all notifications
export const getAllNotifications = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized" 
      });
    }

    const notifications = await Notification.find()
      .populate('recipient', 'email firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching notifications" 
    });
  }
};