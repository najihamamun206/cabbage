const express = require('express')
const { authenticate, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()
router.get('/dashboard', authenticate, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome admin', user: req.user })
})

module.exports = router