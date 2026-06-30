import crypto from 'crypto'
import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Address from '../models/Address.js'
import razorpay from '../utils/razorpay.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import { sendOrderConfirmationEmail } from '../utils/sendEmail.js'

const TAX_RATE = 0.00        // No GST
const FREE_SHIPPING_ABOVE = 500  // Free shipping above ₹500

// ─── Create Order ─────────────────────────────────────────────────────────────
export const createOrder = async (req, res, next) => {
  try {
    const { addressId } = req.body
    if (!addressId) throw new ApiError(400, 'Shipping address is required')

    // Validate address belongs to user
    const address = await Address.findOne({ _id: addressId, user: req.user._id })
    if (!address) throw new ApiError(404, 'Shipping address not found')

    // Get cart with full product details
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discountPrice images stock seller',
    })

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'Cart is empty')
    }

    // Validate stock and build order items
    const orderItems = []
    let subtotal = 0

    for (const item of cart.items) {
      const product = item.product
      if (!product) throw new ApiError(400, 'One or more products no longer exist')
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for "${product.name}". Available: ${product.stock}`)
      }

      const price = product.discountPrice || product.price
      subtotal += price * item.quantity

      orderItems.push({
        product: product._id,
        seller: product.seller,
        name: product.name,
        image: product.images[0]?.url || '',
        price,
        quantity: item.quantity,
      })
    }

    const shippingCharge = subtotal >= FREE_SHIPPING_ABOVE ? 0 : 50
    const taxAmount = Math.round(subtotal * TAX_RATE)
    const totalAmount = subtotal + taxAmount + shippingCharge

    // Create Razorpay order (amount in paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    })

    // Save order with pending status
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      shippingAddress: {
        name: address.name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },
      paymentInfo: {
        razorpayOrderId: razorpayOrder.id,
        status: 'pending',
      },
      totalAmount,
      taxAmount,
      shippingCharge,
      orderStatus: 'pending',
    })

    return res.status(201).json(
      new ApiResponse(201, {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      }, 'Order created. Proceed to payment.')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Verify Payment ───────────────────────────────────────────────────────────
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError(400, 'All payment details are required')
    }

    // HMAC-SHA256 verification
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      throw new ApiError(400, 'Payment verification failed: Invalid signature')
    }

    // Fetch and update order
    const order = await Order.findById(orderId)
    if (!order) throw new ApiError(404, 'Order not found')

    order.paymentInfo.razorpayPaymentId = razorpayPaymentId
    order.paymentInfo.razorpaySignature = razorpaySignature
    order.paymentInfo.status = 'paid'
    order.orderStatus = 'processing'
    await order.save()

    // Decrement stock for each product
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      })
    }

    // Clear the cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })

    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail(req.user.email, order).catch(console.error)

    return res
      .status(200)
      .json(new ApiResponse(200, { order }, 'Payment verified. Order confirmed!'))
  } catch (error) {
    next(error)
  }
}

// ─── Get Customer Orders ──────────────────────────────────────────────────────
export const getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const filter = { customer: req.user._id }
    if (status) filter.orderStatus = status

    const skip = (Number(page) - 1) * Number(limit)

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ])

    return res.status(200).json(
      new ApiResponse(200, {
        orders,
        pagination: {
          total,
          page: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Orders fetched')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Get Single Order ─────────────────────────────────────────────────────────
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) throw new ApiError(404, 'Order not found')

    // Customers can only view their own orders
    if (
      req.user.role === 'customer' &&
      order.customer.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, 'Access denied')
    }

    return res.status(200).json(new ApiResponse(200, { order }, 'Order fetched'))
  } catch (error) {
    next(error)
  }
}

// ─── Cancel Order ─────────────────────────────────────────────────────────────
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id })
    if (!order) throw new ApiError(404, 'Order not found')

    if (!['pending', 'processing'].includes(order.orderStatus)) {
      throw new ApiError(400, `Cannot cancel order with status: ${order.orderStatus}`)
    }

    // Initiate Razorpay refund if already paid
    if (order.paymentInfo.status === 'paid' && order.paymentInfo.razorpayPaymentId) {
      await razorpay.payments.refund(order.paymentInfo.razorpayPaymentId, {
        amount: Math.round(order.totalAmount * 100),
        speed: 'normal',
      })
      order.paymentInfo.status = 'refunded'
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      })
    }

    order.orderStatus = 'cancelled'
    order.cancelledAt = new Date()
    await order.save()

    return res
      .status(200)
      .json(new ApiResponse(200, { order }, 'Order cancelled successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Get Seller Orders ────────────────────────────────────────────────────────
export const getSellerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const filter = { 'items.seller': req.user._id }
    if (status) filter.orderStatus = status

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ])

    return res.status(200).json(
      new ApiResponse(200, {
        orders,
        pagination: {
          total,
          page: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Seller orders fetched')
    )
  } catch (error) {
    next(error)
  }
}

// ─── Update Order Status (Seller & Admin) ───────────────────────────────────────
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const allowedTransitions = {
      processing: ['shipped'],
      shipped: ['delivered'],
    }

    const filter = { _id: req.params.id }
    // If not admin, restrict to orders containing items sold by this seller
    if (req.user.role !== 'admin') {
      filter['items.seller'] = req.user._id
    }

    const order = await Order.findOne(filter)
    if (!order) throw new ApiError(404, 'Order not found or access denied')

    // Sellers must follow strict transitions; admins can force any valid status
    if (req.user.role !== 'admin') {
      const allowed = allowedTransitions[order.orderStatus]
      if (!allowed || !allowed.includes(status)) {
        throw new ApiError(400, `Cannot transition from "${order.orderStatus}" to "${status}"`)
      }
    }

    order.orderStatus = status
    if (status === 'delivered') order.deliveredAt = new Date()
    await order.save()

    return res
      .status(200)
      .json(new ApiResponse(200, { order }, `Order status updated to ${status}`))
  } catch (error) {
    next(error)
  }
}

// ─── Get All Orders (Admin) ───────────────────────────────────────────────────
export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, status } = req.query
    const filter = status ? { orderStatus: status } : {}
    const skip = (Number(page) - 1) * Number(limit)

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ])

    return res.status(200).json(
      new ApiResponse(200, {
        orders,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
      }, 'All orders fetched')
    )
  } catch (error) {
    next(error)
  }
}
