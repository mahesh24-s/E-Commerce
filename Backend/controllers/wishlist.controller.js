import Wishlist from '../models/Wishlist.js'
import Product from '../models/Product.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'

// ─── Get Wishlist ─────────────────────────────────────────────────────────────
export const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      select: 'name price discountPrice images ratings stock slug',
      populate: { path: 'category', select: 'name' },
    })

    return res
      .status(200)
      .json(
        new ApiResponse(200, { wishlist: wishlist || { products: [] } }, 'Wishlist fetched')
      )
  } catch (error) {
    next(error)
  }
}

// ─── Add to Wishlist ──────────────────────────────────────────────────────────
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params

    const product = await Product.findById(productId)
    if (!product) throw new ApiError(404, 'Product not found')

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { products: productId } }, // addToSet prevents duplicates
      { new: true, upsert: true }
    )

    return res
      .status(200)
      .json(new ApiResponse(200, { wishlist }, 'Added to wishlist'))
  } catch (error) {
    next(error)
  }
}

// ─── Remove from Wishlist ─────────────────────────────────────────────────────
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: productId } },
      { new: true }
    )

    return res
      .status(200)
      .json(new ApiResponse(200, { wishlist }, 'Removed from wishlist'))
  } catch (error) {
    next(error)
  }
}

// ─── Check if Product is in Wishlist ─────────────────────────────────────────
export const checkWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params

    const wishlist = await Wishlist.findOne({ user: req.user._id })
    const isWishlisted = wishlist
      ? wishlist.products.some((p) => p.toString() === productId)
      : false

    return res
      .status(200)
      .json(new ApiResponse(200, { isWishlisted }, 'Wishlist check complete'))
  } catch (error) {
    next(error)
  }
}
