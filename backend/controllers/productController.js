const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const mongoose = require('mongoose')
const { readSheet } = require('read-excel-file/node')
const writeExcelFile = require('write-excel-file/node')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const SubCategory = require('../models/subCategoryModel')

const toSlug = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const createUniqueSlug = async (title, currentId) => {
  const baseSlug = toSlug(title) || 'product'
  let slug = baseSlug
  let suffix = 1
  while (await Product.exists({ slug, ...(currentId ? { _id: { $ne: currentId } } : {}) })) {
    slug = `${baseSlug}-${suffix++}`
  }
  return slug
}

const createSku = () => `CAB-${crypto.randomBytes(5).toString('hex').toUpperCase()}`
const imageUrl = (file) => `/uploads/${file.filename}`
const populateProduct = (query) => query
  .populate('category', 'name')
  .populate('subCategory', 'name')
  .populate('owner', 'username email')

const validateCategory = async ({ categoryId, subCategoryId, ownerId, allowOtherOwners }) => {
  if (!mongoose.isValidObjectId(categoryId) || !mongoose.isValidObjectId(subCategoryId)) return false
  const categoryQuery = { _id: categoryId, status: 'active' }
  if (!allowOtherOwners) categoryQuery.owner = ownerId
  const [category, subCategory] = await Promise.all([
    Category.findOne(categoryQuery),
    SubCategory.findOne({ _id: subCategoryId, parentCategory: categoryId, status: 'active' }),
  ])
  return Boolean(category && subCategory)
}

const listProducts = async (req, res) => {
  const filter = { status: 'approved' }
  const categoryId = req.query.category || req.params.categoryId
  const subCategoryId = req.query.subCategory || req.params.subcategoryId
  if (categoryId && mongoose.isValidObjectId(categoryId)) filter.category = categoryId
  if (subCategoryId && mongoose.isValidObjectId(subCategoryId)) filter.subCategory = subCategoryId
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    filter.title = { $regex: req.query.search.trim(), $options: 'i' }
  }
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100)
  const [products, total] = await Promise.all([
    populateProduct(Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)),
    Product.countDocuments(filter),
  ])
  return res.json({ success: true, data: products, pagination: { page, limit, total } })
}

const getProduct = async (req, res) => {
  const query = mongoose.isValidObjectId(req.params.id)
    ? { _id: req.params.id, status: 'approved' }
    : { slug: req.params.id, status: 'approved' }
  const product = await populateProduct(Product.findOne(query))
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
  return res.json({ success: true, data: product })
}

const listOwnerProducts = async (req, res) => {
  const ownerId = req.user.role === 'admin' ? req.params.ownerId : req.user._id
  if (req.user.role === 'admin' && !mongoose.isValidObjectId(ownerId)) {
    return res.status(400).json({ success: false, message: 'Invalid owner id' })
  }
  const products = await populateProduct(Product.find({ owner: ownerId }).sort({ createdAt: -1 }))
  return res.json({ success: true, data: products })
}

const createProduct = async (req, res) => {
  const { title, description = '', shortDescription = '', price, discountPrice = 0, stock = 0, category, subCategory } = req.body
  if (!title?.trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ success: false, message: 'Title and a valid price are required' })
  }
  if (!await validateCategory({
    categoryId: category,
    subCategoryId: subCategory,
    ownerId: req.user._id,
    allowOtherOwners: req.user.role === 'admin',
  })) {
    return res.status(400).json({ success: false, message: 'Choose an active category and subcategory that you own' })
  }

  const mainImageIndex = Number(req.body.mainImageIndex ?? req.body.isMain ?? 0)
  const images = (req.files || []).map((file, index) => ({ url: imageUrl(file), isMain: index === mainImageIndex }))
  const product = await Product.create({
    title: title.trim(),
    slug: await createUniqueSlug(title),
    sku: createSku(),
    description,
    shortDescription,
    price: Number(price),
    discountPrice: Number(discountPrice) || 0,
    stock: Math.max(Number.parseInt(stock, 10) || 0, 0),
    category,
    subCategory,
    owner: req.user._id,
    images,
  })
  return res.status(201).json({ success: true, data: product })
}

const updateProduct = async (req, res) => {
  if (req.body.sku || req.body.slug || req.body.owner) {
    return res.status(400).json({ success: false, message: 'SKU, slug, and owner cannot be changed' })
  }
  const filter = { _id: req.params.id }
  if (req.user.role !== 'admin') filter.owner = req.user._id
  const product = await Product.findOne(filter)
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

  const allowedFields = ['title', 'description', 'shortDescription', 'price', 'discountPrice', 'stock', 'category', 'subCategory']
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) product[field] = req.body[field]
  }
  if (req.body.title) product.slug = await createUniqueSlug(req.body.title, product._id)
  if (req.body.price !== undefined) product.price = Number(req.body.price)
  if (req.body.discountPrice !== undefined) product.discountPrice = Number(req.body.discountPrice) || 0
  if (req.body.stock !== undefined) product.stock = Number(req.body.stock)
  const requestedMainImage = req.body.mainImageIndex ?? req.body.isMain
  if (requestedMainImage !== undefined) {
    const mainIndex = Number.parseInt(requestedMainImage, 10)
    product.images.forEach((image, index) => { image.isMain = index === mainIndex })
  }
  const requestedRemovals = req.body.removeImageIndexes ?? req.body.deleteIndex
  if (requestedRemovals !== undefined) {
    const indexes = Array.isArray(requestedRemovals)
      ? requestedRemovals
      : String(requestedRemovals).startsWith('[')
        ? JSON.parse(requestedRemovals)
        : String(requestedRemovals).split(',')
    const removeIndexes = new Set(indexes.map(Number))
    product.images = product.images.filter((image, index) => !removeIndexes.has(index))
  }
  for (const file of req.files || []) product.images.push({ url: imageUrl(file), isMain: false })

  if (req.body.category || req.body.subCategory) {
    const category = req.body.category || product.category
    const subCategory = req.body.subCategory || product.subCategory
    if (!await validateCategory({ categoryId: category, subCategoryId: subCategory, ownerId: req.user._id, allowOtherOwners: req.user.role === 'admin' })) {
      return res.status(400).json({ success: false, message: 'Choose a valid active category and subcategory' })
    }
  }
  await product.save()
  return res.json({ success: true, data: product })
}

const deleteProduct = async (req, res) => {
  const filter = { _id: req.params.id }
  if (req.user.role !== 'admin') filter.owner = req.user._id
  const product = await Product.findOneAndDelete(filter)
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
  return res.json({ success: true, message: 'Product deleted successfully' })
}

const spreadsheetSchema = {
  title: { column: 'title', type: String },
  description: { column: 'description', type: String },
  shortDescription: { column: 'shortDescription', type: String },
  price: { column: 'price', type: Number },
  discountPrice: { column: 'discountPrice', type: Number },
  stock: { column: 'stock', type: Number },
  category: { column: 'category', type: String },
  subCategory: { column: 'subCategory', type: String },
}

const importProducts = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Select a spreadsheet file' })
  try {
    const { objects, errors = [] } = await readSheet(req.file.path, { schema: spreadsheetSchema })
    const products = []
    for (const item of objects || []) {
      if (!item.title || !Number.isFinite(item.price) || !await validateCategory({
        categoryId: item.category,
        subCategoryId: item.subCategory,
        ownerId: req.user._id,
      })) continue
      products.push({
        ...item,
        slug: await createUniqueSlug(item.title),
        sku: createSku(),
        owner: req.user._id,
        stock: Math.max(Number.parseInt(item.stock, 10) || 0, 0),
        images: [],
      })
    }
    const created = products.length ? await Product.insertMany(products) : []
    return res.status(201).json({ success: true, data: created, skippedRows: errors.length + (objects?.length || 0) - products.length })
  } finally {
    await fs.rm(req.file.path, { force: true })
  }
}

const exportProducts = async (req, res) => {
  const products = await Product.find({ owner: req.user._id }).lean()
  const columns = [
    { header: 'title', cell: (product) => ({ value: product.title }) },
    { header: 'description', cell: (product) => ({ value: product.description || '' }) },
    { header: 'shortDescription', cell: (product) => ({ value: product.shortDescription || '' }) },
    { header: 'price', cell: (product) => ({ value: product.price, type: Number }) },
    { header: 'discountPrice', cell: (product) => ({ value: product.discountPrice || 0, type: Number }) },
    { header: 'stock', cell: (product) => ({ value: product.stock || 0, type: Number }) },
    { header: 'category', cell: (product) => ({ value: product.category?.toString() || '' }) },
    { header: 'subCategory', cell: (product) => ({ value: product.subCategory?.toString() || '' }) },
  ]
  const filePath = path.join(os.tmpdir(), `cabbage-products-${crypto.randomUUID()}.xlsx`)
  try {
    await writeExcelFile(products, { columns }).toFile(filePath)
    return res.download(filePath, 'products.xlsx', () => fs.rm(filePath, { force: true }))
  } catch (error) {
    await fs.rm(filePath, { force: true })
    throw error
  }
}

module.exports = {
  listProducts,
  getProduct,
  listOwnerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
  exportProducts,
}