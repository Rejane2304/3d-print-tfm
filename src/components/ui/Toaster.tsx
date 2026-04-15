/**
 * Simple Toaster component for notifications
 */
'use client';

import { X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface ToasterProps {
  notifications: Toast[];
  onDismiss: (id: string) => void;
}

export function Toaster({ notifications, onDismiss }: ToasterProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            flex items-start gap-3 p-4 rounded-lg shadow-lg max-w-md animate-slide-in
            ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : ''}
            ${notification.type === 'error' ? 'bg-red-50 border border-red-200' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : ''}
            ${notification.type === 'info' ? 'bg-blue-50 border border-blue-200' : ''}
          `}
        >
          <div className="flex-1">
            <h4
              className={`
              font-semibold text-sm
              ${notification.type === 'success' ? 'text-green-800' : ''}
              ${notification.type === 'error' ? 'text-red-800' : ''}
              ${notification.type === 'warning' ? 'text-yellow-800' : ''}
              ${notification.type === 'info' ? 'text-blue-800' : ''}
            `}
            >
              {notification.title}
            </h4>
            <p
              className={`
              text-sm mt-1
              ${notification.type === 'success' ? 'text-green-600' : ''}
              ${notification.type === 'error' ? 'text-red-600' : ''}
              ${notification.type === 'warning' ? 'text-yellow-600' : ''}
              ${notification.type === 'info' ? 'text-blue-600' : ''}
            `}
            >
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => onDismiss(notification.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
