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
    console.log('🔍 Fetching membership for email:', email);
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const membership = await Membership.findOne({ email });
    console.log('📄 Membership found:', membership ? 'Yes' : 'No');
    
    if (!membership) {
      console.log('No membership found for email:', email);
      return res.status(404).json({ 
        success: false, 
        message: `Membership not found for email: ${email}` 
      });
    }

    // Send the raw membership data
    return res.json({
      success: true,
      membership
    });
    
  } catch (error) {
    console.error('❌ Error in getMembershipByEmail:', error.message);
    console.error('Error details:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching membership", 
      error: error.message 
    });
  }
};