'use client';

import { ArrowRightLeft, Banknote, CreditCard, Wallet, X } from 'lucide-react';
import type { PaymentMethod } from '../hooks/usePaymentProcessing';

interface TestDataModalProps {
  paymentMethod: PaymentMethod;
  onClose: () => void;
}

interface TestDataConfig {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const testDataConfigs: Record<PaymentMethod, TestDataConfig> = {
  CARD: {
    title: 'Datos de prueba - Stripe',
    icon: <CreditCard className="h-5 w-5 text-indigo-600" />,
    content: (
      <div className="text-sm space-y-2">
        <p className="font-mono text-gray-700">
          Número:{' '}
          <span className="text-indigo-600 font-semibold">4242 4242 4242 4242</span>
        </p>
        <p className="font-mono text-gray-700">
          Expira: <span className="text-indigo-600">12/30</span> | CVC:{' '}
          <span className="text-indigo-600">123</span>
        </p>
      </div>
    ),
  },
  PAYPAL: {
    title: 'Datos de prueba - PayPal Sandbox',
    icon: <Wallet className="h-5 w-5 text-blue-600" />,
    content: (
      <div className="text-sm space-y-2">
        <p className="font-mono text-gray-700">
          Usuario:{' '}
          <span className="text-blue-600 font-semibold">
            sb-rb3ao50452979@personal.example.com
          </span>
        </p>
        <p className="font-mono text-gray-700">
          Password: <span className="text-blue-600">Q+7&gt;jQ^8</span>
        </p>
      </div>
    ),
  },
  BIZUM: {
    title: 'Datos de prueba - Demo',
    icon: <Banknote className="h-5 w-5 text-green-600" />,
    content: (
      <p className="text-sm text-gray-700">
        Método de prueba - No requiere datos reales. Se simulará un pago exitoso.
      </p>
    ),
  },
  TRANSFER: {
    title: 'Datos de prueba - Demo',
    icon: <ArrowRightLeft className="h-5 w-5 text-purple-600" />,
    content: (
      <p className="text-sm text-gray-700">
        Método de prueba - No requiere datos reales. Se simulará un pago exitoso.
      </p>
    ),
  },
};

export function TestDataModal({ paymentMethod, onClose }: TestDataModalProps) {
  const config = testDataConfigs[paymentMethod];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {config.icon}
            <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-6">{config.content}</div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export function TestDataDisplay({ paymentMethod }: { paymentMethod: PaymentMethod }) {
  const configs: Record<PaymentMethod, { title: string; content: React.ReactNode }> = {
    CARD: {
      title: 'Stripe',
      content: (
        <div className="text-sm space-y-1">
          <p className="font-mono text-gray-700">
            Número:{' '}
            <span className="text-blue-600 font-semibold">4242 4242 4242 4242</span>
          </p>
          <p className="font-mono text-gray-700">
            Expira: <span className="text-blue-600">12/30</span> | CVC:{' '}
            <span className="text-blue-600">123</span>
          </p>
        </div>
      ),
    },
    PAYPAL: {
      title: 'PayPal Sandbox',
      content: (
        <div className="text-sm space-y-1">
          <p className="font-mono text-gray-700">
            Usuario:{' '}
            <span className="text-blue-600 font-semibold">
              sb-rb3ao50452979@personal.example.com
            </span>
          </p>
          <p className="font-mono text-gray-700">
            Password: <span className="text-blue-600">Q+7&gt;jQ^8</span>
          </p>
        </div>
      ),
    },
    BIZUM: {
      title: 'Demo',
      content: (
        <p className="text-sm text-gray-700">
          Método de prueba - No requiere datos reales
        </p>
      ),
    },
    TRANSFER: {
      title: 'Demo',
      content: (
        <p className="text-sm text-gray-700">
          Método de prueba - No requiere datos reales
        </p>
      ),
    },
  };

  const config = configs[paymentMethod];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
        <svg
          className="h-4 w-4 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Datos de prueba - {config.title}
      </h4>
      {config.content}
    </div>
  );
}
