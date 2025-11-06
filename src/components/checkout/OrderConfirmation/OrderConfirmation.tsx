import { useEffect } from 'react'
import Image from 'next/image'
import Button from '@/components/common/Button/Button'
import { CartProduct } from '@/types'
import { CheckoutFormData } from '../CheckoutForm/schema'
import { getFormattedPrice, getShortenedProductName } from '@/utils/cart'
import OrderConfirmationIcon from '@/assets/checkout/icon-order-confirmation.svg'

interface OrderConfirmationProps {
  orderData: CheckoutFormData
  cart: CartProduct[]
  grandTotal: number
  onClose: () => void
}

export function OrderConfirmation({ orderData, cart, grandTotal, onClose }: OrderConfirmationProps) {
  const firstItem = cart[0]
  const otherItemsCount = cart.length - 1

  useEffect(() => {
    // Send confirmation email
    const sendConfirmationEmail = async () => {
      if (!orderData) {
        console.error('No order data available');
        return;
      }

      try {
        const orderId = Math.random().toString(36).substr(2, 9).toUpperCase(); // Generate random order ID
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingCost = 50;
        const taxes = Math.round(grandTotal * 0.2);

        // Format the items array to match the API expectations
        const formattedItems = cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

        const payload = {
          email: orderData.billing.email,
          name: orderData.billing.name,
          phone: orderData.billing.phone,
          shipping: {
            address: orderData.shipping.address,
            city: orderData.shipping.city,
            country: orderData.shipping.country,
            zip: orderData.shipping.zipCode
          },
          items: formattedItems,
          subtotal: subtotal,
          shippingCost: shippingCost,
          taxes: taxes,
          total: grandTotal,
          orderId: orderId
        };

        console.log('Sending confirmation email payload:', payload);

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log('Email API responded:', result);
      } catch (error) {
        console.error('Failed to send confirmation email:', error);
      }
    };

    sendConfirmationEmail();

    // Handle modal scroll locking
    const html = document.querySelector("html")

    if (html) {
      const documentHasScrollbar = html.scrollHeight > html.clientHeight

      const classesToToggle = [
        "overflow-hidden",
        documentHasScrollbar ? "overflow-y-scroll" : "overflow-y-hidden",
        "fixed",
        "inset-0",
      ]

      classesToToggle.forEach((classToToggle) => {
        html.classList.toggle(classToToggle, true)
      })

      return () => {
        classesToToggle.forEach((classToToggle) => {
          html.classList.toggle(classToToggle, false)
        })
      }
    }
  }, [cart, grandTotal, orderData])

  return (
    <>
      <div className="fixed inset-0 z-[5] bg-neutral-900/40" onClick={onClose} />
      <div className="fixed inset-0 z-[6] flex items-center justify-center p-8">
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full lg:w-[40rem] rounded-lg bg-neutral-100 p-8 md:p-12"
        >
          <div className="mb-6 md:mb-8">
            <Image
              src={OrderConfirmationIcon}
              width={64}
              height={64}
              alt="Order confirmed"
              priority
            />
          </div>
          <h2 className="mb-4 md:mb-6 text-2xl font-bold uppercase text-neutral-900 lg:text-3xl">
            Thank you<br />for your order
          </h2>
          <p className="mb-6 md:mb-8 text-base text-neutral-900/50">
            You will receive an email confirmation shortly.
          </p>

          <div className="mb-6 md:mb-[2.875rem] overflow-hidden rounded-lg md:flex">
            <div className="bg-neutral-400 p-6 md:flex-1 md:rounded-l-lg">
              <div className="flex items-start gap-4">
                <Image
                  width={64}
                  height={64}
                  src={firstItem.image}
                  alt={firstItem.name}
                  className="rounded-lg"
                  priority
                />
                <div className="flex flex-1 justify-between">
                  <div>
                    <p className="font-bold">{getShortenedProductName(firstItem.name)}</p>
                    <p className="text-sm font-bold tracking-[0] text-neutral-900/50">
                      $ {getFormattedPrice(firstItem.price)}
                    </p>
                  </div>
                  <span className="text-base opacity-50">x{firstItem.quantity}</span>
                </div>
              </div>
              {otherItemsCount > 0 && (
                <>
                  <div className="my-3 h-[1px] w-full bg-neutral-900/[8%]" />
                  <p className="text-center text-[0.75rem] tracking-[-0.013em] opacity-50">
                    and {otherItemsCount} other item{otherItemsCount > 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>
            <div className="bg-neutral-900 p-6 md:flex-1 md:flex md:flex-col md:justify-center md:rounded-r-lg">
              <p className="text-base uppercase text-neutral-100/50">Grand total</p>
              <p className="mt-2 text-lg font-bold text-neutral-100">
                $ {getFormattedPrice(grandTotal)}
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            intent="primary"
            fullWidth
            onClick={onClose}
          >
            Back to home
          </Button>
        </div>
      </div>
    </>
  )
} 