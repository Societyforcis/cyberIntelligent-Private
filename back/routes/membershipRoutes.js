import express from 'express';
import { registerMembership, getMembershipByEmail } from '../controller/membershipController.js';
const router = express.Router();

router.post('/', registerMembership);
router.get('/email/:email', getMembershipByEmail);

export default router; 