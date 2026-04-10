/**
 * Order State Machine
 * Gestiona las transiciones válidas entre estados de pedidos
 */
import { OrderStatus } from "@prisma/client";

// Definición de transiciones válidas entre estados
const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [], // Estado final, no se puede salir
};

// Timestamps a actualizar en cada estado
export const STATUS_TIMESTAMPS: Record<OrderStatus, string> = {
  PENDING: "",
  CONFIRMED: "confirmedAt",
  PREPARING: "preparingAt",
  SHIPPED: "shippedAt",
  DELIVERED: "deliveredAt",
  CANCELLED: "cancelledAt",
};

/**
 * Verifica si una transición de estado es válida
 */
export function isValidStatusTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): boolean {
  // No permitir cambio al mismo estado
  if (fromStatus === toStatus) {
    return false;
  }

  // Estados finales no pueden cambiar
  if (fromStatus === "DELIVERED" || fromStatus === "CANCELLED") {
    return false;
  }

  const validNextStatuses = VALID_STATUS_TRANSITIONS[fromStatus];
  return validNextStatuses.includes(toStatus);
}

/**
 * Obtiene el timestamp correspondiente a un estado
 */
export function getStatusTimestamp(status: OrderStatus): string | null {
  const timestamp = STATUS_TIMESTAMPS[status];
  return timestamp || null;
}

/**
 * Valida una transición y devuelve error si no es válida
 */
export function validateStatusTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): { valid: boolean; error?: string } {
  if (fromStatus === toStatus) {
    return { valid: false, error: "No se puede cambiar al mismo estado" };
  }

  if (fromStatus === "DELIVERED") {
    return { valid: false, error: "No se puede modificar un pedido entregado" };
  }

  if (fromStatus === "CANCELLED") {
    return { valid: false, error: "No se puede reactivar un pedido cancelado" };
  }

  const validNextStatuses = VALID_STATUS_TRANSITIONS[fromStatus];
  if (!validNextStatuses.includes(toStatus)) {
    return {
      valid: false,
      error: `Transición inválida: no se puede pasar de ${fromStatus} a ${toStatus}. Estados válidos: ${validNextStatuses.join(", ") || "ninguno"}`,
    };
  }

  return { valid: true };
}

/**
 * Obtiene los estados disponibles desde el estado actual
 */
export function getAvailableStatuses(fromStatus: OrderStatus): OrderStatus[] {
  return VALID_STATUS_TRANSITIONS[fromStatus] || [];
}

/**
 * Verifica si se puede cancelar un pedido
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return ["PENDING", "CONFIRMED", "PREPARING"].includes(status);
}

/**
 * Prepara los datos de actualización incluyendo timestamp
 */
export function prepareStatusUpdate(
  newStatus: OrderStatus,
  additionalData?: Record<string, unknown>,
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    status: newStatus,
    ...additionalData,
  };

  // Agregar timestamp correspondiente
  const timestampField = STATUS_TIMESTAMPS[newStatus];
  if (timestampField) {
    updateData[timestampField] = new Date();
  }

  return updateData;
}

/**
 * Obtiene el orden secuencial de los estados para validación
 */
export const STATUS_SEQUENCE: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
];

/**
 * Verifica si un estado es posterior a otro
 */
export function isStatusAfter(
  statusToCheck: OrderStatus,
  referenceStatus: OrderStatus,
): boolean {
  const checkIndex = STATUS_SEQUENCE.indexOf(statusToCheck);
  const refIndex = STATUS_SEQUENCE.indexOf(referenceStatus);

  if (checkIndex === -1 || refIndex === -1) {
    return false;
  }

  return checkIndex > refIndex;
}
