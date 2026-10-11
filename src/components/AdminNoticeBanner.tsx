import React from 'react';
import { ShieldCheck, MessageCircle, MessageSquare } from 'lucide-react';
import { ADMIN_PHONE, createWhatsAppUrl, openWhatsAppDirect } from '../utils/formatters';

interface AdminNoticeBannerProps {
  onOpenChat: () => void;
}

export const AdminNoticeBanner: React.FC<AdminNoticeBannerProps> = ({ onOpenChat }) => {
  const defaultText = `Halo Admin (${ADMIN_PHONE}), saya ingin konsultasi barang dan transaksi di Katalog Elektronik.`;
  const waUrl = createWhatsAppUrl(defaultText);

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openWhatsAppDirect(defaultText);
  };

  return (
    <div
      id="admin-coordination-banner"
      className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 shadow-2xs text-slate-800 transition-all hover:shadow-xs"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
              Transaksi dikoordinasikan Admin
            </h2>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Tidak ada chat antar pengguna. Untuk membeli, hubungi Admin melalui WhatsApp resmi.
          </p>

          {/* Direct WhatsApp Action Button matching screenshot */}
          <div className="mt-3.5 flex flex-col gap-2">
            <a
              id="hubungi-admin-wa-banner-btn"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="w-full py-3 px-4 rounded-xl bg-[#006699] hover:bg-[#005580] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all touch-manipulation cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current text-emerald-300 shrink-0" />
              <span>Hubungi Admin (WhatsApp {ADMIN_PHONE})</span>
            </a>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Nomor Resmi: <strong className="text-slate-700 font-mono">{ADMIN_PHONE}</strong></span>
              <button
                type="button"
                onClick={onOpenChat}
                className="text-[#006699] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Atau Chat di Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
