const mongoose = require('mongoose')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const SubCategory = require('../models/subCategoryModel')
const User = require('../models/userSchema')

const userFields = 'username email role status isVerified createdAt updatedAt'

const listUsers = async (req, res) => {
  const requestedStatus = req.path.endsWith('/active-users')
    ? 'active'
    : req.path.endsWith('/deactive-users')
      ? 'suspended'
      : req.query.status
  const filter = requestedStatus === 'active'
    ? { $or: [{ status: 'active' }, { status: { $exists: false } }] }
    : requestedStatus === 'suspended'
      ? { status: 'suspended' }
      : {}
  const users = await User.find(filter).select(userFields).sort({ createdAt: -1 })
  return res.json({ success: true, data: users })
}

const getUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user id' })
  }
  const user = await User.findById(req.params.id).select(userFields)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  return res.json({ success: true, data: user })
}

const updateUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user id' })
  }
  const updates = {}
  for (const field of ['username', 'email', 'role', 'status', 'isVerified']) {
    if (req.body[field] !== undefined) updates[field] = req.body[field]
  }
  if (updates.email) updates.email = updates.email.trim().toLowerCase()
  if (updates.role && !['user', 'vendor', 'admin'].includes(updates.role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' })
  }
  if (updates.status && !['active', 'suspended'].includes(updates.status)) {
    return res.status(400).json({ success: false, message: 'Invalid user status' })
  }
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select(userFields)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  return res.json({ success: true, data: user })
}

const deleteUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user id' })
  }
  if (String(req.user._id) === req.params.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account' })
  }
  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  return res.json({ success: true, message: 'User deleted successfully' })
}

const listCategories = async (req, res) => {
  const categories = await Category.find().populate('owner', 'username email').populate('subCategory').sort({ createdAt: -1 })
  return res.json({ success: true, data: categories })
}

const listCategoriesByOwner = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid owner id' })
  }
  const categories = await Category.find({ owner: req.params.id }).populate('subCategory').sort({ name: 1 })
  return res.json({ success: true, data: categories })
}

const updateCategory = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid category id' })
  }
  const updates = {}
  if (typeof req.body.name === 'string') updates.name = req.body.name.trim().toLowerCase()
  if (req.body.status !== undefined) updates.status = req.body.status
  if (updates.status && !['active', 'pending', 'reject'].includes(updates.status)) {
    return res.status(400).json({ success: false, message: 'Invalid category status' })
  }
  if (!Object.keys(updates).length || updates.name === '') {
    return res.status(400).json({ success: false, message: 'A valid category name or status is required' })
  }
  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' })
  if (updates.status) await SubCategory.updateMany({ parentCategory: category._id }, { status: updates.status })
  return res.json({ success: true, data: category })
}

const deleteCategory = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid category id' })
  }
  if (await Product.exists({ category: req.params.id })) {
    return res.status(409).json({ success: false, message: 'Delete category products before deleting this category' })
  }
  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' })
  await SubCategory.deleteMany({ parentCategory: category._id })
  return res.json({ success: true, message: 'Category deleted successfully' })
}

const updateProductStatus = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid product id' })
  }
  const { status } = req.body
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be pending, approved, or rejected' })
  }
  const product = await Product.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
  return res.json({ success: true, data: product })
}

module.exports = {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  listCategories,
  listCategoriesByOwner,
  updateCategory,
  deleteCategory,
  updateProductStatus,
}