const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const multer = require('multer')

const uploadDirectory = path.join(__dirname, '..', 'uploads')
fs.mkdirSync(uploadDirectory, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  },
})

const createUpload = (allowedTypes) => multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error('Unsupported file type'))
    }
    return callback(null, true)
  },
})

module.exports = {
  imageUpload: createUpload(new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])),
  spreadsheetUpload: createUpload(new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ])),
}