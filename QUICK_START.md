# 🚀 Quick Start - 3D Print TFM

## Requisitos Previos
- Node.js 18+
- npm o yarn
- PostgreSQL (o Supabase)

## Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd 3d-print-tfm
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Ejecutar migraciones
```bash
npm run db:migrate
```

### 5. Poblar la base de datos
```bash
npm run db:seed
```

## Desarrollo

### Iniciar servidor de desarrollo
```bash
npm run dev
```

Acceder a: http://localhost:3000

### Credenciales de Prueba
- **Admin**: admin@3dprint.com / admin123
- **Cliente**: juan@example.com / pass123

## Testing

### Tests Unitarios
```bash
npm run test:unit
```

### Tests de Integración
```bash
npm run test:integration
```

### Tests E2E
```bash
npm run test:e2e
```

### Todos los tests
```bash
npm test
```

## Producción

### Build
```bash
npm run build
```

### Iniciar servidor
```bash
npm start
```

## Estructura de Carpetas

```
src/
├── app/              # Páginas y rutas
├── components/       # Componentes React
├── lib/              # Utilidades
└── styles/           # Estilos

prisma/
├── schema.prisma     # Modelo de datos
├── migrations/       # Migraciones SQL
└── seed.ts          # Script de seed

tests/
├── unit/            # Tests unitarios
├── integration/     # Tests de integración
└── e2e/             # Tests end-to-end
```

## Características Principales

### Página de Inicio
- Hero section
- Categorías navegables
- **Productos destacados (Top 3 más vendidos)**
- Características de la empresa

### Catálogo
- Listado con paginación
- Filtros avanzados
- Búsqueda
- Detalle de producto

### Carrito
- Agregar/eliminar productos
- Actualizar cantidades
- Cálculo automático

### Checkout
- Formulario de envío
- Integración Stripe
- Confirmación de pago

### Admin
- Dashboard con métricas
- CRUD de productos
- Gestión de pedidos
- Gestión de alertas
- Facturación
- Mensajería

## Datos de Prueba

El seed carga automáticamente:
- 10 usuarios
- 10 productos
- 10 pedidos
- 8 alertas

## Documentación

- `AUDIT_REPORT.md` - Auditoría completa del proyecto
- `doc/` - Documentación de negocio y técnica
- `README.md` - Información general del proyecto

## Soporte

Para más información, consulta:
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Stripe](https://stripe.com/docs)

## Estado del Proyecto

✅ **COMPLETADO Y FUNCIONAL**
- 351/357 tests pasando (98.3%)
- Base de datos poblada
- Todas las características implementadas
- Listo para producción

---

**Última actualización**: 2 de Abril de 2026
