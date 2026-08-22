import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  DollarSign,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Share2,
  Calendar,
  X,
  CheckSquare,
  Square,
  Send,
} from 'lucide-react';
import { CustomerDebt, StoreSettings, CashierUser } from '../types';
import { formatRupiah, formatDateIndo, exportDebtsToExcel } from '../services/export';
import { sound } from '../services/sound';

interface DebtsViewProps {
  debts: CustomerDebt[];
  onSaveDebt: (debt: CustomerDebt) => void;
  onRecordPayment: (debtId: string, amount: number, notes?: string) => void;
  settings: StoreSettings;
  currentUser: CashierUser | null;
  darkMode: boolean;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  onSaveDebt,
  onRecordPayment,
  settings,
  currentUser,
  darkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<CustomerDebt | null>(null);
  const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);

  // New Debt Form
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    amount: 50000,
    dueDate: '',
    notes: 'Belanja sembako harian',
  });

  // Repayment form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>('Bayar cicilan kasbon');

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        d.customerName.toLowerCase().includes(q) ||
        (d.phone && d.phone.includes(q)) ||
        (d.address && d.address.toLowerCase().includes(q))
      );
    });
  }, [debts, searchQuery]);

  const totalOutstandingDebt = debts.reduce((sum, d) => sum + d.totalDebt, 0);

  // Checkbox helpers for Debts
  const isAllDebtsSelected = useMemo(() => {
    if (filteredDebts.length === 0) return false;
    return filteredDebts.every((d) => selectedDebtIds.includes(d.id));
  }, [filteredDebts, selectedDebtIds]);

  const toggleSelectAllDebts = () => {
    if (isAllDebtsSelected) {
      setSelectedDebtIds([]);
    } else {
      setSelectedDebtIds(filteredDebts.map((d) => d.id));
    }
  };

  const toggleSelectDebt = (debtId: string) => {
    setSelectedDebtIds((prev) =>
      prev.includes(debtId) ? prev.filter((id) => id !== debtId) : [...prev, debtId]
    );
  };

  // Bulk Settle All Checked Debts
  const handleBulkSettleDebts = () => {
    if (selectedDebtIds.length === 0) return;
    const unpaidSelected = debts.filter((d) => selectedDebtIds.includes(d.id) && d.totalDebt > 0);
    if (unpaidSelected.length === 0) {
      alert('Semua pelanggan yang dipilih sudah lunas.');
      return;
    }

    const totalToSettle = unpaidSelected.reduce((sum, d) => sum + d.totalDebt, 0);
    if (
      confirm(
        `Konfirmasi pelunasan massal untuk ${unpaidSelected.length} pelanggan?\nTotal pelunasan: ${formatRupiah(
          totalToSettle
        )}`
      )
    ) {
      unpaidSelected.forEach((d) => {
        onRecordPayment(d.id, d.totalDebt, 'Pelunasan Kasbon Sekaligus (Massal)');
      });
      setSelectedDebtIds([]);
      sound.playSuccess();
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      alert('Nama pelanggan wajib diisi.');
      return;
    }

    const newDebt: CustomerDebt = {
      id: `debt-${Date.now()}`,
      customerName: formData.customerName.trim(),
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      totalDebt: Number(formData.amount),
      createdAt: new Date().toISOString(),
      dueDate: formData.dueDate || undefined,
      notes: formData.notes.trim() || undefined,
      transactions: [
        {
          transactionId: `trx-debt-${Date.now()}`,
          invoiceNumber: `BON-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString(),
          amount: Number(formData.amount),
          description: formData.notes.trim() || 'Hutang awal belanja',
        },
      ],
      payments: [],
    };

    onSaveDebt(newDebt);
    sound.playSuccess();
    setIsAddModalOpen(false);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || payAmount <= 0) return;

    onRecordPayment(selectedDebt.id, payAmount, payNotes);
    sound.playSuccess();
    setIsPayModalOpen(false);
  };

  const sendWhatsAppReminder = (debt: CustomerDebt) => {
    const msg = `Halo ${debt.customerName}, ini pengingat ramah dari ${settings.storeName}.\nSaat ini tercatat sisa catatan kasbon sebesar *${formatRupiah(debt.totalDebt)}*.\nTerima kasih atas kerjasamanya! 🙏`;
    const phone = debt.phone ? debt.phone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div id="debts-view-container" className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <BookOpen className="w-6 h-6 text-amber-500" />
            <span>Buku Kasbon & Catatan Hutang Pelanggan</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Kelola tagihan kasbon toko kelontong & riwayat cicilan pelunasan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-debts-excel"
            type="button"
            onClick={() => exportDebtsToExcel(debts, settings)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Ekspor Excel</span>
          </button>

          <button
            id="btn-add-debt"
            type="button"
            onClick={() => {
              setFormData({
                customerName: '',
                phone: '',
                address: '',
                amount: 50000,
                dueDate: '',
                notes: 'Belanja sembako harian',
              });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all tracking-wide"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Kasbon Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Banner Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-2xl border shadow-xl ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase font-mono">TOTAL PIUTANG / KASBON AKTIF</div>
          <div className="text-2xl font-black font-numeric text-amber-500 mt-1">
            {formatRupiah(totalOutstandingDebt)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Dari {debts.filter((d) => d.totalDebt > 0).length} pelanggan belum lunas
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xl ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase font-mono">TOTAL PELANGGAN TERCATAT</div>
          <div className="text-2xl font-black font-numeric text-slate-800 dark:text-slate-100 mt-1">
            {debts.length} Orang
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold font-mono">
            {debts.filter((d) => d.totalDebt <= 0).length} pelanggan sudah lunas
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xl bg-amber-500/10 border-amber-500/20 flex flex-col justify-center`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Pengingat Ramah WhatsApp</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-1">
            Kirim rincian sisa kasbon langsung ke nomor WA pelanggan dengan 1 klik.
          </p>
        </div>
      </div>

      {/* Search Bar & Bulk Settle Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pelanggan / no. HP..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm bg-white dark:bg-slate-900/90 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {selectedDebtIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={handleBulkSettleDebts}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lunaskan {selectedDebtIds.length} Kasbon Tercentang Sekaligus</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDebtIds([])}
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Batal ({selectedDebtIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Debts Table */}
      <div
        className={`rounded-2xl border shadow-xl overflow-hidden ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-bold font-mono">
              <tr>
                <th className="px-3 py-3.5 text-center w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAllDebts}
                    title={isAllDebtsSelected ? 'Batalkan Semua Pilihan' : 'Centang Semua Pelanggan'}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {isAllDebtsSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5 font-sans">Nama Pelanggan</th>
                <th className="px-4 py-3.5">No. HP / WA</th>
                <th className="px-4 py-3.5 font-sans">Alamat / RT</th>
                <th className="px-4 py-3.5 text-right">Sisa Hutang</th>
                <th className="px-4 py-3.5">Jatuh Tempo</th>
                <th className="px-4 py-3.5 text-center font-sans">Status</th>
                <th className="px-4 py-3.5 text-center font-sans">Aksi Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data catatan kasbon pelanggan.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => {
                  const isPaidOff = debt.totalDebt <= 0;
                  const isChecked = selectedDebtIds.includes(debt.id);
                  return (
                    <tr
                      key={debt.id}
                      className={`transition-colors ${
                        isChecked
                          ? 'bg-amber-500/10 dark:bg-amber-500/15'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectDebt(debt.id)}
                          title="Centang pelanggan ini"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                        {debt.customerName}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {debt.phone || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {debt.address || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-numeric font-extrabold text-sm text-amber-600 dark:text-amber-400">
                        {formatRupiah(debt.totalDebt)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {debt.dueDate || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-mono font-bold text-[10px] border ${
                            isPaidOff
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {isPaidOff ? 'LUNAS' : 'BELUM LUNAS'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaidOff && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDebt(debt);
                                setPayAmount(debt.totalDebt);
                                setIsPayModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-[11px] shadow-xs transition-colors"
                            >
                              Bayar / Cicil
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => sendWhatsAppReminder(debt)}
                            title="Kirim Pesan Tagihan WA"
                            className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Debt Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
              <h3 className="font-extrabold text-sm tracking-tight">Catat Kasbon Pelanggan Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nama Pelanggan:</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Contoh: Pak RT / Bu Marni"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">No. WhatsApp:</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">Nominal Kasbon (Rp):</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border text-sm font-bold font-numeric text-amber-500 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Catatan / Barang:</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  Simpan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {isPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
              <h3 className="font-extrabold text-sm tracking-tight">Pembayaran Kasbon: {selectedDebt.customerName}</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePaySubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                Sisa Hutang Saat Ini: <strong className="text-amber-600 dark:text-amber-400 text-sm font-numeric font-bold">{formatRupiah(selectedDebt.totalDebt)}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">Jumlah Yang Dibayarkan (Rp):</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Math.min(selectedDebt.totalDebt, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border text-base font-bold font-numeric text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedDebt.totalDebt)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold font-numeric text-[11px]"
                  >
                    Bayar Lunas ({formatRupiah(selectedDebt.totalDebt)})
                  </button>
                  {selectedDebt.totalDebt > 20000 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(Math.round(selectedDebt.totalDebt / 2))}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold font-numeric text-[11px]"
                    >
                      Bayar 50%
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Keterangan Pembayaran:</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 hover:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
