import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CartItem, CartProduct, getDiscountedPrice } from './cartTypes';

const STORAGE_KEY = 'octocat-cart';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  addItem: (product: CartProduct, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const parseStoredCart = (): CartItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.productId === 'number' &&
        typeof item?.name === 'string' &&
        typeof item?.description === 'string' &&
        typeof item?.price === 'number' &&
        typeof item?.imgName === 'string' &&
        typeof item?.quantity === 'number' &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(parseStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: CartProduct, quantity = 1) => {
    if (quantity <= 0) {
      return;
    }

    setItems((previous) => {
      const existing = previous.find((item) => item.productId === product.productId);
      if (!existing) {
        return [...previous, { ...product, quantity }];
      }

      return previous.map((item) => {
        if (item.productId !== product.productId) {
          return item;
        }

        return { ...item, quantity: item.quantity + quantity };
      });
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((previous) => {
      if (quantity <= 0) {
        return previous.filter((item) => item.productId !== productId);
      }

      return previous.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        return { ...item, quantity };
      });
    });
  };

  const removeItem = (productId: number) => {
    setItems((previous) => previous.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      return sum + getDiscountedPrice(item.price, item.discount) * item.quantity;
    }, 0);
    const shipping = subtotal === 0 || subtotal > 100 ? 0 : 25;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      itemCount,
      subtotal,
      shipping,
      total: subtotal + shipping,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
