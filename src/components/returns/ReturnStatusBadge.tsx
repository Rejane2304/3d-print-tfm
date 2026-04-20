/**
 * ReturnStatusBadge Component
 * Displays return status with appropriate styling
 */

'use client';

interface ReturnStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  Pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
  Aprobada: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobada' },
  Rechazada: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada' },
  Completada: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completada' },
};

export function ReturnStatusBadge({ status, className = '' }: ReturnStatusBadgeProps) {
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      {config.label}
    </span>
  );
}
