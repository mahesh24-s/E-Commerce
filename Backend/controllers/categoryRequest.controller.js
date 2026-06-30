import CategoryRequest from '../models/CategoryRequest.js'
import Category from '../models/Category.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'

// ─── Create a Category Request (Seller) ───────────────────────────────────────────
export const createCategoryRequest = async (req, res, next) => {
  try {
    const { requestedName, parentCategory, description } = req.body

    if (!requestedName) {
      throw new ApiError(400, 'Requested category name is required')
    }

    // Check if category already exists
    const existing = await Category.findOne({ name: requestedName.trim() })
    if (existing) {
      throw new ApiError(400, 'A category with this name already exists')
    }

    // Check for pending requests with same name to avoid spam
    const existingRequest = await CategoryRequest.findOne({ 
      requestedName: requestedName.trim(), 
      status: 'pending' 
    })
    if (existingRequest) {
      throw new ApiError(400, 'A pending request for this category already exists')
    }

    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory)
      if (!parentExists) throw new ApiError(400, 'Parent category not found')
    }

    const request = await CategoryRequest.create({
      requestedName: requestedName.trim(),
      parentCategory: parentCategory || null,
      description,
      seller: req.user._id,
    })

    return res
      .status(201)
      .json(new ApiResponse(201, { request }, 'Category request submitted successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Get All Requests (Admin) ──────────────────────────────────────────────────
export const getCategoryRequests = async (req, res, next) => {
  try {
    const { status } = req.query
    const filter = status ? { status } : {}

    const requests = await CategoryRequest.find(filter)
      .populate('seller', 'name email')
      .populate('parentCategory', 'name')
      .sort({ createdAt: -1 })
      .lean()

    return res
      .status(200)
      .json(new ApiResponse(200, { requests }, 'Category requests fetched'))
  } catch (error) {
    next(error)
  }
}

// ─── Update Request Status (Admin) ─────────────────────────────────────────────
export const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, adminComment } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Status must be approved or rejected')
    }

    const request = await CategoryRequest.findById(id)
    if (!request) throw new ApiError(404, 'Category request not found')

    if (request.status !== 'pending') {
      throw new ApiError(400, 'Request has already been processed')
    }

    request.status = status
    if (adminComment) request.adminComment = adminComment
    await request.save()

    let newCategory = null

    // Automatically create the category if approved
    if (status === 'approved') {
      // Create slug logic matching the Category model pre-save hook
      const slug = request.requestedName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')

      newCategory = await Category.create({
        name: request.requestedName,
        parent: request.parentCategory,
        slug
      })
    }

    return res.status(200).json(
      new ApiResponse(200, { request, newCategory }, `Category request ${status}`)
    )
  } catch (error) {
    next(error)
  }
}
