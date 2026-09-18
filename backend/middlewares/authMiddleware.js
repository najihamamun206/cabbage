const jwt = require('jsonwebtoken')

const getTokenFromRequest = (req) => {
  const authorization = req.headers.authorization || ''
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : null
}

const authenticate = (req, res, next) => {
  const token = getTokenFromRequest(req)

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token is required' })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
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