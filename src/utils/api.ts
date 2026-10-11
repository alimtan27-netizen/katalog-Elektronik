import { Product, SellerProfile, Order, ChatMessage } from '../types';

// Client-side API Service connecting directly to central public server
// Enables real-time synchronization so all sellers and buyers see all products publicly!

const API_BASE = '/api';

/**
 * Fetch all public products from central server
 */
export async function apiGetPublicProducts(): Promise<{
  success: boolean;
  products: Product[];
  count: number;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`[API] Failed to fetch products: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return {
      success: true,
      products: Array.isArray(data.products) ? data.products : [],
      count: data.count || (data.products ? data.products.length : 0),
    };
  } catch (err) {
    console.warn('[API] Network or offline error fetching public products:', err);
    return null;
  }
}

/**
 * Upload a product to the central public server (Instantly visible to all other sellers & buyers!)
 */
export async function apiPostProduct(product: Product): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn(`[API] Post product failed:`, errData);
      return null;
    }
    const data = await res.json();
    return data.product || product;
  } catch (err) {
    console.warn('[API] Post product network error:', err);
    return null;
  }
}

/**
 * Bulk sync client-stored products into public database (Preserves past seller uploads!)
 */
export async function apiSyncProducts(clientProducts: Product[]): Promise<Product[] | null> {
  if (!clientProducts || clientProducts.length === 0) return null;
  try {
    const res = await fetch(`${API_BASE}/products/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientProducts }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : null;
  } catch (err) {
    console.warn('[API] Sync products error:', err);
    return null;
  }
}

/**
 * Update stock, status, or details of a product on public server
 */
export async function apiUpdateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product || null;
  } catch (err) {
    console.warn('[API] Update product error:', err);
    return null;
  }
}

/**
 * Delete a product from public server
 */
export async function apiDeleteProduct(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Delete product error:', err);
    return false;
  }
}

/**
 * Get registered public sellers
 */
export async function apiGetSellers(): Promise<SellerProfile[]> {
  try {
    const res = await fetch(`${API_BASE}/sellers`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.sellers) ? data.sellers : [];
  } catch (err) {
    return [];
  }
}

/**
 * Register or update seller on public server
 */
export async function apiSaveSeller(seller: SellerProfile): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/sellers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seller),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Fetch marketplace stats (Total products, sellers, active stock)
 */
export async function apiGetStats(): Promise<{
  totalProducts: number;
  totalSellers: number;
  totalStock: number;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
