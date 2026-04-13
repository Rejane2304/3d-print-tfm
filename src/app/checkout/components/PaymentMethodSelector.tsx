'use client';

import { ArrowRightLeft, Banknote, CreditCard, Wallet } from 'lucide-react';
import type { PaymentMethod, PaymentMethodConfig } from '../hooks/usePaymentProcessing';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const iconMap = {
  CreditCard,
  Wallet,
  Banknote,
  ArrowRightLeft,
};

const paymentMethodsConfig: PaymentMethodConfig[] = [
  {
    id: 'CARD',
    name: 'Tarjeta de crédito/débito',
    description: 'Pago seguro con tarjeta',
    iconName: 'CreditCard',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'PAYPAL',
    name: 'PayPal',
    description: 'Pago rápido con PayPal',
    iconName: 'Wallet',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'BIZUM',
    name: 'Bizum',
    description: 'Pago instantáneo desde tu móvil',
    iconName: 'Banknote',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'TRANSFER',
    name: 'Transferencia bancaria',
    description: 'Transferencia a nuestra cuenta',
    iconName: 'ArrowRightLeft',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

interface MethodLabelProps {
  method: PaymentMethodConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function MethodLabel({ method, isSelected, onSelect }: Readonly<MethodLabelProps>) {
  const Icon = iconMap[method.iconName as keyof typeof iconMap];

  return (
    <label
      htmlFor={`payment-${method.id}`}
      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all min-h-[44px] ${
        isSelected
          ? `${method.borderColor} ${method.bgColor}`
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <input
        type="radio"
        id={`payment-${method.id}`}
        name="paymentMethod"
        value={method.id}
        checked={isSelected}
        onChange={onSelect}
        className="sr-only"
      />
      <div className={`p-1.5 sm:p-2 rounded-lg ${method.bgColor} flex-shrink-0`}>
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${method.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-gray-900 text-sm sm:text-base block">
          {method.name}
        </span>
        <p className="text-xs sm:text-sm text-gray-500">{method.description}</p>
      </div>
    </label>
  );
}

export function PaymentMethodSelector({
  paymentMethod,
  onSelectMethod,
}: Readonly<PaymentMethodSelectorProps>) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {paymentMethodsConfig.map((method) => (
        <MethodLabel
          key={method.id}
          method={method}
          isSelected={paymentMethod === method.id}
          onSelect={() => onSelectMethod(method.id)}
        />
      ))}
    </div>
  );
}
