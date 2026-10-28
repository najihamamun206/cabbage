const mongoose = require('mongoose')

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'pending', 'reject'], default: 'pending' },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  },
  { timestamps: true },
)

subCategorySchema.index({ name: 1, parentCategory: 1 }, { unique: true })

module.exports = mongoose.model('SubCategory', subCategorySchema)