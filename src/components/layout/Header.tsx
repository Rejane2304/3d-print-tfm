/**
 * Header Component - Modern Professional Design
 * Responsive: mobile → 4K
 * Icons only for cleaner, more modern UX
 * Cart always visible in the right side
 */
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';
import { 
  Home, 
  User, 
  LogOut, 
  LogIn, 
  LayoutDashboard,
  Menu,
  X,
  Package,
  ShoppingBag
} from 'lucide-react';
import CartIcon from '@/components/cart/CartIcon';

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.rol === 'ADMIN';
  const isCliente = session?.user?.rol === 'CLIENTE';

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo.svg"
              alt="3D Print TFM"
              width={120}
              height={40}
              className="h-8 lg:h-10 w-auto"
              style={{ height: 'auto', width: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Home */}
            <Link
              href="/"
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
              title="Inicio"
            >
              <Home className="h-5 w-5" />
            </Link>

            {/* Products */}
            <Link
              href="/products"
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
              title="Productos"
            >
              <Package className="h-5 w-5" />
            </Link>

            {/* Account - ONLY for CLIENTE */}
            {!isLoading && isAuthenticated && isCliente && (
              <Link
                href="/account"
                className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                title="Mi Cuenta"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            {/* Admin Dashboard - ONLY for ADMIN */}
            {!isLoading && isAuthenticated && isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                title="Panel Admin"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            )}
          </nav>

          {/* Right Side: Cart + Auth */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Cart - Always visible on the right */}
            {!isLoading && (!isAuthenticated || isCliente) && (
              <div className="flex items-center">
                <CartIcon />
              </div>
            )}

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 mx-2" />

            {/* Auth Buttons */}
            {isLoading ? (
              <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
            ) : isAuthenticated ? (
              <div data-testid="user-menu" className="flex items-center space-x-2">
                {/* User greeting */}
                <span className="text-sm text-gray-600 hidden xl:block max-w-[150px] truncate">
                  {session?.user?.name}
                </span>
                
                {/* Logout - Icon only */}
                <button
                  onClick={handleLogout}
                  data-testid="logout-button"
                  className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                title="Iniciar sesión"
              >
                <LogIn className="h-5 w-5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {/* Home */}
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Inicio</span>
            </Link>

            {/* Products */}
            <Link
              href="/products"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Package className="h-5 w-5" />
              <span className="font-medium">Productos</span>
            </Link>

            {/* Cart */}
            {!isLoading && (!isAuthenticated || isCliente) && (
              <Link
                href="/cart"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="font-medium">Carrito</span>
              </Link>
            )}

            {/* Account - ONLY for CLIENTE */}
            {!isLoading && isAuthenticated && isCliente && (
              <Link
                href="/account"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-5 w-5" />
                <span className="font-medium">Mi Cuenta</span>
              </Link>
            )}

            {/* Admin - ONLY for ADMIN */}
            {!isLoading && isAuthenticated && isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="font-medium">Panel Admin</span>
              </Link>
            )}

            <hr className="my-2 border-gray-200" />

            {/* Auth buttons for mobile */}
            {!isLoading && isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Cerrar sesión</span>
              </button>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="h-5 w-5" />
                <span className="font-medium">Iniciar sesión</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
