import React, { useState } from 'react';
import { Product } from '../types';
import { formatRupiah, ADMIN_PHONE, openWhatsAppDirect, createWhatsAppUrl } from '../utils/formatters';
import { getCategoryFallbackImage } from '../utils/db';
import { X, ShieldCheck, MapPin, Store, Zap, MessageSquare, Phone, CheckCircle2, ChevronRight } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onCheckout: (product: Product) => void;
  onChatAdmin: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onCheckout,
  onChatAdmin,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  React.useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[activeImageIndex] || '';

  const productWaText = `Halo Admin (${ADMIN_PHONE}), saya berminat membeli barang ini melalui sistem transaksi aman Katalog Elektronik:\n\n*${product.title}*\nHarga: ${formatRupiah(product.price)}\nKondisi: ${product.condition}\nPenjual: ${product.sellerName}\n\nMohon info ketersediaan dan panduan transfer manual. Terima kasih.`;
  const productWaUrl = createWhatsAppUrl(productWaText);

  const handleWhatsApp = () => {
    openWhatsAppDirect(productWaText);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer notranslate"
      translate="no"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {product.category}
            </span>
            <span className="text-xs font-medium text-slate-500">ID: {product.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer touch-manipulation shadow-2xs"
            title="Tutup (Keluar)"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Main Photo Gallery */}
          <div className="space-y-2.5">
            <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = getCategoryFallbackImage(product.category);
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
              ) : (
                <div className="text-center text-slate-400 p-6">
                  <p className="text-sm">Foto belum tersedia</p>
                </div>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/95 text-slate-900 shadow-sm border border-slate-200">
                  {product.condition}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Stok {product.status}</span>
                </span>
              </div>
            </div>

            {/* Thumbnails if multiple images */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx ? 'border-blue-600 scale-105' : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumb ${idx}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = getCategoryFallbackImage(product.category);
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing and Title */}
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatRupiah(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-slate-400 line-through font-medium">
                  {formatRupiah(product.originalPrice)}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-1 leading-snug">
              {product.title}
            </h2>

            {/* Stock indicator badge */}
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                (product.stock ?? 1) > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {(product.stock ?? 1) > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Stok Tersedia: {product.stock ?? 1} Unit</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Stok Habis (Menunggu Penjual Menambah Stok)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Admin Transaction Protection Banner */}
          <div className="p-3.5 bg-blue-50/90 rounded-2xl border border-blue-200 text-xs text-slate-700 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-slate-900">Transaksi Dijamin & Dikoordinasikan Admin</p>
              <p className="mt-0.5 text-slate-600 leading-relaxed">
                Pembeli tidak perlu transfer langsung ke rekening penjual. Dana disimpan aman di sistem oleh Admin pembuat aplikasi ({ADMIN_PHONE}) sampai barang sampai dan dicek pembeli.
              </p>
            </div>
          </div>

          {/* Seller details with direct WhatsApp & public status */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{product.sellerName}</p>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    🌐 Publik
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {product.location}
                  </span>
                  <span>•</span>
                  <span>WA: {product.sellerPhone || 'Hubungi Admin'}</span>
                </div>
              </div>
            </div>

            {product.sellerPhone && (
              <a
                href={`https://wa.me/${product.sellerPhone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(
                  `Halo Penjual ${product.sellerName}, saya melihat postingan Anda "${product.title}" di Katalog Elektronik. Apakah barang ini masih tersedia?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <span>Chat WA Penjual</span>
              </a>
            )}
          </div>

          {/* Specifications */}
          {product.specs && product.specs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Spesifikasi Utama
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                    <span className="font-medium">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Deskripsi Barang
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
              {product.description}
            </p>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200 cursor-pointer"
              title="Tutup detail produk"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onChatAdmin(product);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-colors border border-indigo-200"
              title="Chat dengan Admin dalam aplikasi"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Chat Admin</span>
            </button>

            <a
              id="detail-wa-btn"
              href={productWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors border border-emerald-200 touch-manipulation cursor-pointer"
              title="Hubungi Admin di WhatsApp Resmi"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Admin</span>
            </a>
          </div>

          <button
            id="modal-checkout-btn"
            disabled={(product.stock ?? 1) <= 0}
            onClick={() => {
              if ((product.stock ?? 1) > 0) {
                onClose();
                onCheckout(product);
              }
            }}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-xs ${
              (product.stock ?? 1) <= 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>
              {(product.stock ?? 1) <= 0
                ? 'Stok Habis (Tidak Tersedia)'
                : 'Beli Sekarang (Otomatis Bank / DANA / GoPay)'}
            </span>
            {(product.stock ?? 1) > 0 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
