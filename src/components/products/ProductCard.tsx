/**
 * ProductCard Component
 * Muestra un producto en formato tarjeta para el catálogo
 */
import Link from 'next/link';
import Image from 'next/image';

interface Producto {
  id: string;
  slug: string;
  nombre: string;
  descripcion?: string | null;
  descripcionCorta?: string | null;
  precio: number | Decimal;
  stock: number;
  imagenes: Array<{
    url: string;
    esPrincipal: boolean;
  }>;
}

interface ProductCardProps {
  producto: Producto;
}

export default function ProductCard({ producto }: ProductCardProps) {
  const imagenPrincipal = producto.imagenes?.find(img => img.esPrincipal) || producto.imagenes?.[0];
  const precio = Number(producto.precio);
  
  return (
    <Link
      href={`/products/${producto.slug}`}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative aspect-square bg-gray-200">
        {imagenPrincipal ? (
          <Image
            src={imagenPrincipal.url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Sin imagen
          </div>
        )}
        
        {/* Badge de stock bajo */}
        {producto.stock > 0 && producto.stock < 5 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            ¡Últimas unidades!
          </span>
        )}
        
        {/* Badge de agotado */}
        {producto.stock === 0 && (
          <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded">
            Agotado
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {producto.nombre}
        </h3>
        
        {producto.descripcionCorta && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
            {producto.descripcionCorta}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">
            {precio.toFixed(2)} €
          </span>
          
          <span className={`text-sm ${
            producto.stock > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {producto.stock > 0 ? 'En stock' : 'Agotado'}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Type helper para Decimal de Prisma
type Decimal = {
  toNumber(): number;
};
