import React, { useState } from 'react';
import { Search, Bell, ShieldCheck, User, Store, LogOut, Check, Smartphone, Share2, AlertTriangle, X } from 'lucide-react';
import { SellerProfile, BuyerProfile } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  seller: SellerProfile | null;
  buyer: BuyerProfile | null;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenBuyerModal: () => void;
  onOpenSellerModal: () => void;
  onLogoutSeller: () => void;
  onOpenAdminDashboard: () => void;
  onOpenInstallShare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  seller,
  buyer,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenBuyerModal,
  onOpenSellerModal,
  onLogoutSeller,
  onOpenAdminDashboard,
  onOpenInstallShare,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  return (
    <header className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs transition-all">
      {/* Top row with brand emblem, user info, admin support & quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xs shrink-0">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
                Gadget<span className="text-indigo-600">Hub</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 hidden sm:inline-block">
                Katalog Elektronik
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Publik Live</span>
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Pilihan pasar &bull; Marketplace Tech Edition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {/* Admin Support Hotline matching Bento Grid design */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Admin Support
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-indigo-600">
              0877-6869-2417
            </span>
          </div>

          <div className="flex items-center gap-2">
            {seller ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-xl border border-emerald-200">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold truncate max-w-[120px] sm:max-w-[140px]">{seller.storeName}</span>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  title="Keluar dari Toko"
                  className="hover:text-red-600 ml-1 p-0.5 rounded"
                >
                  <LogOut className="w-3 h-3 text-slate-400 hover:text-red-500 transition-colors" />
                </button>
              </div>
            ) : buyer ? (
              <div
                onClick={onOpenBuyerModal}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-800 text-xs px-3 py-1.5 rounded-xl border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors"
                title="Klik untuk ganti data pembeli"
              >
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold truncate max-w-[110px] sm:max-w-[130px]">{buyer.name}</span>
                <span className="text-[10px] text-indigo-600 bg-white px-1.5 py-0.5 rounded font-medium">Pembeli</span>
              </div>
            ) : (
              <button
                id="buyer-quick-login-btn"
                onClick={onOpenBuyerModal}
                className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                Login Instan
              </button>
            )}

            <button
              id="install-share-btn"
              onClick={onOpenInstallShare}
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-2xs transition-all cursor-pointer"
              title="Kirim Link Aplikasi ke WhatsApp atau Salin Tautan"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>Bagi Link</span>
            </button>

            <button
              id="admin-hotline-quick-btn"
              onClick={onOpenAdminDashboard}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
              title="Kelola Transaksi & Chat sebagai Admin"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span className="hidden md:inline">Mode Admin</span>
            </button>

            <button
              id="notification-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200/60"
              title="Notifikasi Transaksi Real-time"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar with Bento Grid styling */}
      <div className="mt-3 relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <input
          id="katalog-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari smartphone, laptop, kamera, aksesoris..."
          className="w-full pl-10 sm:pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Confirmation Modal to prevent accidental logout */}
      {showLogoutConfirm && seller && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-5 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Keluar dari Toko {seller.storeName}?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Produk jualan Anda tetap <span className="font-semibold text-emerald-600">aman tersimpan</span> dan tidak akan hilang. Anda bisa masuk kembali kapan saja.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Batal (Tetap Masuk)
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogoutSeller();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
