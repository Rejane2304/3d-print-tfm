/**
 * Tests de Componentes - Header
 * Tests para el componente de navegación principal
 *
 * CAMBIOS REALIZADOS:
 * - Carrito ahora visible para usuarios no autenticados (invitados)
 * - El carrito funciona con localStorage para invitados y API para autenticados
 * - CLIENTE tiene dropdown menu con "Mi Perfil" y "Mis Pedidos"
 * - Icon + text navigation for main menu items
 * - Cart always visible except for Admin
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
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
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: any) => <img alt="" {...props} />,
}));

// Mock de next/link - preservar todos los atributos incluyendo title
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: any }) => (
    <a href={href} {...props}>
      {children}
    </a>
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
      // Verificar que NO hay texto "Entrar" (solo icono)
      expect(screen.queryByText('Entrar')).not.toBeInTheDocument();
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

    it('debe OCULTAR el menú de usuario para invitados', () => {
      render(<Header />);

      expect(screen.queryByTestId('user-menu-button')).not.toBeInTheDocument();
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
            role: 'CUSTOMER',
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
    });

    it('debe mostrar el botón del menú de usuario con el nombre', () => {
      render(<Header />);

      const userMenuButton = screen.getByTestId('user-menu-button');
      expect(userMenuButton).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('debe abrir el menú desplegable al hacer clic', () => {
      render(<Header />);

      const userMenuButton = screen.getByTestId('user-menu-button');
      fireEvent.click(userMenuButton);

      // El menú debe estar visible
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /mi perfil/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /mis pedidos/i })).toBeInTheDocument();
    });

    it('debe tener enlace a Mi Perfil en el menú desplegable', () => {
      render(<Header />);

      const userMenuButton = screen.getByTestId('user-menu-button');
      fireEvent.click(userMenuButton);

      const perfilLink = screen.getByRole('menuitem', { name: /mi perfil/i });
      expect(perfilLink).toHaveAttribute('href', '/account');
    });

    it('debe tener enlace a Mis Pedidos en el menú desplegable', () => {
      render(<Header />);

      const userMenuButton = screen.getByTestId('user-menu-button');
      fireEvent.click(userMenuButton);

      const pedidosLink = screen.getByRole('menuitem', {
        name: /mis pedidos/i,
      });
      expect(pedidosLink).toHaveAttribute('href', '/account/orders');
    });

    it('debe cerrar el menú al hacer clic fuera', () => {
      render(<Header />);

      const userMenuButton = screen.getByTestId('user-menu-button');
      fireEvent.click(userMenuButton);

      // Menú está abierto
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click fuera del menú
      fireEvent.mouseDown(document.body);

      // Menú debería cerrarse (no estar en el documento)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('debe mostrar el carrito para CLIENTE', () => {
      render(<Header />);

      expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
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

    it('debe llamar a signOut al hacer clic en cerrar sesión en el menú', async () => {
      render(<Header />);

      const userMenuButton = screen.getByTestId('user-menu-button');
      fireEvent.click(userMenuButton);

      const logoutButton = screen.getByRole('menuitem', {
        name: /cerrar sesión/i,
      });
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
            role: 'ADMIN',
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

    it('debe OCULTAR el menú desplegable de cuenta para ADMIN', () => {
      render(<Header />);

      expect(screen.queryByTestId('user-menu-button')).not.toBeInTheDocument();
    });

    it('debe mostrar el nombre del admin y botón de logout', () => {
      render(<Header />);

      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
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

  describe('Menu móvil para CLIENTE', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            role: 'CUSTOMER',
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
    });

    it('debe mostrar enlaces de Mi Perfil y Mis Pedidos en menú móvil', () => {
      render(<Header />);

      const menuButton = screen.getByLabelText(/abrir menú/i);
      fireEvent.click(menuButton);

      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
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

      const desktopNav = document.querySelector(String.raw`.hidden.md\:flex`);
      expect(desktopNav).toBeInTheDocument();
    });

    it('debe mostrar botón de menú en móvil', () => {
      render(<Header />);

      const mobileButton = document.querySelector(String.raw`.md\:hidden`);
      expect(mobileButton).toBeInTheDocument();
    });
  });
});
