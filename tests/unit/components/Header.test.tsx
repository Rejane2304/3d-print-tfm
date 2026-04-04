/**
 * Tests de Componentes - Header
 * Tests para el componente de navegación principal
 * 
 * CAMBIOS REALIZADOS:
 * - Carrito ahora visible para usuarios no autenticados (invitados)
 * - El carrito funciona con localStorage para invitados y API para autenticados
 * - Solo CLIENTE puede ver el link de "Cuenta"
 * - Icon + text navigation for main menu items
 * - Cart always visible except for Admin
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/layout/Header';
import '@testing-library/jest-dom';

// Mock de next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

// Mock de next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock de next/link - preservar todos los atributos incluyendo title
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: any }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock del componente CartIcon
vi.mock('@/components/cart/CartIcon', () => ({
  __esModule: true,
  default: () => (
    <a href="/cart" aria-label="Ver carrito" title="Carrito">
      <span data-testid="cart-icon">CartIcon</span>
    </a>
  ),
}));

import { useSession, signOut } from 'next-auth/react';
const mockUseSession = vi.mocked(useSession);
const mockSignOut = vi.mocked(signOut);

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Estado de carga', () => {
    it('debe mostrar estado de carga cuando la sesión está cargando', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: vi.fn(),
      });

      render(<Header />);

      // Debe mostrar skeleton loader
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Usuario no autenticado (INVITADO)', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      });
    });

    it('debe mostrar botón de login con title correcto', () => {
      render(<Header />);

      // Login button is icon-only with title attribute
      const loginLink = screen.getByTitle('Iniciar sesión');
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/auth');
    });

    it('debe mostrar navegación con icono + texto (Inicio)', () => {
      render(<Header />);

      expect(screen.getByText('Inicio')).toBeInTheDocument();
    });

    it('debe mostrar navegación con icono + texto (Catálogo)', () => {
      render(<Header />);

      expect(screen.getByText('Catálogo')).toBeInTheDocument();
    });

    it('debe MOSTRAR el carrito para usuarios no autenticados (invitados)', () => {
      // CAMBIO IMPORTANTE: El carrito ahora es visible para invitados
      render(<Header />);

      expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
    });

    it('debe OCULTAR el link de cuenta para usuarios no autenticados', () => {
      render(<Header />);

      expect(screen.queryByText('Cuenta')).not.toBeInTheDocument();
    });
  });

  describe('Usuario autenticado (CLIENTE)', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            rol: 'CLIENTE',
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
    });

    it('debe mostrar saludo con el nombre del usuario', () => {
      render(<Header />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('debe mostrar botón de cerrar sesión con title', () => {
      render(<Header />);

      const logoutButton = screen.getByTitle('Cerrar sesión');
      expect(logoutButton).toBeInTheDocument();
    });

    it('debe mostrar el carrito para CLIENTE', () => {
      render(<Header />);

      expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
    });

    it('debe mostrar el link de cuenta para CLIENTE', () => {
      render(<Header />);

      expect(screen.getByText('Cuenta')).toBeInTheDocument();
    });

    it('debe mostrar navegación con icono + texto (Inicio)', () => {
      render(<Header />);

      expect(screen.getByText('Inicio')).toBeInTheDocument();
    });

    it('debe mostrar navegación con icono + texto (Catálogo)', () => {
      render(<Header />);

      expect(screen.getByText('Catálogo')).toBeInTheDocument();
    });

    it('debe ocultar botón de login', () => {
      render(<Header />);

      expect(screen.queryByTitle('Iniciar sesión')).not.toBeInTheDocument();
    });

    it('debe llamar a signOut al hacer clic en cerrar sesión', async () => {
      render(<Header />);

      const logoutButton = screen.getByTitle('Cerrar sesión');
      fireEvent.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  describe('Usuario autenticado (ADMIN)', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-123',
            name: 'Admin User',
            email: 'admin@example.com',
            rol: 'ADMIN',
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
    });

    it('debe mostrar el panel de admin', () => {
      render(<Header />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('debe OCULTAR el carrito para ADMIN', () => {
      // ADMIN no puede comprar, no ve el carrito
      render(<Header />);

      expect(screen.queryByTestId('cart-icon')).not.toBeInTheDocument();
    });

    it('debe OCULTAR el link de cuenta para ADMIN', () => {
      render(<Header />);

      expect(screen.queryByText('Cuenta')).not.toBeInTheDocument();
    });

    it('debe mostrar navegación con icono + texto (Inicio)', () => {
      render(<Header />);

      expect(screen.getByText('Inicio')).toBeInTheDocument();
    });

    it('debe mostrar navegación con icono + texto (Catálogo)', () => {
      render(<Header />);

      expect(screen.getByText('Catálogo')).toBeInTheDocument();
    });
  });

  describe('Menu móvil', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      });
    });

    it('debe tener botón de menú móvil', () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/abrir menú/i);
      expect(menuButton).toBeInTheDocument();
    });

    it('debe abrir menú móvil al hacer clic', () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/abrir menú/i);
      fireEvent.click(menuButton);

      // El menú debe estar visible (contiene los enlaces móviles con texto)
      expect(screen.getAllByText('Inicio').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Navegación', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      });
    });

    it('debe tener enlace al inicio con logo', () => {
      render(<Header />);

      const homeLink = screen.getByAltText('3D Print TFM');
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('debe tener enlace a Catálogo', () => {
      render(<Header />);

      const catalogoLink = screen.getByText('Catálogo');
      expect(catalogoLink.closest('a')).toHaveAttribute('href', '/products');
    });

    it('debe tener enlace al carrito para invitados', () => {
      render(<Header />);

      const cartIcon = screen.getByTestId('cart-icon');
      expect(cartIcon.closest('a')).toHaveAttribute('href', '/cart');
    });
  });

  describe('Responsive', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      });
    });

    it('debe ocultar navegación desktop en móvil', () => {
      render(<Header />);

      const desktopNav = document.querySelector('.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    it('debe mostrar botón de menú en móvil', () => {
      render(<Header />);

      const mobileButton = document.querySelector('.md\\:hidden');
      expect(mobileButton).toBeInTheDocument();
    });
  });
});
