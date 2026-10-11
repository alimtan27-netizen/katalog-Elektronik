import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare readonly props: Props;

  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    // Auto-recover immediately if an external translation or DOM mutation causes removeChild glitch
    if (
      error &&
      (error.message?.includes('removeChild') ||
       error.message?.includes('not a child of this node') ||
       error.message?.includes('bukanlah anak dari node ini'))
    ) {
      console.warn('Auto-recovering from external translation DOM removeChild conflict');
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 60);
    }
  }

  private handleDirectRecover = () => {
    // Attempt to reset the error state directly without full page reload
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleSafeRecovery = () => {
    try {
      // Safely preserve critical user products, seller profile, and orders
      const preservedProducts = localStorage.getItem('katalog_products');
      const preservedSeller = localStorage.getItem('katalog_seller_profile') || localStorage.getItem('katalog_last_active_seller');
      const preservedOrders = localStorage.getItem('katalog_orders');

      // Clear volatile/bloated keys
      sessionStorage.clear();

      if (preservedProducts) localStorage.setItem('katalog_products', preservedProducts);
      if (preservedSeller) {
        localStorage.setItem('katalog_seller_profile', preservedSeller);
        localStorage.setItem('katalog_last_active_seller', preservedSeller);
      }
      if (preservedOrders) localStorage.setItem('katalog_orders', preservedOrders);

      this.setState({ hasError: false, error: null });
      window.location.reload();
    } catch (e) {
      console.warn(e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white">
              Pemulihan Sistem Aman
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sistem telah mendeteksi gangguan sementara. <span className="text-emerald-400 font-semibold">Data produk dan toko Anda tetap tersimpan dengan aman</span> di database perangkat.
            </p>

            {this.state.error && (
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 text-left font-mono line-clamp-3 overflow-hidden">
                {this.state.error.message || 'Error runtime'}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleDirectRecover}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                <Home className="w-4 h-4" />
                <span>Keluar & Kembali ke Katalog Utama</span>
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                onClick={this.handleSafeRecovery}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Bersihkan Cache Volatile (Data Toko Tetap Aman)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
