const express = require('express')
const { authenticate, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()
router.get('/dashboard', authenticate, authorize('vendor'), (req, res) => {
  res.json({ success: true, message: 'Welcome vendor', user: req.user })
})

module.exports = router