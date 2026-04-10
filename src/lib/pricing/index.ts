/**
 * Pricing utilities
 * Helper functions for price calculations with VAT
 */

import { Decimal } from "@prisma/client/runtime/library";

const DEFAULT_VAT_RATE = 0.21; // 21% IVA en España

/**
 * Add VAT to a price (use this for display purposes)
 * When storing in DB, prices are without VAT
 * When displaying to customers, prices include VAT
 */
export function addVat(
  price: number | string | Decimal | undefined,
  vatRate: number = DEFAULT_VAT_RATE,
): number {
  if (price === undefined || price === null) return 0;
  const numPrice =
    price instanceof Decimal
      ? price.toNumber()
      : typeof price === "string"
        ? parseFloat(price)
        : price;
  if (isNaN(numPrice)) return 0;
  return numPrice * (1 + vatRate);
}

/**
 * Remove VAT from a price (to get base price from VAT-inclusive price)
 */
export function removeVat(
  price: number | string | undefined,
  vatRate: number = DEFAULT_VAT_RATE,
): number {
  if (price === undefined || price === null) return 0;
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 0;
  return numPrice / (1 + vatRate);
}

/**
 * Format price with VAT for display
 * Returns formatted string with 2 decimals and € symbol option
 */
export function formatPriceWithVat(
  price: number | string | Decimal | undefined,
  options: { showSymbol?: boolean; decimals?: number } = {},
): string {
  const { showSymbol = true, decimals = 2 } = options;
  const priceWithVat = addVat(price);
  const formatted = priceWithVat.toFixed(decimals);
  return showSymbol ? `${formatted} €` : formatted;
}

/**
 * Calculate VAT amount from base price
 */
export function calculateVatAmount(
  price: number | string | undefined,
  vatRate: number = DEFAULT_VAT_RATE,
): number {
  if (price === undefined || price === null) return 0;
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 0;
  return numPrice * vatRate;
}

/**
 * Get current VAT rate
 */
export function getVatRate(): number {
  return DEFAULT_VAT_RATE;
}

/**
 * Get VAT rate as percentage (e.g., 21 for 21%)
 */
export function getVatRatePercent(): number {
  return DEFAULT_VAT_RATE * 100;
}
