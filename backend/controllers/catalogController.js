const mongoose = require('mongoose')
const Category = require('../models/categoryModel')
const SubCategory = require('../models/subCategoryModel')

const listCategories = async (req, res) => {
  const categories = await Category.find({ status: 'active' })
    .populate({ path: 'subCategory', match: { status: 'active' } })
    .sort({ name: 1 })
  return res.json({ success: true, data: categories })
}

const listSubCategories = async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid category id' })
  }
  const categories = await Category.findById(id)
  if (!categories || categories.status !== 'active') {
    return res.status(404).json({ success: false, message: 'Category not found' })
  }
  const subCategories = await SubCategory.find({ parentCategory: id, status: 'active' }).sort({ name: 1 })
  return res.json({ success: true, data: subCategories })
}

const listAllSubCategories = async (req, res) => {
  const subCategories = await SubCategory.find().populate('parentCategory', 'name').sort({ name: 1 })
  return res.json({ success: true, data: subCategories })
}

const listOwnedCategories = async (req, res) => {
  const ownerId = req.user.role === 'admin' ? req.params.id : req.user._id
  if (!mongoose.isValidObjectId(ownerId)) {
    return res.status(400).json({ success: false, message: 'Invalid owner id' })
  }
  if (req.user.role !== 'admin' && String(req.params.id) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You can only view your own categories' })
  }
  const categories = await Category.find({ owner: ownerId }).populate('subCategory').sort({ name: 1 })
  return res.json({ success: true, data: categories })
}

const createCategory = async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim().toLowerCase() : ''
  if (!name) return res.status(400).json({ success: false, message: 'Category name is required' })

  const category = await Category.create({ name, owner: req.user._id })
  return res.status(201).json({ success: true, data: category })
}

const createSubCategory = async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim().toLowerCase() : ''
  const { parentCategory } = req.body
  if (!name || !mongoose.isValidObjectId(parentCategory)) {
    return res.status(400).json({ success: false, message: 'Name and valid parent category are required' })
  }

  const category = await Category.findOne({ _id: parentCategory, owner: req.user._id })
  if (!category) return res.status(404).json({ success: false, message: 'Owned category not found' })

  const subCategory = await SubCategory.create({ name, parentCategory })
  category.subCategory.push(subCategory._id)
  await category.save()
  return res.status(201).json({ success: true, data: subCategory })
}

module.exports = {
  listCategories,
  listSubCategories,
  listAllSubCategories,
  listOwnedCategories,
  createCategory,
  createSubCategory,
}