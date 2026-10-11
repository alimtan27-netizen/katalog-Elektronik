import React, { useState, useRef } from 'react';
import { Order } from '../types';
import { formatRupiah, formatDateTime, ADMIN_PHONE, openWhatsAppDirect, createWhatsAppUrl } from '../utils/formatters';
import { processAndCompressImage } from '../utils/imageCompressor';
import { CheckCircle2, ShieldCheck, Printer, MessageCircle, X, Package, Building2, Image as ImageIcon, Eye, Upload } from 'lucide-react';

interface PaymentReceiptModalProps {
  order: Order | null;
  onClose: () => void;
  onViewOrders: () => void;
  onUpdateOrder?: (updated: Order) => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  order,
  onClose,
  onViewOrders,
  onUpdateOrder,
}) => {
  const [zoomProof, setZoomProof] = useState(false);
  const [currentProof, setCurrentProof] = useState<string | undefined>(order?.transferProofUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!order) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomProof) {
          setZoomProof(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [order, zoomProof, onClose]);

  if (!order) return null;

  const proof = currentProof || order.transferProofUrl;

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await processAndCompressImage(file);
      setCurrentProof(res.dataUrl);
      const updated: Order = {
        ...order,
        transferProofUrl: res.dataUrl,
      };
      if (onUpdateOrder) {
        onUpdateOrder(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses foto bukti transfer');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const waText = `Halo Admin (${ADMIN_PHONE}), saya sudah menyelesaikan transfer manual untuk pesanan:\n\n*Invoice: ${order.invoiceNumber}*\nBarang: ${order.product.title}\nJumlah: ${order.quantity || 1} Unit\nTotal Transfer: ${formatRupiah(order.totalAmount)}\n\n*Rekening / Akun Tujuan:*\n${order.paymentMethodName}\nNo. Rekening: ${order.accountOrVaNumber}\nA/N: ${order.accountHolder || '-'}\n\n*Bukti Transfer:* ${proof ? 'Sudah diunggah di aplikasi (foto struk juga saya lampirkan di pesan ini).' : 'Foto struk bukti transfer saya lampirkan di chat ini.'}\n\n*Penerima:*\nNama: ${order.buyerName} (${order.buyerPhone})\nAlamat: ${order.shippingAddress}\n\nMohon bantu verifikasi dan proses pengiriman ke penjual (${order.product.sellerName}). Terima kasih!`;
  const waUrl = createWhatsAppUrl(waText);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 cursor-default"
      >
        {/* Success Banner */}
        <div className="p-6 bg-gradient-to-b from-emerald-600 to-emerald-700 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">Pesanan Berhasil Dicatat!</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Transaksi transfer manual dikoordinasikan langsung oleh Admin resmi
          </p>
        </div>

        {/* Receipt Details Body */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Invoice ID & Date */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
            <div>
              <span className="text-slate-400 block">Nomor Invoice</span>
              <span className="font-mono font-bold text-slate-800">{order.invoiceNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Waktu Transaksi</span>
              <span className="font-medium text-slate-700">
                {order.paidAt ? formatDateTime(order.paidAt) : formatDateTime(order.createdAt)}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
            {order.product.images?.[0] && (
              <img
                src={order.product.images[0]}
                alt=""
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{order.product.title}</p>
              <p className="text-xs text-slate-500">Toko: {order.product.sellerName}</p>
              <p className="text-sm font-extrabold text-[#006699] mt-0.5">
                {formatRupiah(order.totalAmount)} {order.quantity && order.quantity > 1 ? `(${order.quantity} Unit)` : ''}
              </p>
            </div>
          </div>

          {/* Payment & Shipping Summary */}
          <div className="space-y-2 text-xs bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/60">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tujuan Transfer</span>
              <span className="font-bold text-slate-800">{order.paymentMethodName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nomor Rekening</span>
              <span className="font-mono font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {order.accountOrVaNumber}
              </span>
            </div>
            {order.accountHolder && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Atas Nama (A/N)</span>
                <span className="font-semibold text-slate-800">{order.accountHolder}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status Transaksi</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Lunas & Dikoordinasikan Admin
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Penerima</span>
              <span className="font-semibold text-slate-800">{order.buyerName} ({order.buyerPhone})</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 block mb-0.5">Alamat Pengiriman:</span>
              <p className="font-medium text-slate-700 leading-snug">{order.shippingAddress}</p>
            </div>
          </div>

          {/* Bukti Transfer / Struk Section */}
          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-700" />
                <span>Bukti Transfer / Struk</span>
              </span>
              {proof ? (
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Terlampir
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Belum Diunggah
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadProof}
              className="hidden"
            />

            {proof ? (
              <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-indigo-100">
                <img
                  src={proof}
                  alt="Bukti Transfer"
                  onClick={() => setZoomProof(true)}
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-90"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">Foto Struk Pembayaran</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setZoomProof(true)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Lihat Penuh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      Ganti Foto
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-2.5 px-3 border border-dashed border-indigo-300 hover:border-indigo-500 bg-white rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer text-indigo-700 font-bold"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Sedang Memproses...' : 'Unggah Foto Bukti Transfer Sekarang'}</span>
              </button>
            )}
          </div>

          {/* Admin Safe Custody Notice */}
          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs text-slate-700 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Dana Anda dikoordinasikan aman oleh Admin pembuat aplikasi ({ADMIN_PHONE}). Penjual akan langsung diberitahu untuk menyiapkan dan mengirimkan barang pesanan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <a
              id="konfirmasi-wa-receipt-btn"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 touch-manipulation cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Konfirmasi ke WhatsApp Admin ({ADMIN_PHONE})</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrint}
                className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Invoice</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onViewOrders();
                }}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Lihat Pesanan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Zoom Bukti Transfer */}
        {zoomProof && proof && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
            onClick={() => setZoomProof(false)}
          >
            <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Foto Bukti Transfer ({order.invoiceNumber})</span>
                <button
                  type="button"
                  onClick={() => setZoomProof(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto p-2 flex items-center justify-center bg-slate-950">
                <img
                  src={proof}
                  alt="Bukti Transfer Penuh"
                  className="max-h-[65vh] w-auto object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

