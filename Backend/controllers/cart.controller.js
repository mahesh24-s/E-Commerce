import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'

// ─── Get Cart ─────────────────────────────────────────────────────────────────
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discountPrice images stock slug seller',
      populate: { path: 'seller', select: 'name' },
    })

    if (!cart) {
      cart = { user: req.user._id, items: [], totalPrice: 0, totalItems: 0 }
    }

    const totalItems = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

    return res
      .status(200)
      .json(new ApiResponse(200, { cart, totalItems }, 'Cart fetched'))
  } catch (error) {
    next(error)
  }
}

// ─── Add to Cart ──────────────────────────────────────────────────────────────
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body

    if (!productId) throw new ApiError(400, 'Product ID is required')

    const product = await Product.findById(productId)
    if (!product) throw new ApiError(404, 'Product not found')

    if (product.stock < 1) throw new ApiError(400, 'Product is out of stock')

    const qty = Number(quantity)
    if (qty < 1) throw new ApiError(400, 'Quantity must be at least 1')

    let cart = await Cart.findOne({ user: req.user._id })

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] })
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    )

    if (existingItem) {
      const newQty = existingItem.quantity + qty
      if (newQty > product.stock) {
        throw new ApiError(400, `Only ${product.stock} units available`)
      }
      existingItem.quantity = newQty
    } else {
      if (qty > product.stock) {
        throw new ApiError(400, `Only ${product.stock} units available`)
      }
      cart.items.push({
        product: productId,
        quantity: qty,
        priceAtAdd: product.discountPrice || product.price,
      })
    }

    await cart.save()
    await cart.populate({
      path: 'items.product',
      select: 'name price discountPrice images stock slug',
    })

    return res
      .status(200)
      .json(new ApiResponse(200, { cart }, 'Item added to cart'))
  } catch (error) {
    next(error)
  }
}

// ─── Update Cart Item Quantity ────────────────────────────────────────────────
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params
    const { quantity } = req.body

    const qty = Number(quantity)
    if (!qty || qty < 1) throw new ApiError(400, 'Quantity must be at least 1')

    const product = await Product.findById(productId)
    if (!product) throw new ApiError(404, 'Product not found')

    if (qty > product.stock) {
      throw new ApiError(400, `Only ${product.stock} units available`)
    }

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) throw new ApiError(404, 'Cart not found')

    const item = cart.items.find((i) => i.product.toString() === productId)
    if (!item) throw new ApiError(404, 'Item not in cart')

    item.quantity = qty
    await cart.save()

    return res
      .status(200)
      .json(new ApiResponse(200, { cart }, 'Cart updated'))
  } catch (error) {
    next(error)
  }
}

// ─── Remove from Cart ─────────────────────────────────────────────────────────
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) throw new ApiError(404, 'Cart not found')

    cart.items = cart.items.filter((i) => i.product.toString() !== productId)
    await cart.save()

    return res
      .status(200)
      .json(new ApiResponse(200, { cart }, 'Item removed from cart'))
  } catch (error) {
    next(error)
  }
}

// ─── Clear Cart ───────────────────────────────────────────────────────────────
export const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] },
      { new: true }
    )

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Cart cleared'))
  } catch (error) {
    next(error)
  }
}
