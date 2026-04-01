/**
 * Tests Unitarios - Componente CartItem
 * TDD: Tests primero, implementación después
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CartItem from '@/components/cart/CartItem';

describe('CartItem', () => {
  const mockItem = {
    id: 'item-1',
    productoId: 'prod-1',
    cantidad: 2,
    precioUnitario: 29.99,
    producto: {
      id: 'prod-1',
      nombre: 'Producto Test',
      slug: 'producto-test',
      precio: 29.99,
      stock: 10,
      imagen: '/images/test.jpg',
    },
  };

  const mockHandlers = {
    onUpdateQuantity: vi.fn(),
    onRemove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar información del producto', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />);

    expect(screen.getByText('Producto Test')).toBeInTheDocument();
    expect(screen.getByText('29.99')).toBeInTheDocument();
    expect(screen.getByAltText('Producto Test')).toBeInTheDocument();
  });

  it('debe mostrar cantidad actual', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />);

    const quantityInput = screen.getByDisplayValue('2');
    expect(quantityInput).toBeInTheDocument();
  });

  it('debe calcular y mostrar subtotal correctamente', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />);

    // Subtotal = 29.99 * 2 = 59.98
    expect(screen.getByText(/59\.98/)).toBeInTheDocument();
  });

  it('debe permitir incrementar cantidad', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />);

    const incrementButton = screen.getByLabelText('Incrementar cantidad');
    fireEvent.click(incrementButton);

    expect(mockHandlers.onUpdateQuantity).toHaveBeenCalledWith('item-1', 3);
  });

  it('debe permitir decrementar cantidad', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />);

    const decrementButton = screen.getByLabelText('Decrementar cantidad');
    fireEvent.click(decrementButton);

    expect(mockHandlers.onUpdateQuantity).toHaveBeenCalledWith('item-1', 1);
  });

  it('debe deshabilitar decrementar cuando cantidad es 1', () => {
    const itemWithQuantity1 = { ...mockItem, cantidad: 1 };
    render(<CartItem item={itemWithQuantity1} {...mockHandlers} />);

    const decrementButton = screen.getByLabelText('Decrementar cantidad');
    expect(decrementButton).toBeDisabled();
  });

  it('debe deshabilitar incrementar cuando alcanza stock máximo', () => {
    const itemAtMaxStock = { ...mockItem, cantidad: 10 };
    render(<CartItem item={itemAtMaxStock} {...mockHandlers} />);

    const incrementButton = screen.getByLabelText('Incrementar cantidad');
    expect(incrementButton).toBeDisabled();
  });

  it('debe permitir eliminar item del carrito', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />);

    const removeButton = screen.getByLabelText('Eliminar del carrito');
    fireEvent.click(removeButton);

    expect(mockHandlers.onRemove).toHaveBeenCalledWith('item-1');
  });

  it('debe mostrar imagen placeholder si no hay imagen', () => {
    const itemWithoutImage = { ...mockItem, producto: { ...mockItem.producto, imagen: null } };
    render(<CartItem item={itemWithoutImage} {...mockHandlers} />);

    expect(screen.getByAltText('Producto Test')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('debe mostrar link al producto', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />);

    const productLink = screen.getByRole('link', { name: 'Producto Test' });
    expect(productLink).toHaveAttribute('href', '/productos/producto-test');
  });

  it('debe actualizar cantidad al escribir en input', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />);

    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '5' } });
    fireEvent.blur(quantityInput);

    expect(mockHandlers.onUpdateQuantity).toHaveBeenCalledWith('item-1', 5);
  });

  it('debe validar cantidad máxima al escribir', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />);

    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '15' } });
    fireEvent.blur(quantityInput);

    // No debería permitir más que el stock
    expect(mockHandlers.onUpdateQuantity).toHaveBeenCalledWith('item-1', 10);
  });

  it('debe mostrar estado de carga durante actualización', () => {
    render(<CartItem item={mockItem} {...mockHandlers} isUpdating />);

    expect(screen.getByText('Actualizando...')).toBeInTheDocument();
    expect(screen.getByLabelText('Incrementar cantidad')).toBeDisabled();
    expect(screen.getByLabelText('Decrementar cantidad')).toBeDisabled();
  });
});
