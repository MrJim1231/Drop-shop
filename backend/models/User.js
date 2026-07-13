import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // Matches user_id from frontend session or uniqid
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
      default: "000000",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetExpiry: {
      type: Number, // Unix timestamp in seconds for reset token expiry
      default: null,
    },
    name: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
