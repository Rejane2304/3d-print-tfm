"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Package,
  TrendingUp,
} from "lucide-react";
import { useAdminRealTime, EventType } from "@/hooks/useRealTime";

interface Notification {
  id: string;
  type: EventType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function RealTimeNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userId = session?.user?.id;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isConnected, events } = useAdminRealTime({
    onEvent: (event) => {
      const notification: Notification = {
        id: `${event.type}-${Date.now()}`,
        type: event.type,
        title: getNotificationTitle(event.type),
        message: getNotificationMessage(event),
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
    },
  });

  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: EventType) => {
    switch (type) {
      case "order:new":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "order:status:updated":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "payment:confirmed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "stock:low":
      case "alert:new":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "stock:updated":
        return <Package className="h-5 w-5 text-orange-500" />;
      case "review:new":
        return <Bell className="h-5 w-5 text-purple-500" />;
      case "metrics:update":
        return <TrendingUp className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-400 rounded-full" />
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                <p className="text-xs text-gray-500">
                  {isConnected ? "En tiempo real" : "Modo offline"}
                </p>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Marcar leídas
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.timestamp.toLocaleTimeString("es-ES")}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getNotificationTitle(type: EventType): string {
  const titles: Record<EventType, string> = {
    "order:new": "Nuevo Pedido",
    "order:status:updated": "Estado Actualizado",
    "payment:confirmed": "Pago Confirmado",
    "stock:low": "Stock Bajo",
    "stock:updated": "Stock Actualizado",
    "alert:new": "Nueva Alerta",
    "review:new": "Nueva Reseña",
    "metrics:update": "Métricas Actualizadas",
  };
  return titles[type] || "Notificación";
}

function getNotificationMessage(event: {
  type: EventType;
  payload: Record<string, unknown>;
}): string {
  switch (event.type) {
    case "order:new":
      return `Pedido #${event.payload.orderNumber} por €${event.payload.total}`;
    case "order:status:updated":
      return `Pedido #${event.payload.orderId}: ${event.payload.status}`;
    case "payment:confirmed":
      return `Pago confirmado para pedido #${event.payload.orderId}`;
    case "stock:low":
      return `Producto "${event.payload.productName}" tiene solo ${event.payload.stock} unidades`;
    case "stock:updated":
      return `Stock de "${event.payload.productName}" actualizado a ${event.payload.newStock}`;
    case "alert:new":
      return `${event.payload.alertTitle}: ${event.payload.alertMessage}`;
    case "review:new":
      return `Nueva reseña de ${event.payload.rating} estrellas en "${event.payload.productName}"`;
    case "metrics:update":
      return "Las métricas del dashboard han sido actualizadas";
    default:
      return "Nueva actualización del sistema";
  }
}
