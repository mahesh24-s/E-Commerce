import mongoose from 'mongoose'

const categoryRequestSchema = new mongoose.Schema(
  {
    requestedName: {
      type: String,
      required: [true, 'Requested category name is required'],
      trim: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminComment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

const CategoryRequest = mongoose.model('CategoryRequest', categoryRequestSchema)
export default CategoryRequest
