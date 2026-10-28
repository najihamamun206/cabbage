const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'pending', 'reject'], default: 'pending' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }],
  },
  { timestamps: true },
)

module.exports = mongoose.model('Category', categorySchema)