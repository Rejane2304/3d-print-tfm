/**
 * SiteConfig Provider
 * Loads and provides site configuration to the frontend
 */

'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface SiteConfig {
  _ref: string;
  nombreEmpresa: string;
  cifNif: string;
  direccionEmpresa: string;
  ciudadEmpresa: string;
  provinciaEmpresa: string;
  codigoPostalEmpresa: string;
  telefonoEmpresa: string;
  emailEmpresa: string;
  ivaPorDefecto: number;
  umbralStockBajo: number;
  actualizadoEn: string;
}

interface SiteConfigContextType {
  config: SiteConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/site-config');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar configuración del sitio');
      }

      setConfig(data.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al cargar configuración del sitio:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const value = useMemo(
    () => ({ config, loading, error, refetch: fetchConfig }),
    [config, loading, error, fetchConfig],
  );

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
}

// Hook to get config value with fallback
export function useConfigValue<K extends keyof SiteConfig>(key: K, fallback: SiteConfig[K]): SiteConfig[K] {
  const { config } = useSiteConfig();
  return config?.[key] ?? fallback;
}

// Hook to check if stock is low
export function useIsLowStock(stock: number): boolean {
  const { config } = useSiteConfig();
  const threshold = config?.umbralStockBajo ?? 5;
  return stock <= threshold;
}

// Hook to calculate VAT
export function useCalculateVat(amount: number): {
  vatAmount: number;
  totalWithVat: number;
} {
  const { config } = useSiteConfig();
  const vatRate = config?.ivaPorDefecto ?? 21;
  const vatAmount = (amount * vatRate) / 100;
  return {
    vatAmount,
    totalWithVat: amount + vatAmount,
  };
}
