const express = require('express')
const { authenticate } = require('../middlewares/authMiddleware')
const { getProfile } = require('../controllers/userController')
const { listCategories, listSubCategories } = require('../controllers/catalogController')
const { getProduct, listProducts } = require('../controllers/productController')

const router = express.Router()
router.get('/profile', authenticate, getProfile)
router.get('/categories', listCategories)
router.get('/category/:id/subcategory', listSubCategories)
router.get('/products', listProducts)
router.get('/products/:id', getProduct)

module.exports = router