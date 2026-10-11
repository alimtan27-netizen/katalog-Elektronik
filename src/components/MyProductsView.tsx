import React, { useState } from 'react';
import { Product, SellerProfile } from '../types';
import { formatRupiah } from '../utils/formatters';
import { isSellerPhoneMatch, isSellerNameMatch, getCategoryFallbackImage } from '../utils/db';
import {
  Plus,
  Package,
  Store,
  Camera,
  Trash2,
  ArrowRight,
  Minus,
  Edit3,
  Check,
  Download,
  Upload,
  ShieldCheck,
  Sparkles,
  Layers,
  CheckCircle2,
  X,
  FileJson,
} from 'lucide-react';

interface MyProductsViewProps {
  products: Product[];
  seller: SellerProfile | null;
  rememberedSeller?: SellerProfile | null;
  onOpenUpload: () => void;
  onOpenSellerModal: () => void;
  onRestoreSeller?: (seller: SellerProfile) => void;
  onSelectProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateStock: (id: string, newStock: number) => void;
  onClaimSampleProducts?: () => void;
  onImportProducts?: (imported: Product[]) => void;
  onBulkAddStock?: (amount: number) => void;
}

export const MyProductsView: React.FC<MyProductsViewProps> = ({
  products,
  seller,
  rememberedSeller,
  onOpenUpload,
  onOpenSellerModal,
  onRestoreSeller,
  onSelectProduct,
  onDeleteProduct,
  onUpdateStock,
  onClaimSampleProducts,
  onImportProducts,
  onBulkAddStock,
}) => {
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [customStockValue, setCustomStockValue] = useState<string>('');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  if (!seller) {
    // Check if there is a remembered seller or custom products created on this device
    const customDeviceProducts = (products || []).filter((p) => p?.id?.startsWith('prod-custom-'));

    return (
      <div className="p-4 sm:p-6 max-w-lg mx-auto my-6 space-y-5">
        {rememberedSeller ? (
          <div className="p-5 bg-emerald-50 rounded-3xl border-2 border-emerald-300 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Toko Terdaftar Ditemukan
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1.5">{rememberedSeller.storeName}</h2>
              <p className="text-xs text-slate-600 font-mono mt-0.5">{rememberedSeller.phone} • {rememberedSeller.city || 'Indonesia'}</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda sempat keluar dari sesi toko ini. Semua data produk jualan Anda tetap aman tersimpan di sistem.
            </p>
            <button
              onClick={() => onRestoreSeller && onRestoreSeller(rememberedSeller)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Masuk Kembali ke Toko {rememberedSeller.storeName}</span>
            </button>
          </div>
        ) : null}

        <div className="p-6 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-3xl flex items-center justify-center mx-auto border border-slate-200">
            <Store className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {rememberedSeller ? 'Atau Buka Toko Baru' : 'Belum Terdaftar sebagai Penjual'}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Daftarkan toko Anda hanya dengan Nama Toko & Nomor Telepon (tanpa akun Google) untuk mulai mengunggah foto barang & menentukan jumlah stok banyak.
          </p>
          <div className="pt-1 flex flex-col gap-2">
            <button
              onClick={onOpenSellerModal}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>{rememberedSeller ? 'Daftar Toko Lain' : 'Daftar Toko & Mulai Jual'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenUpload}
              className="w-full py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-emerald-200"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Langsung Unggah Foto & Produk</span>
            </button>
          </div>
        </div>

        {customDeviceProducts.length > 0 && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-center space-y-2">
            <p className="text-xs text-emerald-900">
              Ditemukan <span className="font-bold text-emerald-950">{customDeviceProducts.length} produk</span> yang pernah Anda buat di perangkat ini.
            </p>
            {customDeviceProducts[0].sellerName && (
              <button
                onClick={() => {
                  const autoProfile: SellerProfile = {
                    storeName: customDeviceProducts[0].sellerName,
                    phone: customDeviceProducts[0].sellerPhone || '081234567890',
                    city: customDeviceProducts[0].location || 'Indonesia',
                    joinedAt: Date.now(),
                  };
                  onRestoreSeller && onRestoreSeller(autoProfile);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <Store className="w-4 h-4" />
                <span>Pulihkan Toko "{customDeviceProducts[0].sellerName}"</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Indonesian-aware flexible phone & store name matching
  const myProducts = (products || []).filter((p) => {
    if (!p) return false;
    const phoneMatch = isSellerPhoneMatch(seller.phone, p.sellerPhone);
    const nameMatch = isSellerNameMatch(seller.storeName, p.sellerName);
    return phoneMatch || nameMatch;
  });

  const totalUnits = myProducts.reduce((sum, p) => sum + (p.stock ?? 1), 0);

  const handleStartEditStock = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStockId(prod.id);
    setCustomStockValue(String(prod.stock ?? 1));
  };

  const handleSaveCustomStock = (id: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    const val = parseInt(customStockValue, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateStock(id, val);
    }
    setEditingStockId(null);
  };

  // Export inventory to downloadable file
  const handleExportBackup = () => {
    const backupData = {
      seller,
      products: myProducts,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stok-toko-${seller.storeName.replace(/\s+/g, '_')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupSuccessMessage('File cadangan data stok berhasil diunduh!');
    setTimeout(() => setBackupSuccessMessage(null), 4000);
  };

  // Copy JSON backup to clipboard
  const handleCopyBackupText = () => {
    const backupData = {
      seller,
      products: myProducts,
      exportedAt: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(backupData));
    setBackupSuccessMessage('Teks cadangan berhasil disalin ke clipboard!');
    setTimeout(() => setBackupSuccessMessage(null), 4000);
  };

  // Import JSON backup
  const handleProcessImport = () => {
    if (!importJsonText.trim()) {
      alert('Tempelkan teks JSON cadangan terlebih dahulu.');
      return;
    }
    try {
      const parsed = JSON.parse(importJsonText);
      const incomingProducts: Product[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.products)
        ? parsed.products
        : [];

      if (incomingProducts.length === 0) {
        alert('Tidak ada produk yang valid dalam file/teks cadangan tersebut.');
        return;
      }

      if (onImportProducts) {
        onImportProducts(incomingProducts);
      }
      setShowBackupModal(false);
      setImportJsonText('');
      setBackupSuccessMessage(`Berhasil memulihkan ${incomingProducts.length} produk ke etalase toko!`);
      setTimeout(() => setBackupSuccessMessage(null), 4000);
    } catch (e) {
      alert('Format teks cadangan tidak valid. Pastikan format JSON benar.');
    }
  };

  return (
    <div className="px-4 py-3 space-y-4 pb-24">
      {/* Public Marketplace Sync Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 shadow-2xs">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            <strong className="font-bold text-emerald-950">🌐 Terhubung ke Katalog Publik:</strong> Semua foto & produk Anda otomatis tayang dan dapat dilihat oleh semua pembeli & penjual lain di HP masing-masing.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowBackupModal(true)}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-950 underline"
          >
            Cadangkan
          </button>
        </div>
      </div>

      {backupSuccessMessage && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{backupSuccessMessage}</span>
        </div>
      )}

      {/* Seller info card */}
      <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
            Etalase Toko Anda
          </span>
          <h2 className="text-lg font-extrabold">{seller.storeName}</h2>
          <p className="text-xs text-emerald-100 font-mono mt-0.5">
            {seller.phone} • {seller.city || 'Indonesia'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
              {myProducts.length} Jenis Produk
            </span>
            <span className="text-[11px] bg-emerald-400/30 text-emerald-100 px-2.5 py-0.5 rounded-full font-extrabold">
              Total {totalUnits} Unit Stok
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 items-end">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-colors shadow flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jualan</span>
          </button>

          <button
            onClick={() => setShowBackupModal(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-800/60 hover:bg-emerald-800 text-white text-[10px] font-semibold transition-colors flex items-center gap-1"
            title="Cadangkan atau Pulihkan Stok"
          >
            <Download className="w-3 h-3" />
            <span>Cadangkan Data</span>
          </button>
        </div>
      </div>

      {/* Header row with bulk stock option */}
      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Daftar Barang & Stok ({myProducts.length})
          </h3>
          <span className="text-[11px] text-emerald-700 font-medium">Bisa Tambah Stok Tanpa Batas</span>
        </div>

        {myProducts.length > 0 && onBulkAddStock && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Tambah Semua:</span>
            <button
              onClick={() => onBulkAddStock(5)}
              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-all shadow-2xs"
              title="Tambah 5 unit ke semua produk toko Anda"
            >
              +5 Semua
            </button>
            <button
              onClick={() => onBulkAddStock(10)}
              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-all shadow-2xs"
              title="Tambah 10 unit ke semua produk toko Anda"
            >
              +10 Semua
            </button>
          </div>
        )}
      </div>

      {myProducts.length === 0 ? (
        <div className="text-center py-10 p-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto shadow-xs">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Belum Ada Barang di Toko {seller.storeName}</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
              Etalase Anda masih kosong. Anda dapat menambahkan produk jualan baru dengan foto & stok banyak, atau langsung mengisi etalase dari contoh barang siap jual.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 max-w-md mx-auto">
            {onClaimSampleProducts && (
              <button
                onClick={onClaimSampleProducts}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>Isi Etalase Toko {seller.storeName} (Stok 10 Unit)</span>
              </button>
            )}

            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Foto & Barang Sendiri</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowBackupModal(true)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 underline"
            >
              Punya file cadangan? Pulihkan data stok lama di sini
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {myProducts.map((prod) => {
            const currentStock = prod.stock ?? 1;
            const isOutOfStock = currentStock <= 0;

            return (
              <div
                key={prod.id}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between gap-3 hover:border-indigo-200 transition-all"
              >
                {/* Product Header Row */}
                <div className="flex items-start gap-3 justify-between">
                  <div
                    onClick={() => onSelectProduct(prod)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    {prod.images?.[0] ? (
                      <img
                        src={prod.images[0]}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getCategoryFallbackImage(prod.category);
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
                        No Pic
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {prod.category}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                          🌐 Tayang Publik
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : currentStock <= 2
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOutOfStock ? 'Stok Habis' : `Stok: ${currentStock} Unit`}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate mt-1">
                        {prod.title}
                      </h4>
                      <p className="text-xs font-extrabold text-[#006699]">
                        {formatRupiah(prod.price)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteProduct(prod.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    title="Hapus barang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock Controls (Tambah Stok yang Banyak) */}
                <div className="pt-2 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-bold text-slate-700">Kelola Stok:</span>
                  </div>

                  {editingStockId === prod.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={customStockValue}
                        onChange={(e) => setCustomStockValue(e.target.value)}
                        className="w-18 px-2 py-1.5 text-xs font-bold rounded-xl border border-indigo-400 text-center bg-white outline-hidden shadow-2xs"
                        autoFocus
                      />
                      <button
                        onClick={(e) => handleSaveCustomStock(prod.id, e)}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-2xs transition-colors"
                        title="Simpan Stok"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Stepper buttons with larger touch targets */}
                      <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStock(prod.id, Math.max(0, currentStock - 1));
                          }}
                          className="w-8 h-8 sm:w-9 sm:h-9 hover:bg-slate-100 flex items-center justify-center text-slate-700 active:bg-slate-200 transition-colors"
                          title="Kurangi 1 Stok"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleStartEditStock(prod, e)}
                          className="px-2.5 py-1 text-xs font-extrabold text-slate-900 hover:bg-indigo-50/50 transition-colors flex items-center gap-1"
                          title="Klik untuk ketik angka stok langsung"
                        >
                          <span>{currentStock}</span>
                          <Edit3 className="w-2.5 h-2.5 text-slate-400" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStock(prod.id, currentStock + 1);
                          }}
                          className="w-8 h-8 sm:w-9 sm:h-9 hover:bg-indigo-50 flex items-center justify-center text-indigo-700 active:bg-indigo-100 transition-colors"
                          title="Tambah 1 Stok"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick +5, +10, +20 buttons for adding lots of stock in 1 tap */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStock(prod.id, currentStock + 5);
                        }}
                        className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 text-xs font-bold text-emerald-800 transition-colors shadow-2xs"
                        title="Tambah +5 Unit Langsung"
                      >
                        +5
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStock(prod.id, currentStock + 10);
                        }}
                        className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 text-xs font-bold text-emerald-800 transition-colors shadow-2xs"
                        title="Tambah +10 Unit Langsung"
                      >
                        +10
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prominent Add Product Button at bottom of products list */}
      {myProducts.length > 0 && (
        <div className="pt-1">
          <button
            onClick={onOpenUpload}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>+ Tambah Barang / Produk Jualan Baru</span>
          </button>
        </div>
      )}

      {/* Modal Backup & Restore Stok */}
      {showBackupModal && (
        <div
          onClick={() => setShowBackupModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-5 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Cadangkan & Pulihkan Stok</h3>
              </div>
              <button
                onClick={() => setShowBackupModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Jaga data jualan dan stok toko Anda agar tidak hilang saat berganti browser atau membersihkan cache HP.
            </p>

            {/* Export Section */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                1. Simpan Cadangan Stok Sekarang
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportBackup}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File (.json)</span>
                </button>
                <button
                  onClick={handleCopyBackupText}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors"
                >
                  Salin Teks
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                2. Pulihkan dari Data Cadangan
              </span>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Tempelkan isi teks JSON cadangan di sini..."
                rows={3}
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden bg-white"
              />
              <button
                onClick={handleProcessImport}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pulihkan Stok ke Toko</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
