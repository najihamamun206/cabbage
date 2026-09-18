const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/userSchema')
const sendEmail = require('../utils/emailSender')

const createToken = (user) =>
  jwt.sign({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

const publicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
})

const register = async (req, res) => {
  const { username, email, password, role } = req.body
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'username, email and password are required' })
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) return res.status(409).json({ success: false, message: 'User already exists' })

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: ['user', 'vendor'].includes(role) ? role : 'user',
  })

  const verificationToken = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_VERIFY_SECRET, {
    expiresIn: '1d',
  })
  await sendEmail({
    to: user.email,
    subject: 'Verify your Cabbage account',
    text: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`,
  })

  return res.status(201).json({ success: true, message: 'Registration successful', user: publicUser(user), token: createToken(user) })
}

const login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: email?.toLowerCase() })
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }
  return res.json({ success: true, user: publicUser(user), token: createToken(user) })
}

const verifyEmail = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_VERIFY_SECRET)
    await User.findByIdAndUpdate(decoded._id, { isVerified: true })
    return res.json({ success: true, message: 'Email verified' })
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid or expired verification token' })
  }
}

const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() })
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })

  const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_VERIFY_SECRET, { expiresIn: '15m' })
  await sendEmail({
    to: user.email,
    subject: 'Reset your Cabbage password',
    text: `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`,
  })
  return res.json({ success: true, message: 'Password reset email sent' })
}

const resetPassword = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_VERIFY_SECRET)
    const { newPassword, confirmPassword } = req.body
    if (!newPassword || newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' })
    }
    await User.findByIdAndUpdate(decoded._id, { password: await bcrypt.hash(newPassword, 10) })
    return res.json({ success: true, message: 'Password reset successful' })
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' })
  }
}

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  return res.json({ success: true, user: publicUser(user) })
}

module.exports = { register, login, verifyEmail, forgotPassword, resetPassword, getProfile }