import otpGenerator from 'otp-generator'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import OTP from '../models/OTP.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import { generateAccessAndRefreshTokens } from '../utils/generateTokens.js'
import { sendOTPEmail } from '../utils/sendEmail.js'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email, and password are required')
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists')
    }

    const allowedRoles = ['customer', 'seller']
    const userRole = allowedRoles.includes(role) ? role : 'customer'

    await User.create({ name, email, password, role: userRole })

    // Generate and send OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    })

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email })
    await OTP.create({ email, otp })
    await sendOTPEmail(email, otp, 'verification')

    return res
      .status(201)
      .json(new ApiResponse(201, { email }, 'Registration successful. OTP sent to your email.'))
  } catch (error) {
    // console.log("inside error ",error);
    next(error)
  }
}

// ─── Verify OTP 
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      throw new ApiError(400, 'Email and OTP are required')
    }

    const otpDoc = await OTP.findOne({ email })
    if (!otpDoc) {
      throw new ApiError(400, 'OTP expired or not found. Please request a new one.')
    }

    const isValid = await otpDoc.isOTPCorrect(otp)
    if (!isValid) {
      throw new ApiError(400, 'Invalid OTP')
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    )

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    await OTP.deleteMany({ email })

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user)

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    }

    return res
      .status(200)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json(new ApiResponse(200, { user: safeUser, accessToken }, 'Email verified successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) throw new ApiError(400, 'Email is required')

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(404, 'User not found')
    if (user.isVerified) throw new ApiError(400, 'Email is already verified')

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    })

    await OTP.deleteMany({ email })
    await OTP.create({ email, otp })
    await sendOTPEmail(email, otp, 'verification')

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'OTP resent to your email'))
  } catch (error) {
    next(error)
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required')
    }

    const user = await User.findOne({ email }).select('+password +refreshToken')
    if (!user) {
      throw new ApiError(401, 'Invalid email or password')
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
      throw new ApiError(401, 'Invalid email or password')
    }

    if (!user.isVerified) {
      throw new ApiError(403, 'Please verify your email before logging in')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user)

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      isVerified: user.isVerified,
    }

    return res
      .status(200)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json(new ApiResponse(200, { user: safeUser, accessToken }, 'Login successful'))
  } catch (error) {
    next(error)
  }
}

// ─── Refresh Access Token ─────────────────────────────────────────────────────
export const refreshAccessToken = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken

    if (!incomingRefreshToken) {
      throw new ApiError(401, 'Unauthorized: No refresh token')
    }

    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decoded._id).select('+refreshToken')
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, 'Invalid or expired refresh token')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user)

    return res
      .status(200)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json(new ApiResponse(200, { accessToken }, 'Access token refreshed'))
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired refresh token'))
    }
    next(error)
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: '' })

    return res
      .status(200)
      .clearCookie('refreshToken', cookieOptions)
      .json(new ApiResponse(200, {}, 'Logged out successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) throw new ApiError(400, 'Email is required')

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(404, 'No account found with this email')

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    })

    await OTP.deleteMany({ email })
    await OTP.create({ email, otp })
    await sendOTPEmail(email, otp, 'reset')

    return res
      .status(200)
      .json(new ApiResponse(200, { email }, 'Password reset OTP sent to your email'))
  } catch (error) {
    next(error)
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      throw new ApiError(400, 'Email, OTP, and new password are required')
    }

    if (newPassword.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters')
    }

    const otpDoc = await OTP.findOne({ email })
    if (!otpDoc) {
      throw new ApiError(400, 'OTP expired or not found. Please request a new one.')
    }

    const isValid = await otpDoc.isOTPCorrect(otp)
    if (!isValid) throw new ApiError(400, 'Invalid OTP')

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(404, 'User not found')

    user.password = newPassword
    await user.save()

    await OTP.deleteMany({ email })

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Password reset successfully'))
  } catch (error) {
    next(error)
  }
}
