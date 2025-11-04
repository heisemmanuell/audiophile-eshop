import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email, total, orderId } = await req.json()

    console.log('Sending email to:', email, 'for order:', orderId)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background: #f8f9fa; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank you for your order!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>We've received your order and are preparing it for shipment. Here are the details:</p>
              <div class="order-details">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Total Amount:</strong> $${total}</p>
              </div>
              <p>You'll receive another email when your order ships. If you have any questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>The Audiophile Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Order Confirmation - Audiophile',
      html,
    })

    console.log('Email sent successfully:', result)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Email sending failed:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
