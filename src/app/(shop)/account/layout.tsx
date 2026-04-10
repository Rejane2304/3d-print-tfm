/**
 * Layout para sección de Cuenta
 * Navegación lateral adaptada según el rol del usuario
 * Responsive: Desktop - sidebar lateral | Mobile - tabs horizontales
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import {
  Package,
  MapPin,
  User,
  ChevronRight,
  MessageSquare,
} from "lucide-react";

interface CuentaLayoutProps {
  children: React.ReactNode;
}

export default async function CuentaLayout({ children }: CuentaLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.rol === "ADMIN";

  // Menu items según el rol
  const menuItems = isAdmin
    ? [{ href: "/account/profile", label: "Mi Perfil", icon: User }]
    : [
        { href: "/account/orders", label: "Mis Pedidos", icon: Package },
        { href: "/account/reviews", label: "Mis Reseñas", icon: MessageSquare },
        { href: "/account/addresses", label: "Mis Direcciones", icon: MapPin },
        { href: "/account/profile", label: "Mi Perfil", icon: User },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Mobile Horizontal Tabs */}
          <div className="lg:hidden">
            <nav className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden sticky top-24">
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
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
