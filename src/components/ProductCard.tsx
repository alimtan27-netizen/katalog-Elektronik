import React from 'react';
import { Product } from '../types';
import { formatRupiah, ADMIN_PHONE, createWhatsAppUrl } from '../utils/formatters';
import { getCategoryFallbackImage } from '../utils/db';
import { Camera, MapPin, Store, ShieldCheck, Zap, MessageSquare } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onCheckout: (product: Product) => void;
  onChatAdmin: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onCheckout,
  onChatAdmin,
}) => {
  const hasImage = product.images && product.images.length > 0 && product.images[0].trim() !== '';

  const handleWhatsAppInquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `Halo Admin (${ADMIN_PHONE}), saya tertarik dengan barang:\n\n*${product.title}*\nHarga: ${formatRupiah(product.price)}\nToko: ${product.sellerName}\n\nApakah barang ini masih tersedia dan bisa diproses transaksi aman?`;
    window.open(createWhatsAppUrl(msg), '_blank', 'noopener,noreferrer');
  };

  const handleChatAdminClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChatAdmin(product);
  };

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCheckout(product);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onSelect(product)}
      className="group bg-slate-50/80 hover:bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-200 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer active:scale-[0.99]"
    >
      {/* Product Image Area */}
      <div className="relative w-full aspect-4/3 bg-slate-200/60 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              const fallback = getCategoryFallbackImage(product.category);
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <div className="p-3 bg-slate-200 rounded-full mb-2">
              <Camera className="w-7 h-7 text-slate-400" />
            </div>
            <span className="text-xs font-medium text-slate-500">Foto belum tersedia</span>
          </div>
        )}

        {/* Condition & Public Tag */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/95 text-slate-800 shadow-2xs backdrop-blur-xs border border-slate-200/60">
            {product.condition}
          </span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-700/90 text-white flex items-center gap-1 shadow-2xs backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span>Publik</span>
          </span>
          {product.isVerifiedByAdmin && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-600 text-white flex items-center gap-1 shadow-2xs">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified</span>
            </span>
          )}
        </div>

        {/* Category & Stock badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
            {product.category}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-xs shadow-2xs ${
            (product.stock ?? 1) <= 0 
              ? 'bg-red-600/90 text-white' 
              : 'bg-emerald-600/90 text-white'
          }`}>
            {(product.stock ?? 1) <= 0 ? 'Stok Habis' : `Stok: ${product.stock ?? 1}`}
          </span>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Price matching Bento Grid monospace accent */}
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold font-mono text-indigo-600 tracking-tight">
              {formatRupiah(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatRupiah(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
            {product.title}
          </h3>

          {/* Store & Location */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 truncate max-w-[65%]" title={`Toko Penjual: ${product.sellerName}`}>
              <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate font-semibold text-slate-800">{product.sellerName}</span>
            </div>
            <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
              <MapPin className="w-3 h-3" />
              <span>{product.location}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
          <button
            id={`btn-chat-admin-${product.id}`}
            onClick={handleChatAdminClick}
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors"
            title="Tanya Admin pembuat aplikasi via Chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chat Admin</span>
          </button>

          <button
            id={`btn-checkout-${product.id}`}
            onClick={handleCheckoutClick}
            disabled={(product.stock ?? 1) <= 0}
            className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
              (product.stock ?? 1) <= 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title={(product.stock ?? 1) <= 0 ? 'Stok barang ini sedang habis' : 'Beli dengan Pembayaran Otomatis'}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{(product.stock ?? 1) <= 0 ? 'Habis' : 'Checkout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
