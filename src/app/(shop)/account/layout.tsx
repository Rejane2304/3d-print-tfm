/**
 * Layout para sección de Cuenta
 * Incluye navegación lateral para Mis Pedidos, Mis Direcciones y Mi Perfil
 */
import Link from 'next/link';
import { 
  Package, 
  MapPin, 
  User, 
  ChevronRight 
} from 'lucide-react';

interface CuentaLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { href: '/account/orders', label: 'Mis Pedidos', icon: Package },
  { href: '/account/addresses', label: 'Mis Direcciones', icon: MapPin },
  { href: '/account/profile', label: 'Mi Perfil', icon: User },
];

export default function CuentaLayout({ children }: CuentaLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Mi Cuenta</h2>
              </div>
              <nav className="divide-y">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                        <span className="text-gray-700 group-hover:text-gray-900">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
