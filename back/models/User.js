import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationOTP: { type: String },
    verificationOTPExpires: { type: Date },
    verificationToken: { type: String }, // legacy, can be removed later
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    resetOTP: String,
    resetOTPExpires: Date,
    // Profile fields
    firstName: { type: String },
    lastName: { type: String },
    profilePicture: { type: String },
    bio: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    location: { type: String },
    website: { type: String },
    socialLinks: {
        linkedin: { type: String },
        twitter: { type: String },
        github: { type: String }
    },
    // Admin fields
    isAdmin: {
        type: Boolean,
        default: function() {
            return this.email === 'societyforcis.org@gmail.com';
        }
    },
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.models.User || mongoose.model("User", userSchema);