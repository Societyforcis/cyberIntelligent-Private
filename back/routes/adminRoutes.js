import express from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { isAdmin } from '../middleware/adminAuth.js';
import * as adminController from '../controller/adminController.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(verifyJWT, isAdmin);

// User management routes
router.get('/users', adminController.getAllUsers);
router.delete('/user/:id', adminController.deleteUser);

// Membership routes
router.get('/memberships', adminController.getAllMemberships);
router.get('/membership/:id', adminController.getMembershipById);
router.put('/membership/:id', adminController.updateMembership);
router.delete('/membership/:id', adminController.deleteMembership);

// Profile routes
router.get('/profiles', adminController.getAllProfiles);
router.get('/profile/:id', adminController.getProfileById);
router.put('/profile/:id', adminController.updateProfile);
router.delete('/profile/:id', adminController.deleteProfile);

// Announcement routes
router.post('/announcements', adminController.sendAnnouncement);

export default router;