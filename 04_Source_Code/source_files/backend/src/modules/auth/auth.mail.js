import sendgrid from '@sendgrid/mail'
import nodemailer from 'nodemailer'
import { env } from '../../config/env.js'

const usingSendGrid = Boolean(env.SENDGRID_API_KEY)

export function isPasswordEmailConfigured() {
  return usingSendGrid || Boolean(env.SMTP_HOST)
}

function buildResetBody(name, resetUrl) {
  const expiresIn = env.PASSWORD_RESET_EXPIRES_MINUTES
  return `Hi ${name},

Reset your CP Pulse password using this link: ${resetUrl}

This link expires in ${expiresIn} minutes. If you did not request it, you can ignore this email.`
}

function sendgridFrom() {
  return {
    email: env.SENDGRID_FROM_EMAIL,
    name: env.SENDGRID_FROM_NAME || undefined,
  }
}

async function sendViaSendGrid({ name, resetUrl, to }) {
  sendgrid.setApiKey(env.SENDGRID_API_KEY)
  await sendgrid.send({
    from: sendgridFrom(),
    to,
    subject: 'Reset your CP Pulse password',
    text: buildResetBody(name, resetUrl),
  })
}

async function sendViaSmtp({ name, resetUrl, to }) {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && env.SMTP_PASS
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
  })

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'Reset your CP Pulse password',
    text: buildResetBody(name, resetUrl),
  })
}

export async function sendPasswordResetEmail({ name, resetUrl, to }) {
  if (usingSendGrid) {
    await sendViaSendGrid({ name, resetUrl, to })
    return
  }
  await sendViaSmtp({ name, resetUrl, to })
}
