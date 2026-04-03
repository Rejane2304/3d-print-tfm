/**
 * Tests Unitarios - Componente CartSummary
 * TDD: Tests primero, implementación después
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CartSummary from '@/components/cart/CartSummary';

describe('CartSummary', () => {
  const mockItems = [
    {
      id: 'item-1',
      quantity: 2,
      unitPrice: 29.99,
      product: {
        name: 'Producto A',
        price: 29.99,
      },
    },
    {
      id: 'item-2',
      quantity: 1,
      unitPrice: 49.99,
      product: {
        name: 'Producto B',
        price: 49.99,
      },
    },
  ];

  const mockHandlers = {
    onCheckout: vi.fn(),
    onContinueShopping: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar subtotal de items', () => {
    render(<CartSummary items={mockItems} subtotal={109.97} {...mockHandlers} />);

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('109.97')).toBeInTheDocument();
  });

  it('debe mostrar número total de items', () => {
    render(<CartSummary items={mockItems} subtotal={109.97} {...mockHandlers} />);

    expect(screen.getByText('3 artículos')).toBeInTheDocument();
  });

  it('debe mostrar gastos de envío', () => {
    render(<CartSummary items={mockItems} subtotal={109.97} shippingCost={5.99} {...mockHandlers} />);

    expect(screen.getByText('Envío')).toBeInTheDocument();
    expect(screen.getByText('5.99')).toBeInTheDocument();
  });

  it('debe mostrar envío gratis si supera el mínimo', () => {
    render(
      <CartSummary 
        items={mockItems} 
        subtotal={60} 
        shippingCost={0} 
        freeShippingFrom={50}
        {...mockHandlers} 
      />
    );

    expect(screen.getByText('Envío')).toBeInTheDocument();
    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });

  it('debe calcular y mostrar total correctamente', () => {
    render(
      <CartSummary 
        items={mockItems} 
        subtotal={109.97} 
        shippingCost={5.99}
        {...mockHandlers} 
      />
    );

    // Total = 109.97 + 5.99 = 115.96
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('115.96')).toBeInTheDocument();
  });

  it('debe habilitar botón de checkout con items', () => {
    render(<CartSummary items={mockItems} subtotal={109.97} {...mockHandlers} />);

    const checkoutButton = screen.getByRole('button', { name: /proceder al pago/i });
    expect(checkoutButton).toBeEnabled();
  });

  it('debe deshabilitar botón de checkout sin items', () => {
    render(<CartSummary items={[]} subtotal={0} {...mockHandlers} />);

    const checkoutButton = screen.getByRole('button', { name: /proceder al pago/i });
    expect(checkoutButton).toBeDisabled();
  });

  it('debe llamar onCheckout al hacer clic', () => {
    render(<CartSummary items={mockItems} subtotal={109.97} {...mockHandlers} />);

    const checkoutButton = screen.getByRole('button', { name: /proceder al pago/i });
    fireEvent.click(checkoutButton);

    expect(mockHandlers.onCheckout).toHaveBeenCalled();
  });

  it('debe mostrar mensaje de carrito vacío', () => {
    render(<CartSummary items={[]} subtotal={0} {...mockHandlers} />);

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    expect(screen.getByText('Añade algunos productos para continuar')).toBeInTheDocument();
  });

  it('debe tener botón para seguir comprando', () => {
    render(<CartSummary items={mockItems} subtotal={109.97} {...mockHandlers} />);

    const continueButton = screen.getByRole('button', { name: /seguir comprando/i });
    fireEvent.click(continueButton);

    expect(mockHandlers.onContinueShopping).toHaveBeenCalled();
  });

  it('debe mostrar información de impuestos incluidos', () => {
    render(<CartSummary items={mockItems} subtotal={109.97} taxIncluded {...mockHandlers} />);

    expect(screen.getByText(/impuestos incluidos/i)).toBeInTheDocument();
  });

  it('debe mostrar loader durante procesamiento', () => {
    render(<CartSummary items={mockItems} subtotal={109.97} isProcessing {...mockHandlers} />);

    expect(screen.getByText('Procesando...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proceder al pago/i })).toBeDisabled();
  });
});
