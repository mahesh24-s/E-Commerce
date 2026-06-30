import Category from '../models/Category.js'
import Product from '../models/Product.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload.middleware.js'

// ─── Create Category ──────────────────────────────────────────────────────────
export const createCategory = async (req, res, next) => {
  try {
    const { name, parent } = req.body
    if (!name) throw new ApiError(400, 'Category name is required')

    const existing = await Category.findOne({ name: name.trim() })
    if (existing) throw new ApiError(409, 'Category with this name already exists')

    let image = { public_id: '', url: '' }
    if (req.file) {
      image = await uploadToCloudinary(req.file.buffer, 'ecommerce/categories')
    }

    const category = await Category.create({
      name: name.trim(),
      image,
      parent: parent || null,
    })

    return res
      .status(201)
      .json(new ApiResponse(201, { category }, 'Category created successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Recursive tree builder ───────────────────────────────────────────────────
// IMPORTANT: do NOT populate 'parent' before calling this — lean() returns
// parent as a raw ObjectId which we compare reliably with .toString().
// A populated parent becomes a plain object, making .toString() return
// "[object Object]" and breaking the tree entirely.
function buildTree(allCats, parentId = null) {
  return allCats
    .filter((c) => {
      // parent is either null OR a raw ObjectId (not populated — see above)
      const catParentId = c.parent ? c.parent.toString() : null
      const target = parentId ? parentId.toString() : null
      return catParentId === target
    })
    .map((c) => ({
      ...c,
      children: buildTree(allCats, c._id),
    }))
}

// ─── Get All Categories (Public) ─────────────────────────────────────────────
export const getAllCategories = async (req, res, next) => {
  try {
    // Do NOT populate parent here — buildTree relies on raw ObjectId comparison
    const allCategories = await Category.find({ isActive: true }).lean()
    const categoryTree = buildTree(allCategories)

    return res
      .status(200)
      .json(new ApiResponse(200, { categories: categoryTree }, 'Categories fetched'))
  } catch (error) {
    next(error)
  }
}

// ─── Get All Categories (Admin) ───────────────────────────────────────────────
export const getAdminCategories = async (req, res, next) => {
  try {
    // Do NOT populate parent here — buildTree relies on raw ObjectId comparison
    const allCategories = await Category.find().lean()
    const categoryTree = buildTree(allCategories)

    return res
      .status(200)
      .json(new ApiResponse(200, { categories: categoryTree }, 'Admin categories fetched'))
  } catch (error) {
    next(error)
  }
}

// ─── Update Category ──────────────────────────────────────────────────────────
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, parent } = req.body

    const category = await Category.findById(id)
    if (!category) throw new ApiError(404, 'Category not found')

    if (name) category.name = name.trim()
    if (parent !== undefined) category.parent = parent || null

    if (req.file) {
      if (category.image?.public_id) {
        await deleteFromCloudinary(category.image.public_id)
      }
      category.image = await uploadToCloudinary(req.file.buffer, 'ecommerce/categories')
    }

    await category.save()

    return res
      .status(200)
      .json(new ApiResponse(200, { category }, 'Category updated successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Delete Category ──────────────────────────────────────────────────────────
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params

    const category = await Category.findById(id)
    if (!category) throw new ApiError(404, 'Category not found')

    category.isActive = false
    await category.save()

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Category deactivated successfully'))
  } catch (error) {
    next(error)
  }
}
