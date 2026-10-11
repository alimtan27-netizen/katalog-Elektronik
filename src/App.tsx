import React, { useState, useEffect } from 'react';
import {
  Product,
  ProductCategory,
  SellerProfile,
  BuyerProfile,
  Order,
  AppNotification,
  ChatMessage,
} from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { Header } from './components/Header';
import { AdminNoticeBanner } from './components/AdminNoticeBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { UploadProductModal } from './components/UploadProductModal';
import { SellerAuthModal } from './components/SellerAuthModal';
import { BuyerAuthModal } from './components/BuyerAuthModal';
import { AdminChatModal } from './components/AdminChatModal';
import { CheckoutModal } from './components/CheckoutModal';
import { PaymentReceiptModal } from './components/PaymentReceiptModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { InstallShareModal } from './components/InstallShareModal';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { MyProductsView } from './components/MyProductsView';
import { OrdersView } from './components/OrdersView';
import { ADMIN_PHONE } from './utils/formatters';
import { playNotificationSound, playSuccessSound } from './utils/audio';
import {
  apiGetPublicProducts,
  apiPostProduct,
  apiSyncProducts,
  apiUpdateProduct,
  apiDeleteProduct,
  apiSaveSeller,
  apiGetStats,
} from './utils/api';
import {
  idbSet,
  idbGet,
  idbDelete,
  safeLocalStorageSet,
  safeLocalStorageGet,
  repairProductPhotos,
  KEY_ALL_PRODUCTS,
  KEY_CUSTOM_PRODUCTS,
  KEY_SELLER_PROFILE,
  KEY_REMEMBERED_SELLER,
  isSellerPhoneMatch,
  isSellerNameMatch,
} from './utils/db';
import {
  Bell,
  CheckCircle2,
  ShieldCheck,
  X,
  Plus,
  Send,
  ArrowRight,
  Store,
  Smartphone,
  Share2,
} from 'lucide-react';

export default function App() {
  // Persistence state: Products (Safely merge custom products with catalog)
  const [products, setProducts] = useState<Product[]>(() => {
    const custom = safeLocalStorageGet<Product[]>(KEY_CUSTOM_PRODUCTS, []);
    const local = safeLocalStorageGet<Product[]>(KEY_ALL_PRODUCTS, INITIAL_PRODUCTS);
    let list: Product[] = [];
    if (custom && custom.length > 0) {
      const existingIds = new Set(local.map((p) => p.id));
      const merged = [...local];
      for (const cp of custom) {
        if (!existingIds.has(cp.id)) {
          merged.unshift(cp);
          existingIds.add(cp.id);
        }
      }
      list = merged;
    } else {
      list = local;
    }

    // Align Samsung S20 Plus to Habis (stock 0) as explicitly requested by store owner
    return list.map((p) => {
      if (p.title.toLowerCase().includes('s20 plus') || p.title.toLowerCase().includes('s20+')) {
        return { ...p, stock: 0, status: 'Habis' as Product['status'] };
      }
      return p;
    });
  });

  // Seller Profile (Store Name & Phone only - No Google!)
  const [seller, setSeller] = useState<SellerProfile | null>(() => {
    return (
      safeLocalStorageGet<SellerProfile | null>(KEY_SELLER_PROFILE, null) ||
      safeLocalStorageGet<SellerProfile | null>(KEY_REMEMBERED_SELLER, null)
    );
  });

  // Remembered seller (in case user accidentally logged out)
  const [rememberedSeller, setRememberedSeller] = useState<SellerProfile | null>(() => {
    return (
      safeLocalStorageGet<SellerProfile | null>(KEY_REMEMBERED_SELLER, null) ||
      safeLocalStorageGet<SellerProfile | null>(KEY_SELLER_PROFILE, null)
    );
  });

  // Flag to ensure initial DB restoration completes before syncing state back to storage
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Buyer Profile (No Google - instant login)
  const [buyer, setBuyer] = useState<BuyerProfile | null>(() => {
    return safeLocalStorageGet<BuyerProfile | null>('katalog_buyer_profile', {
      name: 'Pembeli Tamu',
      phone: '081299887766',
    });
  });

  // Orders & Transactions
  const [orders, setOrders] = useState<Order[]>(() => {
    return safeLocalStorageGet<Order[]>('katalog_orders', []);
  });

  // Real-time Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return safeLocalStorageGet<AppNotification[]>('katalog_notifications', [
      {
        id: 'notif-welcome',
        title: 'Selamat Datang di Katalog Elektronik',
        message: `Transaksi aman dikoordinasikan langsung oleh Admin (${ADMIN_PHONE}). Dukungan pembayaran otomatis Bank, DANA, dan GoPay telah aktif.`,
        timestamp: Date.now() - 1000 * 60 * 10,
        type: 'system',
        read: false,
      },
    ]);
  });

  // Real-time Chat Messages with Admin (087768692417)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    return safeLocalStorageGet<ChatMessage[]>('katalog_chat_messages', [
      {
        id: 'chat-admin-welcome',
        sender: 'admin',
        senderName: 'Admin Pembuat Aplikasi',
        senderPhone: ADMIN_PHONE,
        text: `Halo! Selamat datang di Katalog Elektronik. Saya Admin resmi aplikasi ini (${ADMIN_PHONE}). Anda bisa menanyakan stok barang, spesifikasi laptop/HP, atau konfirmasi pembayaran otomatis langsung di sini.`,
        timestamp: Date.now() - 1000 * 60 * 20,
      },
    ]);
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Semua');
  const [activeTab, setActiveTab] = useState<ActiveTab>('katalog');

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSellerAuthOpen, setIsSellerAuthOpen] = useState(false);
  const [isBuyerAuthOpen, setIsBuyerAuthOpen] = useState(false);
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isInstallShareOpen, setIsInstallShareOpen] = useState(false);

  // Active target elements
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<Product | null>(null);
  const [selectedProductForChat, setSelectedProductForChat] = useState<Product | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Toast notification banner state
  const [activeToast, setActiveToast] = useState<{ title: string; message: string } | null>(null);

  // Public Marketplace Sync State (Online indicator & live stats)
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [liveStats, setLiveStats] = useState<{ totalProducts: number; totalSellers: number; totalStock: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initial load from IndexedDB + Central Public Server
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      try {
        // 1. Instant optimistic load from IndexedDB / localStorage
        const [storedCustom, storedAll] = await Promise.all([
          idbGet<Product[]>(KEY_CUSTOM_PRODUCTS),
          idbGet<Product[]>(KEY_ALL_PRODUCTS),
        ]);

        const localCustom = safeLocalStorageGet<Product[]>(KEY_CUSTOM_PRODUCTS, []);
        const localAll = safeLocalStorageGet<Product[]>(KEY_ALL_PRODUCTS, null);

        const rawCustom = storedCustom && storedCustom.length > 0 ? storedCustom : localCustom;
        const customList = repairProductPhotos<Product>(rawCustom);

        let rawBase: Product[] =
          storedAll && storedAll.length > 0
            ? storedAll
            : localAll && localAll.length > 0
            ? localAll
            : INITIAL_PRODUCTS;
        const baseList = repairProductPhotos<Product>(rawBase);

        // Merge custom products locally first for instant display
        const existingIds = new Set(baseList.map((p) => p.id));
        const mergedList = [...baseList];
        if (customList && customList.length > 0) {
          for (const cp of customList) {
            if (!existingIds.has(cp.id)) {
              mergedList.unshift(cp);
              existingIds.add(cp.id);
            }
          }
        }

        if (isMounted) {
          setProducts(mergedList);
        }

        // 2. Fetch central public catalog so ALL users & other sellers see everyone's products!
        try {
          const publicRes = await apiGetPublicProducts();
          if (publicRes && publicRes.products && publicRes.products.length > 0) {
            const serverProducts = repairProductPhotos<Product>(publicRes.products);

            // If the local device has custom products that aren't on the server yet, sync them up immediately!
            if (customList && customList.length > 0) {
              const serverIds = new Set(serverProducts.map((p) => p.id));
              const missingOnServer = customList.filter((p) => !serverIds.has(p.id));
              if (missingOnServer.length > 0) {
                console.log(`[Public Sync] Syncing ${missingOnServer.length} local products to public server...`);
                const syncedServerProducts = await apiSyncProducts(missingOnServer);
                if (syncedServerProducts && isMounted) {
                  setProducts(repairProductPhotos<Product>(syncedServerProducts));
                  idbSet(KEY_ALL_PRODUCTS, syncedServerProducts);
                  safeLocalStorageSet(KEY_ALL_PRODUCTS, syncedServerProducts);
                }
              } else if (isMounted) {
                setProducts(serverProducts);
                idbSet(KEY_ALL_PRODUCTS, serverProducts);
                safeLocalStorageSet(KEY_ALL_PRODUCTS, serverProducts);
              }
            } else if (isMounted) {
              setProducts(serverProducts);
              idbSet(KEY_ALL_PRODUCTS, serverProducts);
              safeLocalStorageSet(KEY_ALL_PRODUCTS, serverProducts);
            }

            if (isMounted) {
              setIsLiveConnected(true);
            }
          }
        } catch (netErr) {
          console.warn('[Public API] Server catalog fetch error (offline fallback):', netErr);
        }

        // 3. Restore seller profile
        const [storedSeller, storedLastSeller] = await Promise.all([
          idbGet<SellerProfile>(KEY_SELLER_PROFILE),
          idbGet<SellerProfile>(KEY_REMEMBERED_SELLER),
        ]);

        const localSeller = safeLocalStorageGet<SellerProfile | null>(KEY_SELLER_PROFILE, null);
        const localLastSeller = safeLocalStorageGet<SellerProfile | null>(KEY_REMEMBERED_SELLER, null);

        const lastSeller = storedLastSeller || localLastSeller;
        let activeSeller = storedSeller || localSeller || lastSeller;

        // Auto-heal: If seller is not found in storage, but user had uploaded products on this device, restore seller from product!
        if (!activeSeller && customList && customList.length > 0) {
          const firstCustom = customList[0];
          if (firstCustom.sellerName && firstCustom.sellerPhone) {
            activeSeller = {
              storeName: firstCustom.sellerName,
              phone: firstCustom.sellerPhone,
              city: firstCustom.location || 'Indonesia',
              joinedAt: Date.now(),
            };
          }
        }

        if (isMounted) {
          if (activeSeller && activeSeller.storeName) {
            setSeller(activeSeller);
            setRememberedSeller(activeSeller);
          } else if (lastSeller && lastSeller.storeName) {
            setSeller(lastSeller);
            setRememberedSeller(lastSeller);
          }
        }

        // 4. Fetch live marketplace stats
        try {
          const stats = await apiGetStats();
          if (stats && isMounted) {
            setLiveStats(stats);
          }
        } catch (e) {}
      } catch (err) {
        console.warn('Initial storage load error:', err);
      } finally {
        if (isMounted) {
          setIsDataLoaded(true);
        }
      }
    }

    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Background Live Synchronization: Polls central server every 6 seconds so any new seller upload appears in real-time
  useEffect(() => {
    let isCancelled = false;

    const syncWithServer = async () => {
      if (isSyncing) return;
      try {
        const publicRes = await apiGetPublicProducts();
        if (!isCancelled && publicRes && Array.isArray(publicRes.products)) {
          setIsLiveConnected(true);
          const serverList = repairProductPhotos<Product>(publicRes.products);

          setProducts((prev) => {
            // Check if length or top product changed
            const lengthChanged = serverList.length !== prev.length;
            const topChanged = serverList[0]?.id !== prev[0]?.id;
            let stockOrStatusChanged = false;

            if (!lengthChanged && !topChanged) {
              for (let i = 0; i < serverList.length; i++) {
                if (
                  serverList[i].id !== prev[i]?.id ||
                  serverList[i].stock !== prev[i]?.stock ||
                  serverList[i].status !== prev[i]?.status
                ) {
                  stockOrStatusChanged = true;
                  break;
                }
              }
            }

            if (lengthChanged || topChanged || stockOrStatusChanged) {
              idbSet(KEY_ALL_PRODUCTS, serverList);
              safeLocalStorageSet(KEY_ALL_PRODUCTS, serverList);
              return serverList;
            }
            return prev;
          });
        }
      } catch (err) {
        if (!isCancelled) setIsLiveConnected(false);
      }
    };

    const intervalId = setInterval(syncWithServer, 6000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncWithServer();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isSyncing]);

  // Save changes to localStorage & IndexedDB ONLY after initial load completes
  useEffect(() => {
    if (!isDataLoaded) return;
    safeLocalStorageSet(KEY_ALL_PRODUCTS, products);
    idbSet(KEY_ALL_PRODUCTS, products);

    // Filter and save user custom/claimed products separately so they are NEVER lost
    const customItems = products.filter((p) => {
      if (!p) return false;
      return (
        p.id.startsWith('prod-custom-') ||
        p.id.startsWith('prod-claimed-') ||
        p.id.startsWith('prod-imported-') ||
        (seller &&
          (isSellerPhoneMatch(seller.phone, p.sellerPhone) ||
            isSellerNameMatch(seller.storeName, p.sellerName)))
      );
    });

    if (customItems.length > 0) {
      safeLocalStorageSet(KEY_CUSTOM_PRODUCTS, customItems);
      idbSet(KEY_CUSTOM_PRODUCTS, customItems);
    }
  }, [products, isDataLoaded, seller]);

  useEffect(() => {
    // CRITICAL: NEVER delete or overwrite seller before initial DB load completes!
    if (!isDataLoaded) return;

    if (seller) {
      safeLocalStorageSet(KEY_SELLER_PROFILE, seller);
      safeLocalStorageSet(KEY_REMEMBERED_SELLER, seller);
      idbSet(KEY_SELLER_PROFILE, seller);
      idbSet(KEY_REMEMBERED_SELLER, seller);
      setRememberedSeller(seller);
    } else {
      try {
        localStorage.removeItem(KEY_SELLER_PROFILE);
      } catch (e) {}
      idbDelete(KEY_SELLER_PROFILE);
      // Keep KEY_REMEMBERED_SELLER so user can restore store with 1-click if they logged out accidentally
    }
  }, [seller, isDataLoaded]);

  useEffect(() => {
    if (buyer) {
      safeLocalStorageSet('katalog_buyer_profile', buyer);
      idbSet('katalog_buyer_profile', buyer);
    }
  }, [buyer]);

  useEffect(() => {
    safeLocalStorageSet('katalog_orders', orders);
    idbSet('katalog_orders', orders);
  }, [orders]);

  useEffect(() => {
    safeLocalStorageSet('katalog_notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    safeLocalStorageSet('katalog_chat_messages', chatMessages);
  }, [chatMessages]);

  // Helper to trigger real-time notification with sound & toast
  const triggerRealtimeNotification = (
    title: string,
    message: string,
    type: AppNotification['type'] = 'system',
    targetId?: string
  ) => {
    playNotificationSound();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: Date.now(),
      type,
      read: false,
      targetId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast({ title, message });
    setTimeout(() => {
      setActiveToast((current) => (current?.title === title ? null : current));
    }, 4500);
  };

  // Add Product from Seller Upload (Instant public publishing so ALL users see it!)
  const handleAddProduct = (newProduct: Product) => {
    // 1. Optimistic local state update
    setProducts((prev) => {
      const updated = [newProduct, ...prev.filter((p) => p.id !== newProduct.id)];
      idbSet(KEY_ALL_PRODUCTS, updated);
      safeLocalStorageSet(KEY_ALL_PRODUCTS, updated);
      return updated;
    });

    // 2. Persist to local custom store for safety
    const currentCustom = safeLocalStorageGet<Product[]>(KEY_CUSTOM_PRODUCTS, []);
    const updatedCustom = [newProduct, ...currentCustom.filter((p) => p.id !== newProduct.id)];
    safeLocalStorageSet(KEY_CUSTOM_PRODUCTS, updatedCustom);
    idbSet(KEY_CUSTOM_PRODUCTS, updatedCustom);

    // 3. Publish to Central Public Server (Visible immediately to all other users & sellers)
    apiPostProduct(newProduct)
      .then((saved) => {
        if (saved) {
          console.log('[Public API] Product successfully published to public catalog:', saved.title);
        }
      })
      .catch((err) => console.warn('[Public API] Background publish error:', err));

    if (seller) {
      apiSaveSeller(seller).catch(() => {});
    }

    triggerRealtimeNotification(
      'Barang Berhasil Tayang ke Publik!',
      `Produk "${newProduct.title}" berhasil diunggah dan langsung dapat dilihat oleh semua pembeli & penjual lain di katalog publik!`,
      'system'
    );
    // Direct user to 'produk_saya' so they immediately see the newly added item in their inventory!
    setActiveTab('produk_saya');
  };

  // Update product stock (for adding many items, +5, +10, or direct number)
  const handleUpdateStock = (id: string, newStock: number) => {
    const validStock = Math.max(0, newStock);
    const newStatus = (validStock <= 0 ? 'Habis' : 'Tersedia') as Product['status'];
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            stock: validStock,
            status: newStatus,
          };
        }
        return p;
      })
    );

    // Sync stock change to public server
    apiUpdateProduct(id, { stock: validStock, status: newStatus }).catch(() => {});

    triggerRealtimeNotification(
      'Stok Produk Diperbarui',
      `Jumlah stok barang berhasil diatur menjadi ${validStock} unit (tersinkronisasi publik).`,
      'system'
    );
  };

  // Claim sample products into current seller's store with 10 units each
  const handleClaimSampleProducts = () => {
    if (!seller) return;
    const claimed: Product[] = INITIAL_PRODUCTS.map((item, idx) => ({
      ...item,
      id: `prod-claimed-${Date.now()}-${idx}`,
      sellerName: seller.storeName,
      sellerPhone: seller.phone,
      location: seller.city || 'Indonesia',
      stock: 10,
      status: 'Tersedia',
      createdAt: Date.now(),
    }));

    setProducts((prev) => {
      const updated = [...claimed, ...prev];
      return updated;
    });

    // Sync to public server
    apiSyncProducts(claimed).catch(() => {});

    triggerRealtimeNotification(
      'Stok Toko Berhasil Ditambahkan!',
      `5 produk elektronik telah dimasukkan ke etalase toko ${seller.storeName} dengan masing-masing 10 unit stok siap jual.`,
      'system'
    );
  };

  // Bulk add stock to all products of the current seller
  const handleBulkAddStock = (amount: number) => {
    if (!seller) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (
          isSellerPhoneMatch(seller.phone, p.sellerPhone) ||
          isSellerNameMatch(seller.storeName, p.sellerName)
        ) {
          const newStock = (p.stock ?? 1) + amount;
          const status = (newStock <= 0 ? 'Habis' : 'Tersedia') as Product['status'];
          apiUpdateProduct(p.id, { stock: newStock, status }).catch(() => {});
          return {
            ...p,
            stock: newStock,
            status,
          };
        }
        return p;
      })
    );
    triggerRealtimeNotification(
      'Stok Massal Ditambahkan!',
      `Berhasil menambahkan +${amount} unit stok ke semua barang toko ${seller.storeName}.`,
      'system'
    );
  };

  // Import products from backup
  const handleImportProducts = (imported: Product[]) => {
    if (!imported || imported.length === 0) return;
    const tagged = imported.map((p, idx) => ({
      ...p,
      id: p.id || `prod-imported-${Date.now()}-${idx}`,
      sellerName: seller ? seller.storeName : p.sellerName,
      sellerPhone: seller ? seller.phone : p.sellerPhone,
      location: seller ? seller.city || p.location : p.location,
      stock: typeof p.stock === 'number' ? p.stock : 1,
      status: ((p.stock ?? 1) <= 0 ? 'Habis' : 'Tersedia') as Product['status'],
    }));

    setProducts((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const filtered = tagged.filter((item) => !existingIds.has(item.id));
      return [...filtered, ...prev];
    });

    apiSyncProducts(tagged).catch(() => {});

    triggerRealtimeNotification(
      'Data Stok Berhasil Dipulihkan!',
      `${tagged.length} produk berhasil dimuat kembali ke etalase toko Anda.`,
      'system'
    );
  };

  // Delete product
  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    // Clean from custom storage
    const custom = safeLocalStorageGet<Product[]>(KEY_CUSTOM_PRODUCTS, []);
    const updatedCustom = custom.filter((p) => p.id !== id);
    safeLocalStorageSet(KEY_CUSTOM_PRODUCTS, updatedCustom);
    idbSet(KEY_CUSTOM_PRODUCTS, updatedCustom);
    // Delete from central public server
    apiDeleteProduct(id).catch(() => {});
    triggerRealtimeNotification('Barang Dihapus', 'Barang telah dihapus dari katalog publik.', 'system');
  };

  // Handle Payment Success from CheckoutModal
  const handlePaymentSuccess = (paidOrder: Order) => {
    setOrders((prev) => [paidOrder, ...prev]);
    setIsCheckoutOpen(false);
    setActiveReceiptOrder(paidOrder);
    setIsReceiptOpen(true);

    // Otomatis kurangi stok produk sesuai unit yang dibeli
    const purchaseQty = paidOrder.quantity ?? 1;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === paidOrder.product.id) {
          const current = p.stock ?? 1;
          const nextStock = Math.max(0, current - purchaseQty);
          const nextStatus = (nextStock <= 0 ? 'Habis' : 'Tersedia') as Product['status'];
          apiUpdateProduct(p.id, { stock: nextStock, status: nextStatus }).catch(() => {});
          return {
            ...p,
            stock: nextStock,
            status: nextStatus,
          };
        }
        return p;
      })
    );

    triggerRealtimeNotification(
      'Pembayaran Otomatis Berhasil!',
      `Transaksi ${paidOrder.invoiceNumber} (${paidOrder.product.title} - ${purchaseQty} unit) berhasil diverifikasi via ${paidOrder.paymentMethodName}. Admin (${ADMIN_PHONE}) sedang mengoordinasikan pengiriman.`,
      'payment',
      paidOrder.id
    );
  };

  // Send message in Chat
  const handleSendMessage = (msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
    if (msg.sender === 'admin') {
      triggerRealtimeNotification(
        'Pesan Baru dari Admin',
        msg.text.slice(0, 100) + (msg.text.length > 100 ? '...' : ''),
        'chat'
      );
    }
  };

  // Admin replies to chat
  const handleAdminReplyChat = (text: string) => {
    const adminMsg: ChatMessage = {
      id: `admin-manual-${Date.now()}`,
      sender: 'admin',
      senderName: 'Admin Pembuat Aplikasi',
      senderPhone: ADMIN_PHONE,
      text,
      timestamp: Date.now(),
    };
    handleSendMessage(adminMsg);
  };

  // Admin updates order status
  const handleUpdateOrderStatus = (orderId: string, status: Order['status'], note?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              adminNotes: note || o.adminNotes,
            }
          : o
      )
    );

    const updated = orders.find((o) => o.id === orderId);
    if (updated) {
      triggerRealtimeNotification(
        `Status Pesanan Diperbarui: ${status.replace('_', ' ')}`,
        `Pesanan ${updated.invoiceNumber} (${updated.product.title}) kini berstatus ${status.replace('_', ' ')}. ${note || ''}`,
        'order',
        orderId
      );
    }
  };

  // State for Bento Grid interactive quick widgets
  const [sideChatText, setSideChatText] = useState('');
  const [quickStoreName, setQuickStoreName] = useState('');
  const [quickStorePhone, setQuickStorePhone] = useState('');

  const handleSideChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sideChatText.trim()) return;
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'buyer',
      senderName: buyer?.name || 'Pengunjung',
      senderPhone: buyer?.phone || '',
      text: sideChatText.trim(),
      timestamp: Date.now(),
    };
    handleSendMessage(userMsg);
    setSideChatText('');
  };

  const handleQuickRegisterSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStoreName.trim() || !quickStorePhone.trim()) {
      setIsSellerAuthOpen(true);
      return;
    }
    const newSeller: SellerProfile = {
      storeName: quickStoreName.trim(),
      phone: quickStorePhone.trim(),
      city: 'Indonesia',
      joinedAt: Date.now(),
    };
    setSeller(newSeller);
    triggerRealtimeNotification(
      'Toko Penjual Aktif!',
      `Selamat datang, ${newSeller.storeName}! Anda sekarang dapat mengunggah foto barang hingga 50 MB.`,
      'system'
    );
    setQuickStoreName('');
    setQuickStorePhone('');
    setActiveTab('produk_saya');
  };

  // Filter products by search and category safely
  const filteredProducts = (products || []).filter((prod) => {
    if (!prod) return false;
    const matchesCategory =
      selectedCategory === 'Semua' || prod.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const titleMatch = (prod.title || '').toLowerCase().includes(query);
    const categoryMatch = (prod.category || '').toLowerCase().includes(query);
    const sellerMatch = (prod.sellerName || '').toLowerCase().includes(query);
    const locationMatch = (prod.location || '').toLowerCase().includes(query);
    return matchesCategory && (titleMatch || categoryMatch || sellerMatch || locationMatch);
  });

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-24 lg:pb-8">
      {/* Floating Real-time Toast Notification Alert */}
      {activeToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-1.5 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate">{activeToast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {activeToast.message}
            </p>
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Bento Grid Container */}
      <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 flex flex-col gap-4 flex-1">
        {/* Bento Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          seller={seller}
          buyer={buyer}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenBuyerModal={() => setIsBuyerAuthOpen(true)}
          onOpenSellerModal={() => setIsSellerAuthOpen(true)}
          onLogoutSeller={() => {
            setSeller(null);
            triggerRealtimeNotification(
              'Keluar Sesi Toko',
              'Anda telah keluar dari toko. Tenang, semua data produk jualan Anda tetap aman tersimpan di memori perangkat.',
              'system'
            );
          }}
          onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
          onOpenInstallShare={() => setIsInstallShareOpen(true)}
        />

        {/* TAB 1: KATALOG (Bento Grid Main Layout) */}
        {activeTab === 'katalog' && (
          <main className="flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
              {/* Main Column (lg:col-span-8): Admin Notice Banner + Katalog Terbaru Bento Card */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {/* Blue Notice Banner */}
                <AdminNoticeBanner
                  onOpenChat={() => {
                    setSelectedProductForChat(null);
                    setIsAdminChatOpen(true);
                  }}
                />

                {/* Main Catalog Bento Tile */}
                <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 flex flex-col shadow-xs relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Katalog Terbaru
                      </h2>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        🌐 Publik (Semua Toko Terhubung)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await apiGetPublicProducts();
                          if (res && res.products) {
                            setProducts(repairProductPhotos<Product>(res.products));
                            triggerRealtimeNotification(
                              'Katalog Publik Diperbarui',
                              'Postingan produk terbaru dari seluruh penjual berhasil dimuat.',
                              'system'
                            );
                          }
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Segarkan produk terbaru dari semua penjual"
                      >
                        <span>🔄 Segarkan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInstallShareOpen(true)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Kirim link aplikasi ini ke WhatsApp atau teman"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kirim Link</span>
                      </button>
                      <span className="text-xs text-slate-500 font-medium font-mono hidden sm:inline">
                        {filteredProducts.length} Produk Tersedia
                      </span>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <CategoryFilter
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    totalCount={filteredProducts.length}
                  />

                  {/* Products Grid */}
                  <div className="mt-1">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-200 mt-2">
                        <p className="text-sm font-semibold text-slate-700">
                          Tidak ada barang yang cocok dengan pencarian Anda
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Coba kata kunci lain atau pilih kategori Semua Produk.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('Semua');
                          }}
                          className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          Reset Filter
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {filteredProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onSelect={(p) => setSelectedProductDetail(p)}
                            onCheckout={(p) => {
                              setSelectedProductForCheckout(p);
                              setIsCheckoutOpen(true);
                            }}
                            onChatAdmin={(p) => {
                              setSelectedProductForChat(p);
                              setIsAdminChatOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Side Bento Column (lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Bento Tile 1: Daftar Toko Baru */}
                <section className="bg-indigo-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col justify-between">
                  {seller ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                          Toko Aktif
                        </span>
                        <Store className="w-5 h-5 text-indigo-200" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold mt-2 truncate">{seller.storeName}</h2>
                      <p className="text-indigo-100 text-xs font-mono mt-0.5">{seller.phone}</p>
                      <p className="text-indigo-100/90 text-xs mt-2 leading-relaxed">
                        Toko terdaftar dan siap mengunggah foto produk hingga 50 MB per file.
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setActiveTab('produk_saya')}
                          className="flex-1 bg-white text-indigo-700 font-semibold text-xs py-2 px-3 rounded-xl hover:bg-indigo-50 shadow-xs transition-colors"
                        >
                          Kelola Toko Saya
                        </button>
                        <button
                          onClick={() => setIsUploadOpen(true)}
                          className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs py-2 px-3 rounded-xl transition-colors"
                        >
                          + Upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                          Khusus Penjual
                        </span>
                        <Store className="w-5 h-5 text-indigo-200" />
                      </div>

                      {rememberedSeller ? (
                        <div className="mt-2.5 p-3 bg-indigo-700/80 rounded-2xl border border-indigo-400/50 space-y-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Toko Tersimpan</span>
                            <h3 className="font-bold text-sm text-white">{rememberedSeller.storeName}</h3>
                            <p className="text-[11px] text-indigo-200 font-mono">{rememberedSeller.phone}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSeller(rememberedSeller);
                              triggerRealtimeNotification(
                                'Toko Berhasil Dipulihkan!',
                                `Selamat datang kembali, ${rememberedSeller.storeName}! Semua produk jualan Anda siap dikelola.`,
                                'system'
                              );
                              setActiveTab('produk_saya');
                            }}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-colors"
                          >
                            Masuk Kembali ke Toko Ini
                          </button>
                        </div>
                      ) : null}

                      <h2 className="text-base sm:text-lg font-bold mt-2">
                        {rememberedSeller ? 'Atau Buka Toko Baru' : 'Daftar Toko Baru'}
                      </h2>
                      <p className="text-indigo-100 text-xs leading-relaxed mt-0.5">
                        Daftar tanpa akun Google — cukup masukkan Nama Toko dan No HP untuk mulai jualan!
                      </p>
                      <form onSubmit={handleQuickRegisterSeller} className="mt-3 space-y-2">
                        <input
                          type="text"
                          placeholder="Nama Toko Anda"
                          value={quickStoreName}
                          onChange={(e) => setQuickStoreName(e.target.value)}
                          className="w-full bg-indigo-700/60 placeholder:text-indigo-200 text-white text-xs px-3 py-2 rounded-xl border border-indigo-500/60 focus:outline-hidden focus:ring-2 focus:ring-white/50"
                        />
                        <input
                          type="tel"
                          placeholder="Nomor Telepon / WA (08...)"
                          value={quickStorePhone}
                          onChange={(e) => setQuickStorePhone(e.target.value)}
                          className="w-full bg-indigo-700/60 placeholder:text-indigo-200 text-white text-xs px-3 py-2 rounded-xl border border-indigo-500/60 focus:outline-hidden focus:ring-2 focus:ring-white/50"
                        />
                        <button
                          type="submit"
                          className="w-full bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors mt-2"
                        >
                          Mulai Buka Toko
                        </button>
                      </form>
                    </div>
                  )}
                </section>

                {/* Bento Tile 2: Upload Foto 50MB */}
                <section
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-slate-900 hover:bg-slate-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base sm:text-lg font-bold">Upload Foto</h2>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Limit hingga <span className="text-emerald-400 font-bold">50MB</span> per file
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                      <span>Klik untuk tambah barang</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-dashed border-slate-700 group-hover:border-indigo-400 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-white transition-colors shrink-0">
                    <Plus className="w-6 h-6" />
                  </div>
                </section>

                {/* Bento Tile 3: Chat Admin */}
                <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 flex flex-col shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      Chat Admin
                    </h2>
                    <button
                      onClick={() => {
                        setSelectedProductForChat(null);
                        setIsAdminChatOpen(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Buka Chat &rarr;
                    </button>
                  </div>

                  <div className="flex-1 bg-slate-50 rounded-2xl p-3 text-xs flex flex-col gap-2 max-h-44 overflow-y-auto mb-3 border border-slate-100">
                    {chatMessages.length === 0 ? (
                      <p className="text-slate-400 text-center py-4 italic text-[11px]">
                        Belum ada percakapan. Ketik pesan untuk menghubungi Admin pembuat aplikasi.
                      </p>
                    ) : (
                      chatMessages.slice(-4).map((msg) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div
                            key={msg.id}
                            className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                              isAdmin
                                ? 'bg-white text-slate-800 self-start border border-slate-200 shadow-2xs'
                                : 'bg-indigo-600 text-white self-end shadow-2xs'
                            }`}
                          >
                            <span className={`block font-bold text-[10px] mb-0.5 ${isAdmin ? 'text-indigo-600' : 'text-indigo-100'}`}>
                              {isAdmin ? 'Admin' : msg.senderName}
                            </span>
                            <p className="leading-relaxed">{msg.text}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSideChatSend} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Tanya Admin..."
                      value={sideChatText}
                      onChange={(e) => setSideChatText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-400 focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-colors shrink-0"
                      title="Kirim pesan"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </section>

                {/* Bento Tile 4: Metode Pembayaran */}
                <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                      Metode Pembayaran
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 border border-slate-200/60">
                        DANA
                      </span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 border border-slate-200/60">
                        GOPAY
                      </span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 border border-slate-200/60">
                        BANK TRANSFER VA
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic mt-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Pembayaran diverifikasi otomatis secara real-time.</span>
                  </p>
                </section>

                {/* Bento Tile 5: Install ke HP & Bagikan */}
                <section
                  onClick={() => setIsInstallShareOpen(true)}
                  className="bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-3xl border border-indigo-200/80 p-5 sm:p-6 shadow-xs flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-200/60 px-2 py-0.5 rounded-full w-fit mb-1.5">
                      PWA Android & Share
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-900 transition-colors">
                      Install ke HP & Bagikan
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Pasang langsung di layar HP Android & bagikan link katalog ke WhatsApp.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-colors ml-3">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </section>
              </div>
            </div>
          </main>
        )}

        {/* TAB 2: JADI PENJUAL (Quick Register or Manage) */}
        {activeTab === 'jadi_penjual' && (
          <main className="flex-1 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs">
            <MyProductsView
              products={products}
              seller={seller}
              rememberedSeller={rememberedSeller}
              onRestoreSeller={(restored) => {
                setSeller(restored);
                triggerRealtimeNotification(
                  'Toko Berhasil Dipulihkan!',
                  `Selamat datang kembali, ${restored.storeName}! Semua produk jualan Anda siap dikelola.`,
                  'system'
                );
              }}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenSellerModal={() => setIsSellerAuthOpen(true)}
              onSelectProduct={(p) => setSelectedProductDetail(p)}
              onDeleteProduct={handleDeleteProduct}
              onUpdateStock={handleUpdateStock}
              onClaimSampleProducts={handleClaimSampleProducts}
              onImportProducts={handleImportProducts}
              onBulkAddStock={handleBulkAddStock}
            />
          </main>
        )}

        {/* TAB 3: PRODUK SAYA (Seller inventory & uploads up to 50MB) */}
        {activeTab === 'produk_saya' && (
          <main className="flex-1 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs">
            <MyProductsView
              products={products}
              seller={seller}
              rememberedSeller={rememberedSeller}
              onRestoreSeller={(restored) => {
                setSeller(restored);
                triggerRealtimeNotification(
                  'Toko Berhasil Dipulihkan!',
                  `Selamat datang kembali, ${restored.storeName}! Semua produk jualan Anda siap dikelola.`,
                  'system'
                );
              }}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenSellerModal={() => setIsSellerAuthOpen(true)}
              onSelectProduct={(p) => setSelectedProductDetail(p)}
              onDeleteProduct={handleDeleteProduct}
              onUpdateStock={handleUpdateStock}
              onClaimSampleProducts={handleClaimSampleProducts}
              onImportProducts={handleImportProducts}
              onBulkAddStock={handleBulkAddStock}
            />
          </main>
        )}

        {/* TAB 4: PESANAN & TRANSAKSI OTOMATIS */}
        {activeTab === 'pesanan' && (
          <main className="flex-1 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs">
            <OrdersView
              orders={orders}
              onSelectOrder={(ord) => {
                setActiveReceiptOrder(ord);
                setIsReceiptOpen(true);
              }}
              onOpenAdminChat={() => setIsAdminChatOpen(true)}
            />
          </main>
        )}

        {/* Bento Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Real-time Sync Active
            </span>
            <span className="w-[1px] h-3 bg-slate-200 hidden sm:inline" />
            <span className="hidden sm:inline">V 1.0.4 - Marketplace Tech Edition</span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">
            &copy; 2024 GadgetHub &bull; Admin: {ADMIN_PHONE}
          </div>
        </footer>

        {/* Floating Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAdminChat={() => {
            setSelectedProductForChat(null);
            setIsAdminChatOpen(true);
          }}
          unreadChatCount={0}
          unreadOrderCount={orders.filter((o) => o.status === 'PEMBAYARAN_BERHASIL').length}
          isSeller={!!seller}
        />
      </div>

      {/* MODALS */}

      {/* 1. Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onCheckout={(prod) => {
          setSelectedProductForCheckout(prod);
          setIsCheckoutOpen(true);
        }}
        onChatAdmin={(prod) => {
          setSelectedProductForChat(prod);
          setIsAdminChatOpen(true);
        }}
      />

      {/* 2. Upload Product Modal (Support up to 50 MB photos!) */}
      <UploadProductModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        seller={seller}
        rememberedSeller={rememberedSeller}
        onAddProduct={handleAddProduct}
        onSaveSeller={(newSeller) => {
          setSeller(newSeller);
          triggerRealtimeNotification(
            'Toko Berhasil Didaftarkan!',
            `Toko ${newSeller.storeName} telah aktif dan barang berhasil ditambahkan.`,
            'system'
          );
        }}
      />

      {/* 3. Seller Auth Modal (Simple registration: Only Nama Toko & Nomor Telepon, no Google!) */}
      <SellerAuthModal
        isOpen={isSellerAuthOpen}
        onClose={() => setIsSellerAuthOpen(false)}
        currentSeller={seller}
        rememberedSeller={rememberedSeller}
        onSaveSeller={(newSeller) => {
          setSeller(newSeller);
          triggerRealtimeNotification(
            'Toko Penjual Aktif!',
            `Selamat datang, ${newSeller.storeName}! Anda sekarang dapat mengunggah foto barang hingga 50 MB.`,
            'system'
          );
          setActiveTab('produk_saya');
        }}
      />

      {/* 4. Buyer Fast Login Modal (Instant, no Google!) */}
      <BuyerAuthModal
        isOpen={isBuyerAuthOpen}
        onClose={() => setIsBuyerAuthOpen(false)}
        currentBuyer={buyer}
        onSaveBuyer={(newBuyer) => {
          setBuyer(newBuyer);
          triggerRealtimeNotification(
            'Login Pembeli Berhasil',
            `Masuk sebagai ${newBuyer.name}. Silakan langsung checkout dengan pembayaran otomatis.`,
            'system'
          );
        }}
      />

      {/* 5. Real-time Admin Chat Modal (Coordination with Admin 087768692417) */}
      <AdminChatModal
        isOpen={isAdminChatOpen}
        onClose={() => setIsAdminChatOpen(false)}
        buyer={buyer}
        targetProduct={selectedProductForChat}
        products={products}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      {/* 6. Checkout & Automatic Payment Modal (Bank Virtual Accounts BCA/Mandiri/BRI/BNI, DANA, GoPay) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={selectedProductForCheckout}
        buyer={buyer}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 7. Payment Receipt / Invoice Modal */}
      <PaymentReceiptModal
        order={activeReceiptOrder}
        onClose={() => setIsReceiptOpen(false)}
        onViewOrders={() => {
          setIsReceiptOpen(false);
          setActiveTab('pesanan');
        }}
        onUpdateOrder={(updated) => {
          setActiveReceiptOrder(updated);
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        }}
      />

      {/* 8. Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onTestNotification={() => {
          triggerRealtimeNotification(
            'Tes Notifikasi Suara Transaksi',
            'Sistem notifikasi real-time aktif dengan suara lonceng otomatis.',
            'system'
          );
        }}
      />

      {/* 9. Admin Dashboard Modal (For Admin 087768692417 to manage transactions and chats) */}
      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        orders={orders}
        products={products}
        messages={chatMessages}
        onAdminReplyChat={handleAdminReplyChat}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* 10. Install Android & Share Modal */}
      <InstallShareModal
        isOpen={isInstallShareOpen}
        onClose={() => setIsInstallShareOpen(false)}
        publicAppUrl="https://ais-pre-ftfl6wyptkb4k5o2k6xy7t-380068474786.asia-southeast1.run.app"
      />
    </div>
  );
}
