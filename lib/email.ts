import nodemailer from 'nodemailer'

/**
 * Email Service Utility
 *
 * Uses Google Workspace SMTP for internal email reminders.
 * Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error(
      'Email belum dikonfigurasi. Pastikan SMTP_HOST, SMTP_USER, dan SMTP_PASS sudah diisi di .env.local'
    )
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  try {
    const transporter = getTransporter()
    const from = process.env.SMTP_FROM || process.env.SMTP_USER

    const recipients = Array.isArray(to) ? to.join(', ') : to

    const info = await transporter.sendMail({
      from: `"Gama ERP" <${from}>`,
      to: recipients,
      subject,
      html,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim email'
    console.error('[email] Send failed:', message)
    return { success: false, error: message }
  }
}
