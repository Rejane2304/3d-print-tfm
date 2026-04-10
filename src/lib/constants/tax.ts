/**
 * Constantes fiscales del sistema
 *
 * NOTA: Estos valores son CONSTANTES y no deben cambiarse sin autorización
 * ya que afectan cálculos contables críticos.
 */

/** Tasa de IVA por defecto (21% en España) */
export const DEFAULT_VAT_RATE = 0.21; // 21%

/** Tasa de IVA como porcentaje entero */
export const DEFAULT_VAT_RATE_PERCENT = 21;

/**
 * Calcula el IVA dado un importe
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
 * @param subtotal - Subtotal de items
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
  taxableBase: number;
  vatAmount: number;
  total: number;
} {
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxableBase = discountedSubtotal + shipping;
  const vatAmount = roundToCents(taxableBase * DEFAULT_VAT_RATE);
  const total = roundToCents(discountedSubtotal + shipping + vatAmount);

  return {
    discountedSubtotal: roundToCents(discountedSubtotal),
    taxableBase: roundToCents(taxableBase),
    vatAmount,
    total,
  };
}

/**
 * Fórmula documentada para referencia:
 *
 * Base Imponible = (Subtotal - Descuento) + Envío
 * IVA = Base Imponible × 0.21
 * Total = Base Imponible + IVA
 *
 * O expresado de otra forma:
 * Total = (Subtotal - Descuento) + Envío + IVA
 */
