import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  FileSpreadsheet,
  FileText,
  Calendar,
  Eye,
  RotateCcw,
  Search,
  CheckCircle,
  XCircle,
  Award,
} from 'lucide-react';
import { Transaction, StoreSettings } from '../types';
import {
  formatRupiah,
  formatDateIndo,
  exportSalesToExcel,
  exportSalesReportPDF,
} from '../services/export';

interface ReportsViewProps {
  transactions: Transaction[];
  onCancelTransaction: (trxId: string) => void;
  onViewReceipt: (trx: Transaction) => void;
  settings: StoreSettings;
  darkMode: boolean;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  onCancelTransaction,
  onViewReceipt,
  settings,
  darkMode,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'ALL'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    return transactions.filter((trx) => {
      const trxTime = new Date(trx.date).getTime();

      let matchPeriod = true;
      if (periodFilter === 'TODAY') matchPeriod = trxTime >= todayStart;
      else if (periodFilter === '7DAYS') matchPeriod = trxTime >= sevenDaysAgo;
      else if (periodFilter === '30DAYS') matchPeriod = trxTime >= thirtyDaysAgo;

      let matchPayment = true;
      if (paymentFilter !== 'ALL') matchPayment = trx.paymentMethod === paymentFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        trx.invoiceNumber.toLowerCase().includes(q) ||
        trx.cashierName.toLowerCase().includes(q) ||
        (trx.customerName && trx.customerName.toLowerCase().includes(q)) ||
        trx.items.some((item) => item.productName.toLowerCase().includes(q));

      return matchPeriod && matchPayment && matchQuery;
    });
  }, [transactions, periodFilter, paymentFilter, searchQuery]);

  // Aggregate metrics (only completed transactions)
  const completedTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => t.status === 'COMPLETED');
  }, [filteredTransactions]);

  const totalOmzet = useMemo(() => {
    return completedTransactions.reduce((sum, t) => sum + t.grandTotal, 0);
  }, [completedTransactions]);

  const totalProfit = useMemo(() => {
    return completedTransactions.reduce((sum, t) => sum + t.totalProfit, 0);
  }, [completedTransactions]);

  const totalCost = useMemo(() => {
    return completedTransactions.reduce((sum, t) => sum + t.totalCost, 0);
  }, [completedTransactions]);

  const totalItemsSold = useMemo(() => {
    return completedTransactions.reduce((sum, t) => sum + t.totalQuantity, 0);
  }, [completedTransactions]);

  const avgBasketSize = useMemo(() => {
    if (completedTransactions.length === 0) return 0;
    return totalOmzet / completedTransactions.length;
  }, [totalOmzet, completedTransactions]);

  // Top selling products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; profit: number }> = {};
    completedTransactions.forEach((trx) => {
      trx.items.forEach((item) => {
        if (!map[item.productName]) {
          map[item.productName] = { name: item.productName, qty: 0, revenue: 0, profit: 0 };
        }
        map[item.productName].qty += item.quantity;
        map[item.productName].revenue += item.subtotal;
        map[item.productName].profit += (item.sellPrice - item.buyPrice) * item.quantity;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [completedTransactions]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; amount: number }> = {};
    completedTransactions.forEach((trx) => {
      if (!breakdown[trx.paymentMethod]) {
        breakdown[trx.paymentMethod] = { count: 0, amount: 0 };
      }
      breakdown[trx.paymentMethod].count += 1;
      breakdown[trx.paymentMethod].amount += trx.grandTotal;
    });
    return breakdown;
  }, [completedTransactions]);

  const periodTitle =
    periodFilter === 'TODAY'
      ? 'Hari Ini'
      : periodFilter === '7DAYS'
      ? '7 Hari Terakhir'
      : periodFilter === '30DAYS'
      ? '30 Hari Terakhir'
      : 'Semua Periode';

  return (
    <div id="reports-view-container" className="max-w-7xl mx-auto space-y-4">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Laporan Penjualan &amp; Keuangan</span>
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            Analisis omzet, laba kotor &amp; bersih, serta riwayat transaksi kasir
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Filter Buttons */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {(['TODAY', '7DAYS', '30DAYS', 'ALL'] as const).map((p) => {
              const labels = {
                TODAY: 'Hari Ini',
                '7DAYS': '7 Hari',
                '30DAYS': '30 Hari',
                ALL: 'Semua',
              };
              const isSelected = periodFilter === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          <button
            id="btn-export-sales-excel"
            type="button"
            onClick={() => exportSalesToExcel(filteredTransactions, settings)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Ekspor Excel</span>
          </button>

          <button
            id="btn-export-sales-pdf"
            type="button"
            onClick={() => exportSalesReportPDF(filteredTransactions, settings, periodTitle)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Key Financial Metric Cards (4 Cards Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Omzet */}
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold mb-1 font-mono">
            <span>TOTAL OMZET</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-numeric font-mono text-zinc-900 dark:text-zinc-100">
            {formatRupiah(totalOmzet)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            {completedTransactions.length} transaksi selesai
          </p>
        </div>

        {/* Laba Bersih */}
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold mb-1 font-mono">
            <span>ESTIMASI LABA BERSIH</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-numeric font-mono text-emerald-600 dark:text-emerald-400">
            +{formatRupiah(totalProfit)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            {totalOmzet > 0 ? `${((totalProfit / totalOmzet) * 100).toFixed(1)}% margin keuntungan` : '0%'}
          </p>
        </div>

        {/* Total Modal Barang */}
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold mb-1 font-mono">
            <span>TOTAL MODAL KULAKAN</span>
            <ShoppingBag className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-numeric font-mono text-zinc-800 dark:text-zinc-200">
            {formatRupiah(totalCost)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            {totalItemsSold} barang terjual
          </p>
        </div>

        {/* Rata-rata Nilai Belanja */}
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold mb-1 font-mono">
            <span>RATA-RATA STRUK</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-numeric font-mono text-zinc-900 dark:text-zinc-100">
            {formatRupiah(avgBasketSize)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            Rata-rata belanja per pembeli
          </p>
        </div>
      </div>

      {/* Middle Section: Top Products & Payment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Top 5 Products */}
        <div className="md:col-span-7 p-4 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-sm flex items-center gap-1.5 tracking-tight text-zinc-900 dark:text-zinc-100">
              <Award className="w-4 h-4 text-amber-500" />
              <span>5 Produk Terlaris ({periodTitle})</span>
            </h3>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-400">
              Belum ada data penjualan pada periode ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold font-mono text-[10px] flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                      {idx + 1}
                    </span>
                    <span className="font-bold truncate max-w-[200px] sm:max-w-[280px] text-zinc-800 dark:text-zinc-200">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 font-numeric font-mono">
                      {p.qty} terjual ({formatRupiah(p.revenue)})
                    </div>
                    <div className="text-[10px] text-emerald-500 font-numeric font-mono">
                      Laba: +{formatRupiah(p.profit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods Distribution */}
        <div className="md:col-span-5 p-4 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <h3 className="font-extrabold text-sm mb-3 tracking-tight text-zinc-900 dark:text-zinc-100">
            Metode Pembayaran
          </h3>
          {Object.keys(paymentBreakdown).length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-400">
              Belum ada transaksi pada periode ini.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {Object.entries(paymentBreakdown).map(([method, data]: [string, { count: number; amount: number }]) => {
                const percent = totalOmzet > 0 ? ((data.amount / totalOmzet) * 100).toFixed(1) : '0';
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="uppercase font-mono text-zinc-700 dark:text-zinc-300">
                        {method} ({data.count}x)
                      </span>
                      <span className="font-numeric font-mono text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(data.amount)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Transactions History Table */}
      <div
        id="transactions-table-card"
        className="rounded-2xl border shadow-xl overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              Riwayat Transaksi Penjualan
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              {filteredTransactions.length} transaksi tercatat pada sistem
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari faktur, kasir..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-800 dark:text-zinc-100"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-800 dark:text-zinc-100"
            >
              <option value="ALL">Semua Bayar</option>
              <option value="TUNAI">Tunai</option>
              <option value="QRIS">QRIS</option>
              <option value="GOPAY">GoPay</option>
              <option value="OVO">OVO</option>
              <option value="DANA">DANA</option>
              <option value="SHOPEEPAY">ShopeePay</option>
              <option value="TRANSFER_BANK">Transfer</option>
              <option value="KASBON">Kasbon</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/70 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider font-bold font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3.5">No. Faktur</th>
                <th className="px-4 py-3.5 font-sans">Waktu Transaksi</th>
                <th className="px-4 py-3.5 font-sans">Kasir</th>
                <th className="px-4 py-3.5">Metode</th>
                <th className="px-4 py-3.5 text-right">Total Bayar</th>
                <th className="px-4 py-3.5 text-right">Laba Bersih</th>
                <th className="px-4 py-3.5 text-center font-sans">Status</th>
                <th className="px-4 py-3.5 text-center font-sans">Aksi Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                    Tidak ada transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr
                    key={trx.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-amber-500 dark:text-amber-400">
                      #{trx.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-[11px]">
                      {formatDateIndo(trx.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                      {trx.cashierName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 uppercase">
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-numeric font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(trx.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-numeric font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{formatRupiah(trx.totalProfit)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          trx.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}
                      >
                        {trx.status === 'COMPLETED' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Sukses</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>Batal</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(trx)}
                          title="Lihat / Cetak Ulang Struk"
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>Struk</span>
                        </button>
                        {trx.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Batalkan transaksi ${trx.invoiceNumber} dan kembalikan stok barang?`)) {
                                onCancelTransaction(trx.id);
                              }
                            }}
                            title="Batalkan Transaksi / Retur"
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
