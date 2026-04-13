/**
 * Tests de Componentes - Footer
 * Tests para el componente de pie de página
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/layout/Footer';
import '@testing-library/jest-dom';

// Mock de next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('Footer Component', () => {
  it('debe mostrar el nombre de la empresa', () => {
    render(<Footer />);
    expect(screen.getByText('3D Print TFM')).toBeInTheDocument();
  });

  it('debe mostrar la descripción del proyecto', () => {
    render(<Footer />);
    expect(screen.getByText(/E-commerce de productos impresos en 3D/i)).toBeInTheDocument();
  });

  it('debe mostrar enlaces de navegación', () => {
    render(<Footer />);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  it('debe tener enlace correcto al inicio', () => {
    render(<Footer />);
    const inicioLink = screen.getByText('Inicio').closest('a');
    expect(inicioLink).toHaveAttribute('href', '/');
  });

  it('debe tener enlace correcto a productos', () => {
    render(<Footer />);
    const productosLink = screen.getByText('Productos').closest('a');
    expect(productosLink).toHaveAttribute('href', '/products');
  });

  it('debe mostrar sección de información legal', () => {
    render(<Footer />);
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Términos y condiciones')).toBeInTheDocument();
    expect(screen.getByText('Política de privacidad')).toBeInTheDocument();
  });

  it('debe mostrar información de contacto', () => {
    render(<Footer />);
    expect(screen.getByText('Contacto')).toBeInTheDocument();
    expect(screen.getByText(/info@3dprint-tfm.com/i)).toBeInTheDocument();
    expect(screen.getByText(/900 123 456/i)).toBeInTheDocument();
  });

  it('debe mostrar el año actual en el copyright', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('debe mostrar mensaje de proyecto académico', () => {
    render(<Footer />);
    expect(screen.getByText(/Proyecto académico de fin de máster/i)).toBeInTheDocument();
  });

  it('debe mostrar tecnologías utilizadas', () => {
    render(<Footer />);
    expect(screen.getByText(/Next.js, Prisma, PostgreSQL, Tailwind CSS/i)).toBeInTheDocument();
  });

  it('debe tener estructura responsive', () => {
    render(<Footer />);
    const footer = document.querySelector('footer');
    expect(footer).toHaveClass('bg-gray-900');
    expect(footer).toHaveClass('text-white');
  });
});
