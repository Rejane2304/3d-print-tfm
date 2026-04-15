'use client';

import { useState, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import type { ConnectionStatus as ConnectionStatusType } from '@/hooks/useRealTime';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  reconnectAttempt: number;
  maxReconnectAttempts?: number;
  lastHeartbeatAt?: Date | null;
  onReconnect?: () => void;
  missedEventsCount?: number;
  className?: string;
}

/**
 * Componente visual indicador de estado de conexión SSE
 *
 * Estados visuales:
 * - Verde: Conectado
 * - Amarillo: Reconectando / Conectando
 * - Rojo: Desconectado
 *
 * Features:
 * - Indicador visual de estado
 * - Tooltip informativo
 * - Botón de reconexión manual
 * - Contador de intentos
 * - Indicador de eventos perdidos
 */
export default function ConnectionStatus({
  status,
  reconnectAttempt,
  maxReconnectAttempts = 10,
  lastHeartbeatAt,
  onReconnect,
  missedEventsCount = 0,
  className = '',
}: ConnectionStatusProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = useCallback(async () => {
    if (!onReconnect || isReconnecting) return;

    setIsReconnecting(true);
    try {
      await onReconnect();
    } finally {
      setTimeout(() => setIsReconnecting(false), 500);
    }
  }, [onReconnect, isReconnecting]);

  // Configuración visual según el estado
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          borderColor: 'border-green-500',
          label: 'Conectado',
          description: 'Conexión en tiempo real activa',
          pulse: false,
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          borderColor: 'border-yellow-500',
          label: 'Conectando',
          description: 'Estableciendo conexión...',
          pulse: true,
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          borderColor: 'border-yellow-500',
          label: 'Reconectando',
          description: `Intento ${reconnectAttempt} de ${maxReconnectAttempts}`,
          pulse: true,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500',
          label: 'Desconectado',
          description: 'Conexión perdida. Click para reconectar.',
          pulse: false,
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-500',
          label: 'Desconocido',
          description: 'Estado de conexión desconocido',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Formatear tiempo desde último heartbeat
  const getTimeSinceLastHeartbeat = () => {
    if (!lastHeartbeatAt) return null;
    const diff = Date.now() - lastHeartbeatAt.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Botón principal de estado */}
      <button
        onClick={status === 'disconnected' ? handleReconnect : undefined}
        disabled={isReconnecting || status === 'connecting' || status === 'reconnecting'}
        className={`
          relative flex items-center gap-2 px-3 py-1.5 rounded-full
          border transition-all duration-200 min-h-[32px]
          ${status === 'disconnected' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
          ${config.borderColor} ${config.color}
          bg-opacity-10 hover:bg-opacity-20
          ${status === 'disconnected' ? 'bg-red-50' : ''}
          ${status === 'connected' ? 'bg-green-50' : ''}
          ${status === 'reconnecting' || status === 'connecting' ? 'bg-yellow-50' : ''}
        `}
        aria-label={`Estado: ${config.label}. ${config.description}`}
      >
        {/* Indicador visual con animación */}
        <span className="relative flex h-2.5 w-2.5">
          {config.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bgColor} opacity-75`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.bgColor} ${isReconnecting ? 'animate-spin' : ''}`}
          />
        </span>

        {/* Icono */}
        <Icon className={`h-4 w-4 ${isReconnecting || config.pulse ? 'animate-spin' : ''}`} />

        {/* Texto del estado */}
        <span className="text-xs font-medium hidden sm:inline">{config.label}</span>

        {/* Badge de eventos perdidos */}
        {missedEventsCount > 0 && status === 'connected' && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white font-bold">
            {missedEventsCount > 9 ? '9+' : missedEventsCount}
          </span>
        )}
      </button>

      {/* Tooltip informativo */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
            <div className="font-medium">{config.label}</div>
            <div className="text-gray-300 mt-0.5">{config.description}</div>

            {lastHeartbeatAt && status === 'connected' && (
              <div className="text-gray-400 mt-1">Último ping: {getTimeSinceLastHeartbeat()}</div>
            )}

            {missedEventsCount > 0 && (
              <div className="text-orange-300 mt-1">
                {missedEventsCount} evento{missedEventsCount > 1 ? 's' : ''} recuperado
              </div>
            )}

            {status === 'disconnected' && onReconnect && (
              <div className="text-blue-300 mt-1">Click para reconectar</div>
            )}

            {/* Flecha del tooltip */}
            <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Versión compacta del indicador (solo el punto de color)
 */
export function ConnectionStatusDot({ status, className = '' }: { status: ConnectionStatusType; className?: string }) {
  const getColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return <span className={`inline-flex h-2.5 w-2.5 rounded-full ${getColor()} ${className}`} title={status} />;
}

/**
 * Versión para mostrar en el header admin con más información
 */
export function AdminConnectionStatus({
  status,
  reconnectAttempt,
  onReconnect,
  missedEventsCount,
}: {
  status: ConnectionStatusType;
  reconnectAttempt: number;
  onReconnect?: () => void;
  missedEventsCount?: number;
}) {
  return (
    <div className="relative">
      <ConnectionStatus
        status={status}
        reconnectAttempt={reconnectAttempt}
        onReconnect={onReconnect}
        missedEventsCount={missedEventsCount}
      />
    </div>
  );
}
