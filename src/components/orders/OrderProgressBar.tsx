/**
 * OrderProgressBar - Componente reutilizable para mostrar el progreso de un pedido
 * Usado en: /account/orders/[id], /admin/orders/[id]
 * 
 * Muestra los 5 estados del flujo de pedido con integración de estado de pago
 */
'use client';

import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  AlertCircle,
  CreditCard,
  XCircle,
  Banknote
} from 'lucide-react';

interface OrderProgressBarProps {
  estado: string;                    // Estado del pedido en español
  estadoPago?: string;               // Estado del pago en español
  metodoPago?: string;               // Método de pago en español
  numeroSeguimiento?: string;        // Para estado "Enviado"
  transportista?: string;            // Para estado "Enviado"
  isCancelled?: boolean;            // Si el pedido está cancelado
  motivoCancelacion?: string;       // Motivo de cancelación si aplica
}

interface StepConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresPayment?: boolean;
}

const steps: StepConfig[] = [
  {
    key: 'Pendiente',
    label: 'Pendiente',
    icon: Clock,
    description: 'Pedido recibido',
    requiresPayment: true,
  },
  {
    key: 'Confirmado',
    label: 'Confirmado',
    icon: CheckCircle2,
    description: 'Pago verificado',
    requiresPayment: true,
  },
  {
    key: 'En preparación',
    label: 'En preparación',
    icon: Package,
    description: 'Preparando tu pedido',
  },
  {
    key: 'Enviado',
    label: 'Enviado',
    icon: Truck,
    description: 'En camino',
  },
  {
    key: 'Entregado',
    label: 'Entregado',
    icon: CheckCircle2,
    description: 'Pedido completado',
  },
];

export default function OrderProgressBar({
  estado,
  estadoPago,
  metodoPago,
  numeroSeguimiento,
  transportista,
  isCancelled = false,
  motivoCancelacion,
}: OrderProgressBarProps) {
  // Si está cancelado, mostrar mensaje de cancelación
  if (isCancelled || estado === 'Cancelado') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900">
              Pedido Cancelado
            </h3>
            <p className="text-red-700 mt-1">
              {motivoCancelacion || 'Este pedido ha sido cancelado.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular el índice del paso actual
  const currentStepIndex = steps.findIndex((step) => step.key === estado);
  const isPaymentCompleted = estadoPago === 'Completado' || estadoPago === 'Reembolsado';
  const isPaymentFailed = estadoPago === 'Fallido';
  const isPaymentPending = estadoPago === 'Pendiente' || estadoPago === 'Procesando';

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header con estado actual */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Estado del Pedido
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {steps[currentStepIndex]?.description || 'Procesando...'}
          </p>
        </div>
        
        {/* Indicador de estado de pago */}
        {estadoPago && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            isPaymentCompleted 
              ? 'bg-green-100 text-green-800' 
              : isPaymentFailed
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <CreditCard className="h-4 w-4" />
            <span>Pago: {estadoPago}</span>
          </div>
        )}
      </div>

      {/* Timeline de pasos */}
      <div className="relative">
        {/* Barra de progreso de fondo */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
        
        {/* Barra de progreso activa */}
        <div 
          className="absolute top-5 left-0 h-1 bg-indigo-600 -translate-y-1/2 transition-all duration-500"
          style={{ 
            width: currentStepIndex >= 0 
              ? `${(currentStepIndex / (steps.length - 1)) * 100}%` 
              : '0%' 
          }}
        />

        {/* Pasos */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const isPending = index > currentStepIndex;

            // Lógica especial para el paso de pago
            const showPaymentWarning = step.requiresPayment && 
                                      isCurrent && 
                                      isPaymentPending && 
                                      step.key === 'Pendiente';

            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                {/* Círculo del paso */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? showPaymentWarning
                        ? 'bg-yellow-500 text-white ring-4 ring-yellow-200'
                        : 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {showPaymentWarning ? (
                    <Banknote className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Etiqueta del paso */}
                <span
                  className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                    isCompleted
                      ? 'text-green-600'
                      : isCurrent
                      ? 'text-indigo-900'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>

                {/* Indicador de esperando pago */}
                {showPaymentWarning && (
                  <span className="mt-1 text-xs text-yellow-600 font-medium text-center">
                    Esperando pago
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Información adicional según estado */}
      
      {/* Mensaje de pago fallido */}
      {isPaymentFailed && estado === 'Pendiente' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-900 font-medium">
              Pago fallido
            </p>
            <p className="text-red-700 text-sm mt-1">
              El pago no se pudo procesar. Por favor, intenta nuevamente con otro método de pago.
            </p>
            {metodoPago && (
              <p className="text-red-600 text-sm mt-2">
                Método: {metodoPago}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mensaje de pago pendiente */}
      {isPaymentPending && estado === 'Pendiente' && !isPaymentFailed && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <Banknote className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-yellow-900 font-medium">
              Pago pendiente
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Tu pedido se confirmará una vez que recibamos la confirmación del pago.
            </p>
          </div>
        </div>
      )}

      {/* Información de envío */}
      {estado === 'Enviado' && (numeroSeguimiento || transportista) && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 font-medium flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Información de envío
          </p>
          {transportista && (
            <p className="text-blue-700 text-sm mt-1">
              Transportista: <span className="font-medium">{transportista}</span>
            </p>
          )}
          {numeroSeguimiento && (
            <p className="text-blue-700 text-sm mt-1">
              Número de seguimiento:{' '}
              <span className="font-mono font-medium bg-blue-100 px-2 py-1 rounded">
                {numeroSeguimiento}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Mensaje de entrega completada */}
      {estado === 'Entregado' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div>
            <p className="text-green-900 font-medium">
              ¡Pedido entregado!
            </p>
            <p className="text-green-700 text-sm">
              Gracias por tu compra. Esperamos que disfrutes tu producto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
