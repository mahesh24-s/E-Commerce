import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'

export const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      throw new ApiError(401, 'Unauthorized: No token provided')
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decoded._id).select(
      '-password -refreshToken'
    )

    if (!user) {
      throw new ApiError(401, 'Unauthorized: Invalid access token')
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Unauthorized: Invalid token'))
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Unauthorized: Token expired'))
    }
    next(error)
  }
}

export const optionalJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '')

    if (!token) return next()

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decoded._id).select('-password -refreshToken')

    if (user) req.user = user
    next()
  } catch (error) {
    // If token is invalid, just proceed as unauthenticated
    next()
  }
}
