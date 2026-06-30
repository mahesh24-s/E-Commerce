import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Review from '../models/Review.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload.middleware.js'

// ─── Create Product (Seller only) ─────────────────────────────────────────────
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, discountPrice, stock, category, tags, isFeatured } =
      req.body

    if (!name || !description || !price || !stock || !category) {
      throw new ApiError(400, 'Name, description, price, stock, and category are required')
    }

    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'At least one product image is required')
    }

    const categoryExists = await Category.findById(category)
    if (!categoryExists || !categoryExists.isActive) {
      throw new ApiError(400, 'The selected category is inactive or does not exist')
    }

    // Upload all images to Cloudinary in parallel
    const imageUploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, 'ecommerce/products')
    )
    const images = await Promise.all(imageUploadPromises)

    const product = new Product({
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: Number(stock),
      category,
      seller: req.user._id,
      images,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
      isFeatured: isFeatured === 'true' || isFeatured === true,
    })

    await product.save()
    await product.populate('category', 'name slug')

    return res
      .status(201)
      .json(new ApiResponse(201, { product }, 'Product created successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Get All Products (Public) ────────────────────────────────────────────────
export const getAllProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      minRating,
      tag,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query

    const filter = { isDeleted: false }

    // Full-text search
    if (q) {
      filter.$text = { $search: q }
    }

    const activeCategories = await Category.find({ isActive: true }).select('_id parent').lean()
    const activeCategoryIds = activeCategories.map((c) => c._id)

    const getDescendantIds = (parentId, categoriesList) => {
      let ids = [];
      const children = categoriesList.filter(c => c.parent && c.parent.toString() === parentId.toString());
      for (const child of children) {
        ids.push(child._id);
        ids = ids.concat(getDescendantIds(child._id, categoriesList));
      }
      return ids;
    };

    // Category filter
    if (category) {
      let categoryId = category;
      if (!mongoose.Types.ObjectId.isValid(category)) {
        const cat = await Category.findOne({ slug: category }).lean();
        if (cat) categoryId = cat._id.toString();
      }

      if (!activeCategoryIds.some((id) => id.toString() === categoryId)) {
        filter.category = null // Will intentionally return 0 results
      } else {
        const descendantIds = getDescendantIds(categoryId, activeCategories);
        filter.category = { $in: [categoryId, ...descendantIds] }
      }
    } else {
      filter.category = { $in: activeCategoryIds }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    // Minimum rating filter
    if (minRating) {
      filter['ratings.average'] = { $gte: Number(minRating) }
    }

    // Tag filter
    if (tag) {
      filter.tags = tag.toLowerCase()
    }

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      rating: { 'ratings.average': -1 },
    }

    const sortBy = sortOptions[sort] || sortOptions.newest

    const skip = (Number(page) - 1) * Number(limit)

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('seller', 'name')
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ])

    return res.status(200).json(
      new ApiResponse(200, {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Products fetched')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Get Products By Category Slug (Public) ──────────────────────────────────
export const getProductsByCategorySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      throw new ApiError(404, 'Category not found or inactive');
    }

    const activeCategories = await Category.find({ isActive: true }).select('_id parent').lean();
    
    const getDescendantIds = (parentId, categoriesList) => {
      let ids = [];
      const children = categoriesList.filter(c => c.parent && c.parent.toString() === parentId.toString());
      for (const child of children) {
        ids.push(child._id);
        ids = ids.concat(getDescendantIds(child._id, categoriesList));
      }
      return ids;
    };

    const descendantIds = getDescendantIds(category._id, activeCategories);
    const categoryIds = [category._id, ...descendantIds];

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find({ category: { $in: categoryIds }, isDeleted: false })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments({ category: { $in: categoryIds }, isDeleted: false }),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        category,
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Products fetched by category')
    );
  } catch (error) {
    next(error);
  }
};

// ─── Get Featured Products (Public) ───────────────────────────────────────────
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const activeCategories = await Category.find({ isActive: true }).select('_id').lean()
    const activeCategoryIds = activeCategories.map((c) => c._id)

    const products = await Product.find({ 
      isFeatured: true, 
      stock: { $gt: 0 },
      isDeleted: false,
      category: { $in: activeCategoryIds }
    })
      .populate('category', 'name slug')
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()

    return res
      .status(200)
      .json(new ApiResponse(200, { products }, 'Featured products fetched'))
  } catch (error) {
    next(error)
  }
}

// ─── Get Seller's Products ────────────────────────────────────────────────────
export const getSellerProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, q } = req.query

    const activeCategories = await Category.find({ isActive: true }).select('_id').lean()
    const activeCategoryIds = activeCategories.map((c) => c._id)

    const filter = { 
      seller: req.user._id,
      isDeleted: false,
      category: { $in: activeCategoryIds }
    }
    if (q) filter.$text = { $search: q }

    const skip = (Number(page) - 1) * Number(limit)

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ])

    return res.status(200).json(
      new ApiResponse(200, {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Seller products fetched')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Get Product by Slug (Public) ─────────────────────────────────────────────
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isDeleted: false })
      .populate('category', 'name slug')
      .populate('seller', 'name avatar')

    if (!product) throw new ApiError(404, 'Product not found')

    const reviews = await Review.find({ product: product._id })
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, { product, reviews }, 'Product fetched'))
  } catch (error) {
    next(error)
  }
}

// ─── Update Product (Seller, own product) ─────────────────────────────────────
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const product = await Product.findById(id)

    if (!product) throw new ApiError(404, 'Product not found')

    if (product.seller.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only update your own products')
    }

    const { name, description, price, discountPrice, stock, category, tags, isFeatured, removeImageIds } =
      req.body

    if (category) {
      const categoryExists = await Category.findById(category)
      if (!categoryExists || !categoryExists.isActive) {
        throw new ApiError(400, 'The selected category is inactive or does not exist')
      }
      product.category = category
    }

    if (name) product.name = name
    if (description) product.description = description
    if (price) product.price = Number(price)
    if (discountPrice !== undefined)
      product.discountPrice = discountPrice ? Number(discountPrice) : null
    if (stock !== undefined) product.stock = Number(stock)
    if (tags)
      product.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())
    if (isFeatured !== undefined)
      product.isFeatured = isFeatured === 'true' || isFeatured === true

    // Remove specified images
    if (removeImageIds) {
      const idsToRemove = Array.isArray(removeImageIds)
        ? removeImageIds
        : [removeImageIds]

      for (const publicId of idsToRemove) {
        await deleteFromCloudinary(publicId)
      }
      product.images = product.images.filter(
        (img) => !idsToRemove.includes(img.public_id)
      )
    }

    // Upload new images
    if (req.files && req.files.length > 0) {
      if (product.images.length + req.files.length > 5) {
        throw new ApiError(400, 'A product can have at most 5 images')
      }
      const newImages = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, 'ecommerce/products'))
      )
      product.images.push(...newImages)
    }

    await product.save()
    await product.populate('category', 'name slug')

    return res
      .status(200)
      .json(new ApiResponse(200, { product }, 'Product updated successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Delete Product (Seller, own product) ─────────────────────────────────────
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const product = await Product.findById(id)

    if (!product) throw new ApiError(404, 'Product not found')

    if (product.isDeleted) {
      throw new ApiError(404, 'Product not found')
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only delete your own products')
    }

    // Soft delete: mark as deleted instead of removing from DB.
    // Images are intentionally kept on Cloudinary so that existing
    // order history can still display the product name and images.
    product.isDeleted = true
    await product.save()

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Product deleted successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

export const getAdminProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, q } = req.query;
    const filter = {};
    if (q) filter.$text = { $search: q };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('seller', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Admin products fetched')
    );
  } catch (error) {
    next(error);
  }
};

export const toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) throw new ApiError(404, 'Product not found');

    product.isFeatured = !product.isFeatured;
    await product.save();

    return res.status(200).json(new ApiResponse(200, { product }, 'Product featured status toggled'));
  } catch (error) {
    next(error);
  }
};

export const adminDeleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) throw new ApiError(404, 'Product not found');

    product.isDeleted = true;
    await product.save();

    return res.status(200).json(new ApiResponse(200, {}, 'Product soft deleted by admin'));
  } catch (error) {
    next(error);
  }
};
