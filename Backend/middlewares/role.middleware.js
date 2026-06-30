import ApiError from '../utils/ApiError.js'

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Access denied: Admin role required'))
  }
  next()
}
export const isSeller = (req, res, next) => {
  if (req.user?.role !== 'seller') {
    return next(new ApiError(403, 'Access denied: Seller role required'))
  }
  next()
}

export const isCustomer = (req, res, next) => {
  if (req.user?.role !== 'customer') {
    return next(new ApiError(403, 'Access denied: Customer role required'))
  }
  next()
}

// Allows both customers and sellers (any authenticated user)
export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Unauthorized: Please log in'))
  }
  next()
}
