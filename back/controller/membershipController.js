import Membership from '../models/Membership.js';

// Register new membership
export const registerMembership = async (req, res) => {
  try {
    const membership = new Membership(req.body);
    membership.paymentStatus = 'completed';
    // Generate a unique membership ID
    const count = await Membership.countDocuments();
    const membershipId = `CIS${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;
    membership.membershipId = membershipId;
    // Set issue date and expiry date
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    membership.issueDate = issueDate;
    membership.expiryDate = expiryDate;
    await membership.save();
    res.status(201).json({ success: true, message: "Membership confirmed!", membershipId, membership });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error processing membership", error: error.message });
  }
};

// Get membership by email
export const getMembershipByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const membership = await Membership.findOne({ email });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    res.json({ success: true, membership });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching membership", error: error.message });
  }
}; 