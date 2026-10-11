import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Share2,
  Copy,
  Check,
  Download,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface InstallShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicAppUrl: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallShareModal: React.FC<InstallShareModalProps> = ({
  isOpen,
  onClose,
  publicAppUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'install'>('share');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [onClose]);

  if (!isOpen) return null;

  // Resolve clean public share link (always ais-pre- for public visitors)
  const getPublicShareUrl = () => {
    if (typeof window !== 'undefined' && window.location.origin) {
      const origin = window.location.origin;
      if (origin.includes('ais-dev-')) {
        return origin.replace('ais-dev-', 'ais-pre-');
      }
      if (origin.includes('ais-pre-')) {
        return origin;
      }
    }
    return publicAppUrl;
  };

  const currentUrl = getPublicShareUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GadgetHub - Katalog Elektronik',
          text: 'Lihat katalog laptop, HP, kamera & elektronik di GadgetHub! Transaksi aman dikoordinasikan admin & pembayaran otomatis.',
          url: currentUrl,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Halo! Yuk cek katalog gadget & elektronik di *GadgetHub*:\n\n📱 HP, Laptop, Kamera, Aksesoris\n🛡️ Transaksi Dijamin Aman & Dikoordinasikan Admin\n⚡ Pembayaran Otomatis DANA, GoPay & Transfer Bank\n\nBuka aplikasinya di sini:\n${currentUrl}`
    );
    const waUrl = `https://api.whatsapp.com/send?text=${text}`;
    try {
      const opened = window.open(waUrl, '_blank');
      if (!opened) {
        window.location.href = waUrl;
      }
    } catch {
      window.location.href = waUrl;
    }
  };

  const handleTriggerPrompt = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert(
        'Untuk menginstall di HP Android:\n1. Buka browser Google Chrome di HP.\n2. Klik titik tiga (⋮) di pojok kanan atas.\n3. Pilih "Tambahkan ke Layar Utama" atau "Instal Aplikasi".'
      );
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer notranslate"
      translate="no"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 cursor-default"
      >
        {/* Header with gradient badge */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                Android & Multi-Device
              </span>
              <h2 className="text-xl font-extrabold tracking-tight mt-1">
                Install ke HP & Bagikan
              </h2>
            </div>
          </div>
          <p className="text-indigo-100 text-xs mt-2 leading-relaxed">
            Pasang langsung ke layar utama Android layaknya aplikasi Play Store, dan bagikan link katalog ke siapa saja.
          </p>

          {/* Tab Selector inside header */}
          <div className="flex bg-black/20 p-1 rounded-xl mt-4">
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'share'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-indigo-100 hover:text-white'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim & Bagikan Link</span>
            </button>
            <button
              onClick={() => setActiveTab('install')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'install'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-indigo-100 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Cara Pasang di HP</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 space-y-4">
          {activeTab === 'share' ? (
            <div className="space-y-4">
              {/* WhatsApp Quick Share Button (Primary) */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    Kirim Langsung ke Kontak / Grup WhatsApp
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    Paling Cepat
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Sekali klik, WhatsApp akan langsung terbuka dengan pesan rapi dan tautan aplikasi yang siap dikirim ke teman, keluarga, pembeli, atau grup dagang.
                </p>
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current text-white" />
                  <span>Kirim Link via WhatsApp Sekarang</span>
                </button>
              </div>

              {/* Share URL Box */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Salin Tautan Aplikasi Publik:
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-3">
                  <span className="text-xs text-slate-700 truncate font-mono flex-1 select-all" title={currentUrl}>
                    {currentUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Link berhasil disalin! Silakan paste / tempel di WhatsApp, Telegram, atau SMS.
                  </p>
                )}
              </div>

              {/* Native Mobile Share Button */}
              <div>
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Buka Menu Berbagi Bawaan HP (Android / iOS)</span>
                </button>
              </div>

              {/* Guide: Cara Dapat Link dari Google AI Studio */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  Cara Mendapatkan Link dari Google AI Studio:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    Lihat ke pojok kanan atas layar <strong>Google AI Studio</strong>.
                  </li>
                  <li>
                    Klik tombol biru <strong>&quot;Share&quot;</strong> (Bagikan).
                  </li>
                  <li>
                    Pilih izin akses ke <strong>&quot;Anyone with the link&quot;</strong> (Publik).
                  </li>
                  <li>
                    Klik <strong>&quot;Copy Link&quot;</strong> lalu kirimkan tautan tersebut ke WhatsApp siapa saja.
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* If browser supports direct install */}
              {deferredPrompt && !isInstalled && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Perangkat Anda Siap!</p>
                    <p className="text-[11px] text-emerald-700">Tekan tombol di samping untuk menginstal 1-klik ke HP.</p>
                  </div>
                  <button
                    onClick={handleTriggerPrompt}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    Instal Sekarang
                  </button>
                </div>
              )}

              {isInstalled && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Aplikasi sudah terinstal dan berjalan dalam mode Standalone!</span>
                </div>
              )}

              {/* Step by Step Android PWA Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Langkah Praktis Pasang di Android (Tanpa Play Store):</span>
                </h3>

                <ol className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900">Buka Link di Google Chrome Android</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Buka link aplikasi ini di browser Chrome di HP Anda atau calon pengguna.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900">Ketuk Menu Titik Tiga ( ⋮ )</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Lihat di pojok kanan atas browser Google Chrome dan sentuh ikon titik tiga (⋮).
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900">Pilih &quot;Instal aplikasi&quot; atau &quot;Tambahkan ke Layar utama&quot;</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pilih <em>&quot;Install app&quot;</em> / <em>&quot;Add to Home screen&quot;</em>. Ikon GadgetHub akan langsung muncul di layar HP Android seperti aplikasi native, tanpa kuota unduh besar!
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Developer / APK Note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-amber-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Opsi Berkas Installer .APK (Jika Diperlukan):
                </span>
                <p className="text-amber-800/90 leading-relaxed">
                  Jika ingin berkas <strong>.apk</strong> untuk dibagikan offline atau upload ke Play Store: gunakan menu <strong>Settings &rarr; Export to GitHub / ZIP</strong> di AI Studio, kemudian buat APK menggunakan alat pembungkus resmi Android seperti <strong>PWABuilder</strong> atau <strong>Bubblewrap (TWA)</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>PWA Ready &bull; Standalone Support</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
