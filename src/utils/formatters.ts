export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

export const ADMIN_PHONE = '087768692417';
export const ADMIN_PHONE_INTL = '6287768692417';
export const ADMIN_WA_LINK = 'https://wa.me/6287768692417';

export function createWhatsAppUrl(text: string): string {
  return `https://wa.me/6287768692417?text=${encodeURIComponent(text)}`;
}

/**
 * Membuka chat WhatsApp langsung ke nomor Admin resmi 087768692417.
 * Menggunakan mekanisme anchor trigger yang kompatibel dengan browser Android,
 * iOS, desktop, dan aplikasi PWA yang terinstall di layar utama HP.
 */
export function openWhatsAppDirect(text: string): void {
  const url = createWhatsAppUrl(text);
  try {
    // ALWAYS open in a new tab (_blank) with noopener,noreferrer
    // This safely escapes any iframe (such as AI Studio preview or webviews)
    // without triggering X-Frame-Options crash or popup block
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      // If blocked by browser popup blocker, trigger a real anchor click with target="_blank"
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 300);
    }
  } catch {
    // Last resort fallback anchor
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
  }
}
