'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  taxId: string | null;
}

export interface Address {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  address: string;
  complement?: string;
  postalCode: string;
  city: string;
  province: string;
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  type: string;
}

interface CheckoutDataResult {
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  addresses: Address[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  cart: Cart | null;
  setCart: (cart: Cart | null) => void;
  appliedCoupon: AppliedCoupon | null;
  userProfile: UserProfile | null;
}

export function useCheckoutData(): CheckoutDataResult {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [cart, setCart] = useState<Cart | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const migrateLocalCart = useCallback(async() => {
    const localCartData = localStorage.getItem('cart');
    if (!localCartData) {
      return;
    }

    try {
      const localItems = JSON.parse(localCartData) as Array<{
        productId: string;
        quantity: number;
      }>;

      if (localItems.length === 0) {
        return;
      }

      // Migrar items del localStorage
      for (const item of localItems) {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
          }),
        });
      }

      // Limpiar localStorage y recargar carrito
      localStorage.removeItem('cart');
      const refreshedCart = await fetch('/api/cart');
      if (refreshedCart.ok) {
        const refreshedData = await refreshedCart.json();
        setCart(refreshedData.cart);
      }
    } catch (migrationError) {
      console.error('Error migrando carrito:', migrationError);
    }
  }, []);

  const loadCoupon = useCallback(() => {
    const storedCoupon = localStorage.getItem('appliedCoupon');
    if (!storedCoupon) {
      return;
    }

    try {
      const parsed = JSON.parse(storedCoupon) as AppliedCoupon;
      setAppliedCoupon(parsed);
    } catch {
      localStorage.removeItem('appliedCoupon');
    }
  }, []);

  const loadData = useCallback(async() => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const resProfile = await fetch('/api/account/profile');
      if (resProfile.ok) {
        const data = await resProfile.json();
        if (data.success) {
          setUserProfile(data.usuario);
        }
      }

      // Load addresses
      const resAddresses = await fetch('/api/account/addresses');
      if (resAddresses.ok) {
        const data = await resAddresses.json();
        const loadedAddresses = (data.addresses as Address[]) || [];
        setAddresses(loadedAddresses);
        const primary = loadedAddresses.find((d: Address) => d.isDefault);
        if (primary) {
          setSelectedAddressId(primary.id);
        }
      } else if (resAddresses.status === 401) {
        router.push('/auth?callbackUrl=/checkout');
        return;
      }

      // Load cart
      const resCart = await fetch('/api/cart');
      if (resCart.ok) {
        const data = await resCart.json();
        setCart(data.cart);
        loadCoupon();

        // Solo redirigir si realmente no hay items
        if (!data.cart?.items?.length && !localStorage.getItem('cart')) {
          router.push('/cart');
          return;
        }

        // Si hay items en localStorage, intentar migrarlos
        await migrateLocalCart();
      }
    } catch (err) {
      setError('Error al cargar datos del checkout');
      console.error('Error al cargar datos de checkout:', err);
    } finally {
      setLoading(false);
    }
  }, [router, loadCoupon, migrateLocalCart]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/checkout');
      return;
    }
    if (status === 'authenticated') {
      void loadData();
    }
  }, [status, router, loadData]);

  return {
    loading,
    error,
    setError,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    cart,
    setCart,
    appliedCoupon,
    userProfile,
  };
}
