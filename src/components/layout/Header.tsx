/**
 * Header Component - Modern Professional Design
 * Responsive: mobile → 4K
 * Icon + text navigation for clarity
 * Cart always visible on the right (except for Admin)
 * User dropdown menu for authenticated clients
 */
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
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
  ShoppingBag,
  ChevronDown,
  ClipboardList,
  Settings
} from 'lucide-react';
import CartIcon from '@/components/cart/CartIcon';

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.rol === 'ADMIN';
  const isCliente = session?.user?.rol === 'CLIENTE';

  const handleLogout = async () => {
    // Limpiar carrito del localStorage antes de cerrar sesión
    localStorage.removeItem('cart');
    // Dispatch event para actualizar el contador del carrito
    window.dispatchEvent(new Event('cartUpdated'));
    await signOut({ callbackUrl: '/' });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Desktop Navigation - Center (Icon + Text) */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Home */}
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
              title="Inicio"
            >
              <Home className="h-5 w-5" />
              <span className="text-sm font-medium">Inicio</span>
            </Link>

            {/* Products/Catalog */}
            <Link
              href="/products"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
              title="Catálogo"
            >
              <Package className="h-5 w-5" />
              <span className="text-sm font-medium">Catálogo</span>
            </Link>

            {/* Admin Dashboard - ONLY for ADMIN */}
            {!isLoading && isAuthenticated && isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                title="Panel Admin"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-sm font-medium">Admin</span>
              </Link>
            )}
          </nav>

          {/* Right Side: Cart + Auth - Always visible */}
          <div className="flex items-center space-x-2">
            {/* Cart - Always visible except for Admin */}
            {!isLoading && !isAdmin && (
              <div className="flex items-center">
                <CartIcon />
              </div>
            )}

            {/* Divider - only show if cart is visible or user is authenticated */}
            {(!isLoading && !isAdmin) || (!isLoading && isAuthenticated) ? (
              <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block" />
            ) : null}

            {/* Auth Buttons */}
            {isLoading ? (
              <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
            ) : isAuthenticated && isCliente ? (
              /* User Dropdown Menu for CLIENTE */
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  data-testid="user-menu-button"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium hidden xl:block max-w-[120px] truncate">
                    {session?.user?.name}
                  </span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session?.user?.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4" />
                        Mi Perfil
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        role="menuitem"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Mis Pedidos
                      </Link>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : isAuthenticated && isAdmin ? (
              /* Simple logout button for ADMIN */
              <div data-testid="user-menu" className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 hidden xl:block max-w-[150px] truncate">
                  {session?.user?.name}
                </span>
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
              /* Login button for unauthenticated users - User silhouette icon */
              <Link
                href="/auth"
                className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                title="Iniciar sesión"
              >
                <User className="h-5 w-5" />
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

            {/* Products/Catalog */}
            <Link
              href="/products"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Package className="h-5 w-5" />
              <span className="font-medium">Catálogo</span>
            </Link>

            {/* Cart - Always visible except for Admin */}
            {!isLoading && !isAdmin && (
              <Link
                href="/cart"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="font-medium">Carrito</span>
              </Link>
            )}

            {/* Account links for CLIENTE */}
            {!isLoading && isAuthenticated && isCliente && (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Mi Perfil</span>
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ClipboardList className="h-5 w-5" />
                  <span className="font-medium">Mis Pedidos</span>
                </Link>
              </>
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
