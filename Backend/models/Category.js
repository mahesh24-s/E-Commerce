import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      public_id: { type: String, default: '' },
      url: { type: String, default: '' },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Auto-generate slug from name before save
categorySchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
  }
  // .replace(/[^\w\s-]/g, '') removes letters other than alphabets,numbers,underscores, spaces and hyphens e.g. "men's shoes" to "mens shoes"

  // .replace(/\s+/g, '-') replaces multiple spaces with a single hyphen and removes leading/trailing spaces e.g. "mens  shoes" to "mens-shoes" & " men's   shoes " to "mens-shoes"
  
  // next()
})

const Category = mongoose.model('Category', categorySchema)
export default Category
