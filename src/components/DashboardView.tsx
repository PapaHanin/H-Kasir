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
  Scan,
  PlusCircle,
  BookOpen,
  CheckCircle2,
  Calendar,
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
  // Calculate Today's Transactions
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

  // Recent 10 Transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [transactions]);

  return (
    <div id="dashboard-view-container" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Store Greeting & Quick Shift Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-800 to-pink-700 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-purple-200 text-xs font-mono uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Dashboard Operasional Kasir</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Selamat Datang di {settings.storeName || 'UD. Toko Kelontong'}
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-xl">
            Pantau transaksi penjualan hari ini, stok barang sembako, kasbon pelanggan, dan saldo laci kasir secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('cashier')}
            className="px-4 py-2.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 text-purple-600" />
            <span>Mulai Transaksi (POS)</span>
          </button>
          <button
            type="button"
            onClick={onOpenShiftModal}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeShift
                ? 'bg-purple-900/40 border-purple-400/40 text-purple-100 hover:bg-purple-900/60'
                : 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{activeShift ? 'Rekap Shift' : 'Buka Shift'}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stat Cards Grid (Styled like in the reference photo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Transaksi Hari Ini (Blue Card) */}
        <div
          onClick={() => onNavigate('reports')}
          className={`p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer group ${
            darkMode
              ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50'
              : 'bg-white border-slate-200 hover:border-blue-400 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Transaksi Hari Ini
              </p>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 font-numeric text-blue-600 dark:text-blue-400">
                {todayTransactions.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>{todayTransactions.length > 0 ? 'Penjualan berhasil dicatat' : 'Belum ada transaksi hari ini'}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2. Total Produk Terdaftar (Green / Emerald Card) */}
        <div
          onClick={() => onNavigate('inventory')}
          className={`p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer group ${
            darkMode
              ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50'
              : 'bg-white border-slate-200 hover:border-emerald-400 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Produk Kelontong
              </p>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 font-numeric text-emerald-600 dark:text-emerald-400">
                {products.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {lowStockCount > 0 ? (
                  <span className="text-amber-500 font-semibold">{lowStockCount} barang perlu restok</span>
                ) : (
                  <span className="text-emerald-500 font-semibold">Semua stok aman</span>
                )}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 3. Uang di Laci Kasir / Cash (Teal Card - persis seperti foto) */}
        <div
          onClick={onOpenShiftModal}
          className={`p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer group ${
            darkMode
              ? 'bg-slate-900/80 border-slate-800 hover:border-teal-500/50'
              : 'bg-white border-slate-200 hover:border-teal-400 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Uang di Laci (Cash)
              </p>
              <h3 className="text-xl sm:text-2xl font-black mt-2 font-numeric text-teal-600 dark:text-teal-400">
                {formatRupiah(cashInDrawer)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {activeShift ? 'Shift kasir sedang aktif' : 'Shift kasir belum dibuka'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 4. Piutang Belum Lunas / Kasbon (Orange / Rose Card - persis seperti foto) */}
        <div
          onClick={() => onNavigate('debts')}
          className={`p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer group ${
            darkMode
              ? 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50'
              : 'bg-white border-slate-200 hover:border-amber-400 shadow-2xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Piutang Belum Lunas
              </p>
              <h3 className="text-xl sm:text-2xl font-black mt-2 font-numeric text-amber-600 dark:text-amber-400">
                {formatRupiah(totalUnpaidDebts)}
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
                <span>Kelola Kasbon Pelanggan →</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Omzet Hari Ini & Quick Action Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Omzet & Keuntungan Card */}
        <div
          className={`p-5 rounded-2xl border ${
            darkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pink-500" />
              <h4 className="font-bold text-sm">Pendapatan Hari Ini</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Real-Time</span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Omzet Penjualan:</span>
              <div className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-numeric">
                {formatRupiah(todayOmzet)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 dark:text-pink-300">Estimasi Laba Bersih:</span>
              <span className="font-black text-sm font-numeric text-purple-700 dark:text-pink-300">
                +{formatRupiah(todayProfit)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Penjualan Tunai:</span>
              <span className="font-bold font-numeric">{formatRupiah(todayCashSales)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Non-Tunai (QRIS / E-Wallet):</span>
              <span className="font-bold font-numeric">{formatRupiah(todayOmzet - todayCashSales)}</span>
            </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div
          className={`lg:col-span-2 p-5 rounded-2xl border flex flex-col justify-between ${
            darkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div>
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
              <span className="text-purple-500">⚡</span>
              <span>Akses Pintas Cepat Kasir</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('cashier')}
                className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="font-black text-xs text-slate-900 dark:text-slate-100">Buka Kasir</div>
                <div className="text-[10px] text-slate-500">Input belanja pembeli</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div className="font-black text-xs text-slate-900 dark:text-slate-100">Tambah Barang</div>
                <div className="text-[10px] text-slate-500">Input sembako / stok</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('debts')}
                className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="font-black text-xs text-slate-900 dark:text-slate-100">Buku Kasbon</div>
                <div className="text-[10px] text-slate-500">Catat hutang warga</div>
              </button>

              <button
                type="button"
                onClick={onOpenShiftModal}
                className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="font-black text-xs text-slate-900 dark:text-slate-100">Rekap Kasir</div>
                <div className="text-[10px] text-slate-500">Hitung uang fisik laci</div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Sistem Kasir Kelontong Siap Pakai</span>
            <span className="font-mono text-[11px] text-purple-600 dark:text-pink-400 font-bold">
              Database Offline & Cloud Sync Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Penjualan Terbaru Table (persis seperti di foto referensi) */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-white border-slate-200 shadow-2xs'
        }`}
      >
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-600 dark:text-pink-400" />
            <h4 className="font-black text-base tracking-tight">Penjualan Terbaru</h4>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="text-xs font-bold text-purple-600 dark:text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Laporan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Belum ada catatan penjualan</p>
            <p className="text-xs mt-1">Lakukan transaksi pertama di menu Kasir (POS)</p>
            <button
              type="button"
              onClick={() => onNavigate('cashier')}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
            >
              Mulai Jual Barang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">No. Nota</th>
                  <th className="py-3 px-4">Pelanggan / Kasir</th>
                  <th className="py-3 px-4">Tanggal & Jam</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4 text-right">Total Belanja</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {recentTransactions.map((trx) => (
                  <tr
                    key={trx.id}
                    className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-purple-600 dark:text-pink-400">
                      #{trx.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {trx.customerName || 'Pelanggan Umum'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Kasir: {trx.cashierName}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {formatDateIndo(trx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-numeric text-sm text-slate-900 dark:text-slate-100">
                      {formatRupiah(trx.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(trx)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-purple-600 dark:text-pink-400 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
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
