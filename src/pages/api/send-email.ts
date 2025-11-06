import nodemailer from "nodemailer";
import type { NextApiRequest, NextApiResponse } from 'next';

export interface SendEmailParams {
  orderId?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    city: string;
    country: string;
    zip: string;
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totals: {
    subtotal: number;
    shipping: number;
    taxes: number;
    grandTotal: number;
  };
}

export async function sendOrderConfirmationEmail(params: SendEmailParams) {
  const { customer, items, totals, orderId, shipping } = params;

  if (!customer?.email || !items || !totals) {
    throw new Error("Missing required fields");
  }

  // Configure transporter.
  // Use Ethereal ONLY when explicitly requested via USE_ETHEREAL=true.
  // Otherwise use the real SMTP settings (Gmail) in both dev and prod.
  let transporter: any
  let usedEthereal = false

  if (process.env.USE_ETHEREAL === 'true') {
    console.log('USE_ETHEREAL=true -> using Ethereal test SMTP account for preview')
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    usedEthereal = true
  } else {
    transporter = nodemailer.createTransport({
      // Prefer explicit host/port rather than `service` so env vars control behavior.
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true" || false, // true for port 465, false for 587
      auth: {
        user: process.env.SMTP_USER, // SMTP username
        pass: process.env.SMTP_PASSWORD, // SMTP password or app password
      },
      tls: {
        // Allow self-signed certs in development. In production, ensure this is secure.
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    })
    console.log('Using real SMTP transporter (Gmail or configured SMTP).')
  }

  // Format order items for invoice-style HTML display
  const itemsListHtml = items
    .map((item, index) => {
      const itemTotal = item.price * item.quantity;
      const productName = `${item.name} x${item.quantity}`;
      const dashes = "-".repeat(Math.max(1, 60 - productName.length - itemTotal.toLocaleString().length - 3));
      return `
          <tr class="invoice-row">
            <td class="invoice-item">${productName}</td>
            <td class="invoice-dashes">${item.quantity}</td>
            <td class="invoice-price">$${itemTotal.toLocaleString()}</td>
          </tr>
          ${index < items.length - 1 ? '<tr><td colspan="3" class="invoice-divider">-</td></tr>' : ''}
        `;
    })
    .join("");

  // Format order items for plain text version
  const itemsList = items
    .map((item) => {
      const itemTotal = item.price * item.quantity;
      const productName = `${item.name} x${item.quantity}`;
      const dashes = "-".repeat(Math.max(1, 60 - productName.length - itemTotal.toLocaleString().length - 3));
      return `${productName} ${dashes} $${itemTotal.toLocaleString()}`;
    })
    .join("\n");

  // Email HTML template with Neo-Brutalism style
  const emailHtml = `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f5f5f7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #222;
    }

    .email-wrapper {
      width: 100%;
      padding: 30px 0;
      display: flex;
      justify-content: center;
    }

    .email-container {
      background: #ffffff;
      width: 100%;
      max-width: 620px;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 6px 28px rgba(0,0,0,0.09);
    }

    .header {
      background: #d87d4a;
      color: #fff;
      text-align: center;
      padding: 40px 30px;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .header span {
      font-size: 16px;
      opacity: 0.9;
    }

    .section {
      padding: 32px;
    }

    .section h2 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 14px;
    }

    .divider {
      height: 1px;
      background: #e5e5e5;
      margin: 20px 0;
    }

    .address-box {
      background: #fafafa;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
      border: 1px solid #ececec;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .items-table th {
      text-align: left;
      padding: 8px 4px;
      font-size: 13px;
      color: #555;
      border-bottom: 1px solid #e5e5e5;
    }

    .items-table td {
      padding: 10px 4px;
      font-size: 14px;
      border-bottom: 1px solid #f1f1f1;
    }

    .totals {
      margin-top: 24px;
      font-size: 15px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .grand-total {
      font-size: 22px;
      font-weight: 800;
      margin-top: 14px;
      color: #d87d4a;
    }

    .cta-button {
      display: inline-block;
      background: #d87d4a;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      font-size: 15px;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 28px;
      text-align: center;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #555;
      padding: 28px;
    }
  </style>
</head>

<body>
<div class="email-wrapper">
  <div class="email-container">

    <div class="header">
      <h1>Order Confirmed</h1>
      <span>Thanks for your purchase, ${customer.name}!</span>
    </div>

    <div class="section">
      <h2>Shipping To</h2>
      <div class="address-box">
        ${customer.name}<br>
        ${shipping?.address || "N/A"}<br>
        ${shipping?.city || "N/A"}, ${shipping?.country || "N/A"} ${shipping?.zip || "N/A"}
      </div>

      <div class="divider"></div>

      <h2>Order #${orderId || "N/A"}</h2>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width:60%">Item</th>
            <th style="width:20%">Qty</th>
            <th style="width:20%">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row"><span>Subtotal:  </span><span>$${totals.subtotal.toLocaleString()}</span></div>
        <div class="totals-row"><span>Shipping:  </span><span>$${totals.shipping.toLocaleString()}</span></div>
        <div class="totals-row"><span>Tax:  </span><span>$${totals.taxes.toFixed(2)}</span></div>
        <div class="grand-total">Total: $${totals.grandTotal.toLocaleString()}</div>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://audiophile.com'}/orders/${orderId}" class="cta-button">
        View Order Status
      </a>
    </div>

    <div class="footer">
      Questions? Contact support@audiophile.com<br>
      You’ll receive a shipping update soon.
    </div>

  </div>
</div>
</body>
</html>
  `;

  // Plain text version
  const emailText = `
    Hello ${customer.name}! 👋

    🎉 Your Order is Confirmed!

    Order #${orderId || "N/A"}

    📦 Order Details:

    📍 Shipping Address:
    ${customer.name}
    ${shipping?.address || "N/A"}
    ${shipping?.city || "N/A"}, ${shipping?.country || "N/A"} ${shipping?.zip || "N/A"}

    🛍️ Items You Got:
    ${itemsList}

    💰 Payment Summary:
    Subtotal: $${totals.subtotal.toLocaleString()}
    Shipping: $${totals.shipping.toLocaleString()}
    Tax: $${totals.taxes.toFixed(2)}
    Grand Total: $${totals.grandTotal.toLocaleString()}

    View Your Order: ${process.env.NEXT_PUBLIC_APP_URL || 'https://audiophile.com'}/orders/${orderId}

    You'll receive another email when your order ships! 🚚
  `;

  // Send email from your Gmail account
  const fromEmail = process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || "Audiophile";
  
  if (!fromEmail) {
    throw new Error("SMTP_USER environment variable is required (your Gmail address)");
  }

  let info: any

  try {
    console.log('transporter options:', (transporter as any).options || {})
    info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: customer.email,
      subject: `Order Confirmation - Order #${orderId || "N/A"}`,
      text: emailText,
      html: emailHtml,
    })

    console.log('nodemailer sendMail info:', info)

    const result: any = { success: true, messageId: info.messageId }
    if (usedEthereal) {
      result.previewUrl = nodemailer.getTestMessageUrl(info)
      result.ethereal = true
      console.log('Ethereal preview URL:', result.previewUrl)
    }

    return result
  } catch (err: any) {
    console.error('SMTP send failed:', err && err.message ? err.message : err)
    throw err
  }
}

// Next.js Pages API handler so client-side fetch('/api/send-email') works
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('/api/send-email POST body:', req.body)

    const {
      email,
      name,
      phone,
      shipping,
      // support some clients that sent shippingAddress previously
      shippingAddress,
      items = [],
      subtotal,
      // some clients use `shipping` numeric for shipping cost
      shipping: shippingNumber,
      // explicit shipping cost field (preferred when sending both address and cost)
      shippingCost,
      taxes,
      total,
      orderId,
    } = req.body as any

    // Prefer an object shipping address when available. shipping may be either an object or a number.
    const shippingObj = (shipping && typeof shipping === 'object') ? shipping : (shippingAddress ?? { address: '', city: '', country: '', zip: '' })

    const params: SendEmailParams = {
      orderId,
      customer: { name: name || '', email: email || '', phone: phone || '' },
      shipping: {
        address: shippingObj.address || '',
        city: shippingObj.city || '',
        country: shippingObj.country || '',
        zip: shippingObj.zipCode || shippingObj.zip || '',
      },
      items: (items || []).map((it: any) => ({ name: it.name, price: Number(it.price || 0), quantity: Number(it.quantity || 1) })),
      totals: {
        subtotal: Number(subtotal || 0),
        // shippingCost takes precedence if provided, otherwise fall back to shippingNumber (if numeric),
        // otherwise 0. This avoids NaN when shipping was sent as an address object.
        shipping: Number(typeof shippingCost === 'number' ? shippingCost : (typeof shippingNumber === 'number' ? shippingNumber : 0)),
        taxes: Number(taxes || 0),
        grandTotal: Number(total || 0),
      },
    }

    const result = await sendOrderConfirmationEmail(params)
    console.log('Email send result:', result)
    return res.status(200).json({ success: true, result })
  } catch (err) {
    console.error('Error in /api/send-email:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}

