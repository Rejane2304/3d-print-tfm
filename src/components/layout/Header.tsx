/**
 * Header Component with Avatar Menu
 * Shows avatar with first letter for authenticated users
 */
/* eslint-disable max-len */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ClipboardList,
  FileText,
  Folder,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Ticket,
  Truck,
  User,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import CartIcon from '@/components/cart/CartIcon';

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false); // Submenu for admin on mobile
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.role === 'ADMIN';

  // Get first letter of user's name
  const userName = session?.user?.name || '';
  const firstLetter = userName.charAt(0).toUpperCase();

  const handleLogout = async() => {
    try {
      // Clear cart from database for authenticated users
      if (isAuthenticated) {
        await fetch('/api/cart/clear', { method: 'DELETE' });
      }
    } catch (err) {
      console.error('Error clearing cart on logout:', err);
    } finally {
      // Always clear localStorage and sign out
      localStorage.removeItem('cart');
      globalThis.dispatchEvent(new Event('cartUpdated'));
      await signOut({ callbackUrl: '/' });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo.svg"
              alt="3D Print"
              width={120}
              height={40}
              className="h-8 lg:h-10 w-auto"
              style={{ height: 'auto', width: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Home */}
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
              <Home className="h-5 w-5" />
              <span className="text-sm font-medium">Inicio</span>
            </Link>

            {/* Products */}
            <Link
              href="/products"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
              <Package className="h-5 w-5" />
              <span className="text-sm font-medium">Catálogo</span>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Cart */}
            {!isAdmin && (
              <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                <CartIcon />
              </div>
            )}

            {/* Avatar Menu for Authenticated Users */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative" data-testid="user-menu">
                {/* Avatar Button - Touch-friendly */}
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 focus:outline-none min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Menú de usuario"
                  aria-expanded={userMenuOpen}
                >
                  {/* Avatar Circle */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm hover:bg-indigo-700 transition-colors">
                    {firstLetter || <User className="h-4 w-4" />}
                  </div>
                  {/* Dropdown Arrow - Hidden on very small screens */}
                  <ChevronDown
                    className={`hidden sm:block h-4 w-4 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {/* Dropdown Menu with Scroll */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain"
                    role="menu"
                    aria-label="Menú de usuario"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-indigo-50 rounded-t-lg sticky top-0">
                      <p className="font-medium text-gray-900">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session?.user?.email}
                      </p>
                    </div>

                    {/* Menu Links */}
                    <div className="py-2">
                      {isAdmin ? (
                        // Admin Menu
                        <>
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Panel Admin</span>
                          </Link>
                          <Link
                            href="/admin/clients"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Clientes</span>
                          </Link>
                          <Link
                            href="/admin/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <ClipboardList className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Pedidos</span>
                          </Link>
                          <Link
                            href="/admin/products"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Package className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Productos</span>
                          </Link>
                          <Link
                            href="/admin/inventory"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Warehouse className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Inventario</span>
                          </Link>
                          <Link
                            href="/admin/invoices"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Facturas</span>
                          </Link>
                          <Link
                            href="/admin/alerts"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Bell className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Alertas</span>
                          </Link>
                          <div className="border-t border-gray-100 my-2" />
                          <p className="px-4 py-1 text-xs text-gray-400 font-medium uppercase tracking-wider">
                            Configuración
                          </p>
                          <Link
                            href="/admin/categories"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Folder className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Categorías</span>
                          </Link>
                          <Link
                            href="/admin/coupons"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Ticket className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Cupones</span>
                          </Link>
                          <Link
                            href="/admin/faqs"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <HelpCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">FAQs</span>
                          </Link>
                          <Link
                            href="/admin/reviews"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Star className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Reseñas</span>
                          </Link>
                          <Link
                            href="/admin/shipping"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Truck className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Envíos</span>
                          </Link>
                          <Link
                            href="/admin/site-config"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Settings className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Configuración</span>
                          </Link>
                          <div className="border-t border-gray-100 my-2" />
                          <Link
                            href="/account/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Mi Perfil</span>
                          </Link>
                        </>
                      ) : (
                        // Client Menu
                        <>
                          <Link
                            href="/account/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <Settings className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Mi Perfil</span>
                          </Link>
                          <Link
                            href="/account/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <ClipboardList className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Mis Pedidos</span>
                          </Link>
                          <Link
                            href="/account/addresses"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[44px]"
                            role="menuitem"
                          >
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Mis Direcciones</span>
                          </Link>
                          <Link
                            href="/cart"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors md:hidden min-h-[44px]"
                            role="menuitem"
                          >
                            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Mi Carrito</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 py-2">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Login Button for Unauthenticated Users */
              <Link
                href="/auth"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px]"
                title="Iniciar sesión"
              >
                <User className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium hidden sm:block">
                  Iniciar sesión
                </span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button - Touch-friendly */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Full screen overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Cerrar menú móvil"
            onClick={() => setMobileMenuOpen(false)}
            tabIndex={0}
            style={{ border: 'none', background: 'none', padding: 0, margin: 0 }}
          />
          {/* Menu Content */}
          <div className="absolute top-0 left-0 right-0 max-h-[calc(100vh-64px)] bg-white border-t border-gray-100 shadow-2xl overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 min-h-[48px] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Inicio</span>
              </Link>
              <Link
                href="/products"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 min-h-[48px] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Package className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Catálogo</span>
              </Link>
              {!isAdmin && (
                <Link
                  href="/cart"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 min-h-[48px] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingBag className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Carrito</span>
                </Link>
              )}
              {!isAdmin && isAuthenticated && (
                <>
                  <hr className="my-3 border-gray-200" />
                  <Link
                    href="/account/profile"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 min-h-[48px] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Mi Perfil</span>
                  </Link>
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 min-h-[48px] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ClipboardList className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Mis Pedidos</span>
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 min-h-[48px] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MapPin className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Mis Direcciones</span>
                  </Link>
                </>
              )}
              {/* Mobile Admin Submenu */}
              {isAdmin && (
                <div className="space-y-1">
                  {/* Admin Menu Toggle Button */}
                  <button
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 min-h-[48px] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">Panel Admin</span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${adminMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Admin Submenu - Scrollable - ORDEN ALFABÉTICO */}
                  {adminMenuOpen && (
                    <div className="ml-4 pl-4 border-l-2 border-indigo-200 space-y-1 max-h-[60vh] overflow-y-auto">
                      <Link
                        href="/admin/alerts"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <Bell className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Alertas</span>
                      </Link>
                      <Link
                        href="/admin/categories"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <Folder className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Categorías</span>
                      </Link>
                      <Link
                        href="/admin/clients"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Clientes</span>
                      </Link>
                      <Link
                        href="/admin/site-config"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <Settings className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Configuración</span>
                      </Link>
                      <Link
                        href="/admin/coupons"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <Ticket className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Cupones</span>
                      </Link>
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Dashboard</span>
                      </Link>
                      <Link
                        href="/admin/shipping"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <Truck className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Envíos</span>
                      </Link>
                      <Link
                        href="/admin/invoices"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Facturas</span>
                      </Link>
                      <Link
                        href="/admin/faqs"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <HelpCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">FAQs</span>
                      </Link>
                      <Link
                        href="/admin/inventory"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <Warehouse className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Inventario</span>
                      </Link>
                      <Link
                        href="/admin/orders"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <ClipboardList className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Pedidos</span>
                      </Link>
                      <Link
                        href="/admin/products"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <Package className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Productos</span>
                      </Link>
                      <Link
                        href="/admin/reviews"
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 min-h-[44px] transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAdminMenuOpen(false);
                        }}
                      >
                        <Star className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">Reseñas</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {isAuthenticated && (
                <>
                  <hr className="my-3 border-gray-200" />
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 min-h-[48px] transition-colors"
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Cerrar sesión</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
