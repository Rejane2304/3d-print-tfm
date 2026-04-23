/**
 * Constantes fiscales del sistema
 *
 * NOTA: Estos valores son CONSTANTES y no deben cambiarse sin autorización
 * ya que afectan cálculos contables críticos.
 *
 * IMPORTANTE: Los precios en la BD se almacenan SIN IVA.
 * Los precios mostrados al cliente deben incluir IVA.
 */

/** Tasa de IVA por defecto (21% en España) */
export const DEFAULT_VAT_RATE = 0.21; // 21%

/** Tasa de IVA como porcentaje entero */
export const DEFAULT_VAT_RATE_PERCENT = 21;

/**
 * Calcula el precio con IVA incluido
 * @param basePrice - Precio base sin IVA
 * @returns Precio con IVA incluido
 */
export function calculatePriceWithVAT(basePrice: number): number {
  return roundToCents(basePrice * (1 + DEFAULT_VAT_RATE));
}

/**
 * Calcula el IVA dado un importe base
 * @param amount - Importe base
 * @returns IVA calculado
 */
export function calculateVAT(amount: number): number {
  return amount * DEFAULT_VAT_RATE;
}

/**
 * Redondea a 2 decimales (precisión de céntimos)
 * @param amount - Importe a redondear
 * @returns Importe redondeado
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Valida que dos montos monetarios coincidan (con tolerancia de 1 céntimo)
 * @param amount1 - Primer monto
 * @param amount2 - Segundo monto
 * @returns true si coinciden
 */
export function amountsMatch(amount1: number, amount2: number): boolean {
  return Math.abs(amount1 - amount2) <= 0.01;
}

/**
 * Calcula los totales de un pedido
 * @param subtotal - Subtotal de items (SIN IVA)
 * @param discount - Descuento aplicado
 * @param shipping - Costo de envío
 * @returns Objeto con totales calculados
 */
export function calculateOrderTotals(
  subtotal: number,
  discount: number,
  shipping: number,
): {
  discountedSubtotal: number;
  vatAmount: number;
  total: number;
} {
  const discountedSubtotal = Math.max(0, subtotal - discount);
  // IVA solo sobre productos (no sobre envío)
  const vatAmount = roundToCents(discountedSubtotal * DEFAULT_VAT_RATE);
  // Total = productos con IVA + envío (sin IVA)
  const total = roundToCents(discountedSubtotal * (1 + DEFAULT_VAT_RATE) + shipping);

  return {
    discountedSubtotal: roundToCents(discountedSubtotal),
    vatAmount,
    total,
  };
}

/**
 * FÓRMULA CORRECTA (según requerimiento fiscal español):
 *
 * IVA = (Subtotal - Descuento) × 0.21
 * Total = (Subtotal - Descuento) × 1.21 + Envío
 *
 * El IVA solo se aplica sobre los productos, NO sobre el envío.
 * El envío se suma al final sin IVA.
 *
 * NOTA IMPORTANTE PARA UI:
 * Los precios mostrados al cliente deben INCLUIR IVA.
 * Usar calculatePriceWithVAT() para mostrar precios.
 *
 * Ejemplo:
 *   Precio en BD: 100€ (sin IVA)
 *   Precio mostrado: 121€ (con IVA incluido)
 *   Envío: 5€
 *   Total: 126€
 */
