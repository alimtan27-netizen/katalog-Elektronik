import React, { useState } from 'react';
import { Order, Product, ChatMessage, ManualBankAccount } from '../types';
import { ADMIN_PHONE, formatRupiah, formatDateTime, openWhatsAppDirect } from '../utils/formatters';
import { getInitialBankAccounts, saveBankAccountsToStorage } from '../utils/bankAccounts';
import {
  ShieldCheck,
  X,
  CreditCard,
  MessageSquare,
  Package,
  CheckCircle,
  CheckCircle2,
  Truck,
  Send,
  Phone,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  Image as ImageIcon,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  products: Product[];
  messages: ChatMessage[];
  onAdminReplyChat: (text: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status'], note?: string) => void;
  onDeleteProduct?: (productId: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  orders,
  products,
  messages,
  onAdminReplyChat,
  onUpdateOrderStatus,
  onDeleteProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'TRANSAKSI' | 'CHAT' | 'PRODUK' | 'REKENING'>('TRANSAKSI');
  const [replyInput, setReplyInput] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Rekening management state
  const [bankAccounts, setBankAccounts] = useState<ManualBankAccount[]>(() => getInitialBankAccounts());
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newBankName, setNewBankName] = useState('BCA (Bank Central Asia)');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountHolder, setNewAccountHolder] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Editing existing account state
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editAccountHolder, setEditAccountHolder] = useState('');
  const [zoomProofImage, setZoomProofImage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomProofImage) {
          setZoomProofImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoomProofImage, onClose]);

  if (!isOpen) return null;

  const totalSales = orders
    .filter((o) => o.status !== 'MENUNGGU_PEMBAYARAN')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    onAdminReplyChat(replyInput.trim());
    setReplyInput('');
  };

  const handleSetShipped = (orderId: string) => {
    const resi = trackingNumber.trim() || `JNE${Math.floor(100000000 + Math.random() * 900000000)}`;
    onUpdateOrderStatus(orderId, 'DIKIRIM', `Resi Pengiriman: ${resi}`);
    setTrackingNumber('');
    setSelectedOrderId(null);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountNumber.trim() || !newAccountHolder.trim()) {
      alert('Mohon isi nomor rekening dan atas nama pemilik rekening.');
      return;
    }

    const newAcc: ManualBankAccount = {
      id: `acc_${Date.now()}`,
      bankName: newBankName.trim() || 'Bank Lainnya',
      accountNumber: newAccountNumber.trim(),
      accountHolder: newAccountHolder.trim(),
      notes: newNotes.trim() || 'Transfer manual rekening sendiri',
      isDefault: false,
    };

    const updated = [...bankAccounts, newAcc];
    setBankAccounts(updated);
    saveBankAccountsToStorage(updated);
    setIsAddingAccount(false);
    setNewAccountNumber('');
    setNewAccountHolder('');
    setNewNotes('');
  };

  const handleStartEdit = (account: ManualBankAccount) => {
    setEditingAccountId(account.id);
    setEditBankName(account.bankName);
    setEditAccountNumber(account.accountNumber);
    setEditAccountHolder(account.accountHolder);
  };

  const handleSaveEdit = (accountId: string) => {
    if (!editAccountNumber.trim() || !editAccountHolder.trim()) {
      alert('Nomor rekening dan nama pemilik tidak boleh kosong.');
      return;
    }

    const updated = bankAccounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          bankName: editBankName.trim() || acc.bankName,
          accountNumber: editAccountNumber.trim(),
          accountHolder: editAccountHolder.trim(),
        };
      }
      return acc;
    });

    setBankAccounts(updated);
    saveBankAccountsToStorage(updated);
    setEditingAccountId(null);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (bankAccounts.length <= 1) {
      alert('Minimal harus ada 1 rekening pembayaran.');
      return;
    }
    if (confirm('Yakin ingin menghapus rekening ini?')) {
      const updated = bankAccounts.filter((acc) => acc.id !== accountId);
      setBankAccounts(updated);
      saveBankAccountsToStorage(updated);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 flex flex-col h-[88vh] max-h-[720px] cursor-default"
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-100 bg-[#005B82] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Panel Admin Pembuat Aplikasi</h2>
                <span className="text-[11px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded">
                  Admin Utama
                </span>
              </div>
              <p className="text-xs text-blue-100 font-mono">Nomor HP/WA: {ADMIN_PHONE}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border-b border-slate-200/80 text-center">
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Transaksi</span>
            <span className="text-sm font-extrabold text-slate-900">{orders.length}</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Omset Masuk</span>
            <span className="text-sm font-extrabold text-emerald-700">{formatRupiah(totalSales)}</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Rekening Aktif</span>
            <span className="text-sm font-extrabold text-indigo-700">{bankAccounts.length} Rek</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('TRANSAKSI')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'TRANSAKSI'
                ? 'border-[#005B82] text-[#005B82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Transaksi ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('REKENING')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'REKENING'
                ? 'border-[#005B82] text-[#005B82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Rekening Manual ({bankAccounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CHAT')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'CHAT'
                ? 'border-[#005B82] text-[#005B82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PRODUK')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'PRODUK'
                ? 'border-[#005B82] text-[#005B82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Katalog ({products.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
          {/* TAB 1: TRANSAKSI */}
          {activeTab === 'TRANSAKSI' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">Belum ada transaksi masuk.</p>
                  <p className="text-xs">Lakukan checkout pada produk untuk menguji transfer manual.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{order.invoiceNumber}</span>
                        <span className="text-slate-400 block">{formatDateTime(order.createdAt)}</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          order.status === 'PEMBAYARAN_BERHASIL'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'DIKIRIM'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'SELESAI'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      {order.product.images?.[0] && (
                        <img
                          src={order.product.images[0]}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{order.product.title}</p>
                        <p className="text-xs text-slate-500">
                          Penerima: {order.buyerName} ({order.buyerPhone})
                        </p>
                        <p className="text-xs font-bold text-[#006699]">
                          {formatRupiah(order.totalAmount)} &bull; Rekening: {order.paymentMethodName} ({order.accountOrVaNumber})
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <p className="font-semibold text-slate-800">Alamat Kirim:</p>
                      <p>{order.shippingAddress}</p>
                      {order.adminNotes && (
                        <p className="mt-1 text-blue-700 font-medium">{order.adminNotes}</p>
                      )}
                    </div>

                    {/* Bukti Transfer Pembeli */}
                    {order.transferProofUrl ? (
                      <div className="flex items-center gap-3 p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs">
                        <img
                          src={order.transferProofUrl}
                          alt="Bukti Transfer"
                          onClick={() => setZoomProofImage(order.transferProofUrl || null)}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-300 cursor-pointer hover:opacity-90 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Bukti Struk Transfer Terlampir</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pembeli telah mengunggah struk transfer manual.
                          </p>
                          <button
                            type="button"
                            onClick={() => setZoomProofImage(order.transferProofUrl || null)}
                            className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold underline flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Periksa Foto Struk Ukuran Penuh</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>Belum ada foto bukti transfer diunggah di aplikasi. Mohon konfirmasi via chat WhatsApp di bawah.</span>
                      </div>
                    )}

                    {/* Admin Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          const waText = `Halo ${order.buyerName}, Admin (${ADMIN_PHONE}) mengonfirmasi pesanan ${order.invoiceNumber} (${order.product.title}) senilai ${formatRupiah(order.totalAmount)}. Terima kasih atas pembayarannya!`;
                          openWhatsAppDirect(waText);
                        }}
                        className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp Pembeli</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {order.status === 'PEMBAYARAN_BERHASIL' && (
                          <button
                            onClick={() => setSelectedOrderId(order.id)}
                            className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Kirim Barang (Input Resi)</span>
                          </button>
                        )}

                        {order.status === 'DIKIRIM' && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'SELESAI', 'Barang diterima pembeli & dana diteruskan ke penjual')}
                            className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Selesaikan Transaksi</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tracking number input modal sub-box */}
                    {selectedOrderId === order.id && (
                      <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 mt-2 space-y-2">
                        <label className="text-xs font-bold text-slate-800">
                          Nomor Resi Pengiriman JNE/J&T/SiCepat:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Contoh: JNE88291039120"
                            className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-blue-300 outline-hidden"
                          />
                          <button
                            onClick={() => handleSetShipped(order.id)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
                          >
                            Kirim & Notifikasi Pembeli
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: KELOLA REKENING MANUAL (Bisa masukkan rekening sendiri) */}
          {activeTab === 'REKENING' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Pengaturan Rekening Transfer Manual
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bisa memasukkan nomor rekening bank atau e-wallet milik Anda sendiri.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingAccount(!isAddingAccount)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Rekening</span>
                </button>
              </div>

              {/* Form Tambah Rekening Baru */}
              {isAddingAccount && (
                <form
                  onSubmit={handleAddAccount}
                  className="p-4 bg-indigo-50/90 rounded-2xl border border-indigo-200 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                    <span className="font-bold text-indigo-950">Form Rekening Baru / Sendiri</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingAccount(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Nama Bank / E-Wallet *
                      </label>
                      <input
                        type="text"
                        required
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        placeholder="Contoh: BCA, BRI, Mandiri, DANA, BSI..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Nomor Rekening Anda *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        placeholder="Ketik nomor rekening Anda..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Atas Nama (A/N) Pemilik Rekening *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccountHolder}
                        onChange={(e) => setNewAccountHolder(e.target.value)}
                        placeholder="Nama pemilik rekening..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Catatan Tambahan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="Contoh: Transfer lewat Livin Mandiri / m-BCA"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                    >
                      Simpan Rekening
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAccount(false)}
                      className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}

              {/* Daftar Rekening */}
              <div className="space-y-2.5">
                {bankAccounts.map((account) => {
                  const isEditing = editingAccountId === account.id;

                  if (isEditing) {
                    return (
                      <div
                        key={account.id}
                        className="p-4 bg-white rounded-2xl border-2 border-indigo-400 space-y-3 text-xs shadow-xs"
                      >
                        <span className="font-bold text-slate-900 block">Edit Rekening:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">Bank:</label>
                            <input
                              type="text"
                              value={editBankName}
                              onChange={(e) => setEditBankName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">No Rekening:</label>
                            <input
                              type="text"
                              value={editAccountNumber}
                              onChange={(e) => setEditAccountNumber(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">Atas Nama (A/N):</label>
                            <input
                              type="text"
                              value={editAccountHolder}
                              onChange={(e) => setEditAccountHolder(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(account.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Simpan Perubahan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAccountId(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={account.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{account.bankName}</h4>
                          {account.isDefault && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                              Utama
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-baseline gap-2 mt-1">
                          <span className="text-sm font-extrabold text-indigo-700 font-mono tracking-wider">
                            {account.accountNumber}
                          </span>
                          <span className="text-xs text-slate-500">
                            A/N: <strong>{account.accountHolder}</strong>
                          </span>
                        </div>
                        {account.notes && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{account.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(account)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(account.id)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-200"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CHAT */}
          {activeTab === 'CHAT' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Riwayat Percakapan dengan Pembeli
                </h3>
                <div className="max-h-[300px] overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        m.sender === 'admin'
                          ? 'bg-blue-600 text-white ml-6'
                          : 'bg-white border border-slate-200 mr-6 text-slate-800'
                      }`}
                    >
                      <p className="font-bold text-[10px] opacity-80 mb-0.5">
                        {m.senderName} ({m.sender === 'admin' ? ADMIN_PHONE : 'Pembeli'})
                      </p>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendAdminReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="Balas pesan pembeli sebagai Admin (087768692417)..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Balasan</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUK */}
          {activeTab === 'PRODUK' && (
            <div className="space-y-2.5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {prod.images?.[0] ? (
                      <img
                        src={prod.images[0]}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        No Pic
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{prod.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Toko: {prod.sellerName} ({prod.sellerPhone})
                      </p>
                      <p className="text-xs font-extrabold text-[#006699]">
                        {formatRupiah(prod.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200">
                      Aktif
                    </span>
                    {onDeleteProduct && (
                      <button
                        onClick={() => onDeleteProduct(prod.id)}
                        className="text-xs text-red-600 hover:text-red-800 p-1 font-semibold"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Zoom Bukti Transfer Admin */}
        {zoomProofImage && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
            onClick={() => setZoomProofImage(null)}
          >
            <div
              className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden p-3 shadow-2xl space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>Foto Struk Bukti Transfer Pembeli</span>
                </span>
                <button
                  type="button"
                  onClick={() => setZoomProofImage(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-950 p-2 rounded-xl">
                <img
                  src={zoomProofImage}
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
