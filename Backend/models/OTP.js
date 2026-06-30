import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // TTL: auto-delete after 10 minutes
  },
})

// Hash OTP before saving
otpSchema.pre('save', async function () {
  if (!this.isModified('otp')) return
  this.otp = await bcrypt.hash(this.otp, 10)
})

// Compare plain OTP with hashed
otpSchema.methods.isOTPCorrect = async function (plainOTP) {
  return bcrypt.compare(plainOTP, this.otp)
}

const OTP = mongoose.model('OTP', otpSchema)
export default OTP
