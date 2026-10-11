// Built-in Native IndexedDB Manager for high-capacity persistent storage
// Safely stores large product catalogs, photos, and orders without localStorage 5MB quota crashes.

const DB_NAME = 'GadgetHubDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('idbGet error:', err);
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('idbSet error:', err);
    return false;
  }
}

export async function idbDelete(key: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('idbDelete error:', err);
    return false;
  }
}

// Fallback category images (High-resolution, ultra-fast loading Unsplash URLs)
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Ponsel & Tablet': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
  'Laptop & Komputer': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  'Audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'Kamera': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  'Aksesoris': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
  'Default': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80',
};

export function getCategoryFallbackImage(category?: string): string {
  if (!category) return CATEGORY_FALLBACK_IMAGES['Default'];
  return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES['Default'];
}

// Check if a base64 or URL image is valid and not corrupted
export function isValidImageSource(img?: string): boolean {
  if (!img || typeof img !== 'string') return false;
  const trimmed = img.trim();
  if (trimmed.length === 0) return false;
  // If it's an HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }
  // If it's a data URL
  if (trimmed.startsWith('data:image/')) {
    // Sliced corrupted images were cut off at 4000 characters
    if (trimmed.length <= 4050) {
      return false; // Corrupted from previous slice bug!
    }
    return true;
  }
  return false;
}

// Auto-repair any products with corrupted or missing images
export function repairProductPhotos<T extends { images?: string[]; category?: string }>(products: T[]): T[] {
  if (!Array.isArray(products)) return [];
  return products.map((prod) => {
    const fallback = getCategoryFallbackImage(prod.category);
    let currentImages = Array.isArray(prod.images) ? prod.images : [];
    
    // Filter out corrupted or broken images
    const validImages = currentImages.filter((img) => isValidImageSource(img));

    if (validImages.length === 0) {
      return {
        ...prod,
        images: [fallback],
      };
    }

    return {
      ...prod,
      images: validImages,
    };
  });
}

// Safe localStorage helpers that never throw or crash React
export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const jsonStr = JSON.stringify(value);
    window.localStorage.setItem(key, jsonStr);
    return true;
  } catch (e) {
    console.warn(`SafeStorage: Quota exceeded saving key "${key}". Preserving in IndexedDB.`);
    // If quota exceeded, do NOT corrupt the data by slicing strings.
    // Instead, if it's an array of products, keep the primary image and metadata intact.
    try {
      if (Array.isArray(value)) {
        const lightweight = value.map((item: any) => {
          if (item && item.images && Array.isArray(item.images)) {
            // Keep at most 1 primary image if valid, otherwise fallback URL
            const primary = item.images.find((im: string) => isValidImageSource(im)) || getCategoryFallbackImage(item.category);
            return {
              ...item,
              images: [primary],
            };
          }
          return item;
        });
        window.localStorage.setItem(key, JSON.stringify(lightweight));
        return true;
      }
    } catch (fallbackErr) {
      console.warn('SafeStorage: Lightweight fallback also reached quota. Relying on IndexedDB.', fallbackErr);
    }
    return false;
  }
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`SafeStorage: Error parsing key "${key}". Using fallback.`, e);
    return fallback;
  }
}

// Dedicated storage keys for guaranteed persistence
export const KEY_CUSTOM_PRODUCTS = 'katalog_user_custom_products';
export const KEY_ALL_PRODUCTS = 'katalog_products';
export const KEY_SELLER_PROFILE = 'katalog_seller_profile';
export const KEY_REMEMBERED_SELLER = 'katalog_last_active_seller';

// Normalize Indonesian phone numbers for 100% accurate matching
export function normalizePhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  return digits;
}

// Check if seller phone and product seller phone match
export function isSellerPhoneMatch(sellerPhone?: string, productPhone?: string): boolean {
  if (!sellerPhone || !productPhone) return false;
  const p1 = normalizePhone(sellerPhone);
  const p2 = normalizePhone(productPhone);
  if (!p1 || !p2) return false;
  return p1 === p2 || p1.slice(-9) === p2.slice(-9);
}

// Check if seller name and product seller name match
export function isSellerNameMatch(sellerName?: string, productSellerName?: string): boolean {
  if (!sellerName || !productSellerName) return false;
  const n1 = sellerName.trim().toLowerCase();
  const n2 = productSellerName.trim().toLowerCase();
  if (!n1 || !n2) return false;
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}
