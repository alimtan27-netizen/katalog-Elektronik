export type ProductCategory =
  | 'Semua'
  | 'Laptop & Komputer'
  | 'Ponsel & Tablet'
  | 'Kamera & Audio'
  | 'Aksesoris & Gadget';

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  condition: 'Baru' | 'Bekas Mulus' | 'Like New' | 'Bagus';
  sellerName: string;
  sellerPhone: string;
  location: string;
  description: string;
  specs: string[];
  images: string[]; // Base64 or URL
  createdAt: number;
  isVerifiedByAdmin?: boolean;
  status: 'Tersedia' | 'Terjual' | 'Dipesan' | 'Habis';
  stock: number; // Jumlah stok barang (1, 5, 10, 50, 100+ unit)
}

export interface SellerProfile {
  storeName: string;
  phone: string;
  city?: string;
  joinedAt: number;
}

export interface BuyerProfile {
  name: string;
  phone: string;
  email?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'buyer' | 'admin' | 'system';
  senderName: string;
  senderPhone?: string;
  text: string;
  timestamp: number;
  productId?: string;
  productTitle?: string;
  productPrice?: number;
  productImage?: string;
}

export interface ManualBankAccount {
  id: string;
  bankName: string; // e.g. 'BCA', 'BRI', 'Mandiri', 'BNI', 'DANA', 'GoPay', 'Bank Jago', 'Seabank', dll
  accountNumber: string; // Nomor rekening yang bisa diinput sendiri oleh pengguna/admin
  accountHolder: string; // Atas Nama (A/N) pemilik rekening
  notes?: string;
  isDefault?: boolean;
}

export type PaymentChannel = string;

export interface Order {
  id: string;
  invoiceNumber: string;
  product: Product;
  buyerName: string;
  buyerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentMethodName: string;
  accountOrVaNumber: string;
  accountHolder?: string;
  totalAmount: number;
  quantity?: number; // Jumlah unit yang dibeli (default: 1)
  status: 'MENUNGGU_PEMBAYARAN' | 'PEMBAYARAN_BERHASIL' | 'DIPROSES_ADMIN' | 'DIKIRIM' | 'SELESAI';
  createdAt: number;
  paidAt?: number;
  paymentExpiresAt: number;
  adminNotes?: string;
  transferProofUrl?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'order' | 'payment' | 'chat' | 'system';
  read: boolean;
  targetId?: string; // e.g. orderId or chatId
}
