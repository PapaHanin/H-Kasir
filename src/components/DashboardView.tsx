import React, { useMemo } from 'react';
import {
  Users,
  Package,
  Wallet,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Clock,
  ArrowRight,
  PlusCircle,
  BookOpen,
} from 'lucide-react';
import { Product, Transaction, CustomerDebt, CashierShift, StoreSettings } from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';

interface DashboardViewProps {
  products: Product[];
  transactions: Transaction[];
  debts: CustomerDebt[];
  activeShift: CashierShift | null;
  settings: StoreSettings;
  darkMode: boolean;
  onNavigate: (tab: 'cashier' | 'inventory' | 'reports' | 'debts' | 'settings') => void;
  onOpenShiftModal: () => void;
  onViewReceipt: (trx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  transactions,
  debts,
  activeShift,
  settings,
  darkMode,
  onNavigate,
  onOpenShiftModal,
  onViewReceipt,
}) => {
  // Today's Transactions
  const todayTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    return transactions.filter((t) => {
      const tTime = new Date(t.date).getTime();
      return tTime >= todayTime && t.status === 'COMPLETED';
    });
  }, [transactions]);

  // Today's Metrics
  const todayOmzet = useMemo(() => {
    return todayTransactions.reduce((acc, t) => acc + t.grandTotal, 0);
  }, [todayTransactions]);

  const todayProfit = useMemo(() => {
    return todayTransactions.reduce((acc, t) => acc + t.totalProfit, 0);
  }, [todayTransactions]);

  const todayCashSales = useMemo(() => {
    return todayTransactions
      .filter((t) => t.paymentMethod === 'TUNAI')
      .reduce((acc, t) => acc + t.grandTotal, 0);
  }, [todayTransactions]);

  // Cash in Drawer (Starting Cash + Cash Sales of current shift)
  const cashInDrawer = useMemo(() => {
    const starting = activeShift?.startingCash || 0;
    return starting + todayCashSales;
  }, [activeShift, todayCashSales]);

  // Total Unpaid Debts (Piutang Belum Lunas)
  const totalUnpaidDebts = useMemo(() => {
    return debts.reduce((acc, d) => acc + d.totalDebt, 0);
  }, [debts]);

  // Low & Out of Stock Count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock).length;
  }, [products]);

  // Recent Transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [transactions]);

  return (
    <div id="dashboard-view-container" className="space-y-5 max-w-7xl mx-auto">
      {/* Top Banner with Store Greeting & Quick Shift Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Dashboard Operasional Kasir</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {settings.storeName || 'UD. TOKO KELONTONG'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Pantau transaksi penjualan hari ini, stok sembako, kasbon pelanggan, dan saldo laci kasir secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('cashier')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Mulai Transaksi (F9)</span>
          </button>
          <button
            type="button"
            onClick={onOpenShiftModal}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              activeShift
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-850'
                : 'bg-zinc-900 border-amber-500/40 text-amber-400 hover:bg-zinc-850'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{activeShift ? 'Rekap Shift' : 'Buka Shift'}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Transaksi Hari Ini */}
        <div
          onClick={() => onNavigate('reports')}
          className="p-4 sm:p-5 rounded-2xl border transition-all hover:border-zinc-500 cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                Total Transaksi Hari Ini
              </p>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 font-numeric font-mono text-zinc-900 dark:text-zinc-100">
                {todayTransactions.length}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">
                {todayTransactions.length > 0 ? 'Penjualan berhasil dicatat' : 'Belum ada transaksi hari ini'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. Total Produk Terdaftar */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 sm:p-5 rounded-2xl border transition-all hover:border-zinc-500 cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                Total Produk Kelontong
              </p>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 font-numeric font-mono text-zinc-900 dark:text-zinc-100">
                {products.length}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">
                {lowStockCount > 0 ? (
                  <span className="text-amber-500 font-semibold">{lowStockCount} barang perlu restok</span>
                ) : (
                  <span className="text-emerald-500 font-semibold">Semua stok aman</span>
                )}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 3. Uang di Laci Kasir */}
        <div
          onClick={onOpenShiftModal}
          className="p-4 sm:p-5 rounded-2xl border transition-all hover:border-zinc-500 cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                Uang di Laci Kasir
              </p>
              <h3 className="text-xl sm:text-2xl font-black mt-2 font-numeric font-mono text-zinc-900 dark:text-zinc-100">
                {formatRupiah(cashInDrawer)}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">
                {activeShift ? 'Shift kasir sedang aktif' : 'Shift kasir belum dibuka'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 4. Piutang Kasbon */}
        <div
          onClick={() => onNavigate('debts')}
          className="p-4 sm:p-5 rounded-2xl border transition-all hover:border-zinc-500 cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                Piutang Belum Lunas
              </p>
              <h3 className="text-xl sm:text-2xl font-black mt-2 font-numeric font-mono text-amber-500 dark:text-amber-400">
                {formatRupiah(totalUnpaidDebts)}
              </h3>
              <p className="text-[11px] text-amber-500 mt-1 font-semibold flex items-center gap-1">
                <span>Kelola Kasbon Pelanggan →</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Omzet Hari Ini & Quick Action Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Omzet & Keuntungan Card */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-sm">Pendapatan Hari Ini</h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Real-Time</span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Omzet Penjualan:</span>
              <div className="text-2xl font-black font-numeric font-mono text-zinc-900 dark:text-zinc-100">
                {formatRupiah(todayOmzet)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Estimasi Laba Bersih:</span>
              <span className="font-black text-sm font-numeric font-mono text-emerald-600 dark:text-emerald-400">
                +{formatRupiah(todayProfit)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 font-mono">
              <span>Penjualan Tunai:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-200 font-numeric">{formatRupiah(todayCashSales)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Non-Tunai (QRIS / Bank):</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-200 font-numeric">{formatRupiah(todayOmzet - todayCashSales)}</span>
            </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="lg:col-span-2 p-5 rounded-2xl border flex flex-col justify-between bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div>
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
              <span className="text-amber-400">⚡</span>
              <span>Akses Pintas Cepat Kasir</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('cashier')}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-amber-400 border border-zinc-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="font-black text-xs text-zinc-900 dark:text-zinc-100">Buka Kasir</div>
                <div className="text-[10px] text-zinc-500">Input belanja pembeli</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-emerald-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-emerald-400 border border-zinc-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div className="font-black text-xs text-zinc-900 dark:text-zinc-100">Tambah Barang</div>
                <div className="text-[10px] text-zinc-500">Input sembako / stok</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('debts')}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-amber-400 border border-zinc-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="font-black text-xs text-zinc-900 dark:text-zinc-100">Buku Kasbon</div>
                <div className="text-[10px] text-zinc-500">Catat hutang warga</div>
              </button>

              <button
                type="button"
                onClick={onOpenShiftModal}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-zinc-600 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="font-black text-xs text-zinc-900 dark:text-zinc-100">Rekap Kasir</div>
                <div className="text-[10px] text-zinc-500">Hitung uang fisik laci</div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Kasir-Q POS &amp; Manajemen Stok</span>
            <span className="text-[11px] text-emerald-500 font-bold">
              Database Offline &amp; Cloud Synced
            </span>
          </div>
        </div>
      </div>

      {/* Penjualan Terbaru Table */}
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            <h4 className="font-black text-base tracking-tight">Penjualan Terbaru</h4>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Laporan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Belum ada catatan penjualan</p>
            <p className="text-xs mt-1">Lakukan transaksi pertama di menu Kasir (POS)</p>
            <button
              type="button"
              onClick={() => onNavigate('cashier')}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold cursor-pointer shadow-md"
            >
              Mulai Jual Barang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-mono border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">No. Nota</th>
                  <th className="py-3 px-4">Pelanggan / Kasir</th>
                  <th className="py-3 px-4">Tanggal & Jam</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4 text-right">Total Belanja</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                {recentTransactions.map((trx) => (
                  <tr
                    key={trx.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-500 dark:text-amber-400">
                      #{trx.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {trx.customerName || 'Pelanggan Umum'}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        Kasir: {trx.cashierName}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500">
                      {formatDateIndo(trx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-numeric font-mono text-sm text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(trx.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(trx)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-500 hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Lihat Struk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
