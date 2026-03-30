import { createContext, useContext, useEffect, useState } from "react";
import type { BoxType } from "../data/boxTypes";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  boxes: number;
  grower: string;
  boxType: BoxType;
  stemsPerBox: number;
  totalStems: number;

  selectedVariety?: string;
  selectedColor?: string;
  selectedLength?: string;
  deliveryDate?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (
    slug: string,
    grower?: string,
    selectedVariety?: string,
    selectedLength?: string
  ) => void;
  increaseQty: (
    slug: string,
    grower?: string,
    selectedVariety?: string,
    selectedLength?: string
  ) => void;
  decreaseQty: (
    slug: string,
    grower?: string,
    selectedVariety?: string,
    selectedLength?: string
  ) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

function isSameCartLine(a: CartItem, b: CartItem) {
  return (
    a.slug === b.slug &&
    a.grower === b.grower &&
    a.boxType === b.boxType &&
    a.stemsPerBox === b.stemsPerBox &&
    (a.selectedVariety || "") === (b.selectedVariety || "") &&
    (a.selectedLength || "") === (b.selectedLength || "")
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cart");
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      setCart([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cart]);

  function addToCart(item: CartItem) {
    const deliveryDate = localStorage.getItem("deliveryDate") || "";

    setCart((prev) => {
      const itemWithDelivery = {
        ...item,
        deliveryDate,
        totalStems: item.boxes * item.stemsPerBox,
      };

      const exists = prev.find((p) => isSameCartLine(p, itemWithDelivery));

if (exists) {
  return prev.map((p) =>
    isSameCartLine(p, itemWithDelivery)
      ? {
          ...p,
          boxes: p.boxes + item.boxes,
          totalStems: (p.boxes + item.boxes) * p.stemsPerBox,
          deliveryDate,
        }
      : p
  );
}
      return [...prev, itemWithDelivery];
    });
  }

  function removeFromCart(
    slug: string,
    grower?: string,
    selectedVariety?: string,
    selectedLength?: string
  ) {
    setCart((prev) =>
      prev.filter(
        (p) =>
          !(
            p.slug === slug &&
            (grower ? p.grower === grower : true) &&
            (selectedVariety !== undefined
              ? (p.selectedVariety || "") === selectedVariety
              : true) &&
            (selectedLength !== undefined
              ? (p.selectedLength || "") === selectedLength
              : true)
          )
      )
    );
  }

  function increaseQty(
    slug: string,
    grower?: string,
    selectedVariety?: string,
    selectedLength?: string
  ) {
    setCart((prev) =>
      prev.map((p) =>
        p.slug === slug &&
        (grower ? p.grower === grower : true) &&
        (selectedVariety !== undefined
          ? (p.selectedVariety || "") === selectedVariety
          : true) &&
        (selectedLength !== undefined
          ? (p.selectedLength || "") === selectedLength
          : true)
          ? {
              ...p,
              boxes: p.boxes + 1,
              totalStems: (p.boxes + 1) * p.stemsPerBox,
            }
          : p
      )
    );
  }

  function decreaseQty(
    slug: string,
    grower?: string,
    selectedVariety?: string,
    selectedLength?: string
  ) {
    setCart((prev) =>
      prev
        .map((p) =>
          p.slug === slug &&
          (grower ? p.grower === grower : true) &&
          (selectedVariety !== undefined
            ? (p.selectedVariety || "") === selectedVariety
            : true) &&
          (selectedLength !== undefined
            ? (p.selectedLength || "") === selectedLength
            : true)
            ? {
                ...p,
                boxes: p.boxes - 1,
                totalStems: (p.boxes - 1) * p.stemsPerBox,
              }
            : p
        )
        .filter((p) => p.boxes > 0)
    );
  }

  function clearCart() {
    setCart([]);
    localStorage.removeItem("cart");
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("Cart not found");
  return context;
}