const jwt = require('jsonwebtoken')
const User = require('../models/userSchema')

const getTokenFromRequest = (req) => {
  const authorization = req.headers.authorization || ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : null
}

const authenticate = async (req, res, next) => {
  const token = getTokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token is required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded._id)
    if (!user || user.status === 'suspended') {
      return res.status(401).json({ success: false, message: 'Account is unavailable' })
    }
    req.user = user
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You are not authorized' })
  }
  next()
}

module.exports = { authenticate, authorize }