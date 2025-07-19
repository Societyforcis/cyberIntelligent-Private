import User from '../models/User.js';
import Profile from '../models/Profile.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { sendVerificationEmail, sendOTPEmail } from './utils/email.js';
dotenv.config();

const secret = process.env.JWT_SECRET;

export const login = async (req, res) => {
    const { email, password, googleAuth } = req.body;
    try {
        const user = await User.findOne({ email });
        
        if (!user && googleAuth) {
           
            const newUser = new User({
                email,
                password: await bcrypt.hash(password, 10),
                isVerified: true, // Google users are automatically verified
                isAdmin: email === 'societyforcis.org@gmail.com' 
            });
            await newUser.save();
            
            const token = jwt.sign(
                { 
                    email, 
                    isAdmin: email === 'societyforcis.org@gmail.com'
                }, 
                secret, 
                { expiresIn: '1h' }
            );
            
            return res.status(200).json({ 
                success: true, 
                token,
                user: { 
                    email: newUser.email,
                    isAdmin: newUser.isAdmin,
                    isVerified: true
                }
            });
        }

        if (!user) {
            return res.status(400).json({ success: false, message: "User does not exist" });
        }

       
        if (!googleAuth) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Invalid credentials" });
            }
        }

        // Block login for unverified accounts (email/password flow)
        if (!googleAuth && !user.isVerified) {
            // regenerate OTP each login attempt to avoid expired code issues
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.verificationOTP = otp;
            user.verificationOTPExpires = Date.now() + 10 * 60 * 1000;
            await user.save();
            await sendOTPEmail(email, otp);
            return res.status(403).json({ success: false, message: "VERIFY_OTP" });
        }

        const token = jwt.sign(
            { 
                email, 
                isAdmin: user.isAdmin || email === 'societyforcis.org@gmail.com'
            }, 
            secret, 
            { expiresIn: '1h' }
        );
        
        res.status(200).json({ 
            success: true, 
            token,
            user: { 
                email: user.email,
                isAdmin: user.isAdmin || email === 'societyforcis.org@gmail.com',
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Error logging in user" });
    }
};

export const signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        const hash = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
        const newUser = new User({ email, password: hash, isVerified: false, verificationOTP: otp, verificationOTPExpires: otpExpires });
        await newUser.save();
        await sendOTPEmail(email, otp);
        return res.status(201).json({ success: true, otpSent: true, message: "OTP sent to your email for verification." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "An error occurred during registration", error: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    return res.status(410).json({ success: false, message: "Deprecated endpoint" });
};

export const verifyAccountOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }
    try {
        const user = await User.findOne({ email });
        if (!user || user.isVerified) {
            return res.status(400).json({ success: false, message: "Invalid request" });
        }
        if (user.verificationOTP !== otp || user.verificationOTPExpires < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        user.isVerified = true;
        user.verificationOTP = '';
        user.verificationOTPExpires = undefined;
        await user.save();

        const token = jwt.sign({ email: user.email, isAdmin: user.isAdmin }, secret, { expiresIn: '1h' });

        res.json({ success: true, token, user: { email: user.email, isAdmin: user.isAdmin, isVerified: true } });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOTP = otp;
        user.resetOTPExpires = Date.now() + 600000;
        await user.save();
        await sendOTPEmail(email, otp);
        res.json({ success: true, message: "OTP sent to email" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error sending OTP" });
    }
};

export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({
            email,
            resetOTP: otp,
            resetOTPExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }
        res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error verifying OTP" });
    }
};

export const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const user = await User.findOne({ 
            email,
            resetOTP: { $exists: true }, // Ensure reset was initiated
            resetOTPExpires: { $gt: Date.now() } // And not expired
        });
        
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "Password reset not initiated or link expired" 
            });
        }

        // Update the password
        const hash = await bcrypt.hash(newPassword, 10);
        user.password = hash;
        
        // Clear the reset token
        user.resetOTP = undefined;
        user.resetOTPExpires = undefined;
        
        await user.save();
        
        res.json({ 
            success: true, 
            message: "Password reset successful" 
        });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error resetting password", 
            error: error.message 
        });
    }
};


export const getProfile = async (req, res) => {
  try {
    // First check if user exists
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

  
    let profile = await Profile.findOne({ userId: user?._id });
    
    if (!profile) {
      // Create default profile if none exists
      profile = new Profile({
        userId: user._id,
        firstName: '',
        lastName: '',
        email: user.email || '', // Add fallback empty string
        phone: '',
        address: '',
        bio: '',
        profilePicture: ''
      });
      await profile.save();
    }
    
    res.json({ 
      success: true, 
      profile: {
        ...profile.toObject(),
        email: user.email || profile.email || '' // Prioritize user email
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, bio, profilePicture } = req.body;
    
    // First check if user exists
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: user._id },
      {
        firstName,
        lastName,
        email: user.email, // Use user's email
        phone,
        address,
        bio,
        profilePicture,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      profile: {
        ...updatedProfile.toObject(),
        email: user.email // Always use user's email
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

export const uploadProfilePicture = async (req, res) => {
    try {
        const { email } = req.user;
        const { profilePicture } = req.body; // Base64 encoded image
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let profile = await Profile.findOne({ userId: user._id });
        
        // If no profile exists, create one
        if (!profile) {
            profile = new Profile({ userId: user._id });
        }

        profile.profilePicture = profilePicture;
        await profile.save();
        
        res.json({ success: true, message: "Profile picture updated successfully", profile });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error uploading profile picture", error: error.message });
    }
};

export const checkProfileCompletion = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const profile = await Profile.findOne({ userId: user._id });
        const isComplete = profile?.isProfileComplete || false;
        
        res.json({ success: true, isProfileComplete: isComplete });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error checking profile completion", error: error.message });
    }
};

export const verifyToken = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};