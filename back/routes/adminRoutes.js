import express from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { isAdmin } from '../middleware/adminAuth.js';
import * as adminController from '../controller/adminController.js';

const router = express.Router();

// Protected admin routes
// import express from 'express';
import { getAllUsers, deleteUser } from '../controller/adminController.js';
// import { verifyJWT, isAdmin } from '../middleware/auth.js'; // Assuming you have an isAdmin middleware

// const router = express.Router();

// GET all users
router.get('/users', verifyJWT, isAdmin, getAllUsers);

// DELETE a user
router.delete('/user/:id', verifyJWT, isAdmin, deleteUser);


// export default router;
router.use(verifyJWT, isAdmin);

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

export default router;