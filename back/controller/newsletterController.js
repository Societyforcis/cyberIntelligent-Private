import Newsletter from '../models/Newsletter.js';
import User from '../models/User.js';

// Subscribe to newsletter
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const existingSubscription = await Newsletter.findOne({ email });
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Email already subscribed'
      });
    }

    const newsletter = new Newsletter({ email });
    await newsletter.save();

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter'
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error subscribing to newsletter'
    });
  }
};

// Get all subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Newsletter.find().sort('-createdAt');
    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching newsletter subscriptions'
    });
  }
};

// Delete newsletter subscription
export const deleteNewsletter = async (req, res) => {
  try {
    const { id } = req.params;
    const newsletter = await Newsletter.findById(id);

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter subscription not found'
      });
    }

    await Newsletter.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Newsletter subscription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting newsletter subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting newsletter subscription'
    });
  }
};

// Unsubscribe from newsletter
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.params;
    const newsletter = await Newsletter.findOne({ email });

    if (!newsletter) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await Newsletter.findOneAndDelete({ email });

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unsubscribing from newsletter'
    });
  }
};