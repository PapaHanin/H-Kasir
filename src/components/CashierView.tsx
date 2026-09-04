import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  Tag,
  PauseCircle,
  PlayCircle,
  ShoppingBag,
  ArrowRight,
  Package,
  CheckSquare,
  Square,
  Percent,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import {
  Product,
  ProductCategory,
  CartItem,
  HeldCart,
  StoreSettings,
  CashierUser,
  Transaction,
} from '../types';
import { formatRupiah } from '../services/export';
import { sound } from '../services/sound';
import { CheckoutModal } from './CheckoutModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';

const CATEGORIES: ('ALL' | string)[] = [
  'ALL',
  'Sembako & Beras',
  'Minyak & Bumbu',
  'Mie & Makanan Instan',
  'Minuman, Kopi & Susu',
  'Makanan Ringan / Snack',
  'Sabun, Cuci & Kebersihan',
  'Perawatan & Obat Ringan',
  'Rokok & Korek',
  'Gas LPG & Galon Air',
  'Plastik, Baterai & Lainnya',
];

const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'Sembako & Beras':
      return {
        gradientBar: 'from-amber-500 via-orange-500 to-amber-600',
        badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        cardBorderHover: 'hover:border-amber-500/70 hover:shadow-amber-500/15',
        accentColor: 'text-amber-600 dark:text-amber-400',
        icon: '🌾',
      };
    case 'Minyak & Bumbu':
      return {
        gradientBar: 'from-rose-500 via-red-500 to-rose-600',
        badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        cardBorderHover: 'hover:border-rose-500/70 hover:shadow-rose-500/15',
        accentColor: 'text-rose-600 dark:text-rose-400',
        icon: '🍳',
      };
    case 'Mie & Makanan Instan':
      return {
        gradientBar: 'from-orange-500 via-amber-500 to-orange-600',
        badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
        cardBorderHover: 'hover:border-orange-500/70 hover:shadow-orange-500/15',
        accentColor: 'text-orange-600 dark:text-orange-400',
        icon: '🍜',
      };
    case 'Minuman, Kopi & Susu':
      return {
        gradientBar: 'from-sky-500 via-blue-500 to-cyan-500',
        badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
        cardBorderHover: 'hover:border-sky-500/70 hover:shadow-sky-500/15',
        accentColor: 'text-sky-600 dark:text-sky-400',
        icon: '☕',
      };
    case 'Makanan Ringan / Snack':
      return {
        gradientBar: 'from-fuchsia-500 via-pink-500 to-rose-500',
        badgeBg: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-pink-300 border-fuchsia-500/30',
        cardBorderHover: 'hover:border-fuchsia-500/70 hover:shadow-fuchsia-500/15',
        accentColor: 'text-fuchsia-600 dark:text-pink-400',
        icon: '🍿',
      };
    case 'Sabun, Cuci & Kebersihan':
      return {
        gradientBar: 'from-emerald-500 via-teal-500 to-cyan-600',
        badgeBg: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
        cardBorderHover: 'hover:border-teal-500/70 hover:shadow-teal-500/15',
        accentColor: 'text-teal-600 dark:text-teal-400',
        icon: '🧼',
      };
    case 'Perawatan & Obat Ringan':
      return {
        gradientBar: 'from-indigo-500 via-purple-500 to-pink-500',
        badgeBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        cardBorderHover: 'hover:border-indigo-500/70 hover:shadow-indigo-500/15',
        accentColor: 'text-indigo-600 dark:text-indigo-400',
        icon: '💊',
      };
    case 'Rokok & Korek':
      return {
        gradientBar: 'from-slate-600 via-zinc-700 to-neutral-800',
        badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
        cardBorderHover: 'hover:border-slate-500/70 hover:shadow-slate-500/15',
        accentColor: 'text-slate-700 dark:text-slate-300',
        icon: '🚬',
      };
    case 'Gas LPG & Galon Air':
      return {
        gradientBar: 'from-blue-600 via-indigo-600 to-cyan-500',
        badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
        cardBorderHover: 'hover:border-blue-500/70 hover:shadow-blue-500/15',
        accentColor: 'text-blue-600 dark:text-blue-400',
        icon: '🔥',
      };
    case 'Plastik, Baterai & Lainnya':
    default:
      return {
        gradientBar: 'from-purple-600 via-fuchsia-600 to-pink-600',
        badgeBg: 'bg-purple-500/15 text-purple-700 dark:text-pink-300 border-purple-500/30',
        cardBorderHover: 'hover:border-purple-500/70 hover:shadow-purple-500/15',
        accentColor: 'text-purple-600 dark:text-pink-400',
        icon: '📦',
      };
  }
};

interface CashierViewProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  heldCarts: HeldCart[];
  setHeldCarts: React.Dispatch<React.SetStateAction<HeldCart[]>>;
  settings: StoreSettings;
  currentUser: CashierUser | null;
  onTransactionCompleted: (trx: Transaction) => void;
  onSaveProduct?: (product: Product) => void;
  darkMode: boolean;
}

export const CashierView: React.FC<CashierViewProps> = ({
  products,
  cart,
  setCart,
  heldCarts,
  setHeldCarts,
  settings,
  currentUser,
  onTransactionCompleted,
  onSaveProduct,
  darkMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([]);
  const [scanToast, setScanToast] = useState<string | null>(null);

  // Quick Register Modal State for Unrecognized Packaging Barcodes
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);
  const [quickRegisterBarcode, setQuickRegisterBarcode] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState<ProductCategory>('Sembako & Beras');
  const [quickBuyPrice, setQuickBuyPrice] = useState<number>(0);
  const [quickSellPrice, setQuickSellPrice] = useState<number>(0);
  const [quickStock, setQuickStock] = useState<number>(20);
  const [quickUnit, setQuickUnit] = useState<string>('pcs');

  // Cart Checkbox Selection Helpers
  const isAllCartSelected = useMemo(() => {
    if (cart.length === 0) return false;
    return cart.every((item) => selectedCartIds.includes(item.product.id));
  }, [cart, selectedCartIds]);

  const toggleSelectAllCart = () => {
    if (isAllCartSelected) {
      setSelectedCartIds([]);
    } else {
      setSelectedCartIds(cart.map((item) => item.product.id));
    }
  };

  const toggleSelectCartItem = (productId: string) => {
    setSelectedCartIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleBulkRemoveFromCart = () => {
    if (selectedCartIds.length === 0) return;
    sound.playBeep(400, 0.04);
    setCart((prev) => prev.filter((item) => !selectedCartIds.includes(item.product.id)));
    setSelectedCartIds([]);
  };

  // Filter products by category and query (name / barcode / category)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Fast add product to cart
  const handleAddToCart = (product: Product, qtyToAdd = 1) => {
    if (product.stock <= 0) {
      sound.playError();
      alert(`Stok ${product.name} saat ini habis!`);
      return;
    }

    sound.playBeep(880, 0.05);

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const item = prev[existingIdx];
        const newQty = item.quantity + qtyToAdd;
        if (newQty > product.stock) {
          alert(`Maksimal stok tersedia hanya ${product.stock} ${product.unit}`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.product.sellPrice - item.discount,
        };
        return updated;
      } else {
        const defaultQty = qtyToAdd;
        const sub = defaultQty * product.sellPrice;
        return [
          ...prev,
          {
            product,
            quantity: defaultQty,
            discount: 0,
            subtotal: sub,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Maksimal stok tersedia: ${item.product.stock} ${item.product.unit}`);
              return item;
            }
            sound.playBeep(700, 0.03);
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.product.sellPrice - item.discount,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleDirectQtyChange = (productId: string, newQtyNum: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const qty = Math.max(1, newQtyNum);
          if (qty > item.product.stock) {
            alert(`Maksimal stok tersedia: ${item.product.stock} ${item.product.unit}`);
            return item;
          }
          return {
            ...item,
            quantity: qty,
            subtotal: Math.round(qty * item.product.sellPrice) - item.discount,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    sound.playBeep(400, 0.04);
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Kosongkan semua barang di keranjang?')) {
      setCart([]);
      setCartDiscount(0);
    }
  };

  // Hold current cart (Simpan Antrian)
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const name =
      prompt('Masukkan nama antrian (contoh: Bu Siti / Antrian 1):') ||
      `Antrian #${heldCarts.length + 1}`;
    const newHold: HeldCart = {
      id: `hold-${Date.now()}`,
      name,
      items: [...cart],
      savedAt: new Date().toISOString(),
    };
    setHeldCarts((prev) => [...prev, newHold]);
    setCart([]);
    setCartDiscount(0);
    sound.playSuccess();
  };

  // Restore held cart
  const handleRestoreCart = (held: HeldCart) => {
    if (cart.length > 0) {
      if (
        !confirm(
          'Keranjang saat ini berisi barang. Simpan antrian saat ini dulu sebelum membuka antrian lain?'
        )
      ) {
        return;
      }
      handleHoldCart();
    }
    setCart(held.items);
    setHeldCarts((prev) => prev.filter((h) => h.id !== held.id));
    sound.playSuccess();
  };

  // Hardware Scanner Gun Listener (USB / Bluetooth Barcode Scanners)
  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT');

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (keyBufferRef.current.length >= 6) {
          e.preventDefault();
          const scannedCode = keyBufferRef.current.trim();
          keyBufferRef.current = '';
          handleBarcodeScanned(scannedCode);
          return;
        }
        keyBufferRef.current = '';
        return;
      }

      // Barcode characters (digits and letters)
      if (e.key.length === 1) {
        if (timeDiff > 100) {
          if (!isInputFocused) {
            keyBufferRef.current = e.key;
          } else {
            keyBufferRef.current = '';
          }
        } else {
          keyBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, cart]);

  // Barcode scanned handler (from camera, hardware scanner, or simulation)
  const handleBarcodeScanned = (barcode: string) => {
    const clean = barcode.trim();
    if (!clean) return;

    const found = products.find(
      (p) =>
        p.barcode === clean ||
        p.barcode.endsWith(clean) ||
        clean.endsWith(p.barcode)
    );

    if (found) {
      handleAddToCart(found, 1);
      setScanToast(`+1 ${found.name} (${formatRupiah(found.sellPrice)}) otomatis masuk keranjang!`);
      setTimeout(() => setScanToast(null), 3000);
      sound.playBeep(880, 0.08);
    } else {
      sound.playError();
      setQuickRegisterBarcode(clean);
      setQuickName('');
      setQuickBuyPrice(0);
      setQuickSellPrice(0);
      setQuickStock(20);
      setQuickUnit('pcs');
      setIsQuickRegisterOpen(true);
    }
  };

  // Quick Register Product Form Submit
  const handleQuickRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      barcode: quickRegisterBarcode.trim(),
      name: quickName.trim(),
      category: quickCategory,
      buyPrice: quickBuyPrice,
      sellPrice: quickSellPrice,
      stock: quickStock,
      minStock: 5,
      unit: quickUnit.trim() || 'pcs',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveProduct?.(newProd);
    handleAddToCart(newProd, 1);
    setIsQuickRegisterOpen(false);
    setScanToast(`✓ +1 ${newProd.name} berhasil didaftarkan & masuk ke keranjang!`);
    setTimeout(() => setScanToast(null), 3500);
    sound.playSuccess();
  };

  // Search input Enter key handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const query = searchQuery.trim();
      const found = products.find(
        (p) =>
          p.barcode === query ||
          p.barcode.endsWith(query) ||
          p.name.toLowerCase() === query.toLowerCase()
      );
      if (found) {
        handleAddToCart(found, 1);
        setSearchQuery('');
        setScanToast(`+1 ${found.name} otomatis masuk ke keranjang!`);
        setTimeout(() => setScanToast(null), 2500);
        sound.playSuccess();
      }
    }
  };

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const grandTotal = Math.max(0, subtotal - cartDiscount);

  const totalCost = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.buyPrice * item.quantity, 0);
  }, [cart]);

  return (
    <div id="cashier-pos-container" className="max-w-7xl mx-auto space-y-4 relative">
      {/* Floating Scan Toast Notification */}
      {scanToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl font-black text-xs sm:text-sm flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{scanToast}</span>
        </div>
      )}

      {/* Top Action Bar: Search, Barcode button & Held carts */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* Search Bar & Barcode Scanner Button */}
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              id="input-pos-product-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari nama produk atau scan barcode kemasan di sini..."
              className={`w-full pl-10 pr-8 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                darkMode
                  ? 'bg-slate-900/90 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-purple-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-xs'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            id="btn-open-barcode-scanner"
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl flex items-center gap-2 font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Scan Barcode dari Kemasan Produk"
          >
            <Scan className="w-4 h-4 text-pink-200" />
            <div className="text-left leading-tight">
              <div>Scan Kemasan</div>
              <div className="text-[9px] text-pink-200 font-normal hidden sm:block">Otomatis Masuk Keranjang</div>
            </div>
          </button>
        </div>

        {/* Held Carts (Simpan Antrian) Quick Pill */}
        {heldCarts.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
              <PauseCircle className="w-4 h-4" />
              <span>Antrian:</span>
            </span>
            {heldCarts.map((h) => (
              <button
                key={h.id}
                onClick={() => handleRestoreCart(h)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors shrink-0 cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>{h.name} ({h.items.length})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category Chips Scrollbar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-thin">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const style = getCategoryStyle(cat);
          return (
            <button
              key={cat}
              id={`cat-chip-${cat.replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => {
                sound.playBeep(600, 0.03);
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md shadow-purple-500/20'
                  : darkMode
                  ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              {cat === 'ALL' ? '🌟 Semua Kategori' : `${style.icon} ${cat}`}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Products Catalog, Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Product Grid (7-8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400 font-mono">
                KATALOG BARANG TOKO ({filteredProducts.length})
              </span>
            </div>
            <span className="text-xs text-slate-400">Klik kartu barang untuk tambah ke keranjang</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((i) => i.product.id === product.id);
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock <= 0;
              const catStyle = getCategoryStyle(product.category);

              return (
                <button
                  key={product.id}
                  id={`btn-product-card-${product.id}`}
                  type="button"
                  onClick={() => handleAddToCart(product, 1)}
                  disabled={isOutOfStock}
                  className={`group text-left rounded-2xl border transition-all duration-200 relative flex flex-col justify-between overflow-hidden cursor-pointer shadow-xs hover:shadow-lg ${
                    isOutOfStock
                      ? 'opacity-40 grayscale cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800'
                      : darkMode
                      ? `bg-slate-900/90 border-slate-800/90 ${catStyle.cardBorderHover} hover:bg-slate-850 active:scale-[0.98] text-slate-100`
                      : `bg-white border-slate-200 ${catStyle.cardBorderHover} hover:border-pink-300 active:scale-[0.98] text-slate-800`
                  }`}
                >
                  {/* Top Colorful Accent Strip */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${catStyle.gradientBar}`} />

                  {/* Cart badge if already in cart */}
                  {inCartItem && (
                    <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs w-6 h-6 rounded-lg flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 font-mono z-10 animate-scale">
                      {inCartItem.quantity}
                    </div>
                  )}

                  <div className="p-3">
                    {/* Category pill with Icon & Stock badge */}
                    <div className="flex items-center justify-between text-[10px] mb-2 gap-1">
                      <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md border text-[10px] truncate max-w-[110px] ${catStyle.badgeBg}`}>
                        <span>{catStyle.icon}</span>
                        <span className="truncate">{product.category.split('&')[0]}</span>
                      </span>
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded-md text-[10px] font-mono shrink-0 ${
                          isOutOfStock
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : isLowStock
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-pink-400 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Barcode Footer */}
                  <div className="p-3 pt-0 mt-auto">
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                          #{product.barcode.slice(-6)}
                        </div>
                        <div className="font-black text-sm sm:text-base bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent font-numeric">
                          {formatRupiah(product.sellPrice)}
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-pink-400 border border-purple-500/20 flex items-center justify-center group-hover:from-purple-600 group-hover:to-pink-600 group-hover:text-white transition-all shadow-2xs">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cart & Checkout Summary (4-5 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <div
            id="pos-cart-panel"
            className={`rounded-2xl border shadow-xl flex flex-col min-h-[500px] lg:h-[calc(100vh-140px)] sticky top-2 ${
              darkMode
                ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAllCart}
                    title={isAllCartSelected ? 'Batalkan Semua Pilihan Keranjang' : 'Centang Semua Item Keranjang'}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {isAllCartSelected ? (
                      <CheckSquare className="w-4 h-4 text-pink-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                )}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm tracking-tight">Keranjang Kasir</h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {cart.length} macam barang ({cart.reduce((s, i) => s + i.quantity, 0)} total)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {selectedCartIds.length > 0 && (
                  <button
                    id="btn-bulk-remove-cart"
                    type="button"
                    onClick={handleBulkRemoveFromCart}
                    title={`Hapus ${selectedCartIds.length} item yang dicentang`}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 dark:text-rose-400 text-xs font-bold flex items-center gap-1 border border-rose-500/30 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus ({selectedCartIds.length})</span>
                  </button>
                )}
                {cart.length > 0 && (
                  <>
                    <button
                      id="btn-hold-cart"
                      type="button"
                      onClick={handleHoldCart}
                      title="Simpan Antrian (Park Order)"
                      className="px-2.5 py-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 text-xs font-bold flex items-center gap-1 border border-transparent hover:border-amber-500/20 transition-all cursor-pointer"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Antrian</span>
                    </button>
                    <button
                      id="btn-clear-cart"
                      type="button"
                      onClick={handleClearCart}
                      title="Kosongkan Keranjang"
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Package className="w-12 h-12 mb-2 stroke-[1.2] text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Keranjang masih kosong</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                    Klik barang di sebelah kiri atau gunakan scan barcode untuk menambahkan barang belanjaan.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const isChecked = selectedCartIds.includes(item.product.id);
                  return (
                    <div
                      key={item.product.id}
                      className={`pt-2.5 first:pt-0 p-1.5 rounded-xl transition-colors ${
                        isChecked ? 'bg-purple-500/10 dark:bg-purple-500/15' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleSelectCartItem(item.product.id)}
                            title="Centang item ini"
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-pink-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs truncate">{item.product.name}</h4>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                              <span>
                                {formatRupiah(item.product.sellPrice)} / {item.product.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-xs bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400 font-numeric">
                            {formatRupiah(item.subtotal)}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Direct Input */}
                      <div className="flex items-center justify-between mt-2">
                        {/* Standard Quantity Stepper */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.product.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={(e) =>
                              handleDirectQtyChange(item.product.id, parseInt(e.target.value) || 1)
                            }
                            className="w-10 text-center font-black text-xs font-mono bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.product.id, 1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Quick Multipliers (+5, +10) & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item.product, 5)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono transition-colors cursor-pointer"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item.product, 10)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono transition-colors cursor-pointer"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 ml-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Footer: Subtotal, Discount & Big Bayar Button */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-b-2xl space-y-3">
              {/* Calculations summary */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-numeric">{formatRupiah(subtotal)}</span>
                </div>

                {/* Optional Global Discount */}
                {showDiscountInput ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500">Diskon (Rp):</span>
                    <input
                      type="number"
                      value={cartDiscount || ''}
                      onChange={(e) => setCartDiscount(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      className="w-24 px-2 py-1 rounded-lg border text-xs text-right font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDiscountInput(false)}
                      className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-slate-500">
                    <button
                      type="button"
                      onClick={() => setShowDiscountInput(true)}
                      className="text-[11px] text-purple-600 dark:text-pink-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Tag className="w-3 h-3" />
                      <span>+ Beri Potongan / Diskon</span>
                    </button>
                    {cartDiscount > 0 && (
                      <span className="font-bold text-rose-500 font-numeric">-{formatRupiah(cartDiscount)}</span>
                    )}
                  </div>
                )}

                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-baseline">
                  <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-200">TOTAL BAYAR</span>
                  <span className="font-black text-xl sm:text-2xl bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent font-numeric">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Big Checkout Action Button */}
              <button
                id="btn-open-checkout"
                type="button"
                onClick={() => {
                  if (cart.length === 0) return;
                  sound.playBeep(650, 0.04);
                  setIsCheckoutOpen(true);
                }}
                disabled={cart.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 tracking-wide cursor-pointer"
              >
                <span>BAYAR SEKARANG</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onScanSuccess={handleBarcodeScanned}
        mode="CASHIER"
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        cartTotal={grandTotal}
        onRegisterProduct={(barcode) => {
          setQuickRegisterBarcode(barcode);
          setQuickName('');
          setQuickBuyPrice(0);
          setQuickSellPrice(0);
          setQuickStock(20);
          setQuickUnit('pcs');
          setIsQuickRegisterOpen(true);
        }}
        darkMode={darkMode}
      />

      {/* Quick Register Modal for Unrecognized Packaging Barcodes */}
      {isQuickRegisterOpen && (
        <div
          id="quick-register-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        >
          <div
            id="quick-register-card"
            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div>
                <h3 className="font-black text-sm sm:text-base flex items-center gap-1.5 text-purple-600 dark:text-pink-400">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>Daftarkan Barang dari Kemasan</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Barcode terdeteksi: <span className="font-mono font-bold text-pink-500">{quickRegisterBarcode}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickRegisterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickRegisterSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Nama Produk / Kemasan:
                </label>
                <input
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Contoh: Roma Kelapa 300g / Aqua 600ml"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Kategori:
                  </label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as ProductCategory)}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Satuan:
                  </label>
                  <input
                    type="text"
                    value={quickUnit}
                    onChange={(e) => setQuickUnit(e.target.value)}
                    placeholder="pcs, bks, btl"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Harga Beli (Modal):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={quickBuyPrice || ''}
                    onChange={(e) => setQuickBuyPrice(Number(e.target.value))}
                    placeholder="Rp 0"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Harga Jual:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={quickSellPrice || ''}
                    onChange={(e) => setQuickSellPrice(Number(e.target.value))}
                    placeholder="Rp 0"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Jumlah Stok Saat Ini:
                </label>
                <input
                  type="number"
                  min="1"
                  value={quickStock}
                  onChange={(e) => setQuickStock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-600/20 active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Masuk Keranjang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal with QRIS & Cash fast buttons */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        subtotal={subtotal}
        discount={cartDiscount}
        grandTotal={grandTotal}
        totalCost={totalCost}
        settings={settings}
        currentUser={currentUser}
        onPaymentSuccess={(trx) => {
          setIsCheckoutOpen(false);
          setCart([]);
          setCartDiscount(0);
          onTransactionCompleted(trx);
        }}
        darkMode={darkMode}
      />
    </div>
  );
};
