'use client';

import { MapPin } from 'lucide-react';
import type { Address } from '../hooks/useCheckoutData';

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
}

const addressTranslations: Record<string, string> = {
  home: 'Casa',
  house: 'Casa',
  work: 'Trabajo',
  office: 'Oficina',
  apartment: 'Apartamento',
  flat: 'Piso',
  parents: 'Casa de padres',
  family: 'Casa familiar',
};

function translateAddressName(name: string): string {
  const lowerName = name?.toLowerCase().trim();
  return addressTranslations[lowerName] || name;
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: Readonly<AddressSelectorProps>) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-indigo-600 flex-shrink-0" />
          <h2 className="text-lg sm:text-xl font-semibold">Dirección de envío</h2>
        </div>
        <a
          href="/account/addresses"
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
        >
          Gestionar direcciones →
        </a>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            No tienes direcciones guardadas
          </p>
          <a
            href="/account/addresses"
            className="inline-flex items-center bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            Añadir dirección
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <label
              key={address.id}
              htmlFor={`address-${address.id}`}
              className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors min-h-[44px] ${
                selectedAddressId === address.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                id={`address-${address.id}`}
                name="address"
                value={address.id}
                checked={selectedAddressId === address.id}
                onChange={() => onSelectAddress(address.id)}
                className="mt-1 w-4 h-4 min-w-[16px] min-h-[16px]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    {translateAddressName(address.name)}
                  </span>
                  {address.isDefault && (
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {address.address}
                </p>
                {address.complement && (
                  <p className="text-sm text-gray-600 truncate">
                    {address.complement}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {address.postalCode} {address.city}, {address.province}
                </p>
                <p className="text-sm text-gray-600">Tel: {address.phone}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
