/**
 * IndexedDB Helper para almacenamiento offline
 * Maneja operaciones del carrito pendientes de sincronización
 */

const DB_NAME = '3dprint-cart';
const DB_VERSION = 1;
const STORE_NAME = 'cart-operations';

interface CartOperation {
  id?: number;
  type: 'add' | 'remove' | 'update' | 'clear';
  productId?: string;
  quantity?: number;
  timestamp: number;
  synced: boolean;
}

/**
 * Inicializa la base de datos IndexedDB
 */
export async function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Error opening database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('[IndexedDB] Object store created');
      }
    };
  });
}

/**
 * Guarda una operación de carrito pendiente
 */
export async function saveCartOperation(operation: Omit<CartOperation, 'id'>): Promise<number> {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.add(operation);

    request.onsuccess = () => {
      console.log('[IndexedDB] Operation saved:', request.result);
      resolve(request.result as number);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Error saving operation:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Obtiene todas las operaciones pendientes
 */
export async function getPendingOperations(): Promise<CartOperation[]> {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');

    // Use IDBKeyRange.only to properly query by boolean
    const keyRange = IDBKeyRange.only(0); // false stored as 0
    const request = index.getAll(keyRange);

    request.onsuccess = () => {
      resolve(request.result as CartOperation[]);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Error getting operations:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Obtiene todas las operaciones
 */
export async function getAllOperations(): Promise<CartOperation[]> {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as CartOperation[]);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Error getting all operations:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Marca una operación como sincronizada
 */
export async function markOperationAsSynced(id: number): Promise<void> {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const operation = getRequest.result as CartOperation;
      if (operation) {
        operation.synced = true;
        const updateRequest = store.put(operation);

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
      } else {
        reject(new Error('Operation not found'));
      }
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Elimina todas las operaciones sincronizadas
 */
export async function clearSyncedOperations(): Promise<void> {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');

    // Use IDBKeyRange.only to properly query by boolean (stored as 1 for true)
    const keyRange = IDBKeyRange.only(1);
    const request = index.openCursor(keyRange);

    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Limpia todas las operaciones (útil para reset)
 */
export async function clearAllOperations(): Promise<void> {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.clear();

    request.onsuccess = () => {
      console.log('[IndexedDB] All operations cleared');
      resolve();
    };

    request.onerror = () => {
      console.error('[IndexedDB] Error clearing operations:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Verifica si hay operaciones pendientes
 */
export async function hasPendingOperations(): Promise<boolean> {
  const operations = await getPendingOperations();
  return operations.length > 0;
}

/**
 * Obtiene el número de operaciones pendientes
 */
export async function getPendingOperationsCount(): Promise<number> {
  const operations = await getPendingOperations();
  return operations.length;
}
