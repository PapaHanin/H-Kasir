import CryptoJS from 'crypto-js';
import {
  Product,
  Transaction,
  CustomerDebt,
  CashierUser,
  CashierShift,
  StoreSettings,
  StockLog,
  HeldCart,
} from '../types';

const STORAGE_KEY = 'kelontong_pos_vault_v1';
const MASTER_KEY_STORAGE = 'kelontong_vault_secret_key';
const DEFAULT_KEY = 'KELONTONG_AES256_OFFLINE_SECURE_VAULT_KEY_2026';

const IDB_NAME = 'kelontong_pos_idb';
const IDB_STORE = 'vault';
const IDB_KEY = 'primary_data';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToIDB(dataStr: string): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(dataStr, IDB_KEY);
  } catch (err) {
    console.warn('Could not save to IndexedDB mirror:', err);
  }
}

async function loadFromIDB(): Promise<string | null> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export interface DatabaseSchema {
  version: number;
  products: Product[];
  transactions: Transaction[];
  debts: CustomerDebt[];
  users: CashierUser[];
  activeShift: CashierShift | null;
  shiftHistory: CashierShift[];
  settings: StoreSettings;
  stockLogs: StockLog[];
  heldCarts: HeldCart[];
  lastBackupDate?: string;
}

const INITIAL_USERS: CashierUser[] = [
  {
    id: 'user-owner-1',
    name: 'Pemilik / Kasir Utama',
    username: 'pemilik',
    pin: '1234',
    role: 'OWNER',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_SETTINGS: StoreSettings = {
  storeId: 'toko_offline_local',
  storeName: 'Toko Kelontong Anda',
  ownerName: 'Pemilik / Kasir Utama',
  tagline: 'Sembako Lengkap, Murah & Terpercaya',
  address: 'Jl. Raya Utama No. 01',
  phone: '0812-3456-7890',
  footerMessage: 'Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian. Terima kasih atas kunjungan Anda.',
  taxPercentage: 0,
  enableTax: false,
  paperSize: '58mm',
  qrisMerchantName: 'TOKO KELONTONG',
  qrisNmid: 'ID1020038920192',
  qrisCity: 'JAKARTA',
  qrisMode: 'DYNAMIC_NMID',
  autoPrintReceipt: true,
  playAudioFeedback: true,
  encryptionEnabled: true,
  enableCloudSync: false,
};

const INITIAL_PRODUCTS: Product[] = [
  // Sembako & Beras
  {
    id: 'p-sembako-01',
    barcode: '899100110001',
    name: 'Beras Ramos Super 5kg',
    category: 'Sembako & Beras',
    buyPrice: 68000,
    sellPrice: 75000,
    stock: 25,
    minStock: 5,
    unit: 'karung',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sembako-02',
    barcode: '899100110002',
    name: 'Beras Ramos Super 10kg',
    category: 'Sembako & Beras',
    buyPrice: 132000,
    sellPrice: 145000,
    stock: 20,
    minStock: 4,
    unit: 'karung',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sembako-03',
    barcode: '899100110003',
    name: 'Beras Pandan Wangi Pulen 5kg',
    category: 'Sembako & Beras',
    buyPrice: 76000,
    sellPrice: 84000,
    stock: 18,
    minStock: 4,
    unit: 'karung',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sembako-04',
    barcode: '899100110004',
    name: 'Gula Pasir Gulaku Tebu 1kg',
    category: 'Sembako & Beras',
    buyPrice: 16200,
    sellPrice: 18500,
    stock: 45,
    minStock: 10,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sembako-05',
    barcode: '899100110005',
    name: 'Gula Pasir Curah 1kg',
    category: 'Sembako & Beras',
    buyPrice: 15000,
    sellPrice: 17000,
    stock: 50,
    minStock: 10,
    unit: 'kg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sembako-06',
    barcode: '899100110006',
    name: 'Telur Ayam Negeri Segar 1kg',
    category: 'Sembako & Beras',
    buyPrice: 26000,
    sellPrice: 29000,
    stock: 35,
    minStock: 8,
    unit: 'kg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sembako-07',
    barcode: '899100110007',
    name: 'Tepung Terigu Segitiga Biru 1kg',
    category: 'Sembako & Beras',
    buyPrice: 11500,
    sellPrice: 13500,
    stock: 30,
    minStock: 6,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sembako-08',
    barcode: '899100110008',
    name: 'Tepung Tapioka Rose Brand 500g',
    category: 'Sembako & Beras',
    buyPrice: 6000,
    sellPrice: 7500,
    stock: 24,
    minStock: 5,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Minyak & Bumbu
  {
    id: 'p-bumbu-01',
    barcode: '899100220001',
    name: 'Minyak Goreng Bimoli Pouch 2 Liter',
    category: 'Minyak & Bumbu',
    buyPrice: 34500,
    sellPrice: 38500,
    stock: 40,
    minStock: 8,
    unit: 'pouch',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-02',
    barcode: '899100220002',
    name: 'Minyak Goreng SunCo 1 Liter',
    category: 'Minyak & Bumbu',
    buyPrice: 18000,
    sellPrice: 20500,
    stock: 30,
    minStock: 6,
    unit: 'pouch',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-03',
    barcode: '899100220003',
    name: 'Minyakita 1 Liter',
    category: 'Minyak & Bumbu',
    buyPrice: 14500,
    sellPrice: 16500,
    stock: 45,
    minStock: 10,
    unit: 'pouch',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-04',
    barcode: '899100220004',
    name: 'Kecap Manis Bango 520ml Refill',
    category: 'Minyak & Bumbu',
    buyPrice: 21500,
    sellPrice: 24500,
    stock: 20,
    minStock: 5,
    unit: 'pouch',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-05',
    barcode: '899100220005',
    name: 'Kecap Manis ABC 135ml Botol',
    category: 'Minyak & Bumbu',
    buyPrice: 6500,
    sellPrice: 8000,
    stock: 25,
    minStock: 5,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-06',
    barcode: '899100220006',
    name: 'Saus Sambal ABC Asli 335ml Botol',
    category: 'Minyak & Bumbu',
    buyPrice: 13500,
    sellPrice: 15500,
    stock: 18,
    minStock: 4,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-07',
    barcode: '899100220007',
    name: 'Royco Rasa Ayam (1 Renceng/12 sachet)',
    category: 'Minyak & Bumbu',
    buyPrice: 4800,
    sellPrice: 6000,
    stock: 60,
    minStock: 12,
    unit: 'renceng',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-08',
    barcode: '899100220008',
    name: 'Masako Rasa Sapi (1 Renceng/12 sachet)',
    category: 'Minyak & Bumbu',
    buyPrice: 4800,
    sellPrice: 6000,
    stock: 50,
    minStock: 10,
    unit: 'renceng',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-09',
    barcode: '899100220009',
    name: 'Garam Dapur Cap Kapal 250g',
    category: 'Minyak & Bumbu',
    buyPrice: 2500,
    sellPrice: 3500,
    stock: 45,
    minStock: 10,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-10',
    barcode: '899100220010',
    name: 'Micin Sasa Gurih 100g',
    category: 'Minyak & Bumbu',
    buyPrice: 4500,
    sellPrice: 5500,
    stock: 35,
    minStock: 6,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-bumbu-11',
    barcode: '899100220011',
    name: 'Ladaku Merica Bubuk (1 Renceng/12 sachet)',
    category: 'Minyak & Bumbu',
    buyPrice: 9500,
    sellPrice: 12000,
    stock: 30,
    minStock: 6,
    unit: 'renceng',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Mie & Makanan Instan
  {
    id: 'p-mie-01',
    barcode: '899100330001',
    name: 'Indomie Goreng Spesial 85g',
    category: 'Mie & Makanan Instan',
    buyPrice: 2900,
    sellPrice: 3500,
    stock: 150,
    minStock: 30,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-mie-02',
    barcode: '899100330002',
    name: 'Indomie Goreng 1 Dus (40 pcs)',
    category: 'Mie & Makanan Instan',
    buyPrice: 114000,
    sellPrice: 128000,
    stock: 12,
    minStock: 3,
    unit: 'dus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-mie-03',
    barcode: '899100330003',
    name: 'Indomie Kuah Ayam Bawang',
    category: 'Mie & Makanan Instan',
    buyPrice: 2850,
    sellPrice: 3500,
    stock: 90,
    minStock: 20,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-mie-04',
    barcode: '899100330004',
    name: 'Indomie Kuah Soto Lamongan / Mie',
    category: 'Mie & Makanan Instan',
    buyPrice: 2850,
    sellPrice: 3500,
    stock: 80,
    minStock: 20,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-mie-05',
    barcode: '899100330005',
    name: 'Mie Sedaap Goreng Original 90g',
    category: 'Mie & Makanan Instan',
    buyPrice: 2800,
    sellPrice: 3500,
    stock: 95,
    minStock: 20,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-mie-06',
    barcode: '899100330006',
    name: 'Sarimi Isi 2 Ayam Kecap',
    category: 'Mie & Makanan Instan',
    buyPrice: 3800,
    sellPrice: 4500,
    stock: 60,
    minStock: 15,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-mie-07',
    barcode: '899100330007',
    name: 'Sarden ABC Tomat 155g',
    category: 'Mie & Makanan Instan',
    buyPrice: 9500,
    sellPrice: 11500,
    stock: 30,
    minStock: 6,
    unit: 'kaleng',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Minuman, Kopi & Susu
  {
    id: 'p-minum-01',
    barcode: '899100440001',
    name: 'Aqua Botol 600ml Sedang',
    category: 'Minuman, Kopi & Susu',
    buyPrice: 3000,
    sellPrice: 4000,
    stock: 80,
    minStock: 15,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-minum-02',
    barcode: '899100440002',
    name: 'Le Minerale 600ml',
    category: 'Minuman, Kopi & Susu',
    buyPrice: 2800,
    sellPrice: 4000,
    stock: 70,
    minStock: 15,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-minum-03',
    barcode: '899100440003',
    name: 'Teh Pucuk Harum 350ml Dingin',
    category: 'Minuman, Kopi & Susu',
    buyPrice: 3200,
    sellPrice: 4500,
    stock: 60,
    minStock: 12,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-minum-04',
    barcode: '899100440004',
    name: 'Kopi Kapal Api Spesial Mix (1 Rtg/10 sachet)',
    category: 'Minuman, Kopi & Susu',
    buyPrice: 12800,
    sellPrice: 15500,
    stock: 40,
    minStock: 8,
    unit: 'renceng',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-minum-05',
    barcode: '899100440005',
    name: 'Kopi Good Day Cappuccino (1 Rtg/10 sachet)',
    category: 'Minuman, Kopi & Susu',
    buyPrice: 18500,
    sellPrice: 22000,
    stock: 35,
    minStock: 6,
    unit: 'renceng',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-minum-06',
    barcode: '899100440006',
    name: 'Teh Celup SariWangi Kotak (Isi 25)',
    category: 'Minuman, Kopi & Susu',
    buyPrice: 5800,
    sellPrice: 7500,
    stock: 30,
    minStock: 6,
    unit: 'kotak',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-minum-07',
    barcode: '899100440007',
    name: 'Susu Kental Manis Frisian Flag Pouch 545g',
    category: 'Minuman, Kopi & Susu',
    buyPrice: 16500,
    sellPrice: 19000,
    stock: 25,
    minStock: 5,
    unit: 'pouch',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-minum-08',
    barcode: '899100440008',
    name: 'Ultra Milk Cokelat Kotak 250ml',
    category: 'Minuman, Kopi & Susu',
    buyPrice: 5800,
    sellPrice: 7000,
    stock: 36,
    minStock: 8,
    unit: 'kotak',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Makanan Ringan / Snack
  {
    id: 'p-snack-01',
    barcode: '899100550001',
    name: 'Chitato Sapi Panggang 68g',
    category: 'Makanan Ringan / Snack',
    buyPrice: 8800,
    sellPrice: 11000,
    stock: 25,
    minStock: 5,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-snack-02',
    barcode: '899100550002',
    name: 'Tango Wafer Cokelat 130g',
    category: 'Makanan Ringan / Snack',
    buyPrice: 6500,
    sellPrice: 8000,
    stock: 30,
    minStock: 6,
    unit: 'kotak',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-snack-03',
    barcode: '899100550003',
    name: 'Biskuit Roma Kelapa 300g',
    category: 'Makanan Ringan / Snack',
    buyPrice: 9200,
    sellPrice: 11500,
    stock: 25,
    minStock: 5,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-snack-04',
    barcode: '899100550004',
    name: 'Roma Malkist Crackers Abon 135g',
    category: 'Makanan Ringan / Snack',
    buyPrice: 6500,
    sellPrice: 8000,
    stock: 25,
    minStock: 5,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-snack-05',
    barcode: '899100550005',
    name: 'Beng-Beng Cokelat Karamel (1 Box/20 pcs)',
    category: 'Makanan Ringan / Snack',
    buyPrice: 38000,
    sellPrice: 45000,
    stock: 15,
    minStock: 3,
    unit: 'box',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Sabun, Cuci & Kebersihan
  {
    id: 'p-sabun-01',
    barcode: '899100660001',
    name: 'Sunlight Cuci Piring Jeruk Nipis 650ml',
    category: 'Sabun, Cuci & Kebersihan',
    buyPrice: 13500,
    sellPrice: 16000,
    stock: 30,
    minStock: 6,
    unit: 'pouch',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sabun-02',
    barcode: '899100660002',
    name: 'Deterjen Rinso Molto Bubuk 770g',
    category: 'Sabun, Cuci & Kebersihan',
    buyPrice: 19500,
    sellPrice: 23000,
    stock: 24,
    minStock: 5,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sabun-03',
    barcode: '899100660003',
    name: 'SoKlin Pewangi Pakaian (1 Rtg/12 sachet)',
    category: 'Sabun, Cuci & Kebersihan',
    buyPrice: 5000,
    sellPrice: 6500,
    stock: 40,
    minStock: 8,
    unit: 'renceng',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sabun-04',
    barcode: '899100660004',
    name: 'Sabun Mandi Lifebuoy Bar 85g',
    category: 'Sabun, Cuci & Kebersihan',
    buyPrice: 3800,
    sellPrice: 5000,
    stock: 45,
    minStock: 10,
    unit: 'batang',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sabun-05',
    barcode: '899100660005',
    name: 'Pasta Gigi Pepsodent 190g',
    category: 'Sabun, Cuci & Kebersihan',
    buyPrice: 11500,
    sellPrice: 14000,
    stock: 20,
    minStock: 4,
    unit: 'kotak',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sabun-06',
    barcode: '899100660006',
    name: 'Shampoo Sunsilk Black Shine 160ml',
    category: 'Sabun, Cuci & Kebersihan',
    buyPrice: 19000,
    sellPrice: 23000,
    stock: 15,
    minStock: 3,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-sabun-07',
    barcode: '899100660007',
    name: 'Wipol Karbol Pembersih Lantai 750ml',
    category: 'Sabun, Cuci & Kebersihan',
    buyPrice: 17500,
    sellPrice: 21000,
    stock: 18,
    minStock: 4,
    unit: 'pouch',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Perawatan & Obat Ringan
  {
    id: 'p-obat-01',
    barcode: '899100770001',
    name: 'Minyak Kayu Putih Cap Lang 60ml',
    category: 'Perawatan & Obat Ringan',
    buyPrice: 21500,
    sellPrice: 25000,
    stock: 20,
    minStock: 4,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-obat-02',
    barcode: '899100770002',
    name: 'Bodrex Sakit Kepala (1 Lembar/4 tab)',
    category: 'Perawatan & Obat Ringan',
    buyPrice: 3500,
    sellPrice: 5000,
    stock: 40,
    minStock: 10,
    unit: 'strip',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-obat-03',
    barcode: '899100770003',
    name: 'Panadol Merah Extra (1 Blister/10 tab)',
    category: 'Perawatan & Obat Ringan',
    buyPrice: 12500,
    sellPrice: 15000,
    stock: 25,
    minStock: 5,
    unit: 'blister',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-obat-04',
    barcode: '899100770004',
    name: 'Tolak Angin Cair SidoMuncul (1 Sachet)',
    category: 'Perawatan & Obat Ringan',
    buyPrice: 3800,
    sellPrice: 4500,
    stock: 60,
    minStock: 12,
    unit: 'sachet',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-obat-05',
    barcode: '899100770005',
    name: 'Promag Obat Maag (1 Blister/10 tab)',
    category: 'Perawatan & Obat Ringan',
    buyPrice: 8500,
    sellPrice: 10500,
    stock: 30,
    minStock: 6,
    unit: 'blister',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-obat-06',
    barcode: '899100770006',
    name: 'Tisu Wajah Paseo Smart 250 Sheets',
    category: 'Perawatan & Obat Ringan',
    buyPrice: 12000,
    sellPrice: 14500,
    stock: 25,
    minStock: 5,
    unit: 'pack',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Rokok & Korek
  {
    id: 'p-rokok-01',
    barcode: '899100880001',
    name: 'Sampoerna A Mild 16 Batang',
    category: 'Rokok & Korek',
    buyPrice: 32000,
    sellPrice: 35000,
    stock: 35,
    minStock: 6,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-rokok-02',
    barcode: '899100880002',
    name: 'Djarum Super 12 Batang',
    category: 'Rokok & Korek',
    buyPrice: 22500,
    sellPrice: 25000,
    stock: 30,
    minStock: 6,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-rokok-03',
    barcode: '899100880003',
    name: 'Gudang Garam Surya 16 Batang',
    category: 'Rokok & Korek',
    buyPrice: 31000,
    sellPrice: 34000,
    stock: 30,
    minStock: 6,
    unit: 'bungkus',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-rokok-04',
    barcode: '899100880004',
    name: 'Korek Api Gas Tokai Original',
    category: 'Rokok & Korek',
    buyPrice: 2800,
    sellPrice: 4000,
    stock: 50,
    minStock: 10,
    unit: 'pcs',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Gas LPG & Galon Air
  {
    id: 'p-gas-01',
    barcode: '899100990001',
    name: 'Isi Ulang Gas LPG 3kg Melon',
    category: 'Gas LPG & Galon Air',
    buyPrice: 19000,
    sellPrice: 22000,
    stock: 18,
    minStock: 4,
    unit: 'tabung',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-gas-02',
    barcode: '899100990002',
    name: 'Isi Ulang Air Galon Aqua 19 Liter',
    category: 'Gas LPG & Galon Air',
    buyPrice: 17500,
    sellPrice: 20500,
    stock: 25,
    minStock: 5,
    unit: 'galon',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-gas-03',
    barcode: '899100990003',
    name: 'Isi Ulang Galon Le Minerale 15 Liter',
    category: 'Gas LPG & Galon Air',
    buyPrice: 16500,
    sellPrice: 19500,
    stock: 20,
    minStock: 4,
    unit: 'galon',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Plastik, Baterai & Lainnya
  {
    id: 'p-lain-01',
    barcode: '899100000001',
    name: 'Kantong Kresek Putih Bening Sedang (1 Pack)',
    category: 'Plastik, Baterai & Lainnya',
    buyPrice: 6000,
    sellPrice: 8000,
    stock: 30,
    minStock: 5,
    unit: 'pack',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-lain-02',
    barcode: '899100000002',
    name: 'Baterai ABC Alkaline AA (Isi 2 pcs)',
    category: 'Plastik, Baterai & Lainnya',
    buyPrice: 12000,
    sellPrice: 15000,
    stock: 20,
    minStock: 4,
    unit: 'pack',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-lain-03',
    barcode: '899100000003',
    name: 'Obat Nyamuk Bakar Baygon Jumbo (Isi 10)',
    category: 'Plastik, Baterai & Lainnya',
    buyPrice: 5500,
    sellPrice: 7000,
    stock: 25,
    minStock: 5,
    unit: 'kotak',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// AES-256 Vault Manager for local data persistence
class LocalEncryptedDatabase {
  private memoryCache: DatabaseSchema | null = null;
  private listeners: Set<() => void> = new Set();

  private getVaultKey(): string {
    if (typeof window === 'undefined') return DEFAULT_KEY;
    const stored = localStorage.getItem(MASTER_KEY_STORAGE);
    return stored || DEFAULT_KEY;
  }

  public setVaultKey(newKey: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MASTER_KEY_STORAGE, newKey);
    // Re-save existing data with new key
    if (this.memoryCache) {
      this.save(this.memoryCache);
    }
  }

  // Encrypt string with AES-256
  private encrypt(data: string, secretKey: string): string {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  }

  // Decrypt string with AES-256
  private decrypt(ciphertext: string, secretKey: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Initialize and load data
  public load(): DatabaseSchema {
    if (this.memoryCache) return this.memoryCache;

    if (typeof window === 'undefined') {
      return this.getInitialSchema();
    }

    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) {
        const initial = this.getInitialSchema();
        this.save(initial);
        this.memoryCache = initial;
        return initial;
      }

      const key = this.getVaultKey();
      let decryptedStr = '';
      try {
        decryptedStr = this.decrypt(encrypted, key);
      } catch {
        // Fallback to default key if custom key failed
        decryptedStr = this.decrypt(encrypted, DEFAULT_KEY);
      }

      if (!decryptedStr) {
        // Fallback or plain text migration
        try {
          const plainObj = JSON.parse(encrypted);
          this.memoryCache = plainObj;
          this.save(plainObj);
          return plainObj;
        } catch {
          const initial = this.getInitialSchema();
          this.save(initial);
          this.memoryCache = initial;
          return initial;
        }
      }

      const data: DatabaseSchema = JSON.parse(decryptedStr);
      // Migration guarantee & clean up demo users / agricultural data (Toko Kelontong pure)
      if (
        data.settings &&
        data.settings.storeName &&
        (data.settings.storeName.toLowerCase().includes('sawit') ||
          data.settings.storeName.toLowerCase().includes('hasil bumi') ||
          data.settings.storeName.toLowerCase().includes('ram '))
      ) {
        data.settings = INITIAL_SETTINGS;
      }
      if (!data.products || data.products.length === 0) {
        data.products = INITIAL_PRODUCTS;
      } else {
        // Strip legacy sawit or hasil bumi products if present
        data.products = data.products.filter(
          (p) =>
            p.category !== 'Hasil Bumi & Sawit' &&
            p.category !== 'Pupuk & Saprotan' &&
            p.category !== 'Alat Panen & Perlengkapan' &&
            !p.category.toLowerCase().includes('sawit') &&
            !p.category.toLowerCase().includes('hasil bumi') &&
            !p.name.toLowerCase().includes('sawit') &&
            !p.name.toLowerCase().includes('egrek') &&
            !p.name.toLowerCase().includes('dodos') &&
            !p.name.toLowerCase().includes('tbs')
        );
        if (data.products.length === 0) {
          data.products = INITIAL_PRODUCTS;
        }
      }
      if (!data.settings) {
        data.settings = INITIAL_SETTINGS;
      } else if (data.settings.enableCloudSync === undefined) {
        data.settings.enableCloudSync = false;
      }
      if (!data.debts) data.debts = [];
      if (!data.transactions) data.transactions = [];
      if (!data.stockLogs) data.stockLogs = [];
      if (!data.heldCarts) data.heldCarts = [];
      if (!data.shiftHistory) data.shiftHistory = [];

      this.memoryCache = data;
      return data;
    } catch {
      const initial = this.getInitialSchema();
      this.save(initial);
      this.memoryCache = initial;
      return initial;
    }
  }

  public save(data: DatabaseSchema): void {
    this.memoryCache = data;
    if (typeof window === 'undefined') return;

    try {
      const jsonStr = JSON.stringify(data);
      const key = this.getVaultKey();
      const encrypted = this.encrypt(jsonStr, key);
      localStorage.setItem(STORAGE_KEY, encrypted);
      saveToIDB(jsonStr); // Mirror into browser IndexedDB
      this.notifyListeners();
    } catch {
      // LocalStorage full or private browsing exception
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  private getInitialSchema(): DatabaseSchema {
    return {
      version: 1,
      products: INITIAL_PRODUCTS,
      transactions: [],
      debts: [],
      users: INITIAL_USERS,
      activeShift: null,
      shiftHistory: [],
      settings: INITIAL_SETTINGS,
      stockLogs: [],
      heldCarts: [],
      lastBackupDate: new Date().toISOString(),
    };
  }

  // Check if browser has granted persistent storage permission
  public async isStoragePersisted(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  }

  // Request persistent storage so browser never purges app data
  public async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  }

  // Asynchronous recovery check from IndexedDB if LocalStorage was cleared
  public async checkAndRecoverFromIndexedDB(): Promise<boolean> {
    try {
      const idbData = await loadFromIDB();
      if (!idbData) return false;
      const parsed: DatabaseSchema = JSON.parse(idbData);
      if (parsed.products && parsed.products.length > 0) {
        this.save(parsed);
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  }

  // Export full human-readable JSON backup
  public exportJsonBackup(): string {
    const data = this.load();
    const backupObj = {
      app: 'KasirKelontong POS Modern',
      version: data.version || 1,
      exportedAt: new Date().toISOString(),
      storeName: data.settings?.storeName || 'Toko Kelontong',
      summary: {
        totalProducts: data.products?.length || 0,
        totalTransactions: data.transactions?.length || 0,
        totalDebts: data.debts?.length || 0,
      },
      data,
    };
    return JSON.stringify(backupObj, null, 2);
  }

  // Restore from JSON backup
  public restoreJsonBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      const schema: DatabaseSchema = parsed.data || parsed.schema || parsed;
      if (!schema.products || !schema.users) return false;
      this.save(schema);
      return true;
    } catch {
      return false;
    }
  }

  // Raw encrypted backup export (with AES-256)
  public exportEncryptedBackup(customPassword?: string): string {
    const data = this.load();
    const payload = JSON.stringify({
      schema: data,
      exportedAt: new Date().toISOString(),
      app: 'KasirKelontong POS',
      encryption: 'AES-256',
    });
    const key = customPassword || this.getVaultKey();
    return CryptoJS.AES.encrypt(payload, key).toString();
  }

  // Restore encrypted backup file
  public restoreEncryptedBackup(encryptedString: string, password?: string): boolean {
    const key = password || this.getVaultKey();
    try {
      let decrypted = '';
      try {
        decrypted = this.decrypt(encryptedString, key);
      } catch {
        decrypted = this.decrypt(encryptedString, DEFAULT_KEY);
      }

      if (!decrypted) return false;
      const parsed = JSON.parse(decrypted);
      const schema: DatabaseSchema = parsed.schema || parsed;
      if (!schema.products || !schema.users) return false;

      this.save(schema);
      return true;
    } catch {
      return false;
    }
  }

  // Reset database to default seed
  public resetToFactoryDefault() {
    const fresh = this.getInitialSchema();
    this.save(fresh);
  }

  // Clear transactional history for a new store client (wipes transactions, debts, shifts, logs)
  public clearStoreForNewClient(options?: { keepProducts?: boolean }) {
    const current = this.load();
    const freshSchema: DatabaseSchema = {
      ...current,
      transactions: [],
      debts: [],
      activeShift: null,
      shiftHistory: [],
      stockLogs: [],
      heldCarts: [],
      products: options?.keepProducts ? current.products : [],
    };
    this.save(freshSchema);
    return freshSchema;
  }

  public saveSettings(settings: StoreSettings) {
    const current = this.load();
    current.settings = settings;
    this.save(current);
  }
}

export const db = new LocalEncryptedDatabase();
