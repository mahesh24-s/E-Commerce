import mongoose from 'mongoose'
import Product from './Product.js'

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    images: [
      {
        public_id: { type: String },
        url: { type: String },
      },
    ],
  },
  { timestamps: true }
)

// One review per customer per product
reviewSchema.index({ customer: 1, product: 1 }, { unique: true })

// Helper: recalculate product average rating
const recalculateRatings = async (productId) => {
  const result = await mongoose.model('Review').aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ])

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': Math.round(result[0].average * 10) / 10,
      'ratings.count': result[0].count,
    })
  } else {
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': 0,
      'ratings.count': 0,
    })
  }
}

// After save/update: recalculate
reviewSchema.post('save', async function () {
  await recalculateRatings(this.product)
})

// After delete: recalculate
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await recalculateRatings(doc.product)
})

const Review = mongoose.model('Review', reviewSchema)
export default Review
