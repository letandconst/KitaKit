import {
  DB_NAME,
  DB_STORE,
  DB_VERSION,
  INVENTORY_KEY,
  LEGACY_INVENTORY_KEY,
  LEGACY_PRODUCTS_KEY,
  PRODUCTS_KEY,
  starterInventory,
  starterProducts,
} from "../constants";
import type { InventoryItem, Product } from "../types";

export async function loadPersistedState(): Promise<{
  products: Product[];
  inventory: InventoryItem[];
}> {
  const [savedProducts, savedInventory] = await Promise.all([
    readPersistedValue(PRODUCTS_KEY),
    readPersistedValue(INVENTORY_KEY),
  ]);

  const legacyProducts = Array.isArray(savedProducts)
    ? null
    : readLegacyLocalValue(LEGACY_PRODUCTS_KEY);
  const legacyInventory = Array.isArray(savedInventory)
    ? null
    : readLegacyLocalValue(LEGACY_INVENTORY_KEY);
  const products = Array.isArray(savedProducts)
    ? savedProducts
    : Array.isArray(legacyProducts) && legacyProducts.length
      ? legacyProducts
      : starterProducts;
  const inventory = Array.isArray(savedInventory)
    ? savedInventory
    : Array.isArray(legacyInventory) && legacyInventory.length
      ? legacyInventory
      : starterInventory;

  await writeAppState(products, inventory);
  removeLegacyLocalValue(LEGACY_PRODUCTS_KEY);
  removeLegacyLocalValue(LEGACY_INVENTORY_KEY);

  return { products, inventory };
}

export async function writeProducts(products: Product[]): Promise<void> {
  return writePersistedValue(PRODUCTS_KEY, products);
}

export async function writeInventory(inventory: InventoryItem[]): Promise<void> {
  return writePersistedValue(INVENTORY_KEY, inventory);
}

export async function writeAppState(
  products: Product[],
  inventory: InventoryItem[],
): Promise<void> {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, "readwrite");
    const store = transaction.objectStore(DB_STORE);
    store.put(products, PRODUCTS_KEY);
    store.put(inventory, INVENTORY_KEY);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE))
        db.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readPersistedValue(key: string): Promise<unknown> {
  const db = await openDatabase();
  return new Promise<unknown>((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, "readonly");
    const request = transaction.objectStore(DB_STORE).get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function writePersistedValue(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, "readwrite");
    const request = transaction.objectStore(DB_STORE).put(value, key);

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function readLegacyLocalValue(key: string): unknown {
  const saved = localStorage.getItem(key);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    removeLegacyLocalValue(key);
    return null;
  }
}

function removeLegacyLocalValue(key: string): void {
  localStorage.removeItem(key);
}
