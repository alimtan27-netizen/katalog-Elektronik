import React, { useState, useEffect, useRef } from 'react';
import { Product, Order, BuyerProfile, ManualBankAccount } from '../types';
import { formatRupiah, ADMIN_PHONE, openWhatsAppDirect, createWhatsAppUrl } from '../utils/formatters';
import { playSuccessSound } from '../utils/audio';
import { getInitialBankAccounts, saveBankAccountsToStorage } from '../utils/bankAccounts';
import { processAndCompressImage } from '../utils/imageCompressor';
import {
  X,
  ShieldCheck,
  CreditCard,
  Wallet,
  CheckCircle2,
  Copy,
  Clock,
  ArrowRight,
  Lock,
  Plus,
  Minus,
  Package,
  MessageCircle,
  Edit3,
  Building2,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Smartphone,
  AlertCircle,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  buyer: BuyerProfile | null;
  onPaymentSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  buyer,
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT'>('DETAILS');
  const [recipientName, setRecipientName] = useState(buyer?.name || '');
  const [recipientPhone, setRecipientPhone] = useState(buyer?.phone || '');
  const [address, setAddress] = useState('Jl. Jendral Sudirman No. 45, Jakarta Pusat');
  const [shippingNote, setShippingNote] = useState('Mohon packing kayu dan bubble wrap tebal');

  // Bank Accounts state (Manual)
  const [bankAccounts, setBankAccounts] = useState<ManualBankAccount[]>(() => getInitialBankAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    const accounts = getInitialBankAccounts();
    return accounts[0]?.id || 'bca_manual';
  });
  const [accountCategoryTab, setAccountCategoryTab] = useState<'ALL' | 'BANK' | 'EWALLET'>('ALL');

  // Custom/New Account Form Modal State
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [newBankName, setNewBankName] = useState('BCA');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountHolder, setNewAccountHolder] = useState('');
  const [newAccountNotes, setNewAccountNotes] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [generatedOrder, setGeneratedOrder] = useState<Order | null>(null);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [countdown, setCountdown] = useState(86400); // 24 hours

  // Bukti Transfer State
  const [transferProofUrl, setTransferProofUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [zoomProofModal, setZoomProofModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (buyer) {
      if (!recipientName) setRecipientName(buyer.name);
      if (!recipientPhone) setRecipientPhone(buyer.phone);
    }
  }, [buyer]);

  useEffect(() => {
    if (step === 'PAYMENT' && countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomProofModal) {
          setZoomProofModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoomProofModal, onClose]);

  if (!isOpen || !product) return null;

  const activeAccount = bankAccounts.find((a) => a.id === selectedAccountId) || bankAccounts[0];

  const handleSaveCustomAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountNumber.trim() || !newAccountHolder.trim()) {
      alert('Mohon isi Nomor Rekening dan Atas Nama (A/N) pemilik rekening.');
      return;
    }

    const created: ManualBankAccount = {
      id: `acc_custom_${Date.now()}`,
      bankName: newBankName.trim() || 'Bank Lainnya',
      accountNumber: newAccountNumber.trim(),
      accountHolder: newAccountHolder.trim(),
      notes: newAccountNotes.trim() || 'Transfer manual rekening sendiri',
      isDefault: false,
    };

    const updated = [created, ...bankAccounts];
    setBankAccounts(updated);
    saveBankAccountsToStorage(updated);
    setSelectedAccountId(created.id);
    setShowAddAccountForm(false);
    setNewAccountNumber('');
    setNewAccountHolder('');
    setNewAccountNotes('');
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientPhone.trim() || !address.trim()) {
      alert('Mohon lengkapi nama penerima, nomor HP, dan alamat pengiriman.');
      return;
    }

    if (!activeAccount) {
      alert('Mohon pilih atau masukkan rekening pembayaran.');
      return;
    }

    const order: Order = {
      id: `ord-${Date.now()}`,
      invoiceNumber: `INV/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100000 + Math.random() * 900000)}`,
      product,
      buyerName: recipientName.trim(),
      buyerPhone: recipientPhone.trim(),
      shippingAddress: address.trim(),
      paymentMethod: activeAccount.id,
      paymentMethodName: activeAccount.bankName,
      accountOrVaNumber: activeAccount.accountNumber,
      accountHolder: activeAccount.accountHolder,
      totalAmount: product.price * quantity,
      quantity,
      status: 'MENUNGGU_PEMBAYARAN',
      createdAt: Date.now(),
      paymentExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      adminNotes: shippingNote.trim(),
    };

    setGeneratedOrder(order);
    setStep('PAYMENT');
  };

  const handleCopyRekening = () => {
    if (!activeAccount) return;
    navigator.clipboard.writeText(activeAccount.accountNumber);
    setCopiedRekening(true);
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  const handleCopyNominal = () => {
    if (!generatedOrder) return;
    navigator.clipboard.writeText(generatedOrder.totalAmount.toString());
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  // Helper check E-Wallet
  const isEWallet = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes('dana') || lower.includes('gopay') || lower.includes('shopee') || lower.includes('ovo') || lower.includes('wallet') || lower.includes('dompet');
  };

  const filteredAccounts = bankAccounts.filter((acc) => {
    if (accountCategoryTab === 'BANK') return !isEWallet(acc.bankName);
    if (accountCategoryTab === 'EWALLET') return isEWallet(acc.bankName);
    return true;
  });

  const bankCount = bankAccounts.filter((a) => !isEWallet(a.bankName)).length;
  const ewalletCount = bankAccounts.filter((a) => isEWallet(a.bankName)).length;

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProof(true);
    try {
      const res = await processAndCompressImage(file);
      setTransferProofUrl(res.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses foto bukti transfer.');
    } finally {
      setIsUploadingProof(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Konfirmasi pembayaran via WhatsApp langsung ke 087768692417
  const waConfirmText = generatedOrder
    ? `Halo Admin (${ADMIN_PHONE}), saya sudah transfer pembayaran pesanan melalui ${isEWallet(generatedOrder.paymentMethodName) ? 'E-Wallet' : 'Rekening Bank'} manual:\n\n*Invoice: ${generatedOrder.invoiceNumber}*\nBarang: ${generatedOrder.product.title}\nJumlah: ${generatedOrder.quantity || 1} Unit\nTotal Transfer: ${formatRupiah(generatedOrder.totalAmount)}\n\n*Tujuan Transfer:*\n${generatedOrder.paymentMethodName}\nNo. Rekening/Akun: ${generatedOrder.accountOrVaNumber}\nA/N: ${generatedOrder.accountHolder || '-'}\n\n*Bukti Transfer:* ${transferProofUrl ? 'Sudah saya unggah di sistem (dan foto saya lampirkan juga di pesan chat ini)' : 'Foto bukti transfer saya lampirkan di chat ini'}\n\n*Penerima:*\nNama: ${generatedOrder.buyerName} (${generatedOrder.buyerPhone})\nAlamat: ${generatedOrder.shippingAddress}\nCatatan: ${generatedOrder.adminNotes || '-'}\n\nMohon dikonfirmasi dan diproses pengirimannya. Terima kasih!`
    : `Halo Admin (${ADMIN_PHONE}), saya ingin konfirmasi pembayaran pesanan di Katalog Elektronik.`;
  const waConfirmUrl = createWhatsAppUrl(waConfirmText);

  const handleConfirmViaWhatsApp = () => {
    if (!generatedOrder) return;
    openWhatsAppDirect(waConfirmText);

    // Save order
    const paidOrder: Order = {
      ...generatedOrder,
      transferProofUrl: transferProofUrl || undefined,
      status: 'PEMBAYARAN_BERHASIL',
      paidAt: Date.now(),
    };
    playSuccessSound();
    onPaymentSuccess(paidOrder);
  };

  // Tandai sudah transfer manual
  const handleManualTransferred = () => {
    if (!generatedOrder) return;
    const paidOrder: Order = {
      ...generatedOrder,
      transferProofUrl: transferProofUrl || undefined,
      status: 'PEMBAYARAN_BERHASIL',
      paidAt: Date.now(),
    };
    playSuccessSound();
    onPaymentSuccess(paidOrder);
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 cursor-default"
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {step === 'DETAILS' ? 'Checkout & Pengiriman' : 'Pembayaran Transfer Manual'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {step === 'DETAILS' ? 'Langkah 1: Masukkan data & pilih rekening' : 'Langkah 2: Transfer ke rekening manual'}
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

        {/* STEP 1: RECIPIENT & MANUAL BANK SELECTION */}
        {step === 'DETAILS' ? (
          <form onSubmit={handleProceedToPayment} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Item Mini Card */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{product.title}</p>
                <p className="text-xs text-slate-500">Toko: {product.sellerName}</p>
                <p className="text-sm font-extrabold text-[#006699] mt-0.5">
                  {formatRupiah(product.price)} / unit
                </p>
              </div>
            </div>

            {/* Quantity Selector & Stock Indicator */}
            <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  Jumlah Beli
                </span>
                <span className="text-[11px] text-slate-500">
                  Tersedia {product.stock ?? 1} unit stok
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-indigo-200 bg-white shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-slate-100 text-slate-600 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-xs text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock ?? 999, q + 1))}
                    disabled={quantity >= (product.stock ?? 1)}
                    className="p-2 hover:bg-slate-100 text-slate-600 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total</span>
                  <span className="text-xs font-extrabold text-indigo-700 font-mono">
                    {formatRupiah(product.price * quantity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recipient info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Informasi Penerima
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Penerima *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama Lengkap Penerima Paket"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon / WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Pengiriman *
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota & kode pos..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan untuk Admin & Penjual
                </label>
                <input
                  type="text"
                  value={shippingNote}
                  onChange={(e) => setShippingNote(e.target.value)}
                  placeholder="Contoh: Packing kayu wajib, kirim sebelum jam 3 sore"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                />
              </div>
            </div>

            {/* Rekening Tujuan Transfer Manual */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pilih Rekening Tujuan Transfer Manual</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddAccountForm(!showAddAccountForm)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Rekening Sendiri</span>
                </button>
              </div>

              {/* Kategori Tabs: Semua, Bank Transfer, E-Wallet */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAccountCategoryTab('ALL')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                    accountCategoryTab === 'ALL'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({bankAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountCategoryTab('BANK')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                    accountCategoryTab === 'BANK'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Bank ({bankCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountCategoryTab('EWALLET')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                    accountCategoryTab === 'EWALLET'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>E-Wallet ({ewalletCount})</span>
                </button>
              </div>

              {/* Form Input Rekening Baru / Sendiri */}
              {showAddAccountForm && (
                <div className="p-3.5 bg-indigo-50/90 rounded-2xl border border-indigo-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Masukkan Rekening Sendiri:</span>
                    <button
                      type="button"
                      onClick={() => setShowAddAccountForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Nama Bank / E-Wallet
                      </label>
                      <input
                        type="text"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        placeholder="Contoh: BCA, BRI, GoPay, ShopeePay, DANA, OVO"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Nomor Rekening / No. HP E-Wallet *
                      </label>
                      <input
                        type="text"
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        placeholder="Nomor rekening atau nomor HP..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Atas Nama (A/N) Pemilik Rekening *
                    </label>
                    <input
                      type="text"
                      value={newAccountHolder}
                      onChange={(e) => setNewAccountHolder(e.target.value)}
                      placeholder="Nama lengkap pemilik rekening..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveCustomAccount}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                    >
                      Simpan Rekening Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAccountForm(false)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium text-xs"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Daftar Rekening Tersedia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredAccounts.map((account) => {
                  const isSelected = selectedAccountId === account.id;
                  const isWallet = isEWallet(account.bankName);
                  return (
                    <div
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {isWallet ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Wallet className="w-2.5 h-2.5" />
                              E-Wallet
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                              <CreditCard className="w-2.5 h-2.5" />
                              Bank
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{account.bankName}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </div>
                      <p className="font-mono font-bold text-xs text-indigo-700 tracking-wide">
                        {account.accountNumber}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        A/N: {account.accountHolder}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total breakdown */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Harga Barang ({quantity} unit)</span>
                <span>{formatRupiah(product.price * quantity)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Rekening Tujuan</span>
                <span className="font-semibold text-slate-800">
                  {activeAccount?.bankName || '-'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>No. Rekening</span>
                <span className="font-mono font-bold text-indigo-700">
                  {activeAccount?.accountNumber || '-'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Tagihan</span>
                <span className="text-indigo-600 font-mono">{formatRupiah(product.price * quantity)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Lanjut ke Transfer Rekening Manual</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* STEP 2: ACTIVE MANUAL TRANSFER DETAILS */
          <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
            {/* Countdown timer */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-amber-900">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Batas Waktu Transfer Manual:</span>
              </div>
              <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded-md border border-amber-300">
                {formatTimer(countdown)}
              </span>
            </div>

            {/* Total Amount Card */}
            <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Total yang Harus Ditransfer</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700 font-mono">
                  {generatedOrder ? formatRupiah(generatedOrder.totalAmount) : ''}
                </p>
                <button
                  type="button"
                  onClick={handleCopyNominal}
                  className="text-xs px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold transition-colors"
                >
                  {copiedNominal ? 'Tersalin!' : 'Salin'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Invoice: {generatedOrder?.invoiceNumber}</p>
            </div>

            {/* Manual Bank Account Details */}
            <div className="p-4 bg-white rounded-2xl border-2 border-indigo-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Bank / E-Wallet Tujuan</span>
                  <span className="text-sm font-bold text-slate-900">
                    {generatedOrder?.paymentMethodName}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Transfer Manual
                </span>
              </div>

              {/* Nomor Rekening */}
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Nomor Rekening Tujuan:</p>
                <div className="flex items-center justify-between gap-2 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-mono text-base sm:text-xl font-extrabold text-slate-900 tracking-wider">
                    {generatedOrder?.accountOrVaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRekening}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedRekening ? 'Tersalin!' : 'Salin Rekening'}</span>
                  </button>
                </div>
              </div>

              {/* Atas Nama */}
              <div className="p-2.5 bg-slate-50 rounded-xl text-xs flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Atas Nama (A/N):</span>
                <span className="font-bold text-slate-900">{generatedOrder?.accountHolder || '-'}</span>
              </div>

              {/* Security banner */}
              <div className="flex items-start gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Transfer langsung ke rekening di atas. Setelah transfer, kirimkan bukti ke WhatsApp Admin resmi (<strong>{ADMIN_PHONE}</strong>) untuk verifikasi.
                </p>
              </div>
            </div>

            {/* Petunjuk Pembayaran Manual */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-800">Langkah Transfer Manual:</p>
              <p>1. Buka m-Banking (BCA, Mandiri, BRI, BNI) atau aplikasi E-Wallet (GoPay, ShopeePay, DANA, OVO).</p>
              <p>2. Transfer tepat senilai <strong>{generatedOrder ? formatRupiah(generatedOrder.totalAmount) : ''}</strong> ke nomor rekening/akun di atas.</p>
              <p>3. Simpan screenshot atau foto struk bukti transfer Anda.</p>
              <p>4. Unggah bukti transfer di bawah ini dan konfirmasi ke WhatsApp Admin.</p>
            </div>

            {/* SEKSI UNGGAH BUKTI TRANSFER */}
            <div className="p-4 bg-indigo-50/70 rounded-2xl border-2 border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-700" />
                  <span className="text-xs font-bold text-slate-900">Bukti Transfer / Struk Pembayaran</span>
                </div>
                {transferProofUrl ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Terlampir
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Sangat Dianjurkan
                  </span>
                )}
              </div>

              {/* Input File Hidden */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProofUpload}
                className="hidden"
              />

              {transferProofUrl ? (
                /* Preview Foto Bukti */
                <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-indigo-200">
                  <img
                    src={transferProofUrl}
                    alt="Bukti Transfer"
                    onClick={() => setZoomProofModal(true)}
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">Foto Struk / Bukti Transfer</p>
                    <p className="text-[11px] text-slate-500">Klik untuk melihat foto ukuran penuh</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setZoomProofModal(true)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Lihat Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-slate-600 hover:text-slate-800 font-medium"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransferProofUrl(null)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-0.5 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Area Upload Foto */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingProof}
                  className="w-full p-4 border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white/90 hover:bg-white rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-0.5">
                    {isUploadingProof ? (
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {isUploadingProof ? 'Sedang Memproses Foto...' : 'Unggah Foto Bukti Transfer'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pilih screenshot m-Banking, bukti ATM, atau e-wallet (GoPay, ShopeePay, DANA, OVO)
                  </span>
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              <a
                id="kirim-bukti-wa-checkout-btn"
                href={waConfirmUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (generatedOrder) {
                    const paidOrder: Order = {
                      ...generatedOrder,
                      transferProofUrl: transferProofUrl || undefined,
                      status: 'PEMBAYARAN_BERHASIL',
                      paidAt: Date.now(),
                    };
                    playSuccessSound();
                    onPaymentSuccess(paidOrder);
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 touch-manipulation cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current text-white" />
                <span>Kirim Bukti Transfer ke WA Admin ({ADMIN_PHONE})</span>
              </a>

              <button
                type="button"
                onClick={handleManualTransferred}
                className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>{transferProofUrl ? 'Saya Sudah Transfer & Unggah Bukti' : 'Saya Sudah Transfer (Simpan Pesanan)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Ganti Rekening / Masukkan Rekening Lain
              </button>
            </div>
          </div>
        )}

        {/* Modal Zoom Bukti Transfer */}
        {zoomProofModal && transferProofUrl && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
            onClick={() => setZoomProofModal(false)}
          >
            <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Foto Bukti Transfer</span>
                <button
                  type="button"
                  onClick={() => setZoomProofModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto p-2 flex items-center justify-center bg-slate-950">
                <img
                  src={transferProofUrl}
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
