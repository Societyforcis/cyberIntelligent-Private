import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  title: String,
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: String,
  currentPosition: String,
  institute: String,
  department: String,
  organisation: { type: String, required: true },
  address: String,
  town: { type: String, required: true },
  postcode: String,
  state: String,
  country: { type: String, required: true },
  status: { type: String, required: true },
  linkedin: String,
  orcid: String,
  researchGate: String,
  paymentStatus: { type: String, default: 'pending' },
  membershipFee: String,
  profilePhoto: { type: String },
  membershipId: { type: String },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Membership || mongoose.model("Membership", membershipSchema); 