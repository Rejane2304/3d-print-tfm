/**
 * Página de Inicio
 * Muestra productos destacados traducidos y bienvenida
 * Responsive: mobile → 4K
 */

// Force dynamic rendering to prevent static caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db/prisma';
import {
  translateProductName,
  translateProductDescription,
  translateProductShortDescription,
} from '@/lib/i18n';

async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      images: {
        where: { isMain: true },
        take: 1,
      },
    },
  });

  const deliveredOrders = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
    },
    include: {
      items: true,
    },
  });

  const salesByProduct: Record<string, number> = {};
  for (const order of deliveredOrders) {
    for (const item of order.items) {
      if (item.productId) {
        salesByProduct[item.productId] = (salesByProduct[item.productId] || 0) + item.quantity;
      }
    }
  }

  const productsWithSales = products
    .map((product) => ({
      ...product,
      sales: salesByProduct[product.id] || 0,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  // Traducir productos destacados al español
  const translatedProducts = productsWithSales.map((product) => ({
    ...product,
    name: translateProductName(product.slug),
    description: translateProductDescription(product.slug),
    shortDescription: translateProductShortDescription(product.slug),
  }));

  return translatedProducts;
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-6">
              Impresión 3D de
              <br />
              <span className="text-yellow-300">Calidad Profesional</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Descubre nuestra colección de productos impresos en 3D con los mejores materiales PLA y PETG
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 transition-colors"
              >
                Ver productos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-12">
            Explora por categorías
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: 'Decoración', color: 'bg-pink-100', icon: '🎨' },
              { name: 'Accesorios', color: 'bg-blue-100', icon: '🔧' },
              { name: 'Funcional', color: 'bg-green-100', icon: '⚙️' },
              { name: 'Articulados', color: 'bg-orange-100', icon: '🦖' },
              { name: 'Juguetes', color: 'bg-purple-100', icon: '🎮' },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${category.name.toUpperCase()}`}
                className={`${category.color} p-6 lg:p-8 rounded-xl text-center hover:shadow-lg transition-shadow group`}
              >
                <span className="text-3xl lg:text-4xl mb-3 block group-hover:scale-110 transition-transform">{category.icon}</span>
                <span className="text-gray-800 font-semibold text-lg">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Productos destacados</h2>
            <Link
              href="/products"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              Ver todos
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group"
                >
                  <div className="bg-white shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative w-full aspect-square bg-gray-200">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Sin imagen</div>
                      )}
                    </div>
                    
                    <div className="p-4 lg:p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                      
                       <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {product.shortDescription || product.description}
                         </p>

                         <div className="flex justify-between items-center">
                           <span className="text-xl font-bold text-indigo-600">
                             {Number(product.price).toFixed(2)} €
                          </span>
                           
                            <span className={`text-sm ${product.stock > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                             {product.stock > 0 ? '✅ En stock' : 'Agotado'}
                            </span>
                         </div>
                       </div>
                     </div>
                   </Link>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12 text-gray-500">
                 No hay productos destacados disponibles
               </div>
             )}
           </div>
         </section>

      {/* Características */}
      <section className="py-16 lg:py-24 bg-indigo-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: '🏆',
                title: 'Calidad Premium',
                description: 'Productos impresos con los mejores materiales PLA y PETG de alta calidad.',
              },
              {
                icon: '📦',
                title: 'Envío Rápido',
                description: 'Entrega en 3-5 días laborables. Envío gratis en pedidos superiores a 50€.',
              },
              {
                icon: '💬',
                title: 'Soporte Personalizado',
                description: 'Atención al cliente especializada. Resolvemos tus dudas en 24 horas.',
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <span className="text-4xl lg:text-5xl mb-4 block">{feature.icon}</span>
                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            ¿Listo para empezar?
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Descubre nuestra colección única de productos impresos en 3D.
          </p>
          
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Ver productos
          </Link>
        </div>
      </section>
    </div>
  );
}
