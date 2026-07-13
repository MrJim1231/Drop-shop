import React, { createContext, useContext, useState, useEffect } from "react";
import { api, OrderItem } from "../api/client";

export interface CartItem extends OrderItem {
  id: string; // SKU (maps to product_id)
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addItem: (product: { id: string; name: string; price: number; image: string; size?: string; quantity?: number; rubber?: boolean }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  guestUserId: string | null;
  ensureGuestUserId: () => Promise<string>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [guestUserId, setGuestUserId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed loading cart from localStorage", e);
    }

    const savedUserId = localStorage.getItem("userId");
    if (savedUserId) {
      setGuestUserId(savedUserId);
    }
  }, []);

  // Save changes to localStorage
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("cart", JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("cart-updated"));
  };

  const addItem = (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    size?: string;
    quantity?: number;
    rubber?: boolean;
  }) => {
    const items = [...cartItems];
    const existing = items.find((i) => i.id === product.id);

    if (existing) {
      existing.quantity += product.quantity || 1;
    } else {
      items.push({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || "",
        size: product.size || "—",
        quantity: product.quantity || 1,
        rubber: !!product.rubber,
      });
    }
    saveCart(items);
  };

  const updateQuantity = (id: string, quantity: number) => {
    const items = cartItems.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    });
    saveCart(items);
  };

  const removeItem = (id: string) => {
    const items = cartItems.filter((i) => i.id !== id);
    saveCart(items);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const ensureGuestUserId = async (): Promise<string> => {
    let id = localStorage.getItem("userId");
    if (!id) {
      try {
        const res = await api.generateUserId();
        id = res.userId;
        localStorage.setItem("userId", id);
        setGuestUserId(id);
      } catch (error) {
        console.error("Failed to generate guest user id", error);
        id = "guest-" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("userId", id);
        setGuestUserId(id);
      }
    }
    return id;
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        guestUserId,
        ensureGuestUserId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
