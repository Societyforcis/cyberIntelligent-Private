import UserSettings from '../models/UserSettings.js';

export const getUserSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.user._id });
    
    if (!settings) {
      // Create default settings if none exist
      const newSettings = new UserSettings({ userId: req.user._id });
      await newSettings.save();
      return res.json({ success: true, settings: newSettings });
    }
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching settings" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, profileVisibility, darkMode } = req.body;
    
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { emailNotifications, pushNotifications, profileVisibility, darkMode },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating settings" });
  }
};