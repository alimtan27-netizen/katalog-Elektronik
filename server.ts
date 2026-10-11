import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS } from './src/data/initialProducts';
import { Product, SellerProfile, Order, ChatMessage } from './src/types';

// Global uncaught exception and rejection handlers to prevent container crashes
process.on('uncaughtException', (err) => {
  console.error('[Server Error] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server Error] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Persistent File Storage Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'public_catalog.json');

interface ServerDatabase {
  products: Product[];
  sellers: SellerProfile[];
  orders: Order[];
  chatMessages: ChatMessage[];
  updatedAt: number;
}

let inMemoryDb: ServerDatabase = {
  products: [],
  sellers: [],
  orders: [],
  chatMessages: [],
  updatedAt: Date.now(),
};

function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products)) {
        inMemoryDb = {
          products: parsed.products,
          sellers: Array.isArray(parsed.sellers) ? parsed.sellers : [],
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
          updatedAt: parsed.updatedAt || Date.now(),
        };
        console.log(`[DB] Loaded ${inMemoryDb.products.length} products from disk.`);
      }
    }

    // If products is empty, seed with initial catalog
    if (inMemoryDb.products.length === 0) {
      inMemoryDb.products = [...INITIAL_PRODUCTS];
      saveDatabaseToDisk();
      console.log(`[DB] Initialized database with ${INITIAL_PRODUCTS.length} initial products.`);
    } else {
      // Ensure initial products exist if not present
      const existingIds = new Set(inMemoryDb.products.map((p) => p.id));
      let addedInitials = false;
      for (const ip of INITIAL_PRODUCTS) {
        if (!existingIds.has(ip.id)) {
          inMemoryDb.products.push(ip);
          addedInitials = true;
        }
      }
      if (addedInitials) {
        saveDatabaseToDisk();
      }
    }
  } catch (err) {
    console.error('[DB] Failed to initialize database file:', err);
    inMemoryDb.products = [...INITIAL_PRODUCTS];
  }
}

function saveDatabaseToDisk() {
  try {
    inMemoryDb.updatedAt = Date.now();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Failed to save database to disk:', err);
  }
}

// Initial DB boot
initDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Immediate basic middleware with generous limit for photo uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers so public links and sharing work seamlessly
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Create HTTP server and bind port 3000 immediately
  const server = http.createServer(app);

  // 1. Health check endpoint for Cloud Run and AI Studio proxy
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      totalProducts: inMemoryDb.products.length,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. GET /api/products - Get all public products
  app.get('/api/products', (_req, res) => {
    res.status(200).json({
      success: true,
      count: inMemoryDb.products.length,
      products: inMemoryDb.products,
      updatedAt: inMemoryDb.updatedAt,
    });
  });

  // 3. POST /api/products - Add or update a product from any seller (public visibility)
  app.post('/api/products', (req, res) => {
    try {
      const product = req.body as Product;
      if (!product || !product.title || !product.price) {
        return res.status(400).json({ error: 'Data produk tidak lengkap (title dan price wajib diisi)' });
      }

      // Check if product already exists by ID
      const existingIdx = inMemoryDb.products.findIndex((p) => p.id === product.id);
      if (existingIdx >= 0) {
        // Update existing product
        inMemoryDb.products[existingIdx] = {
          ...inMemoryDb.products[existingIdx],
          ...product,
          status: (product.stock ?? 1) <= 0 ? 'Habis' : (product.status || 'Tersedia'),
        };
      } else {
        // Insert new product at top of list so it appears immediately on everyone's screen
        inMemoryDb.products.unshift({
          ...product,
          status: (product.stock ?? 1) <= 0 ? 'Habis' : (product.status || 'Tersedia'),
          createdAt: product.createdAt || Date.now(),
        });
      }

      // Auto-register seller if provided
      if (product.sellerName && product.sellerPhone) {
        const sellerExists = inMemoryDb.sellers.some(
          (s) => s.phone === product.sellerPhone || s.storeName.toLowerCase() === product.sellerName.toLowerCase()
        );
        if (!sellerExists) {
          inMemoryDb.sellers.push({
            storeName: product.sellerName,
            phone: product.sellerPhone,
            city: product.location || 'Indonesia',
            joinedAt: Date.now(),
          });
        }
      }

      saveDatabaseToDisk();
      console.log(`[Public API] Product saved: "${product.title}" by ${product.sellerName}. Total: ${inMemoryDb.products.length}`);
      res.status(201).json({ success: true, product });
    } catch (err: any) {
      console.error('[Public API] Error saving product:', err);
      res.status(500).json({ error: err?.message || 'Gagal menyimpan produk ke server publik' });
    }
  });

  // 4. POST /api/products/sync - Bulk sync products from client (e.g. offline or previously local products)
  app.post('/api/products/sync', (req, res) => {
    try {
      const { clientProducts } = req.body;
      if (!Array.isArray(clientProducts)) {
        return res.status(400).json({ error: 'clientProducts must be an array' });
      }

      let addedCount = 0;
      const existingIds = new Set(inMemoryDb.products.map((p) => p.id));

      for (const cp of clientProducts) {
        if (!cp || !cp.id || !cp.title) continue;
        if (!existingIds.has(cp.id)) {
          inMemoryDb.products.unshift(cp);
          existingIds.add(cp.id);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        saveDatabaseToDisk();
        console.log(`[Sync] Merged ${addedCount} products from client into public catalog.`);
      }

      res.status(200).json({
        success: true,
        added: addedCount,
        count: inMemoryDb.products.length,
        products: inMemoryDb.products,
      });
    } catch (err: any) {
      console.error('[Public API] Error in sync:', err);
      res.status(500).json({ error: err?.message || 'Gagal sinkronisasi produk' });
    }
  });

  // 5. PUT /api/products/:id - Update product details or stock
  app.put('/api/products/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body as Partial<Product>;
      const idx = inMemoryDb.products.findIndex((p) => p.id === id);

      if (idx === -1) {
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
      }

      const updated = {
        ...inMemoryDb.products[idx],
        ...updates,
      };

      if (typeof updates.stock === 'number') {
        updated.status = updates.stock <= 0 ? 'Habis' : 'Tersedia';
      }

      inMemoryDb.products[idx] = updated;
      saveDatabaseToDisk();
      res.status(200).json({ success: true, product: updated });
    } catch (err: any) {
      console.error('[Public API] Error updating product:', err);
      res.status(500).json({ error: 'Gagal memperbarui produk' });
    }
  });

  // 6. DELETE /api/products/:id - Delete product
  app.delete('/api/products/:id', (req, res) => {
    try {
      const { id } = req.params;
      const initialLength = inMemoryDb.products.length;
      inMemoryDb.products = inMemoryDb.products.filter((p) => p.id !== id);

      if (inMemoryDb.products.length !== initialLength) {
        saveDatabaseToDisk();
        res.status(200).json({ success: true, message: 'Produk berhasil dihapus' });
      } else {
        res.status(404).json({ error: 'Produk tidak ditemukan' });
      }
    } catch (err: any) {
      console.error('[Public API] Error deleting product:', err);
      res.status(500).json({ error: 'Gagal menghapus produk' });
    }
  });

  // 7. GET /api/sellers & POST /api/sellers - Registered public sellers
  app.get('/api/sellers', (_req, res) => {
    res.status(200).json({ success: true, sellers: inMemoryDb.sellers });
  });

  app.post('/api/sellers', (req, res) => {
    try {
      const seller = req.body as SellerProfile;
      if (!seller || !seller.storeName || !seller.phone) {
        return res.status(400).json({ error: 'Nama toko dan nomor telepon wajib diisi' });
      }

      const idx = inMemoryDb.sellers.findIndex(
        (s) => s.phone === seller.phone || s.storeName.toLowerCase() === seller.storeName.toLowerCase()
      );

      if (idx >= 0) {
        inMemoryDb.sellers[idx] = { ...inMemoryDb.sellers[idx], ...seller };
      } else {
        inMemoryDb.sellers.push(seller);
      }

      saveDatabaseToDisk();
      res.status(200).json({ success: true, seller });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal menyimpan profil penjual' });
    }
  });

  // 8. GET & POST /api/orders
  app.get('/api/orders', (_req, res) => {
    res.status(200).json({ success: true, orders: inMemoryDb.orders });
  });

  app.post('/api/orders', (req, res) => {
    try {
      const order = req.body as Order;
      if (!order || !order.id) {
        return res.status(400).json({ error: 'Data pesanan tidak valid' });
      }
      inMemoryDb.orders.unshift(order);
      saveDatabaseToDisk();
      res.status(201).json({ success: true, order });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal membuat pesanan' });
    }
  });

  // 9. GET & POST /api/chat
  app.get('/api/chat', (_req, res) => {
    res.status(200).json({ success: true, messages: inMemoryDb.chatMessages });
  });

  app.post('/api/chat', (req, res) => {
    try {
      const msg = req.body as ChatMessage;
      if (!msg || !msg.text) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
      }
      inMemoryDb.chatMessages.push(msg);
      saveDatabaseToDisk();
      res.status(201).json({ success: true, message: msg });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal mengirim pesan' });
    }
  });

  // 10. GET /api/stats - Live Marketplace Statistics
  app.get('/api/stats', (_req, res) => {
    const uniqueSellers = new Set(inMemoryDb.products.map((p) => p.sellerName)).size;
    const totalStock = inMemoryDb.products.reduce((acc, p) => acc + (p.stock ?? 1), 0);
    res.status(200).json({
      totalProducts: inMemoryDb.products.length,
      totalSellers: Math.max(uniqueSellers, inMemoryDb.sellers.length),
      totalStock,
      timestamp: Date.now(),
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });

  // Vite middleware for development / Static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite dev middleware attached successfully');
    } catch (viteErr) {
      console.error('Failed to initialize Vite dev server:', viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html><head><title>Loading...</title><meta http-equiv="refresh" content="3"></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Aplikasi sedang memuat...</h2><p>Halaman akan otomatis diperbarui dalam beberapa detik.</p></body></html>');
      }
    });
  }

  // Global Express error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Express Error Handler]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

