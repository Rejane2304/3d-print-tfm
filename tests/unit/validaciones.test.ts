/**
 * Tests de validaciones Zod
 * TDD: Tests primero, implementación después
 * Validaciones para el backend - 100% en español
 */
import { describe, it, expect } from 'vitest';

// ============================================
// VALIDACIONES DE AUTENTICACIÓN
// ============================================

describe('Validaciones de Autenticación', () => {
  describe('Login', () => {
    it('debe validar email requerido', () => {
      const result = validarLogin({ email: '', password: 'password123' });
      expect(result.valido).toBe(false);
      expect(result.errores).toContain('El email es requerido');
    });

    it('debe validar formato de email', () => {
      const result = validarLogin({ email: 'email-invalido', password: 'password123' });
      expect(result.valido).toBe(false);
      expect(result.errores).toContain('El formato del email no es válido');
    });

    it('debe validar contraseña requerida', () => {
      const result = validarLogin({ email: 'test@example.com', password: '' });
      expect(result.valido).toBe(false);
      expect(result.errores).toContain('La contraseña es requerida');
    });

    it('debe validar longitud mínima de contraseña', () => {
      const result = validarLogin({ email: 'test@example.com', password: '123' });
      expect(result.valido).toBe(false);
      expect(result.errores).toContain('La contraseña debe tener al menos 8 caracteres');
    });

    it('debe aceptar credenciales válidas', () => {
      const result = validarLogin({ email: 'test@example.com', password: 'Password123!' });
      expect(result.valido).toBe(true);
      expect(result.errores).toHaveLength(0);
    });
  });

  describe('Registro', () => {
    const datosValidos = {
      email: 'nuevo@example.com',
      password: 'Password123!',
      confirmarPassword: 'Password123!',
      nombre: 'Juan Pérez',
      telefono: '+34 600 123 456',
    };

    it('debe validar nombre requerido', () => {
      const result = validarRegistro({ ...datosValidos, nombre: '' });
      expect(result.valido).toBe(false);
      expect(result.errores).toContain('El nombre es requerido');
    });

    it('debe validar longitud del nombre', () => {
      const result = validarRegistro({ ...datosValidos, nombre: 'Jo' });
      expect(result.valido).toBe(false);
      expect(result.errores).toContain('El nombre debe tener al menos 3 caracteres');
    });

    it('debe validar coincidencia de contraseñas', () => {
      const result = validarRegistro({
        ...datosValidos,
        confirmarPassword: 'OtraPassword123!',
      });
      expect(result.valido).toBe(false);
      expect(result.errores).toContain('Las contraseñas no coinciden');
    });

    it('debe validar formato de teléfono español', () => {
      const result = validarRegistro({ ...datosValidos, telefono: '123' });
      expect(result.valido).toBe(false);
      expect(result.errores).toContain('El teléfono no tiene un formato válido');
    });

    it('debe aceptar registro válido', () => {
      const result = validarRegistro(datosValidos);
      expect(result.valido).toBe(true);
      expect(result.errores).toHaveLength(0);
    });
  });
});

// ============================================
// VALIDACIONES DE PRODUCTOS
// ============================================

describe('Validaciones de Productos', () => {
  const productoValido = {
    nombre: 'Vaso Decorativo Floral',
    descripcion: 'Un hermoso vaso con diseño floral para decoración del hogar',
    precio: 12.99,
    stock: 25,
    categoria: 'DECORATION',
    material: 'PLA',
  };

  it('debe validar nombre requerido', () => {
    const result = validarProducto({ ...productoValido, nombre: '' });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('El nombre del producto es requerido');
  });

  it('debe validar longitud máxima del nombre', () => {
    const result = validarProducto({
      ...productoValido,
      nombre: 'a'.repeat(201),
    });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('El nombre no puede exceder los 200 caracteres');
  });

  it('debe validar descripción requerida', () => {
    const result = validarProducto({ ...productoValido, descripcion: '' });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('La descripción es requerida');
  });

  it('debe validar precio positivo', () => {
    const result = validarProducto({ ...productoValido, precio: -5 });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('El precio debe ser mayor a 0');
  });

  it('debe validar precio máximo', () => {
    const result = validarProducto({ ...productoValido, precio: 100000 });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('El precio máximo permitido es 99999.99');
  });

  it('debe validar stock no negativo', () => {
    const result = validarProducto({ ...productoValido, stock: -1 });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('El stock no puede ser negativo');
  });

  it('debe validar categoría válida', () => {
    const result = validarProducto({ ...productoValido, categoria: 'INVALIDA' });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('Categoría no válida');
  });

  it('debe validar material válido', () => {
    const result = validarProducto({ ...productoValido, material: 'INVALIDO' });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('Material no válido');
  });

  it('debe aceptar producto válido', () => {
    const result = validarProducto(productoValido);
    expect(result.valido).toBe(true);
    expect(result.errores).toHaveLength(0);
  });
});

// ============================================
// VALIDACIONES DE PEDIDOS
// ============================================

describe('Validaciones de Pedidos', () => {
  const pedidoValido = {
    items: [
      { productoId: 'PROD-001', cantidad: 2 },
      { productoId: 'PROD-002', cantidad: 1 },
    ],
    direccionEnvioId: 'DIR-001',
    notas: 'Entregar por la mañana',
  };

  it('debe validar items requeridos', () => {
    const result = validarPedido({ ...pedidoValido, items: [] });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('El pedido debe contener al menos un producto');
  });

  it('debe validar cantidad mínima de items', () => {
    const result = validarPedido({
      ...pedidoValido,
      items: [{ productoId: 'PROD-001', cantidad: 0 }],
    });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('La cantidad debe ser mayor a 0');
  });

  it('debe validar cantidad máxima por item', () => {
    const result = validarPedido({
      ...pedidoValido,
      items: [{ productoId: 'PROD-001', cantidad: 1000 }],
    });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('La cantidad máxima por producto es 100 unidades');
  });

  it('debe validar dirección de envío requerida', () => {
    const result = validarPedido({ ...pedidoValido, direccionEnvioId: '' });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('La dirección de envío es requerida');
  });

  it('debe validar longitud máxima de notas', () => {
    const result = validarPedido({
      ...pedidoValido,
      notas: 'a'.repeat(1001),
    });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('Las notas no pueden exceder los 1000 caracteres');
  });

  it('debe aceptar pedido válido', () => {
    const result = validarPedido(pedidoValido);
    expect(result.valido).toBe(true);
    expect(result.errores).toHaveLength(0);
  });
});

// ============================================
// VALIDACIONES DE CAMBIO DE ESTADO
// ============================================

describe('Validaciones de Cambio de Estado', () => {
  it('debe permitir cambiar de PENDIENTE a CONFIRMADO', () => {
    const result = validarCambioEstado('PENDIENTE', 'CONFIRMADO');
    expect(result.valido).toBe(true);
  });

  it('debe permitir cambiar de CONFIRMADO a PREPARANDO', () => {
    const result = validarCambioEstado('CONFIRMADO', 'PREPARANDO');
    expect(result.valido).toBe(true);
  });

  it('debe permitir cancelar pedido en PENDIENTE', () => {
    const result = validarCambioEstado('PENDIENTE', 'CANCELADO');
    expect(result.valido).toBe(true);
  });

  it('debe permitir cancelar pedido en CONFIRMADO', () => {
    const result = validarCambioEstado('CONFIRMADO', 'CANCELADO');
    expect(result.valido).toBe(true);
  });

  it('debe rechazar cancelar pedido ENTREGADO', () => {
    const result = validarCambioEstado('ENTREGADO', 'CANCELADO');
    expect(result.valido).toBe(false);
    expect(result.error).toBe('No se puede cancelar un pedido ya enviado o entregado');
  });

  it('debe rechazar retroceder estado', () => {
    const result = validarCambioEstado('ENVIADO', 'CONFIRMADO');
    expect(result.valido).toBe(false);
    expect(result.error).toBe('No se puede retroceder el estado del pedido');
  });

  it('debe rechazar cambio al mismo estado', () => {
    const result = validarCambioEstado('PENDIENTE', 'PENDIENTE');
    expect(result.valido).toBe(false);
    expect(result.error).toBe('El nuevo estado debe ser diferente al actual');
  });
});

// ============================================
// VALIDACIONES DE PAGOS
// ============================================

describe('Validaciones de Pagos', () => {
  it('debe validar monto positivo', () => {
    const result = validarPago({ monto: 0, method: 'CARD' });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('El monto debe ser mayor a 0');
  });

  it('debe validar método de pago válido', () => {
    const result = validarPago({ monto: 100, metodo: 'INVALIDO' });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('Método de pago no válido');
  });

  it('debe aceptar pago válido', () => {
    const result = validarPago({ monto: 99.99, method: 'CARD' });
    expect(result.valido).toBe(true);
    expect(result.errores).toHaveLength(0);
  });
});

// ============================================
// VALIDACIONES DE USUARIOS
// ============================================

describe('Validaciones de Usuarios', () => {
  const usuarioValido = {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    telefono: '+34 600 123 456',
    nif: '12345678A',
  };

  it('debe validar NIF español', () => {
    const result = validarUsuario({ ...usuarioValido, nif: 'INVALIDO' });
    expect(result.valido).toBe(false);
    expect(result.errores).toContain('El NIF no tiene un formato válido');
  });

  it('debe aceptar usuario válido', () => {
    const result = validarUsuario(usuarioValido);
    expect(result.valido).toBe(true);
  });
});

// ============================================
// STUBS - Implementación temporal
// ============================================

function validarLogin(datos: { email: string; password: string }) {
  const errores: string[] = [];
  
  if (!datos.email) errores.push('El email es requerido');
  else if (!datos.email.includes('@')) errores.push('El formato del email no es válido');
  
  if (!datos.password) errores.push('La contraseña es requerida');
  else if (datos.password.length < 8) errores.push('La contraseña debe tener al menos 8 caracteres');
  
  return { valido: errores.length === 0, errores };
}

function validarRegistro(datos: {
  email: string;
  password: string;
  confirmarPassword: string;
  nombre: string;
  telefono: string;
}) {
  const errores: string[] = [];
  
  if (!datos.nombre) errores.push('El nombre es requerido');
  else if (datos.nombre.length < 3) errores.push('El nombre debe tener al menos 3 caracteres');
  
  if (datos.password !== datos.confirmarPassword) errores.push('Las contraseñas no coinciden');
  
  const telefonoRegex = /^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/;
  if (datos.telefono && !telefonoRegex.test(datos.telefono)) {
    errores.push('El teléfono no tiene un formato válido');
  }
  
  // Validaciones de login también aplican
  const loginValidation = validarLogin({ email: datos.email, password: datos.password });
  errores.push(...loginValidation.errores);
  
  return { valido: errores.length === 0, errores };
}

function validarProducto(datos: {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  material: string;
}) {
  const errores: string[] = [];
  const categoriasValidas = ['DECORATION', 'ACCESSORIES', 'FUNCTIONAL', 'ARTICULATED', 'TOYS'];
  const materialesValidos = ['PLA', 'PETG', 'ABS', 'TPU'];
  
  if (!datos.nombre) errores.push('El nombre del producto es requerido');
  else if (datos.nombre.length > 200) errores.push('El nombre no puede exceder los 200 caracteres');
  
  if (!datos.descripcion) errores.push('La descripción es requerida');
  
  if (datos.precio <= 0) errores.push('El precio debe ser mayor a 0');
  else if (datos.precio > 99999.99) errores.push('El precio máximo permitido es 99999.99');
  
  if (datos.stock < 0) errores.push('El stock no puede ser negativo');
  
  if (!categoriasValidas.includes(datos.categoria)) errores.push('Categoría no válida');
  if (!materialesValidos.includes(datos.material)) errores.push('Material no válido');
  
  return { valido: errores.length === 0, errores };
}

function validarPedido(datos: {
  items: Array<{ productoId: string; cantidad: number }>;
  direccionEnvioId: string;
  notas?: string;
}) {
  const errores: string[] = [];
  
  if (!datos.items || datos.items.length === 0) {
    errores.push('El pedido debe contener al menos un producto');
  } else {
    for (const item of datos.items) {
      if (item.cantidad <= 0) errores.push('La cantidad debe ser mayor a 0');
      if (item.cantidad > 100) errores.push('La cantidad máxima por producto es 100 unidades');
    }
  }
  
  if (!datos.direccionEnvioId) errores.push('La dirección de envío es requerida');
  
  if (datos.notas && datos.notas.length > 1000) {
    errores.push('Las notas no pueden exceder los 1000 caracteres');
  }
  
  return { valido: errores.length === 0, errores };
}

function validarCambioEstado(estadoActual: string, nuevoEstado: string) {
  const transicionesValidas: Record<string, string[]> = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['PREPARING', 'CANCELLED'],
    'PREPARING': ['SHIPPED'],
    'SHIPPED': ['DELIVERED'],
    'DELIVERED': [],
    'CANCELLED': [],
  };
  
  if (estadoActual === nuevoEstado) {
    return { valido: false, error: 'El nuevo estado debe ser diferente al actual' };
  }
  
  if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
    if (nuevoEstado === 'CANCELADO' && ['ENVIADO', 'ENTREGADO'].includes(estadoActual)) {
      return { valido: false, error: 'No se puede cancelar un pedido ya enviado o entregado' };
    }
    if (transicionesValidas[estadoActual] && nuevoEstado < estadoActual) {
      return { valido: false, error: 'No se puede retroceder el estado del pedido' };
    }
    return { valido: false, error: `Transición no válida de ${estadoActual} a ${nuevoEstado}` };
  }
  
  return { valido: true, error: null };
}

function validarPago(datos: { monto: number; metodo: string }) {
  const errores: string[] = [];
  const metodosValidos = ['CARD', 'BIZUM', 'TRANSFER'];

  if (datos.monto <= 0) errores.push('El monto debe ser mayor a 0');
  if (!metodosValidos.includes(datos.metodo)) errores.push('Método de pago no válido');

  return { valido: errores.length === 0, errores };
}

function validarUsuario(datos: { nombre: string; email: string; telefono?: string; nif?: string }) {
  const errores: string[] = [];
  
  if (datos.nif) {
    const nifRegex = /^\d{8}[A-Z]$/;
    if (!nifRegex.test(datos.nif)) errores.push('El NIF no tiene un formato válido');
  }
  
  return { valido: errores.length === 0, errores };
}
