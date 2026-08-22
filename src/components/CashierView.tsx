import React, { useState, useMemo } from 'react';
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

interface CashierViewProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  heldCarts: HeldCart[];
  setHeldCarts: React.Dispatch<React.SetStateAction<HeldCart[]>>;
  settings: StoreSettings;
  currentUser: CashierUser | null;
  onTransactionCompleted: (trx: Transaction) => void;
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
  darkMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([]);

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

  // Barcode scanned handler
  const handleBarcodeScanned = (barcode: string) => {
    const found = products.find((p) => p.barcode === barcode || p.barcode.endsWith(barcode));
    if (found) {
      handleAddToCart(found, 1);
    } else {
      sound.playError();
      alert(`Produk dengan barcode [${barcode}] tidak ditemukan.`);
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
    <div id="cashier-pos-container" className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
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
              placeholder="Cari barang kelontong (nama, barcode, merek)..."
              className={`w-full pl-10 pr-8 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                darkMode
                  ? 'bg-slate-900/90 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-xs'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            id="btn-open-barcode-scanner"
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm shadow-emerald-600/20 active:scale-95 transition-all shrink-0"
            title="Buka Scanner Barcode Kamera"
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Scan Barcode</span>
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
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors shrink-0"
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
          return (
            <button
              key={cat}
              id={`cat-chip-${cat.replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => {
                sound.playBeep(600, 0.03);
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 border-emerald-500 shadow-sm'
                  : darkMode
                  ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              {cat === 'ALL' ? '🌟 Semua Kategori' : cat}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Products Catalog, Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Product Grid (7-8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              KATALOG BARANG ({filteredProducts.length})
            </span>
            <span className="text-xs text-slate-400">Klik untuk tambah ke keranjang</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((i) => i.product.id === product.id);
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  id={`btn-product-card-${product.id}`}
                  type="button"
                  onClick={() => handleAddToCart(product, 1)}
                  disabled={isOutOfStock}
                  className={`group text-left p-3.5 rounded-2xl border transition-all duration-150 relative flex flex-col justify-between ${
                    isOutOfStock
                      ? 'opacity-50 grayscale cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800'
                      : darkMode
                      ? 'bg-slate-900/90 border-slate-800/90 hover:border-emerald-500/70 hover:bg-slate-800/90 active:scale-98 text-slate-100'
                      : 'bg-white border-slate-200 hover:border-emerald-500 active:scale-98 text-slate-800 shadow-xs'
                  }`}
                >
                  {/* Cart badge if already in cart */}
                  {inCartItem && (
                    <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-black text-xs w-6 h-6 rounded-lg flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 font-mono">
                      {inCartItem.quantity}
                    </div>
                  )}

                  <div>
                    {/* Category pill & Stock badge */}
                    <div className="flex items-center justify-between text-[10px] mb-1.5 gap-1">
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                        {product.category.split('&')[0]}
                      </span>
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded-md text-[10px] font-mono shrink-0 ${
                          isOutOfStock
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : isLowStock
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Stok: ${product.stock} ${product.unit}`}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-emerald-500 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Barcode */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                        #{product.barcode.slice(-6)}
                      </div>
                      <div className="font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-numeric">
                        {formatRupiah(product.sellPrice)}
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                      <Plus className="w-4 h-4" />
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
            className={`rounded-2xl border shadow-xl flex flex-col h-[calc(100vh-200px)] sticky top-20 ${
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
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                )}
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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
                      className="px-2.5 py-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 text-xs font-bold flex items-center gap-1 border border-transparent hover:border-amber-500/20 transition-all"
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
                    Klik produk di sebelah kiri atau gunakan scan barcode untuk menambahkan barang belanjaan.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const isChecked = selectedCartIds.includes(item.product.id);
                  return (
                    <div
                      key={item.product.id}
                      className={`pt-2.5 first:pt-0 p-1.5 rounded-xl transition-colors ${
                        isChecked ? 'bg-emerald-500/10 dark:bg-emerald-500/15' : ''
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
                              <CheckSquare className="w-4 h-4 text-emerald-500" />
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
                          <div className="font-black text-xs text-emerald-600 dark:text-emerald-400 font-numeric">
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
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs hover:bg-slate-200 transition-colors"
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
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs hover:bg-slate-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Quick Multipliers (+5, +10) & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item.product, 5)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono transition-colors"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item.product, 10)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono transition-colors"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 ml-1 transition-colors"
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
                      className="w-24 px-2 py-1 rounded-lg border text-xs text-right font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDiscountInput(false)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-slate-500">
                    <button
                      type="button"
                      onClick={() => setShowDiscountInput(true)}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
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
                  <span className="font-black text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 font-numeric">
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
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-slate-950 font-black text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 tracking-wide"
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
        darkMode={darkMode}
      />

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
