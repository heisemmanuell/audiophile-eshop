'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import Container from '../common/Container'
import { CartProduct } from '../../types'
import { getFormattedPrice } from '../../utils/cart'
import Image from 'next/image'

export default function OrderConfirmation() {
  const params = useSearchParams()
  const router = useRouter()
  const orderId = params.get('orderId')
  const [cart, setCart] = useState<CartProduct[]>([])

  // Fetch order details from Convex
  const order = useQuery(api.orders.getOrder, orderId ? { id: orderId as any } : 'skip')

  useEffect(() => {
    // Get cart from localStorage before it was cleared
    const savedCart = localStorage.getItem('savedCart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  if (!orderId || !order) {
    return (
      <main className="container mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold">Order not found</h1>
        <p className="mt-4">Please check your order details or contact support.</p>
      </main>
    )
  }

  const handleContinueShopping = () => {
    router.push('/')
  }

  return (
    <main className="pb-[7.5rem] pt-[calc(2rem+var(--navigation-height))] md:pb-[6rem] xl:pb-[10rem] xl:pt-[calc(6.125rem+var(--navigation-height))]">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <Image
                src="/assets/checkout/icon-order-confirmation.svg"
                alt="Order confirmed"
                width={64}
                height={64}
              />
            </div>
            <h1 className="text-3xl font-bold uppercase text-neutral-900 lg:text-4xl">
              Thank you for your order
            </h1>
            <p className="mt-4 text-base text-neutral-900/50">
              You will receive an email confirmation shortly.
            </p>
          </div>

          <div className="rounded-lg bg-neutral-100 p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
              <div className="flex-1">
                <h2 className="mb-4 text-lg font-bold uppercase text-neutral-900">
                  Order Summary
                </h2>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={50}
                        height={50}
                        className="rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-neutral-900">{item.name}</p>
                        <p className="text-sm text-neutral-900/50">
                          $ {getFormattedPrice(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-neutral-900">
                        $ {getFormattedPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-80">
                <div className="rounded-lg bg-neutral-900 p-6 text-white">
                  <h3 className="mb-2 text-sm font-medium uppercase text-neutral-100/50">
                    Grand Total
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    $ {getFormattedPrice(order.total)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleContinueShopping}
              className="w-full rounded-lg bg-orange px-8 py-4 text-sm font-bold uppercase text-white hover:bg-orange/80 lg:w-auto"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </Container>
    </main>
  )
}
