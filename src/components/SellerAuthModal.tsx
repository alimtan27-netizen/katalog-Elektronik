import React, { useState } from 'react';
import { SellerProfile } from '../types';
import { Store, Phone, MapPin, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface SellerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSeller: (seller: SellerProfile) => void;
  currentSeller: SellerProfile | null;
  rememberedSeller?: SellerProfile | null;
}

export const SellerAuthModal: React.FC<SellerAuthModalProps> = ({
  isOpen,
  onClose,
  onSaveSeller,
  currentSeller,
  rememberedSeller,
}) => {
  const initialSeller = currentSeller || rememberedSeller;
  const [storeName, setStoreName] = useState(initialSeller?.storeName || '');
  const [phone, setPhone] = useState(initialSeller?.phone || '');
  const [city, setCity] = useState(initialSeller?.city || 'Jakarta');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert('Mohon masukkan Nama Toko Anda.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      alert('Mohon masukkan Nomor Telepon / WhatsApp yang valid.');
      return;
    }

    const seller: SellerProfile = {
      storeName: storeName.trim(),
      phone: phone.trim(),
      city: city.trim() || 'Jakarta',
      joinedAt: currentSeller?.joinedAt || Date.now(),
    };

    onSaveSeller(seller);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200 cursor-default"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-emerald-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {currentSeller ? 'Profil Toko Penjual' : 'Daftar Jadi Penjual'}
              </h2>
              <p className="text-xs text-slate-500">
                Cukup Nama Toko & Nomor Telepon
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="px-5 pt-4 space-y-2.5">
          {rememberedSeller && !currentSeller && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs text-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Toko Sebelumnya</span>
                <p className="font-bold text-slate-900">{rememberedSeller.storeName}</p>
                <p className="text-[11px] text-slate-600">{rememberedSeller.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStoreName(rememberedSeller.storeName);
                  setPhone(rememberedSeller.phone);
                  setCity(rememberedSeller.city || 'Jakarta');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] shadow-xs"
              >
                Gunakan Data
              </button>
            </div>
          )}

          <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-slate-700 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <span className="font-bold text-slate-900">Tanpa akun Google!</span> Penjual langsung bisa jualan dan unggah foto ukuran besar (hingga 50 MB) hanya dengan mendaftarkan nama toko & nomor kontak.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Toko / Penjual *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Store className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Contoh: Toko Berkah Gadget, iShop Jakarta"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Telepon / WhatsApp Penjual *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden font-medium"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Digunakan Admin untuk koordinasi pengiriman & pencairan dana
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kota Asal Toko
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Jakarta Selatan, Surabaya, Bandung"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{currentSeller ? 'Simpan Perubahan' : 'Aktifkan Toko & Mulai Jual'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
