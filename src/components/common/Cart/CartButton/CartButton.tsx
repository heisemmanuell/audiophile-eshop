import CartIcon from "@/assets/shared/desktop/icon-cart.svg";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getCartFromLocalStorage } from "@/utils/cart";

type CartButtonProps = {
  handleCartButtonClick: () => void;
  className?: string;
};

export default function CartButton({
  handleCartButtonClick,
  className,
}: CartButtonProps) {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const readQuantity = () => {
      const cart = getCartFromLocalStorage();
      const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setQuantity(total);
    };

    // Initial read
    if (typeof window !== "undefined") {
      readQuantity();
    }

    // Update when localStorage changes in other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cart") {
        readQuantity();
      }
    };

    window.addEventListener("storage", onStorage);

    // Also listen for custom events if other parts of the app dispatch them
    const onCartUpdated = () => readQuantity();
    window.addEventListener("cart:updated", onCartUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:updated", onCartUpdated);
    };
  }, []);

  return (
    <button
      onClick={handleCartButtonClick}
      className={`relative ${className ?? ""}`}
      aria-label={`Open cart (${quantity} items)`}
    >
      <span className="sr-only">Open cart</span>
      <Image src={CartIcon} width="23" height="20" alt="Cart Icon" priority />

      {quantity > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange px-1.5 text-xs font-bold text-white">
          {quantity}
        </span>
      )}
    </button>
  );
}
