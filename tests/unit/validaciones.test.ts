/**
 * Zod Validation Tests
 * TDD: Tests first, implementation after
 * Validations for the backend - 100% in English
 */
import { describe, it, expect } from 'vitest';

// ============================================
// AUTHENTICATION VALIDATIONS
// ============================================

describe('Authentication Validations', () => {
  describe('Login', () => {
    it('should validate required email', () => {
      const result = validateLogin({ email: '', password: 'password123' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should validate email format', () => {
      const result = validateLogin({ email: 'invalid-email', password: 'password123' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should validate required password', () => {
      const result = validateLogin({ email: 'test@example.com', password: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should validate minimum password length', () => {
      const result = validateLogin({ email: 'test@example.com', password: '123' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should accept valid credentials', () => {
      const result = validateLogin({ email: 'test@example.com', password: 'Password123!' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Registration', () => {
    const validData = {
      email: 'new@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      name: 'John Doe',
      phone: '+34 600 123 456',
    };

    it('should validate required name', () => {
      const result = validateRegistration({ ...validData, name: '' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should validate name length', () => {
      const result = validateRegistration({ ...validData, name: 'Jo' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name must be at least 3 characters long');
    });

    it('should validate password matching', () => {
      const result = validateRegistration({
        ...validData,
        confirmPassword: 'AnotherPassword123!',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('should validate Spanish phone format', () => {
      const result = validateRegistration({ ...validData, phone: '123' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid phone format');
    });

    it('should accept valid registration', () => {
      const result = validateRegistration(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

// ============================================
// PRODUCT VALIDATIONS
// ============================================

describe('Product Validations', () => {
  const validProduct = {
    name: 'Floral Decorative Vase',
    description: 'A beautiful vase with floral design for home decoration',
    price: 12.99,
    stock: 25,
    category: 'DECORATION',
    material: 'PLA',
  };

  it('should validate required name', () => {
    const result = validateProduct({ ...validProduct, name: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Product name is required');
  });

  it('should validate maximum name length', () => {
    const result = validateProduct({
      ...validProduct,
      name: 'a'.repeat(201),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name cannot exceed 200 characters');
  });

  it('should validate required description', () => {
    const result = validateProduct({ ...validProduct, description: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Description is required');
  });

  it('should validate positive price', () => {
    const result = validateProduct({ ...validProduct, price: -5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Price must be greater than 0');
  });

  it('should validate maximum price', () => {
    const result = validateProduct({ ...validProduct, price: 100000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Maximum allowed price is 99999.99');
  });

  it('should validate non-negative stock', () => {
    const result = validateProduct({ ...validProduct, stock: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Stock cannot be negative');
  });

  it('should validate valid category', () => {
    const result = validateProduct({ ...validProduct, category: 'INVALID' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid category');
  });

  it('should validate valid material', () => {
    const result = validateProduct({ ...validProduct, material: 'INVALID' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid material');
  });

  it('should accept valid product', () => {
    const result = validateProduct(validProduct);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================
// ORDER VALIDATIONS
// ============================================

describe('Order Validations', () => {
  const validOrder = {
    items: [
      { productId: 'PROD-001', quantity: 2 },
      { productId: 'PROD-002', quantity: 1 },
    ],
    shippingAddressId: 'ADDR-001',
    notes: 'Deliver in the morning',
  };

  it('should validate required items', () => {
    const result = validateOrder({ ...validOrder, items: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Order must contain at least one product');
  });

  it('should validate minimum item quantity', () => {
    const result = validateOrder({
      ...validOrder,
      items: [{ productId: 'PROD-001', quantity: 0 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Quantity must be greater than 0');
  });

  it('should validate maximum item quantity', () => {
    const result = validateOrder({
      ...validOrder,
      items: [{ productId: 'PROD-001', quantity: 1000 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Maximum quantity per product is 100 units');
  });

  it('should validate required shipping address', () => {
    const result = validateOrder({ ...validOrder, shippingAddressId: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Shipping address is required');
  });

  it('should validate maximum notes length', () => {
    const result = validateOrder({
      ...validOrder,
      notes: 'a'.repeat(1001),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Notes cannot exceed 1000 characters');
  });

  it('should accept valid order', () => {
    const result = validateOrder(validOrder);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================
// STATUS CHANGE VALIDATIONS
// ============================================

describe('Status Change Validations', () => {
  it('should allow changing from PENDING to CONFIRMED', () => {
    const result = validateStatusChange('PENDING', 'CONFIRMED');
    expect(result.valid).toBe(true);
  });

  it('should allow changing from CONFIRMED to PREPARING', () => {
    const result = validateStatusChange('CONFIRMED', 'PREPARING');
    expect(result.valid).toBe(true);
  });

  it('should allow canceling order in PENDING', () => {
    const result = validateStatusChange('PENDING', 'CANCELLED');
    expect(result.valid).toBe(true);
  });

  it('should allow canceling order in CONFIRMED', () => {
    const result = validateStatusChange('CONFIRMED', 'CANCELLED');
    expect(result.valid).toBe(true);
  });

  it('should reject canceling DELIVERED order', () => {
    const result = validateStatusChange('DELIVERED', 'CANCELLED');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot cancel an order that has already been shipped or delivered');
  });

  it('should reject reverting status', () => {
    const result = validateStatusChange('SHIPPED', 'CONFIRMED');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot revert order status');
  });

  it('should reject change to same status', () => {
    const result = validateStatusChange('PENDING', 'PENDING');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('New status must be different from current status');
  });
});

// ============================================
// PAYMENT VALIDATIONS
// ============================================

describe('Payment Validations', () => {
  it('should validate positive amount', () => {
    const result = validatePayment({ amount: 0, method: 'CARD' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Amount must be greater than 0');
  });

  it('should validate valid payment method', () => {
    const result = validatePayment({ amount: 100, method: 'INVALID' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid payment method');
  });

  it('should accept valid payment', () => {
    const result = validatePayment({ amount: 99.99, method: 'CARD' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================
// USER VALIDATIONS
// ============================================

describe('User Validations', () => {
  const validUser = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+34 600 123 456',
    nif: '12345678A',
  };

  it('should validate Spanish NIF', () => {
    const result = validateUser({ ...validUser, nif: 'INVALID' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid NIF format');
  });

  it('should accept valid user', () => {
    const result = validateUser(validUser);
    expect(result.valid).toBe(true);
  });
});

// ============================================
// STUBS - Temporary implementation
// ============================================

function validateLogin(data: { email: string; password: string }) {
  const errors: string[] = [];
  
  if (!data.email) errors.push('Email is required');
  else if (!data.email.includes('@')) errors.push('Invalid email format');
  
  if (!data.password) errors.push('Password is required');
  else if (data.password.length < 8) errors.push('Password must be at least 8 characters long');
  
  return { valid: errors.length === 0, errors };
}

function validateRegistration(data: {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}) {
  const errors: string[] = [];
  
  if (!data.name) errors.push('Name is required');
  else if (data.name.length < 3) errors.push('Name must be at least 3 characters long');
  
  if (data.password !== data.confirmPassword) errors.push('Passwords do not match');
  
  const phoneRegex = /^\+34\s?\d{3}\s?\d{3}\s?\d{3}$/;
  if (data.phone && !phoneRegex.test(data.phone)) {
    errors.push('Invalid phone format');
  }
  
  // Login validations also apply
  const loginValidation = validateLogin({ email: data.email, password: data.password });
  errors.push(...loginValidation.errors);
  
  return { valid: errors.length === 0, errors };
}

function validateProduct(data: {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  material: string;
}) {
  const errors: string[] = [];
  const validCategories = ['DECORATION', 'ACCESSORIES', 'FUNCTIONAL', 'ARTICULATED', 'TOYS'];
  const validMaterials = ['PLA', 'PETG', 'ABS', 'TPU'];
  
  if (!data.name) errors.push('Product name is required');
  else if (data.name.length > 200) errors.push('Name cannot exceed 200 characters');
  
  if (!data.description) errors.push('Description is required');
  
  if (data.price <= 0) errors.push('Price must be greater than 0');
  else if (data.price > 99999.99) errors.push('Maximum allowed price is 99999.99');
  
  if (data.stock < 0) errors.push('Stock cannot be negative');
  
  if (!validCategories.includes(data.category)) errors.push('Invalid category');
  if (!validMaterials.includes(data.material)) errors.push('Invalid material');
  
  return { valid: errors.length === 0, errors };
}

function validateOrder(data: {
  items: Array<{ productId: string; quantity: number }>;
  shippingAddressId: string;
  notes?: string;
}) {
  const errors: string[] = [];
  
  if (!data.items || data.items.length === 0) {
    errors.push('Order must contain at least one product');
  } else {
    for (const item of data.items) {
      if (item.quantity <= 0) errors.push('Quantity must be greater than 0');
      if (item.quantity > 100) errors.push('Maximum quantity per product is 100 units');
    }
  }
  
  if (!data.shippingAddressId) errors.push('Shipping address is required');
  
  if (data.notes && data.notes.length > 1000) {
    errors.push('Notes cannot exceed 1000 characters');
  }
  
  return { valid: errors.length === 0, errors };
}

function validateStatusChange(currentStatus: string, newStatus: string) {
  const validTransitions: Record<string, string[]> = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['PREPARING', 'CANCELLED'],
    'PREPARING': ['SHIPPED'],
    'SHIPPED': ['DELIVERED'],
    'DELIVERED': [],
    'CANCELLED': [],
  };
  
  if (currentStatus === newStatus) {
    return { valid: false, error: 'New status must be different from current status' };
  }
  
  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    if (newStatus === 'CANCELLED' && ['SHIPPED', 'DELIVERED'].includes(currentStatus)) {
      return { valid: false, error: 'Cannot cancel an order that has already been shipped or delivered' };
    }
    if (validTransitions[currentStatus] && newStatus < currentStatus) {
      return { valid: false, error: 'Cannot revert order status' };
    }
    return { valid: false, error: `Invalid transition from ${currentStatus} to ${newStatus}` };
  }
  
  return { valid: true, error: null };
}

function validatePayment(data: { amount: number; method: string }) {
  const errors: string[] = [];
  const validMethods = ['CARD', 'BIZUM', 'TRANSFER'];

  if (data.amount <= 0) errors.push('Amount must be greater than 0');
  if (!validMethods.includes(data.method)) errors.push('Invalid payment method');

  return { valid: errors.length === 0, errors };
}

function validateUser(data: { name: string; email: string; phone?: string; nif?: string }) {
  const errors: string[] = [];
  
  if (data.nif) {
    const nifRegex = /^\d{8}[A-Z]$/;
    if (!nifRegex.test(data.nif)) errors.push('Invalid NIF format');
  }
  
  return { valid: errors.length === 0, errors };
}
