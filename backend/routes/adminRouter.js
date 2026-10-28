const express = require('express')
const { authenticate, authorize } = require('../middlewares/authMiddleware')
const {
  deleteCategory,
  deleteUser,
  getUser,
  listCategories,
  listCategoriesByOwner,
  listUsers,
  updateCategory,
  updateProductStatus,
  updateUser,
} = require('../controllers/adminController')

const router = express.Router()
const adminAccess = [authenticate, authorize('admin')]

router.get('/dashboard', authenticate, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome admin', user: req.user })
})

router.get('/all-users', ...adminAccess, listUsers)
router.get('/active-users', ...adminAccess, listUsers)
router.get('/deactive-users', ...adminAccess, listUsers)
router.get('/user/:id', ...adminAccess, getUser)
router.post('/update/:id', ...adminAccess, updateUser)
router.delete('/delete/:id', ...adminAccess, deleteUser)

router.get('/categories', ...adminAccess, listCategories)
router.get('/user/:id/category', ...adminAccess, listCategoriesByOwner)
router.post('/update-category/:id', ...adminAccess, updateCategory)
router.post('/delete-category/:id', ...adminAccess, deleteCategory)
router.patch('/products/:id/status', ...adminAccess, updateProductStatus)

module.exports = router