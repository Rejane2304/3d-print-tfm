'use client';

import { useCallback, useRef } from 'react';

/**
 * Hook para reproducir sonidos de notificación
 * Compatible con la mayoría de navegadores modernos
 */
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Inicializa el AudioContext (debe llamarse en respuesta a interacción del usuario)
   */
  const initAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Intentar usar Web Audio API para mejor compatibilidad
    if (!audioContextRef.current && window.AudioContext) {
      audioContextRef.current = new (
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    }
  }, []);

  /**
   * Reproduce un sonido de notificación
   */
  const playNotificationSound = useCallback(
    async (type: 'order' | 'alert' | 'message' | 'success' = 'order') => {
      if (typeof window === 'undefined') return;

      try {
        // Asegurar que el AudioContext esté listo
        if (!audioContextRef.current) {
          initAudioContext();
        }

        const audioContext = audioContextRef.current;
        if (!audioContext) return;

        // Resumir el contexto si está suspendido (requerido en algunos navegadores)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Crear oscilador para generar sonido
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configurar el sonido según el tipo
        switch (type) {
          case 'order':
            // Sonido de "ding-dong" para nuevos pedidos
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;

          case 'alert':
            // Sonido de alerta para notificaciones importantes
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(0, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;

          case 'message':
            // Sonido suave para mensajes
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
            oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;

          case 'success':
            // Sonido de éxito
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
        }
      } catch {
        // Silenciar errores de reproducción de audio
      }
    },
    [initAudioContext],
  );

  /**
   * Reproduce sonido para evento específico
   */
  const playEventSound = useCallback(
    (eventType: string) => {
      switch (eventType) {
        case 'order:new':
          playNotificationSound('order');
          break;
        case 'return:new':
        case 'review:new':
          playNotificationSound('message');
          break;
        case 'alert:new':
        case 'stock:alert':
        case 'stock:low':
          playNotificationSound('alert');
          break;
        case 'payment:confirmed':
          playNotificationSound('success');
          break;
        default:
          playNotificationSound('message');
      }
    },
    [playNotificationSound],
  );

  return {
    initAudioContext,
    playNotificationSound,
    playEventSound,
  };
}
