import ApiError from '../utils/ApiError.js'

const errorMiddleware = (err, req, res, next) => {
  let error = err

  // Wrap non-ApiError errors
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500
    const message = error.message || 'Internal Server Error'
    error = new ApiError(statusCode, message, error?.errors || [])
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`)
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    error = new ApiError(400, messages.join(', '))
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const value = err.keyValue[field]
    error = new ApiError(409, `Duplicate value: ${field} '${value}' already exists`)
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token')
  }
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired, please login again')
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  }

  return res.status(error.statusCode).json(response)
}

export default errorMiddleware
