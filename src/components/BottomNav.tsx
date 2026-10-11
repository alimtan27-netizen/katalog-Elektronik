import React from 'react';
import { LayoutGrid, Store, Package, MessageSquare, Receipt } from 'lucide-react';

export type ActiveTab = 'katalog' | 'jadi_penjual' | 'produk_saya' | 'pesanan';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAdminChat: () => void;
  unreadChatCount?: number;
  unreadOrderCount?: number;
  isSeller: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAdminChat,
  unreadChatCount = 0,
  unreadOrderCount = 0,
  isSeller,
}) => {
  return (
    <div className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav
        id="app-bottom-navbar"
        className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200/90 px-3 py-1.5 flex items-center gap-1 sm:gap-2 max-w-md w-full justify-around"
      >
        {/* Katalog button matching screenshot */}
        <button
          id="nav-katalog-btn"
          onClick={() => onSelectTab('katalog')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-center select-none ${
            activeTab === 'katalog'
              ? 'bg-indigo-50 text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Katalog</span>
        </button>

        {/* Jadi Penjual matching screenshot */}
        <button
          id="nav-jadi-penjual-btn"
          onClick={() => onSelectTab('jadi_penjual')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-center select-none ${
            activeTab === 'jadi_penjual'
              ? 'bg-emerald-50 text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">
            {isSeller ? 'Toko Saya' : 'Jadi Penjual'}
          </span>
        </button>

        {/* Produk Saya matching screenshot */}
        <button
          id="nav-produk-saya-btn"
          onClick={() => onSelectTab('produk_saya')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-center select-none ${
            activeTab === 'produk_saya'
              ? 'bg-indigo-50 text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Produk Saya</span>
        </button>

        {/* Chat Admin with live badge */}
        <button
          id="nav-chat-admin-btn"
          onClick={onOpenAdminChat}
          className="relative flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-slate-500 hover:text-indigo-600 font-medium text-center select-none"
          title="Chat langsung dengan Admin pembuat aplikasi"
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Chat Admin</span>
          {unreadChatCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>

        {/* Pesanan / Transaksi */}
        <button
          id="nav-pesanan-btn"
          onClick={() => onSelectTab('pesanan')}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all text-center select-none ${
            activeTab === 'pesanan'
              ? 'bg-indigo-50 text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Pesanan</span>
          {unreadOrderCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </button>
      </nav>
    </div>
  );
};
