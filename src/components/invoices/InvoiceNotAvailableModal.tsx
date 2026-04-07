/**
 * InvoiceNotAvailableModal Component
 * Shows when an invoice is not yet available for an order
 */
'use client';

import { useEffect } from 'react';
import { FileText, Clock, AlertCircle, X } from 'lucide-react';

interface InvoiceNotAvailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber?: string;
  reason?: 'not_completed' | 'not_generated' | 'payment_pending' | 'cancelled';
}

const reasonConfig = {
  not_completed: {
    icon: Clock,
    title: 'Invoice Not Available',
    message: 'This invoice will be generated once the order is completed and delivered.',
    action: 'Please check back later or contact support if you need assistance.',
  },
  not_generated: {
    icon: FileText,
    title: 'Invoice Not Generated',
    message: 'The invoice for this order has not been generated yet.',
    action: 'Contact the administrator to generate the invoice.',
  },
  payment_pending: {
    icon: AlertCircle,
    title: 'Payment Pending',
    message: 'The invoice will be available once the payment is confirmed.',
    action: 'Please complete the payment to receive your invoice.',
  },
  cancelled: {
    icon: X,
    title: 'Order Cancelled',
    message: 'This order has been cancelled. No invoice will be generated.',
    action: 'Contact support if you believe this is an error.',
  },
};

export function InvoiceNotAvailableModal({
  isOpen,
  onClose,
  orderNumber,
  reason = 'not_completed',
}: InvoiceNotAvailableModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const config = reasonConfig[reason];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-amber-100">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Icon className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            {config.title}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {orderNumber && (
            <div className="mb-4 text-center">
              <span className="text-sm text-gray-500">Order</span>
              <p className="text-lg font-semibold text-indigo-600">{orderNumber}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-gray-700 text-center">
              {config.message}
            </p>
          </div>

          <p className="text-sm text-gray-500 text-center mb-6">
            {config.action}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@3dprint.com" className="text-indigo-600 hover:underline">
              support@3dprint.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default InvoiceNotAvailableModal;
