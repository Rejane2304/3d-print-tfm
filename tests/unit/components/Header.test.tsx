/**
 * Tests de Componentes - Header
 * Tests para el componente de navegación principal
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

// Mock de next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
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

  describe('Usuario no autenticado', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      });
    });

    it('debe mostrar enlaces de login y registro', () => {
      render(<Header />);

      expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
      expect(screen.getByText('Registrarse')).toBeInTheDocument();
    });

    it('debe mostrar enlaces de navegación públicos', () => {
      render(<Header />);

      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.getByText('Productos')).toBeInTheDocument();
    });

    it('debe ocultar enlaces de cuenta y carrito', () => {
      render(<Header />);

      expect(screen.queryByText('Carrito')).not.toBeInTheDocument();
      expect(screen.queryByText('Mi Cuenta')).not.toBeInTheDocument();
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

      expect(screen.getByText('Hola, Juan Pérez')).toBeInTheDocument();
    });

    it('debe mostrar botón de cerrar sesión', () => {
      render(<Header />);

      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
    });

    it('debe mostrar enlaces de carrito y cuenta', () => {
      render(<Header />);

      expect(screen.getByText('Carrito')).toBeInTheDocument();
      expect(screen.getByText('Mi Cuenta')).toBeInTheDocument();
    });

    it('debe ocultar enlaces de login y registro', () => {
      render(<Header />);

      expect(screen.queryByText('Iniciar sesión')).not.toBeInTheDocument();
      expect(screen.queryByText('Registrarse')).not.toBeInTheDocument();
    });

    it('debe llamar a signOut al hacer clic en cerrar sesión', async () => {
      render(<Header />);

      const logoutButton = screen.getByText('Cerrar sesión');
      fireEvent.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
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

      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('debe abrir menú móvil al hacer clic', () => {
      render(<Header />);

      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);

      // El menú debe estar visible (contiene los enlaces móviles)
      expect(screen.getAllByText('Inicio').length).toBeGreaterThan(1);
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

    it('debe tener enlace a productos', () => {
      render(<Header />);

      const productosLink = screen.getByText('Productos');
      expect(productosLink.closest('a')).toHaveAttribute('href', '/productos');
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
