import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

type LineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('POST /api/send-email called with body:', req.body)

    const {
      email,
      name,
      phone,
      shipping,
      // some clients may send shippingAddress instead of shipping
      shippingAddress,
      shippingDetails,
      items = [],
      subtotal,
      // some clients may send shipping as a number (shipping) or shippingCost
      shipping: shippingNumber,
      shippingCost,
      taxes,
      total,
      orderId,
    } = req.body as {
      email: string;
      name?: string;
      phone?: string;
      shippingDetails?: { address?: string; city?: string; country?: string; zipCode?: string };
      shippingAddress?: { address?: string; city?: string; country?: string; zipCode?: string };
      items?: LineItem[];
      subtotal?: number;
      shippingCost?: number;
      // shippingNumber is also allowed (from clients named `shipping`)
      shipping?: number;
      taxes?: number;
      total?: number;
      orderId?: string;
    };

    const fromAddress = process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3000`;

    if (!fromAddress.endsWith('@audiophileshop.order.com') && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ Using fallback from address (testing mode)');
}

    // Normalize shipping object and shipping cost field names
    const shippingObj = shippingDetails ?? shippingAddress ?? {};
    const shippingFee = typeof shippingCost === 'number' ? shippingCost : typeof shippingNumber === 'number' ? shippingNumber : 0;

    const itemsHtml = (items as LineItem[])
      .map(
        (it) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(it.name)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">$${(it.price * it.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Order Confirmation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111; margin:0; padding:0; }
          .container { max-width:600px; margin:0 auto; padding:16px; }
          .card { background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
          .header { background:#000; color:#fff; padding:24px; text-align:center }
          .content { padding:20px }
          .btn { display:inline-block; padding:12px 18px; background:#D87D4A; color:#fff; text-decoration:none; border-radius:6px }
          table { width:100%; border-collapse:collapse; margin-top:12px }
          @media (max-width:480px) { .container { padding:12px } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Thanks for your order${name ? `, ${escapeHtml(name)}` : ''}!</h1>
            </div>
            <div class="content">
              <p>We've received your order <strong>#${escapeHtml(String(orderId || ''))}</strong> and will start preparing it for shipment.</p>

              <h3>Order summary</h3>
              <table aria-label="Order summary">
                <thead>
                  <tr>
                    <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #eee">Item</th>
                    <th style="text-align:center;padding:8px 12px;border-bottom:1px solid #eee">Qty</th>
                    <th style="text-align:right;padding:8px 12px;border-bottom:1px solid #eee">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr><td></td><td></td><td style="padding:8px 12px;text-align:right">Subtotal: $${(subtotal ?? 0).toFixed(2)}</td></tr>
                  <tr><td></td><td></td><td style="padding:8px 12px;text-align:right">Shipping: $${(shippingCost ?? 0).toFixed(2)}</td></tr>
                  <tr><td></td><td></td><td style="padding:8px 12px;text-align:right">Taxes: $${(taxes ?? 0).toFixed(2)}</td></tr>
                  <tr><td></td><td></td><td style="padding:8px 12px;text-align:right"><strong>Grand total: $${(total ?? 0).toFixed(2)}</strong></td></tr>
                </tfoot>
              </table>

              <h3>Shipping details</h3>
              <p>
                ${escapeHtml((shippingObj?.address) || '')}<br />
                ${escapeHtml((shippingObj?.city) || '')}${shippingObj?.zipCode ? `, ${escapeHtml(shippingObj.zipCode)}` : ''}<br />
                ${escapeHtml((shippingObj?.country) || '')}
              </p>

              <p>If you have questions, contact our support at <a href="mailto:support@audiophile.example">support@audiophile.example</a> or reply to this email.</p>

              <p style="text-align:center;margin-top:20px">
                <a class="btn" href="${baseUrl}/order-confirmation?orderId=${encodeURIComponent(String(orderId || ''))}">View your order</a>
              </p>

              <p style="margin-top:18px;font-size:13px;color:#666">Order placed by: ${escapeHtml(name || '')}${phone ? ` — ${escapeHtml(phone)}` : ''}</p>
            </div>
          </div>
        </div>
      </body>
    </html>`;

    const result = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `Your Audiophile order confirmation (#${orderId || ''})`,
      html,
    });

    console.log('📩 Resend send() response:', JSON.stringify(result, null, 2));
    console.log('Resend result:', result);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('Failed to send email', err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

function escapeHtml(unsafe: string) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
