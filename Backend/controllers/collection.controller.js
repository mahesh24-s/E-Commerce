import Collection from '../models/Collection.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload.middleware.js'

// ─── Get All Collections ──────────────────────────────────────────────────────
export const getAllCollections = async (req, res, next) => {
  try {
    // Admins see all, others see only active ones
    const query = req.user?.role === 'admin' ? {} : { isActive: true }
    
    const collections = await Collection.find(query)
      .sort({ createdAt: -1 })

    return res.status(200).json(
      new ApiResponse(200, { collections }, 'Collections fetched successfully')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Get Single Collection by Slug ────────────────────────────────────────────
export const getCollectionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params

    const collection = await Collection.findOne({ slug })
      .populate({
        path: 'products',
        match: { stock: { $gt: 0 } }, // optionally only show in-stock products
        select: 'name slug price discountPrice images category ratings stock seller',
        populate: { path: 'category', select: 'name' }
      })

    if (!collection) {
      throw new ApiError(404, 'Collection not found')
    }

    if (!collection.isActive && req.user?.role !== 'admin') {
      throw new ApiError(403, 'This collection is currently inactive')
    }

    return res.status(200).json(
      new ApiResponse(200, { collection }, 'Collection fetched successfully')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Create Collection (Admin) ────────────────────────────────────────────────
export const createCollection = async (req, res, next) => {
  try {
    const { name, description, products, isActive } = req.body

    if (!name) {
      throw new ApiError(400, 'Collection name is required')
    }

    let bannerImage = { public_id: '', url: '' }

    if (req.file) {
      bannerImage = await uploadToCloudinary(req.file.buffer, 'ecommerce/collections')
    }

    // Convert comma-separated products string to array if needed
    let parsedProducts = []
    if (products) {
      parsedProducts = typeof products === 'string' ? JSON.parse(products) : products
    }

    const collection = await Collection.create({
      name,
      description,
      bannerImage,
      products: parsedProducts,
      isActive: isActive !== undefined ? isActive : true,
    })

    return res.status(201).json(
      new ApiResponse(201, { collection }, 'Collection created successfully')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Update Collection (Admin) ────────────────────────────────────────────────
export const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, products, isActive } = req.body

    const collection = await Collection.findById(id)
    if (!collection) {
      throw new ApiError(404, 'Collection not found')
    }

    if (name) collection.name = name
    if (description !== undefined) collection.description = description
    if (isActive !== undefined) collection.isActive = isActive

    if (products) {
      collection.products = typeof products === 'string' ? JSON.parse(products) : products
    }

    if (req.file) {
      if (collection.bannerImage?.public_id) {
        await deleteFromCloudinary(collection.bannerImage.public_id)
      }
      collection.bannerImage = await uploadToCloudinary(req.file.buffer, 'ecommerce/collections')
    }

    await collection.save()

    return res.status(200).json(
      new ApiResponse(200, { collection }, 'Collection updated successfully')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Delete Collection (Admin) ────────────────────────────────────────────────
export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params

    const collection = await Collection.findById(id)
    if (!collection) {
      throw new ApiError(404, 'Collection not found')
    }

    if (collection.bannerImage?.public_id) {
      await deleteFromCloudinary(collection.bannerImage.public_id)
    }

    await Collection.findByIdAndDelete(id)

    return res.status(200).json(
      new ApiResponse(200, {}, 'Collection deleted successfully')
    )
  } catch (error) {
    next(error)
  }
}
