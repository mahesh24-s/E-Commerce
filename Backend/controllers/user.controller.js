import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload.middleware.js'

// ─── Get Profile ──────────────────────────────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) throw new ApiError(404, 'User not found')

    return res
      .status(200)
      .json(new ApiResponse(200, { user }, 'Profile fetched successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body
    const user = await User.findById(req.user._id)
    if (!user) throw new ApiError(404, 'User not found')

    if (name) user.name = name
    if (phone !== undefined) user.phone = phone

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar from Cloudinary
      if (user.avatar?.public_id) {
        await deleteFromCloudinary(user.avatar.public_id)
      }
      const uploaded = await uploadToCloudinary(req.file.buffer, 'ecommerce/avatars')
      user.avatar = uploaded
    }

    await user.save()

    return res
      .status(200)
      .json(new ApiResponse(200, { user }, 'Profile updated successfully'))
  } catch (error) {
    next(error)
  }
}


// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      throw new ApiError(400, 'Old and new password are required')
    }

    if (newPassword.length < 8) {
      throw new ApiError(400, 'New password must be at least 8 characters')
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user) throw new ApiError(404, 'User not found')

    const isCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isCorrect) throw new ApiError(400, 'Old password is incorrect')

    user.password = newPassword
    await user.save()

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Password changed successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Admin: Get All Users ─────────────────────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 100 } = req.query
    const filter = role ? { role } : {}
    const skip = (Number(page) - 1) * Number(limit)

    const [users, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ])

    return res.status(200).json(
      new ApiResponse(200, {
        users,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
      }, 'Users fetched')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Admin: Update User Role ───────────────────────────────────────────────────
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['admin', 'seller', 'customer'].includes(role)) {
      throw new ApiError(400, 'Invalid role')
    }

    // Prevent changing own role
    if (req.params.id === req.user._id.toString()) {
      throw new ApiError(400, 'You cannot change your own role')
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    )

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { user }, `User role updated to ${role}`))
  } catch (error) {
    next(error)
  }
}
