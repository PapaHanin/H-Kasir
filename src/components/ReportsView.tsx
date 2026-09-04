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
    const map = new Map<string, { name: string; qty: number; revenue: number; profit: number }>();
    completedTransactions.forEach((trx) => {
      trx.items.forEach((item) => {
        const prev = map.get(item.productName) || {
          name: item.productName,
          qty: 0,
          revenue: 0,
          profit: 0,
        };
        map.set(item.productName, {
          name: item.productName,
          qty: prev.qty + item.quantity,
          revenue: prev.revenue + item.subtotal,
          profit: prev.profit + item.profit,
        });
      });
    });
    return Array.from(map.values())
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
    <div id="reports-view-container" className="max-w-7xl mx-auto space-y-5">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
              Laporan Penjualan & Keuangan Toko Kelontong
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Analisis omzet, laba kotor & bersih, serta riwayat transaksi kasir
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setPeriodFilter('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'TODAY'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriodFilter('7DAYS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === '7DAYS'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriodFilter('30DAYS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === '30DAYS'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setPeriodFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'ALL'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Semua
            </button>
          </div>

          <button
            id="btn-export-sales-excel"
            type="button"
            onClick={() => exportSalesToExcel(filteredTransactions, settings)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-pink-400 hover:bg-purple-500/20 border border-purple-500/30 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
            <span>Ekspor Excel</span>
          </button>

          <button
            id="btn-export-sales-pdf"
            type="button"
            onClick={() => exportSalesReportPDF(filteredTransactions, settings, periodTitle)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Key Financial Metric Cards (4 Cards Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Omzet */}
        <div
          className={`p-4 rounded-2xl border shadow-xl ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1 font-mono">
            <span>TOTAL OMZET</span>
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-pink-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-numeric bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            {formatRupiah(totalOmzet)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {completedTransactions.length} transaksi selesai
          </p>
        </div>

        {/* Laba Bersih (Net Profit) */}
        <div
          className={`p-4 rounded-2xl border shadow-xl ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1 font-mono">
            <span>LABA BERSIH</span>
            <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-numeric text-pink-600 dark:text-pink-400">
            {formatRupiah(totalProfit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {totalOmzet > 0 ? `${((totalProfit / totalOmzet) * 100).toFixed(1)}% margin untung` : '0%'}
          </p>
        </div>

        {/* Total Modal Barang */}
        <div
          className={`p-4 rounded-2xl border shadow-xl ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1 font-mono">
            <span>TOTAL MODAL KULAKAN</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-numeric text-slate-700 dark:text-slate-300">
            {formatRupiah(totalCost)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {totalItemsSold} barang terjual
          </p>
        </div>

        {/* Rata-rata Nilai Belanja */}
        <div
          className={`p-4 rounded-2xl border shadow-xl ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1 font-mono">
            <span>RATA-RATA STRUK</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-numeric text-purple-600 dark:text-purple-400">
            {formatRupiah(avgBasketSize)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Rata-rata per pelanggan
          </p>
        </div>
      </div>

      {/* Middle Section: Top Products & Payment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Top 5 Products */}
        <div
          className={`md:col-span-7 p-4 rounded-2xl border shadow-xl ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-sm flex items-center gap-1.5 tracking-tight text-slate-900 dark:text-slate-100">
              <Award className="w-4 h-4 text-amber-500" />
              <span>5 Produk Terlaris ({periodTitle})</span>
            </h3>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada data penjualan pada periode ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold font-mono text-[10px] flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {idx + 1}
                    </span>
                    <span className="font-bold truncate max-w-[200px] sm:max-w-[280px] text-slate-800 dark:text-slate-200">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600 dark:text-pink-400 font-numeric">
                      {p.qty} terjual ({formatRupiah(p.revenue)})
                    </div>
                    <div className="text-[10px] text-slate-400 font-numeric">Laba: +{formatRupiah(p.profit)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods Distribution */}
        <div
          className={`md:col-span-5 p-4 rounded-2xl border shadow-xl ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="font-extrabold text-sm mb-3 tracking-tight text-slate-900 dark:text-slate-100">Metode Pembayaran</h3>
          {Object.keys(paymentBreakdown).length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada transaksi pada periode ini.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {Object.entries(paymentBreakdown).map(([method, data]: [string, { count: number; amount: number }]) => {
                const percent = totalOmzet > 0 ? ((data.amount / totalOmzet) * 100).toFixed(1) : '0';
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="uppercase font-mono text-slate-700 dark:text-slate-300">{method} ({data.count}x)</span>
                      <span className="font-numeric text-slate-900 dark:text-slate-100">{formatRupiah(data.amount)} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
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
        className={`rounded-2xl border shadow-xl overflow-hidden ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">Riwayat Transaksi Penjualan</h3>
            <p className="text-xs text-slate-500 font-mono">
              {filteredTransactions.length} transaksi tercatat pada sistem
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari faktur, kasir..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
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
            <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-bold font-mono">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr
                    key={trx.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-100">
                      {trx.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {formatDateIndo(trx.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                      {trx.cashierName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-numeric font-bold text-purple-600 dark:text-pink-400">
                      {formatRupiah(trx.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-numeric text-pink-600 dark:text-pink-400 font-semibold">
                      +{formatRupiah(trx.totalProfit)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[10px] border ${
                          trx.status === 'COMPLETED'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-pink-400 border-purple-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}
                      >
                        {trx.status === 'COMPLETED' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-purple-500 dark:text-pink-400" />
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
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-700 dark:text-pink-300 hover:from-purple-500/25 hover:to-pink-500/25 border border-purple-500/30 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
