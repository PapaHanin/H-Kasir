import React, { useState, useMemo } from 'react';
import { Clock, DollarSign, CheckCircle, AlertTriangle, Printer, X, ShieldCheck } from 'lucide-react';
import { CashierShift, CashierUser, Transaction, StoreSettings } from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';
import { sound } from '../services/sound';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: CashierShift | null;
  onOpenShift: (startingCash: number) => void;
  onCloseShift: (actualCash: number, notes?: string) => void;
  transactions: Transaction[];
  currentUser: CashierUser | null;
  settings: StoreSettings;
  darkMode: boolean;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  onOpenShift,
  onCloseShift,
  transactions,
  currentUser,
  settings,
  darkMode,
}) => {
  const [startingCash, setStartingCash] = useState<number>(200000); // Default 200k modal uang kembalian
  const [actualCash, setActualCash] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Calculate live shift statistics
  const currentShiftStats = useMemo(() => {
    if (!activeShift) return { totalSales: 0, cashSales: 0, nonCashSales: 0, count: 0 };
    const shiftStartTime = new Date(activeShift.startTime).getTime();

    const shiftTrxs = transactions.filter(
      (t) => new Date(t.date).getTime() >= shiftStartTime && t.status === 'COMPLETED'
    );

    const totalSales = shiftTrxs.reduce((sum, t) => sum + t.grandTotal, 0);
    const cashSales = shiftTrxs
      .filter((t) => t.paymentMethod === 'TUNAI')
      .reduce((sum, t) => sum + t.grandTotal, 0);
    const nonCashSales = totalSales - cashSales;

    return {
      totalSales,
      cashSales,
      nonCashSales,
      count: shiftTrxs.length,
      expectedCash: activeShift.startingCash + cashSales,
    };
  }, [activeShift, transactions]);

  if (!isOpen) return null;

  const handleStartShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    onOpenShift(startingCash);
    onClose();
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    onCloseShift(actualCash, notes);
    onClose();
  };

  const cashDiff = actualCash - (currentShiftStats.expectedCash || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <div>
              <h3 className="font-black text-base tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                {activeShift ? 'Tutup Shift / Rekapitulasi Kasir' : 'Buka Shift Baru Kasir'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Petugas: {currentUser?.name || 'Kasir'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!activeShift ? (
            /* Form Buka Shift */
            <form onSubmit={handleStartShiftSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 font-mono">
                Masukkan modal uang kembalian awal di laci kasir sebelum melayani transaksi.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Modal Uang Awal di Laci (Rp):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm font-mono">Rp</span>
                  <input
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(Number(e.target.value))}
                    className="w-full pl-11 pr-3 py-2.5 rounded-xl border text-base font-bold font-numeric bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[100000, 200000, 300000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStartingCash(amt)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold font-numeric bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-xs rounded-xl shadow-md tracking-wide cursor-pointer"
                >
                  Buka Shift Sekarang
                </button>
              </div>
            </form>
          ) : (
            /* Form Tutup Shift & Rekap Z-Report */
            <form onSubmit={handleCloseShiftSubmit} className="space-y-4">
              {/* Shift Summary Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Mulai Shift:</span>
                  <span className="font-semibold">{formatDateIndo(activeShift.startTime)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Modal Awal Laci:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-numeric">{formatRupiah(activeShift.startingCash)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Total Penjualan Tunai ({currentShiftStats.count} trx):</span>
                  <span className="font-bold text-purple-600 dark:text-pink-400 font-numeric">{formatRupiah(currentShiftStats.cashSales)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Total Non-Tunai (QRIS/E-Wallet):</span>
                  <span className="font-bold text-pink-600 dark:text-pink-400 font-numeric">{formatRupiah(currentShiftStats.nonCashSales)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-sm font-mono">
                  <span>TOTAL UANG TUNAI SEHARUSNYA:</span>
                  <span className="text-purple-600 dark:text-pink-400 font-numeric">{formatRupiah(currentShiftStats.expectedCash)}</span>
                </div>
              </div>

              {/* Physical Cash Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Hitung Fisik Uang Tunai di Laci (Rp):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm font-mono">Rp</span>
                  <input
                    type="number"
                    value={actualCash || ''}
                    onChange={(e) => setActualCash(Number(e.target.value))}
                    placeholder="Hitung semua uang fisik di laci..."
                    className="w-full pl-11 pr-3 py-2.5 rounded-xl border text-base font-bold font-numeric bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Difference indication */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between font-bold ${
                  cashDiff === 0
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-pink-300'
                    : cashDiff > 0
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                }`}
              >
                <span className="font-mono">{cashDiff === 0 ? 'Kas Pas / Seimbang' : cashDiff > 0 ? 'Kas Lebih (+)' : 'Kas Kurang / Selisih (-)'}</span>
                <span className="font-numeric text-sm">{formatRupiah(cashDiff)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Catatan Shift (Opsional):</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Ambil 50rb untuk bayar sampah..."
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md tracking-wide cursor-pointer"
                >
                  Tutup Shift Kasir (Z-Report)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
