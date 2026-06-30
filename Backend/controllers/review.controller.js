import mongoose from 'mongoose'
import Review from '../models/Review.js'
import Order from '../models/Order.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload.middleware.js'

// ─── Create / Update Review ───────────────────────────────────────────────────
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body

    if (!productId || !rating) {
      throw new ApiError(400, 'Product ID and rating are required')
    }

    const ratingNum = Number(rating)
    if (ratingNum < 1 || ratingNum > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5')
    }

    // Verify the customer has a delivered order with this product
    const hasPurchased = await Order.findOne({
      customer: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered',
    })

    if (!hasPurchased) {
      throw new ApiError(403, 'You can only review products you have purchased and received')
    }

    // Upload review images to Cloudinary
    let images = []
    if (req.files && req.files.length > 0) {
      images = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, 'ecommerce/reviews'))
      )
    }

    // Check if review already exists → update it
    const existingReview = await Review.findOne({
      customer: req.user._id,
      product: productId,
    })

    let review

    if (existingReview) {
      // Delete old review images from Cloudinary
      if (existingReview.images.length > 0) {
        await Promise.all(
          existingReview.images.map((img) => deleteFromCloudinary(img.public_id))
        )
      }
      existingReview.rating = ratingNum
      existingReview.comment = comment || ''
      existingReview.images = images
      review = await existingReview.save()
    } else {
      review = await Review.create({
        customer: req.user._id,
        product: productId,
        rating: ratingNum,
        comment: comment || '',
        images,
      })
    }

    await review.populate('customer', 'name avatar')

    return res
      .status(201)
      .json(new ApiResponse(201, { review }, 'Review submitted successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Get Product Reviews ──────────────────────────────────────────────────────
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params
    const { page = 1, limit = 10, sort = 'newest' } = req.query

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1 },
      lowest: { rating: 1 },
    }

    const skip = (Number(page) - 1) * Number(limit)

    // Use mongoose.Types.ObjectId (ES module safe)
    const productObjectId = new mongoose.Types.ObjectId(productId)

    const [reviews, total, breakdown] = await Promise.all([
      Review.find({ product: productId })
        .populate('customer', 'name avatar')
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ product: productId }),
      Review.aggregate([
        { $match: { product: productObjectId } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ])

    // Build rating breakdown object { 1: 0, 2: 3, ... }
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    breakdown.forEach((b) => {
      ratingBreakdown[b._id] = b.count
    })

    return res.status(200).json(
      new ApiResponse(200, {
        reviews,
        ratingBreakdown,
        pagination: {
          total,
          page: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Reviews fetched')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Delete Review ────────────────────────────────────────────────────────────
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params

    const review = await Review.findById(id)
    if (!review) throw new ApiError(404, 'Review not found')

    // Only the author can delete their review
    if (review.customer.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only delete your own reviews')
    }

    // Delete review images from Cloudinary
    if (review.images.length > 0) {
      await Promise.all(review.images.map((img) => deleteFromCloudinary(img.public_id)))
    }

    await Review.findOneAndDelete({ _id: id })
    // Post-remove hook recalculates product ratings automatically

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Review deleted successfully'))
  } catch (error) {
    next(error)
  }
}
