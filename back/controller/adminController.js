import Membership from '../models/Membership.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Membership Controllers
export const getAllMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find()
      .sort('-createdAt')
      .select('-__v');

    res.json({
      success: true,
      memberships
    });
  } catch (error) {
    console.error('Error fetching memberships:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching memberships'
    });
  }
};

export const getMembershipById = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }
    res.json({
      success: true,
      membership
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching membership'
    });
  }
};

export const updateMembership = async (req, res) => {
  try {
    const membership = await Membership.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    res.json({
      success: true,
      membership
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating membership'
    });
  }
};

export const deleteMembership = async (req, res) => {
  try {
    const membership = await Membership.findByIdAndDelete(req.params.id);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    res.json({
      success: true,
      message: 'Membership deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting membership'
    });
  }
};

// Profile Controllers
export const getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate('userId', 'email isAdmin')
      .sort('-createdAt')
      .select('-__v');

    res.json({
      success: true,
      profiles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profiles'
    });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('userId', 'email isAdmin');
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndDelete(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Also delete associated user if needed
    await User.findByIdAndDelete(profile.userId);

    res.json({
      success: true,
      message: 'Profile and associated user deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting profile'
    });
  }
};


// import User from '../models/User.js';

// @desc    Get all users for admin
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        // We use .lean() for performance because we only need to read the data.
        // We are selecting all fields from the User model except the password.
        const users = await User.find({}).select('-password').lean();

        // The key issue is that `firstName` and `lastName` are on the User model itself
        // according to your schema, not a separate Profile model as initially suspected.
        // The User model already contains `firstName` and `lastName`.
        // Therefore, we just need to send the user data as is.
        // The frontend `User` interface already matches this schema.

        if (users) {
            res.status(200).json({
                success: true,
                users: users,
            });
        } else {
            res.status(404).json({ success: false, message: 'No users found' });
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/user/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Add any additional checks here, e.g., preventing deletion of the main admin
            if (user.email === 'societyforcis.org@gmail.com') {
                res.status(400).json({ success: false, message: 'Cannot delete the primary admin account.' });
                return;
            }

            await user.deleteOne(); // Mongoose v6+ uses deleteOne()
            res.status(200).json({ success: true, message: 'User removed' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// You would add other admin functions here like updateUser, etc.

export const sendAnnouncement = async (req, res) => {
  try {
    const { title, message, type = 'admin' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Get all users
    const users = await User.find({}, '_id');
    const notifications = [];

    // Create a notification for each user
    for (const user of users) {
      const notification = new Notification({
        recipient: user._id,
        title,
        message,
        type,
        link: '/announcements' // or any relevant link
      });
      notifications.push(notification.save());
    }

    await Promise.all(notifications);

    res.status(201).json({
      success: true,
      message: 'Announcement sent to all users',
      data: {
        title,
        message,
        type,
        recipients: users.length
      }
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending announcement',
      error: error.message
    });
  }
};

export {
    getAllUsers,
    deleteUser,
    // sendAnnouncement,
};