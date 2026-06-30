import Address from '../models/Address.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'

// ─── Get All Addresses ────────────────────────────────────────────────────────
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    })

    return res
      .status(200)
      .json(new ApiResponse(200, { addresses }, 'Addresses fetched'))
  } catch (error) {
    next(error)
  }
}

// ─── Add Address ──────────────────────────────────────────────────────────────
export const addAddress = async (req, res, next) => {
  try {
    const { name, phone, street, city, state, pincode, country, isDefault } = req.body

    if (!name || !phone || !street || !city || !state || !pincode) {
      throw new ApiError(400, 'All address fields are required')
    }

    // If this is default, unset other defaults
    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false })
    }

    // If no existing addresses, make this default automatically
    const count = await Address.countDocuments({ user: req.user._id })
    const shouldBeDefault = isDefault || count === 0

    const address = await Address.create({
      user: req.user._id,
      name,
      phone,
      street,
      city,
      state,
      pincode,
      country: country || 'India',
      isDefault: shouldBeDefault,
    })

    return res
      .status(201)
      .json(new ApiResponse(201, { address }, 'Address added successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Update Address ───────────────────────────────────────────────────────────
export const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, phone, street, city, state, pincode, country, isDefault } = req.body

    const address = await Address.findOne({ _id: id, user: req.user._id })
    if (!address) throw new ApiError(404, 'Address not found')

    if (name) address.name = name
    if (phone) address.phone = phone
    if (street) address.street = street
    if (city) address.city = city
    if (state) address.state = state
    if (pincode) address.pincode = pincode
    if (country) address.country = country

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false })
      address.isDefault = true
    }

    await address.save()

    return res
      .status(200)
      .json(new ApiResponse(200, { address }, 'Address updated successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Delete Address ───────────────────────────────────────────────────────────
export const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params

    const address = await Address.findOne({ _id: id, user: req.user._id })
    if (!address) throw new ApiError(404, 'Address not found')

    await Address.findByIdAndDelete(id)

    // If deleted address was default, make the most recent remaining one default
    if (address.isDefault) {
      const remaining = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 })
      if (remaining) {
        remaining.isDefault = true
        await remaining.save()
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Address deleted successfully'))
  } catch (error) {
    next(error)
  }
}

// ─── Set Default Address ──────────────────────────────────────────────────────
export const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params

    const address = await Address.findOne({ _id: id, user: req.user._id })
    if (!address) throw new ApiError(404, 'Address not found')

    await Address.updateMany({ user: req.user._id }, { isDefault: false })
    address.isDefault = true
    await address.save()

    return res
      .status(200)
      .json(new ApiResponse(200, { address }, 'Default address updated'))
  } catch (error) {
    next(error)
  }
}
