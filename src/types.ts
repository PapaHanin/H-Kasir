export type ProductCategory =
  | 'Sembako & Beras'
  | 'Minyak & Bumbu'
  | 'Mie & Makanan Instan'
  | 'Minuman, Kopi & Susu'
  | 'Makanan Ringan / Snack'
  | 'Sabun, Cuci & Kebersihan'
  | 'Perawatan & Obat Ringan'
  | 'Rokok & Korek'
  | 'Gas LPG & Galon Air'
  | 'Plastik, Baterai & Lainnya'
  | string;

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  buyPrice: number; // Harga modal / kulakan
  sellPrice: number; // Harga jual eceran
  stock: number;
  minStock: number;
  unit: string; // pcs, bks, renceng, botol, pack, dus, kg, karung, galon, tabung
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // diskon nominal per item
  subtotal: number;
}

export type PaymentMethod = 'TUNAI' | 'QRIS' | 'GOPAY' | 'OVO' | 'DANA' | 'SHOPEEPAY' | 'TRANSFER_BANK' | 'KASBON';

export interface TransactionItem {
  productId: string;
  productName: string;
  barcode: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  unit?: string;
  discount: number;
  subtotal: number;
  profit: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  cashierId: string;
  cashierName: string;
  items: TransactionItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  grandTotal: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  changeAmount?: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  status: 'COMPLETED' | 'CANCELLED';
  qrisRef?: string;
}

export interface CustomerDebt {
  id: string;
  customerName: string;
  phone?: string;
  address?: string;
  totalDebt: number;
  createdAt: string;
  dueDate?: string;
  notes?: string;
  transactions: {
    transactionId: string;
    invoiceNumber: string;
    date: string;
    amount: number;
    description: string;
  }[];
  payments: {
    id: string;
    date: string;
    amount: number;
    cashierName: string;
    notes?: string;
  }[];
}

export interface CashierUser {
  id: string;
  name: string;
  username: string;
  pin: string; // 4-6 digit PIN
  role: 'OWNER' | 'KASIR';
  isActive: boolean;
  createdAt: string;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startingCash: number; // modal awal di laci
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  totalTransactions: number;
  totalSales: number;
  totalCashSales: number;
  totalNonCashSales: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface StoreSettings {
  storeId?: string; // ID Unik Toko / Tenant ID untuk isolasi database Cloud
  storeName: string;
  ownerName?: string;
  tagline: string;
  address: string;
  phone: string;
  footerMessage: string;
  taxPercentage: number;
  enableTax: boolean;
  paperSize: '58mm' | '80mm';
  qrisMerchantName: string;
  qrisNmid: string;
  qrisCity?: string;
  qrisMode?: 'DYNAMIC_NMID' | 'CUSTOM_IMAGE' | 'RAW_STRING';
  qrisImageUrl?: string;
  qrisRawString?: string;
  autoPrintReceipt: boolean;
  playAudioFeedback: boolean;
  encryptionEnabled: boolean;
  enableCloudSync?: boolean;
  showSalesBrochure?: boolean; // Saklar untuk menyembunyikan brosur penawaran setelah aplikasi diserahkan ke klien
  vaultKeyHash?: string;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE';
  quantityChange: number;
  previousStock: number;
  currentStock: number;
  reason: string;
  timestamp: string;
  cashierName: string;
}

export interface HeldCart {
  id: string;
  name: string;
  customerName?: string;
  items: CartItem[];
  savedAt: string;
}
