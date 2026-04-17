/**
 * Rate Limiting para SSE (Server-Sent Events)
 * Protege contra ataques de conexiones masivas
 */

interface RateLimitEntry {
  connections: number;
  lastConnection: number;
  blocked: boolean;
  blockExpiry?: number;
}

const ipConnections = new Map<string, RateLimitEntry>();

// Configuración
const MAX_CONNECTIONS_PER_IP = 5; // Máximo 5 conexiones simultáneas por IP
const CONNECTION_WINDOW_MS = 60 * 1000; // Ventana de 1 minuto
const BLOCK_DURATION_MS = 10 * 60 * 1000; // Bloqueo por 10 minutos

/**
 * Verifica si una IP está permitida crear nuevas conexiones SSE
 */
export function checkSSERateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = ipConnections.get(ip);

  // Si la IP está bloqueada, verificar si el bloqueo expiró
  if (entry?.blocked) {
    if (entry.blockExpiry && now < entry.blockExpiry) {
      return {
        allowed: false,
        reason: 'IP bloqueada temporalmente por exceso de conexiones',
        retryAfter: Math.ceil((entry.blockExpiry - now) / 1000),
      };
    }
    // Desbloquear si expiró
    entry.blocked = false;
    entry.connections = 0;
  }

  // Si no hay entrada, crear una nueva
  if (!entry) {
    ipConnections.set(ip, {
      connections: 0,
      lastConnection: now,
      blocked: false,
    });
    return { allowed: true };
  }

  // Reiniciar contador si la ventana de tiempo expiró
  if (now - entry.lastConnection > CONNECTION_WINDOW_MS) {
    entry.connections = 0;
    entry.lastConnection = now;
  }

  // Verificar límite de conexiones
  if (entry.connections >= MAX_CONNECTIONS_PER_IP) {
    // Bloquear la IP
    entry.blocked = true;
    entry.blockExpiry = now + BLOCK_DURATION_MS;

    console.warn(`[SSE Rate Limit] IP ${ip} bloqueada por exceso de conexiones`);

    return {
      allowed: false,
      reason: `Límite de ${MAX_CONNECTIONS_PER_IP} conexiones SSE excedido`,
      retryAfter: BLOCK_DURATION_MS / 1000,
    };
  }

  return { allowed: true };
}

/**
 * Incrementa el contador de conexiones para una IP
 */
export function incrementSSEConnection(ip: string): void {
  const entry = ipConnections.get(ip);
  if (entry) {
    entry.connections++;
    entry.lastConnection = Date.now();
  }
}

/**
 * Decrementa el contador de conexiones para una IP
 */
export function decrementSSEConnection(ip: string): void {
  const entry = ipConnections.get(ip);
  if (entry && entry.connections > 0) {
    entry.connections--;
  }
}

/**
 * Limpia entradas antiguas del rate limiter (ejecutar periódicamente)
 */
export function cleanupRateLimitEntries(): void {
  const now = Date.now();
  const maxAge = BLOCK_DURATION_MS + CONNECTION_WINDOW_MS;

  for (const [ip, entry] of ipConnections.entries()) {
    // Eliminar entradas muy antiguas que no están bloqueadas
    if (!entry.blocked && now - entry.lastConnection > maxAge) {
      ipConnections.delete(ip);
    }
    // Eliminar bloqueos expirados
    if (entry.blocked && entry.blockExpiry && now > entry.blockExpiry) {
      ipConnections.delete(ip);
    }
  }
}

// Limpiar entradas antiguas cada 5 minutos
setInterval(cleanupRateLimitEntries, 5 * 60 * 1000);
