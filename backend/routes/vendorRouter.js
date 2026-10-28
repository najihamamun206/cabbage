const express = require('express')
const { authenticate, authorize } = require('../middlewares/authMiddleware')
const { imageUpload, spreadsheetUpload } = require('../middlewares/uploadMiddleware')
const {
  createCategory,
  createSubCategory,
  listAllSubCategories,
  listCategories,
  listOwnedCategories,
  listSubCategories,
} = require('../controllers/catalogController')
const {
  createProduct,
  deleteProduct,
  exportProducts,
  getProduct,
  importProducts,
  listOwnerProducts,
  listProducts,
  updateProduct,
} = require('../controllers/productController')

const router = express.Router()
const vendorAccess = [authenticate, authorize('vendor', 'admin')]

router.get('/dashboard', authenticate, authorize('vendor'), (req, res) => {
  res.json({ success: true, message: 'Welcome vendor', user: req.user })
})

router.get('/all/category', ...vendorAccess, listCategories)
router.get('/all/subcategory', ...vendorAccess, listAllSubCategories)
router.get('/category/:id/subcategory', ...vendorAccess, listSubCategories)
router.get('/user/:id/category', ...vendorAccess, listOwnedCategories)
router.post('/create/category', ...vendorAccess, createCategory)
router.post('/create/subcategory', ...vendorAccess, createSubCategory)

router.get('/products/all', listProducts)
router.get('/products/category/:categoryId', listProducts)
router.get('/products/subcategory/:subcategoryId', listProducts)
router.get('/products/owner/:ownerId', ...vendorAccess, listOwnerProducts)
router.get('/products/:id', getProduct)
router.post('/products/create', ...vendorAccess, imageUpload.array('images', 8), createProduct)
router.post('/products/update/:id', ...vendorAccess, imageUpload.array('images', 8), updateProduct)
router.delete('/products/:id', ...vendorAccess, deleteProduct)
router.post('/products/bulk', ...vendorAccess, spreadsheetUpload.single('file'), importProducts)
router.post('/products/bulk/save', ...vendorAccess, exportProducts)

module.exports = router