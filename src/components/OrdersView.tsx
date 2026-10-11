import React from 'react';
import { Order } from '../types';
import { formatRupiah, formatDateTime, ADMIN_PHONE, createWhatsAppUrl } from '../utils/formatters';
import { Receipt, Clock, CheckCircle2, Truck, ShieldCheck, MessageCircle, FileText } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onOpenAdminChat: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onSelectOrder,
  onOpenAdminChat,
}) => {
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PEMBAYARAN_BERHASIL':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lunas (Diproses Admin)</span>
          </span>
        );
      case 'DIKIRIM':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Sedang Dikirim</span>
          </span>
        );
      case 'SELESAI':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Selesai</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Menunggu Bayar</span>
          </span>
        );
    }
  };

  return (
    <div className="px-4 py-3 space-y-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Riwayat Pesanan & Transaksi</h2>
          <p className="text-xs text-slate-500">
            Transfer Manual Rekening Bank & E-Wallet
          </p>
        </div>
        <button
          onClick={onOpenAdminChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold"
        >
          <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Bantuan Admin</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Belum Ada Transaksi</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Pilih laptop, handphone, atau gadget di katalog dan klik "Checkout" untuk melakukan pembayaran otomatis.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="font-mono font-bold text-slate-900">{order.invoiceNumber}</span>
                {getStatusBadge(order.status)}
              </div>

              <div className="flex items-center gap-3">
                {order.product.images?.[0] && (
                  <img
                    src={order.product.images[0]}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {order.product.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">Toko: {order.product.sellerName}</p>
                  <p className="text-sm font-extrabold text-[#006699] mt-0.5">
                    {formatRupiah(order.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="truncate max-w-[150px]">{order.paymentMethodName}</span>
                  {order.transferProofUrl ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ✓ Struk Diunggah
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Belum Upload Struk
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 font-semibold text-indigo-600">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lihat Invoice</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
