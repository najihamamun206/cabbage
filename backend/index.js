require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDatabase = require('./config/mongoDBConfig')

const app = express()
const port = Number(process.env.PORT || 5000)

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/', (req, res) => res.json({ success: true, message: 'Cabbage API is running' }))
app.use('/api/v1/auth', require('./routes/authRouter'))
app.use('/api/v1/user', require('./routes/userRouter'))
app.use('/api/v1/admin', require('./routes/adminRouter'))
app.use('/api/v1/vendor', require('./routes/vendorRouter'))

app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

const startServer = async () => {
  await connectDatabase()
  app.listen(port, () => console.log(`Server is running on port ${port}`))
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Unable to start server: ${error.message}`)
    process.exit(1)
  })
}

module.exports = app