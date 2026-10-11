import React, { useState } from 'react';
import { BuyerProfile } from '../types';
import { User, Phone, X, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface BuyerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBuyer: (buyer: BuyerProfile) => void;
  currentBuyer: BuyerProfile | null;
}

export const BuyerAuthModal: React.FC<BuyerAuthModalProps> = ({
  isOpen,
  onClose,
  onSaveBuyer,
  currentBuyer,
}) => {
  const [name, setName] = useState(currentBuyer?.name || '');
  const [phone, setPhone] = useState(currentBuyer?.phone || '');

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

  const handleSave = (buyerName: string, buyerPhone: string) => {
    const buyer: BuyerProfile = {
      name: buyerName.trim() || 'Pembeli Tamu',
      phone: buyerPhone.trim() || '0812XXXXXXXX',
    };
    onSaveBuyer(buyer);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Mohon masukkan nama Anda.');
      return;
    }
    handleSave(name, phone);
  };

  const handleQuickGuest = () => {
    const randomGuestId = Math.floor(1000 + Math.random() * 9000);
    handleSave(`Pembeli #${randomGuestId}`, '08XXXXXXXXXX');
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
        <div className="p-5 border-b border-slate-100 bg-blue-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Login Pembeli Langsung
              </h2>
              <p className="text-xs text-blue-700 font-medium">
                Tanpa Akun Google (Instan & Cepat)
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

        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Anda tidak perlu mendaftar akun Google. Anda bisa langsung belanja, checkout otomatis, dan chat dengan Admin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap / Panggilan Anda *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, Rizky..."
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp / HP (Opsional untuk konfirmasi resi)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#006699] hover:bg-[#005580] text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Lanjut Belanja</span>
            </button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Atau</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickGuest}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-300/80 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Masuk Cepat 1-Klik sebagai Tamu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
