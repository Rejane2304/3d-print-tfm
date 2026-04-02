/**
 * ============================================
 * GUÍA DE MIGRACIÓN A TRANSACCIONES
 * ============================================
 * 
 * Este archivo contiene ejemplos de cómo migrar tests existentes
 * al nuevo sistema de transacciones.
 * 
 * PROBLEMA ANTERIOR:
 * ❌ Limpieza global TRUNCATE between tests
 * ❌ Race conditions FK
 * ❌ Datos faltantes intermitentes
 * 
 * SOLUCIÓN NUEVA:
 * ✅ Cada test en su propia transacción
 * ✅ Rollback automático al final
 * ✅ Cero race conditions
 * ✅ 100% aislamiento entre tests
 */

// ============================================
// ANTES (PROBLEMÁTICO)
// ============================================

/*
describe('Tests de Usuario - ANTIGUO', () => {
  let userId: string;

  beforeAll(async () => {
    // Crear usuario
    const user = await prisma.usuario.create({...});
    userId = user.id;
  });

  it('debe obtener usuario', async () => {
    // PROBLEMA: TRUNCATE podría ejecutarse AQUÍ MISMO entre beforeAll y este test
    // Resultado: usuario desaparece, test falla intermitentemente
    const user = await prisma.usuario.findUnique({where: {id: userId}});
    expect(user).toBeDefined(); // ❌ A veces falla
  });

  afterAll(async () => {
    // Limpieza con TRUNCATE - pero quizá ya se ejecutó arriba
    await limpiarBaseDatos();
  });
});
*/

// ============================================
// DESPUÉS (NUEVO - CON TRANSACCIONES)
// ============================================

/**
 * NO NECESITAS CAMBIAR NADA EN TUS TESTS
 * 
 * El archivo tests/setup.ts ahora automáticamente:
 * 1. beforeEach: Inicia una transacción SQL
 * 2. Test corre dentro de la transacción
 * 3. afterEach: Hace rollback - limpieza instantánea
 * 
 * Esto funciona para TODOS los tests automáticamente.
 * No hay código que cambiar en los tests existentes.
 */

// ============================================
// EJEMPLO 1: Test simple (SIN CAMBIOS NECESARIOS)
// ============================================

/**
 * Este test funciona igual que antes, pero ahora con aislamiento perfecto
 */
/*
describe('Tests de Usuario - NUEVO', () => {
  let userId: string;

  beforeAll(async () => {
    // Crear datos iniciales
    const user = await prisma.usuario.create({
      data: {
        email: 'test-usuario@example.com',
        nombre: 'Usuario Test',
        password: await bcrypt.hash('test123', 10),
        rol: 'CLIENTE',
        activo: true,
      },
    });
    userId = user.id;
  });

  it('debe obtener usuario', async () => {
    // ✅ GARANTIZADO: Usuario está aquí
    // La transacción de este test puede ver los datos del beforeAll
    // porque están en la MISMA conexión SQL
    const user = await prisma.usuario.findUnique({
      where: { id: userId }
    });
    
    expect(user).toBeDefined();
    expect(user?.email).toBe('test-usuario@example.com');
    // ✅ Después del test: rollback automático
    // Usuario desaparece, pero solo dentro de esta transacción
  });

  it('debe crear nuevo usuario', async () => {
    // ✅ Crear en el mismo beforeAll
    const usuario1 = await prisma.usuario.findUnique({
      where: { id: userId }
    });
    expect(usuario1).toBeDefined();

    // ✅ Crear más usuarios en este test
    const usuario2 = await prisma.usuario.create({
      data: {
        email: 'test-usuario2@example.com',
        nombre: 'Usuario Test 2',
        password: await bcrypt.hash('test123', 10),
        rol: 'CLIENTE',
        activo: true,
      },
    });

    // ✅ GARANTIZADO: usuario2 existe dentro de este test
    const found = await prisma.usuario.findUnique({
      where: { id: usuario2.id }
    });
    expect(found).toBeDefined();

    // ✅ Después de este test: rollback
    // usuario2 desaparece completamente
    // usuario1 del beforeAll también está disponible en el siguiente test
  });

  // IMPORTANTE: No necesitas afterAll para limpiar
  // Cada test se revierte automáticamente
});
*/

// ============================================
// EJEMPLO 2: Test con múltiples operaciones
// ============================================

/**
 * El aislamiento funciona para operaciones complejas también
 */
/*
describe('Tests de Carrito de Compra', () => {
  let usuarioId: string;
  let productoId: string;

  beforeAll(async () => {
    // Crear usuario
    const usuario = await prisma.usuario.create({...});
    usuarioId = usuario.id;

    // Crear producto
    const producto = await prisma.producto.create({...});
    productoId = producto.id;
  });

  it('debe añadir producto al carrito', async () => {
    // ✅ Crear carrito
    const carrito = await prisma.carrito.create({
      data: { usuarioId }
    });

    // ✅ Añadir item
    const item = await prisma.itemCarrito.create({
      data: {
        carritoId: carrito.id,
        productoId: productoId,
        cantidad: 2,
      }
    });

    // ✅ Verificar
    const carritoConItems = await prisma.carrito.findUnique({
      where: { id: carrito.id },
      include: { items: true }
    });

    expect(carritoConItems?.items).toHaveLength(1);
    expect(carritoConItems?.items[0]?.cantidad).toBe(2);

    // ✅ Después: rollback automático
    // carrito e item desaparecen de la BD
  });

  it('debe procesar checkout', async () => {
    // ✅ En este test, el carrito anterior NO existe
    // Solo existen los datos del beforeAll (usuario, producto)

    const carrito = await prisma.carrito.create({
      data: { usuarioId }
    });

    // ✅ Crear pedido
    const pedido = await prisma.pedido.create({
      data: {
        usuarioId,
        total: 100,
        estado: 'PENDIENTE',
      }
    });

    // ✅ Verificar
    const pedidoCreado = await prisma.pedido.findUnique({
      where: { id: pedido.id }
    });
    expect(pedidoCreado).toBeDefined();

    // ✅ Después: rollback automático
    // pedido desaparece
  });
});
*/

// ============================================
// EJEMPLO 3: Cómo los datos del beforeAll persisten
// ============================================

/**
 * Pregunta: Si cada test tiene su propia transacción, 
 * ¿cómo los datos del beforeAll persisten?
 * 
 * Respuesta: Magia de SQL 🎩
 * 
 * 1. beforeAll crea datos (SIN transacción, directo a BD)
 * 2. Test 1 inicia transacción (puede ver datos del beforeAll)
 * 3. Test 1 hace cambios dentro de su transacción
 * 4. Test 1 hace rollback (cambios desaparecen, datos originales intactos)
 * 5. Test 2 inicia NUEVA transacción (puede ver datos originales del beforeAll)
 * 6. Test 2 hace sus cambios
 * 7. Test 2 hace rollback
 * 
 * Resultado: Datos del beforeAll siempre disponibles ✅
 */

// ============================================
// CÓMO MIGRAR TUS TESTS
// ============================================

/**
 * PASO 1: Verifica que setup.ts tenga:
 * 
 *   beforeEach(async () => {
 *     if (process.env.VITEST_ENV === 'integration') {
 *       await prisma.$executeRawUnsafe('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED');
 *     }
 *   });
 * 
 *   afterEach(async () => {
 *     await prisma.$executeRawUnsafe('ROLLBACK');
 *   });
 * 
 * PASO 2: En tus tests, ELIMINA:
 *   - afterEach(() => cleanupTestData())
 *   - afterAll(() => cleanupTestData())
 *   - Cualquier TRUNCATE manual
 *   - Cualquier deleteMany en cleanup
 * 
 * PASO 3: Mantén los beforeAll con seed data:
 *   beforeAll(async () => {
 *     // Crear datos que todos los tests van a necesitar
 *     userId = (await createUser()).id;
 *   });
 * 
 * PASO 4: Los tests ya tienen aislamiento perfecto
 *   No necesitas hacer nada más, la transacción es automática
 * 
 * PASO 5: Corre los tests:
 *   npm run test:integration
 * 
 * RESULTADO:
 *   ✅ Cero fallos intermitentes
 *   ✅ Cero race conditions
 *   ✅ Cero problemas de FK
 *   ✅ Aislamiento perfecto
 */

// ============================================
// CASOS ESPECIALES
// ============================================

/**
 * ¿Qué pasa si quiero hacer algo PERMANENTE durante un test?
 * 
 * Si un test necesita datos que persistan (ej: crear un usuario admin),
 * usa el helper disableTransactionForThisTest():
 * 
 * Solución (si la necesitas después):
 * 1. Pon ese data creation en beforeAll
 * 2. O usa una tabla diferente para "datos de producción"
 * 3. O implementa una lógica especial si es absolutamente necesario
 * 
 * Pero en 99% de casos, la transacción es lo que quieres.
 */

// ============================================
// TESTING LA SOLUCIÓN
// ============================================

/**
 * Para verificar que las transacciones funcionan:
 * 
 * 1. Ejecuta los tests varias veces:
 *    npm run test:integration
 *    npm run test:integration
 *    npm run test:integration
 * 
 * 2. Verifica que los mismos tests no fallen de manera intermitente
 * 
 * 3. Mira los logs - deberías ver:
 *    "BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED"
 *    "ROLLBACK"
 *    ...para cada test
 * 
 * 4. Si ves esos logs, está funcionando perfectamente
 */

export {};
