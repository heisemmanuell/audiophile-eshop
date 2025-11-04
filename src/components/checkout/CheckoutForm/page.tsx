'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { CheckoutForm } from './CheckoutForm'
import { CheckoutFormData } from './schema'

export default function CheckoutPage() {
  const router = useRouter()
  const createOrder = useMutation(api.orders.createOrder) // 👈 your Convex function

  // Called when the form is submitted
  const handleSubmit = async (data: CheckoutFormData) => {
    try {
      // Example: get cart items from localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')

      if (cart.length === 0) {
        alert('Your cart is empty!')
        return
      }

      // Calculate totals (you can make this more robust)
      const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
      const shipping = 50
      const taxes = Math.round(subtotal * 0.2)
      const total = subtotal + shipping + taxes

      // Validate quantities are positive
      const hasInvalidQuantity = cart.some((item: any) => item.quantity <= 0)
      if (hasInvalidQuantity) {
        alert('Invalid item quantities detected!')
        return
      }

      // Save order in Convex
      const orderId = await createOrder({
        name: data.billing.name,
        email: data.billing.email,
        phone: data.billing.phone,
        address: data.shipping.address,
        city: data.shipping.city,
        country: data.shipping.country,
        zipCode: data.shipping.zipCode,
        paymentMethod: data.payment.method,
        items: cart.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        shipping,
        taxes,
        total,
      })

      // Send confirmation email (best-effort; do not block the checkout flow)
      try {
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.billing.email,
            name: data.billing.name,
            phone: data.billing.phone,
            shippingAddress: {
              address: data.shipping.address,
              city: data.shipping.city,
              country: data.shipping.country,
              zipCode: data.shipping.zipCode,
            },
            items: cart.map((item: any) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            subtotal,
            shipping,
            taxes,
            total,
            orderId,
          }),
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          console.error('Email sending failed:', errorData)
        } else {
          console.log('Email sent successfully')
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // Don't block the checkout process if email fails
      }

      // Save cart for confirmation page before clearing
      localStorage.setItem('savedCart', JSON.stringify(cart))

      // Clear cart
      localStorage.removeItem('cart')

      // Redirect to confirmation page
      router.push(`/order-confirmation?orderId=${orderId}`)
    } catch (err) {
      console.error('Checkout failed:', err)
      // Prevent duplicate submissions by checking if order was already created
      if (err instanceof Error && err.message?.includes('duplicate')) {
        alert('This order has already been submitted. Please check your email for confirmation.')
      } else {
        alert('Something went wrong! Please try again.')
      }
    }
  }

  // Called when payment method changes
  const handlePaymentMethodChange = (method: string) => {
    // Could be used for analytics or conditional rendering
    console.log('Selected payment method:', method)
  }

  return (
    <main className="container mx-auto py-10">
      <CheckoutForm
        onSubmit={handleSubmit}
        onPaymentMethodChange={handlePaymentMethodChange}
      />
    </main>
  )
}
