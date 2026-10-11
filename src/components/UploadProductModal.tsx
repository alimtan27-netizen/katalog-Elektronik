import React, { useState, useRef } from 'react';
import { Product, ProductCategory, SellerProfile } from '../types';
import { processAndCompressImage, MAX_ALLOWED_FILE_SIZE_BYTES } from '../utils/imageCompressor';
import {
  X,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImagePlus,
  Package,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Camera,
  FolderOpen,
  ArrowLeft,
  Check,
} from 'lucide-react';

interface UploadProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: SellerProfile | null;
  rememberedSeller?: SellerProfile | null;
  onAddProduct: (product: Product) => void;
  onSaveSeller?: (seller: SellerProfile) => void;
}

const QUICK_SAMPLE_IMAGES = [
  { label: '📱 iPhone 15 Pro', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80' },
  { label: '📱 Samsung Galaxy', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80' },
  { label: '💻 MacBook / Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
  { label: '🎧 Headphone Sony / TWS', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { label: '📷 Kamera Mirrorless', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80' },
];

export const UploadProductModal: React.FC<UploadProductModalProps> = ({
  isOpen,
  onClose,
  seller,
  rememberedSeller,
  onAddProduct,
  onSaveSeller,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Ponsel & Tablet');
  const [price, setPrice] = useState<string>('');
  const [condition, setCondition] = useState<'Baru' | 'Bekas Mulus' | 'Like New' | 'Bagus'>('Bekas Mulus');
  const [location, setLocation] = useState(seller?.city || rememberedSeller?.city || 'Jakarta');
  const [stock, setStock] = useState<number>(5);
  const [description, setDescription] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [fallbackStoreName, setFallbackStoreName] = useState(seller?.storeName || rememberedSeller?.storeName || '');
  const [fallbackPhone, setFallbackPhone] = useState(seller?.phone || rememberedSeller?.phone || '');
  const [uploadedImages, setUploadedImages] = useState<{
    url: string;
    originalName: string;
    originalMb: number;
    processedKb: number;
  }[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  const handleSelectQuickSample = (url: string, label: string) => {
    if (uploadedImages.length >= 4) {
      setImageError('Maksimal 4 foto per barang.');
      return;
    }
    setImageError(null);
    setUploadedImages((prev) => [
      ...prev,
      {
        url,
        originalName: `${label}.jpg`,
        originalMb: 0.25,
        processedKb: 48,
      },
    ]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageError(null);
    setFormError(null);
    setIsProcessingImage(true);

    try {
      const fileList: File[] = Array.from(files);
      const remainingSlots = 4 - uploadedImages.length;
      if (remainingSlots <= 0) {
        setImageError('Maksimal 4 foto per barang.');
        setIsProcessingImage(false);
        return;
      }

      const filesToProcess = fileList.slice(0, remainingSlots);

      for (const file of filesToProcess) {
        try {
          if (file.size > MAX_ALLOWED_FILE_SIZE_BYTES) {
            setImageError(`File ${file.name} melebihi kapasitas 50 MB!`);
            continue;
          }

          const result = await processAndCompressImage(file);
          setUploadedImages((prev) => [
            ...prev,
            {
              url: result.dataUrl,
              originalName: result.originalName,
              originalMb: result.originalSizeMb,
              processedKb: result.processedSizeKb,
            },
          ]);
        } catch (itemErr: any) {
          console.warn('Gagal memproses salah satu foto:', itemErr);
          setImageError(itemErr?.message || 'Format foto tidak terbaca. Coba gunakan foto JPG/PNG atau fitur Contoh Foto.');
        }
      }
    } catch (err: any) {
      setImageError(err?.message || 'Gagal memproses unggah foto.');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFormError(null);

    const activeStoreName = (seller?.storeName || fallbackStoreName || '').trim();
    const activePhone = (seller?.phone || fallbackPhone || '').trim();

    if (!activeStoreName) {
      setFormError('Mohon isi Nama Toko Anda!');
      return;
    }

    if (!activePhone || activePhone.length < 8) {
      setFormError('Mohon isi Nomor Telepon / WA Toko Anda!');
      return;
    }

    if (uploadedImages.length === 0) {
      setFormError('Mohon pilih minimal 1 foto barang!');
      fileInputRef.current?.click();
      return;
    }

    if (!title.trim()) {
      setFormError('Mohon isi Nama Barang / Produk!');
      titleInputRef.current?.focus();
      return;
    }

    const numPrice = parseInt(price.replace(/\D/g, ''), 10);
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Mohon masukkan Harga Jual (Rp) yang valid!');
      priceInputRef.current?.focus();
      return;
    }

    // Auto-save seller profile if not registered yet
    if (!seller && onSaveSeller) {
      const createdSeller: SellerProfile = {
        storeName: activeStoreName,
        phone: activePhone,
        city: location.trim() || 'Indonesia',
        joinedAt: Date.now(),
      };
      onSaveSeller(createdSeller);
    }

    const specsList = specsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newProduct: Product = {
      id: `prod-custom-${Date.now()}`,
      title: title.trim(),
      category,
      price: numPrice,
      condition,
      sellerName: activeStoreName,
      sellerPhone: activePhone,
      location: location.trim() || 'Indonesia',
      description: description.trim() || 'Barang siap kirim, kondisi sesuai foto.',
      specs: specsList.length > 0 ? specsList : ['Kondisi siap pakai', 'Garansi toko'],
      images: uploadedImages.map((img) => img.url),
      createdAt: Date.now(),
      isVerifiedByAdmin: true,
      status: 'Tersedia',
      stock: Math.max(1, Number(stock) || 1),
    };

    onAddProduct(newProduct);

    // Reset fields cleanly for subsequent additions
    setTitle('');
    setPrice('');
    setUploadedImages([]);
    setSpecsText('');
    setDescription('');
    setStock(5);
    setFormError(null);
    onClose();
  };

  const activeStoreName = seller?.storeName || fallbackStoreName || 'Toko Baru';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (uploadedImages.length > 0 || title.trim() || price.trim()) {
      if (window.confirm('Tutup halaman unggah barang? Foto atau data yang belum disimpan akan hilang.')) {
        onClose();
      }
      return;
    }
    onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-slate-900/80 backdrop-blur-xs p-0 sm:p-4 cursor-pointer notranslate"
      translate="no"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in duration-200 cursor-default"
      >
        
        {/* Sticky Header */}
        <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-4 px-4 sm:px-5 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <span>Unggah Foto & Jual Barang</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toko:{' '}
                <span className="font-bold text-slate-800">
                  {activeStoreName}
                </span>
                {seller?.phone ? ` (${seller.phone})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer touch-manipulation"
            title="Tutup (Keluar)"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>

        {/* Form wrapping scrollable body AND sticky action bar */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
          {/* Quick Store Info if not logged in */}
          {!seller && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Informasi Toko Anda</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Toko *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Toko Hoki888"
                    value={fallbackStoreName}
                    onChange={(e) => {
                      setFallbackStoreName(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-emerald-300 font-medium outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081364505533"
                    value={fallbackPhone}
                    onChange={(e) => {
                      setFallbackPhone(e.target.value);
                      setFormError(null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-emerald-300 font-medium outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Foto Barang Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Foto Barang *</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Didukung hingga 50 MB / Foto!
                </span>
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                {uploadedImages.length}/4 Foto
              </span>
            </div>

            {/* Hidden Inputs for Camera and File Picker */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Compact Photo Display when photos are present */}
            {uploadedImages.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border-2 border-slate-200 aspect-square bg-slate-100 shadow-2xs group"
                    >
                      <img
                        src={img.url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded shadow-xs">
                          Utama
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute bottom-1 right-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-xs"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add more photo slot */}
                  {uploadedImages.length < 4 && (
                    <div className="flex flex-col gap-1 aspect-square justify-center">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="flex-1 rounded-lg border border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold gap-1"
                        title="Ambil foto kamera"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="flex-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 text-[10px] font-bold gap-1"
                        title="Pilih dari galeri"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Galeri</span>
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{uploadedImages.length} foto berhasil dioptimasi & siap disimpan di HP.</span>
                </p>
              </div>
            ) : (
              /* Dual Big Action Buttons for Camera & Gallery */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="p-3.5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 active:bg-indigo-200 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation group"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-indigo-950">
                      Buka Kamera HP
                    </span>
                    <span className="text-[10px] text-indigo-700 font-medium">
                      Foto langsung barang
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="p-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50/80 hover:bg-slate-100 active:bg-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      Pilih dari Galeri
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Foto file JPG/PNG/HEIC
                    </span>
                  </button>
                </div>

                {/* Instant Sample Photos if User has difficulty with device file picker */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Atau Pilih Foto Contoh Cepat:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">1-Klik Pasang</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_SAMPLE_IMAGES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectQuickSample(sample.url, sample.label)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>{sample.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {isProcessingImage && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Sedang memproses & mengompres foto Anda...</span>
                  </div>
                )}
              </div>
            )}

            {imageError && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{imageError}</p>
                  <p className="text-[10px] text-red-600 mt-0.5">
                    Tips: Pastikan izin kamera aktif, atau gunakan tombol "Pilih Foto Contoh Cepat" di atas.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Barang / Produk *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFormError(null);
              }}
              placeholder="Contoh: Samsung A7 2017, iPhone 14 Pro, Asus Zenbook..."
              className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            />
          </div>

          {/* HARGA & JUMLAH STOK (Paling Penting & Menonjol) */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-emerald-50/70 rounded-2xl border border-indigo-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Harga Jual */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  Harga Jual (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-indigo-700">
                    Rp
                  </span>
                  <input
                    ref={priceInputRef}
                    type="text"
                    required
                    value={price}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setPrice(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                      setFormError(null);
                    }}
                    placeholder="Contoh: 1.500.000"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-extrabold text-slate-900 rounded-xl bg-white border border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-hidden shadow-2xs"
                  />
                </div>
              </div>

              {/* Jumlah Stok */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-slate-900">
                    Jumlah Stok Siap Jual *
                  </label>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                    {stock} unit
                  </span>
                </div>
                <div className="flex items-center rounded-xl border border-indigo-300 bg-white shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setStock((s) => Math.max(1, s - 1))}
                    className="p-2 px-3 hover:bg-slate-100 text-slate-700 active:bg-slate-200 transition-colors"
                    title="Kurangi 1 unit"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99999"
                    value={stock}
                    onChange={(e) => setStock(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full text-center font-extrabold text-sm text-slate-900 focus:outline-hidden py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setStock((s) => s + 1)}
                    className="p-2 px-3 hover:bg-slate-100 text-slate-700 active:bg-slate-200 transition-colors"
                    title="Tambah 1 unit"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons for Stock */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase">
                Pilih Cepat Stok:
              </span>
              {[1, 5, 10, 20, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setStock(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    stock === preset
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                  }`}
                >
                  {preset === 1 ? '1 unit' : `+${preset}`}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori & Kondisi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden bg-white"
              >
                <option value="Ponsel & Tablet">Ponsel & Tablet</option>
                <option value="Laptop & Komputer">Laptop & Komputer</option>
                <option value="Kamera & Audio">Kamera & Audio</option>
                <option value="Aksesoris & Gadget">Aksesoris & Gadget</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kondisi
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden bg-white"
              >
                <option value="Bekas Mulus">Bekas Mulus Normal</option>
                <option value="Like New">Like New (99% Mulus)</option>
                <option value="Baru">Baru (Segel / BNOB)</option>
                <option value="Bagus">Bagus Siap Pakai</option>
              </select>
            </div>
          </div>

          {/* Kota Pengiriman */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kota Pengiriman (Lokasi Barang)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Jakarta, Medan, Bandung, Surabaya..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden font-medium"
            />
          </div>

          {/* Optional Details Toggle Accordion */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowOptionalDetails(!showOptionalDetails)}
              className="w-full p-3 px-4 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/70 transition-colors text-left"
            >
              <span>+ Tambah Spesifikasi & Deskripsi (Opsional)</span>
              {showOptionalDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showOptionalDetails && (
              <div className="p-3.5 border-t border-slate-200 space-y-3 bg-white">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Spesifikasi (1 baris per poin)
                  </label>
                  <textarea
                    rows={2}
                    value={specsText}
                    onChange={(e) => setSpecsText(e.target.value)}
                    placeholder="Contoh:&#10;Layar Super AMOLED&#10;Baterai awet normal&#10;Kelengkapan Unit + Charger"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Deskripsi / Catatan Tambahan
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tuliskan catatan kondisi, garansi, atau bonus bila ada..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden resize-none"
                  />
                </div>
              </div>
            )}
          </div>
          </div>
          {/* End of Scrollable Form Body */}

          {/* STICKY BOTTOM ACTION BAR (Selalu Tampak & Mudah Ditekan di HP) */}
          <div className="shrink-0 bg-white border-t border-slate-200 p-3 sm:p-4 shadow-xl z-20 space-y-2">
            {formError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">{formError}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation"
              >
                Batal
              </button>

              <button
                id="btn-tayangkan-produk"
                type="button"
                onClick={handleSubmit}
                disabled={isProcessingImage}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] active:bg-indigo-800 disabled:bg-slate-400 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                {isProcessingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Foto...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4" />
                    <span>
                      Tayangkan Produk ({stock} Unit Stok)
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
