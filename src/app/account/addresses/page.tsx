/**
 * Addresses Page - My Addresses
 * Shows and manages customer addresses
 */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  MapPin, 
  Plus,
  Edit3,
  Trash2,
  Star,
  AlertCircle
} from 'lucide-react';

interface Address {
  id: string;
  name: string;
  recipient: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/account/addresses');
      return;
    }

    if (status === 'authenticated') {
      fetchAddresses();
    }
  }, [status, router]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/account/addresses');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar direcciones');
      }

      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

    try {
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar dirección');
      }

      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando direcciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Direcciones</h1>
            <p className="text-gray-600 mt-2">Gestiona tus direcciones de envío</p>
          </div>
          <Link
            href="/account/addresses/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            Agregar
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes direcciones</h3>
            <p className="text-gray-500 mb-6">Agrega tu primera dirección de envío</p>
            <Link
              href="/account/addresses/new"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar dirección
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{address.name}</span>
                    {address.isDefault && (
                      <span className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3" />
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/account/addresses/${address.id}/edit`}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => deleteAddress(address.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <p className="font-medium">{address.recipient}</p>
                  <p>{address.address}</p>
                  <p>
                    {address.postalCode} {address.city}, {address.province}
                  </p>
                  <p>{address.country}</p>
                  <p className="text-gray-500 mt-2">Tel: {address.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
