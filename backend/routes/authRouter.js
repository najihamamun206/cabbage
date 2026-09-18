const express = require('express')
const controller = require('../controllers/userController')

const router = express.Router()

router.post('/registration', controller.register)
router.post('/login', controller.login)
router.get('/verify-email/:token', controller.verifyEmail)
router.post('/forgot-password', controller.forgotPassword)
router.post('/reset-password/:token', controller.resetPassword)

module.exports = router