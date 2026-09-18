const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'vendor', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)