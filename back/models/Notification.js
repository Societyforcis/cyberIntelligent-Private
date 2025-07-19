import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['system', 'membership', 'event', 'admin', 'announcement'],
    default: 'system'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  link: {
    type: String,
    default: ''
  },
  // Store recipients as an array of user IDs or 'all'
  recipients: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    required: true,
    validate: {
      validator: function(v) {
        // Allow empty array or array of ObjectIds
        return Array.isArray(v) && v.every(id => mongoose.Types.ObjectId.isValid(id));
      },
      message: props => `${props.value} is not a valid array of user IDs`
    }
  },
  // Store if this notification is for all users
  isForAllUsers: {
    type: Boolean,
    default: false
  },
  // Store image as base64 string
  image: {
    type: String,
    default: null
  },
  // Store image mime type for proper rendering
  imageType: {
    type: String,
    default: null
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster querying
notificationSchema.index({ 'recipients': 1, 'isForAllUsers': 1, 'createdAt': -1 });
notificationSchema.index({ 'readBy': 1 });

// Add a virtual property for image URL
notificationSchema.virtual('imageUrl').get(function() {
  if (!this.image) return null;
  return `data:${this.imageType};base64,${this.image}`;
});

// Add a static method to find notifications for a specific user
notificationSchema.statics.findForUser = async function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  const [notifications, total] = await Promise.all([
    this.find({
      $or: [
        { isForAllUsers: true },
        { recipients: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('createdBy', 'name email')
    .lean(),
    
    this.countDocuments({
      $or: [
        { isForAllUsers: true },
        { recipients: userId }
      ]
    })
  ]);

  // Add isRead flag to each notification
  const notificationsWithReadStatus = notifications.map(notification => ({
    ...notification,
    isRead: notification.readBy?.includes(userId) || false
  }));

  return {
    data: notificationsWithReadStatus,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  };
};

// Add a static method to count unread notifications for a user
notificationSchema.statics.countUnreadForUser = async function(userId) {
  return this.countDocuments({
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
};

export default mongoose.model('Notification', notificationSchema);