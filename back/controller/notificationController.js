import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Helper function to process base64 image
const processImage = (base64String) => {
  if (!base64String) return { image: null, imageType: null };
  
  // Check if it's a data URL
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { image: null, imageType: null };
  }
  
  return {
    image: matches[2],
    imageType: matches[1]
  };
};

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { title, message, type = 'announcement', recipients = [], priority = 'medium', link, image: base64Image } = req.body;
    const createdBy = req.user?._id;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

  
    const { image, imageType } = processImage(base64Image);

 
    const isForAllUsers = recipients === 'all' || (Array.isArray(recipients) && recipients.includes('all'));
    

    const recipientsList = isForAllUsers ? [] : (Array.isArray(recipients) ? recipients : []);

   
    const notification = await Notification.create({
      title,
      message,
      type,
      priority,
      link,
      recipients: recipientsList,
      isForAllUsers,
      createdBy,
      image,
      imageType
    });

    // Populate createdBy for the response
    const populatedNotification = await Notification.findById(notification._id)
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: {
        ...populatedNotification,
        imageUrl: populatedNotification.image ? `data:${populatedNotification.imageType};base64,${populatedNotification.image}` : null
      },
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all notifications (for admin)
export const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find()
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .lean(),
      Notification.countDocuments()
    ]);

    // Add imageUrl to each notification
    const notificationsWithImageUrl = notifications.map(notification => ({
      ...notification,
      imageUrl: notification.image ? `data:${notification.imageType};base64,${notification.image}` : null
    }));

    res.json({
      success: true,
      data: notificationsWithImageUrl,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting notifications'
    });
  }
};

// Get user's notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    const { page = 1, limit = 20 } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const { data: notifications, pagination } = await Notification.findForUser(userId, { page, limit });

    // Add imageUrl to each notification
    const notificationsWithImageUrl = notifications.map(notification => ({
      ...notification,
      imageUrl: notification.image ? `data:${notification.imageType};base64,${notification.image}` : null
    }));

    res.json({
      success: true,
      data: notificationsWithImageUrl,
      pagination
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting notifications'
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user has already read this notification
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }

    // Add imageUrl to the response
    const notificationWithImageUrl = {
      ...notification.toObject(),
      imageUrl: notification.image ? `data:${notification.imageType};base64,${notification.image}` : null
    };

    res.json({
      success: true,
      data: notificationWithImageUrl,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read'
    });
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find all unread notifications for this user
    const unreadNotifications = await Notification.find({
      $and: [
        {
          $or: [
            { isForAllUsers: true },
            { recipients: userId }
          ]
        },
        { readBy: { $ne: userId } }
      ]
    });

    // Update each notification to mark as read by this user
    await Promise.all(
      unreadNotifications.map(notification => 
        Notification.findByIdAndUpdate(
          notification._id,
          { $addToSet: { readBy: userId } },
          { new: true }
        )
      )
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: unreadNotifications.length
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking all notifications as read'
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const count = await Notification.countUnreadForUser(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting unread count'
    });
  }
};

// Delete notification (admin only)
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndDelete(id);
    
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
      message: 'Server error while deleting notification'
    });
  }
};
