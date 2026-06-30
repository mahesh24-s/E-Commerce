import multer from 'multer'
import cloudinary from '../config/cloudinary.js'
import ApiError from '../utils/ApiError.js'
import { Readable } from 'stream'

// Use memory storage — we stream buffers directly to Cloudinary (stores parsed files in RAM)
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => { // checks file type and size
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed'), false)
  }
}

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
})

// Helper: upload a buffer to Cloudinary via stream
export const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(new ApiError(500, 'Cloudinary upload failed'))
        resolve({ public_id: result.public_id, url: result.secure_url })
      }
    )
    const readable = Readable.from(buffer)
    readable.pipe(uploadStream)
  })
}

// Helper: delete an image from Cloudinary
export const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return
  await cloudinary.uploader.destroy(public_id)
}

// Middleware: single file upload (e.g. avatar)
export const uploadSingle = (fieldName) => multerUpload.single(fieldName)

// Middleware: multiple files upload (e.g. product images — max 5)
export const uploadMultiple = (fieldName, maxCount = 5) =>
  multerUpload.array(fieldName, maxCount)

// Middleware: multiple fields (e.g. review images — max 3)
export const uploadReviewImages = multerUpload.array('images', 3)
