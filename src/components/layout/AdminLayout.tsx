/**
 * AdminLayout Component
 * Layout for admin section with horizontal navigation
 * Menu siempre en la parte superior con scroll horizontal para todos los tamaños de pantalla
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Package,
  Warehouse,
  FileText,
  Bell,
  Folder,
  Ticket,
  HelpCircle,
  Star,
  Truck,
  Settings,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  readonly children: ReactNode;
}

const menuItems = [
  { href: '/admin/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clientes', icon: Users },
  { href: '/admin/orders', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/inventory', label: 'Inventario', icon: Warehouse },
  { href: '/admin/invoices', label: 'Facturas', icon: FileText },
  { href: '/admin/alerts', label: 'Alertas', icon: Bell },
  { href: '/admin/categories', label: 'Categorías', icon: Folder },
  { href: '/admin/coupons', label: 'Cupones', icon: Ticket },
  { href: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/admin/reviews', label: 'Reseñas', icon: Star },
  { href: '/admin/shipping', label: 'Envíos', icon: Truck },
  { href: '/admin/site-config', label: 'Configuración', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col gap-6">
          {/* Horizontal Navigation - Shows on ALL screen sizes */}
          <nav className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Main Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
