const nodemailer = require('nodemailer')

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
    console.warn(`Email not sent because SMTP is not configured. Recipient: ${to}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: Number(process.env.MAIL_PORT || 587) === 465,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD },
  })

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  })
}

module.exports = sendEmail