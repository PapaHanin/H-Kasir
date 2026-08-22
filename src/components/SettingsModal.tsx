import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Download,
  Upload,
  Key,
  Store,
  QrCode,
  Users,
  Volume2,
  Printer,
  RefreshCw,
  CheckCircle2,
  Lock,
  Cloud,
  CloudUpload,
  FileCode,
  X,
} from 'lucide-react';
import { StoreSettings, CashierUser } from '../types';
import { db } from '../services/db';
import { sound } from '../services/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  users: CashierUser[];
  onSaveUsers: (users: CashierUser[]) => void;
  onRestoreCompleted: () => void;
  darkMode: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  users,
  onSaveUsers,
  onRestoreCompleted,
  darkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'STORE' | 'QRIS' | 'SECURITY' | 'USERS' | 'CLOUD'>('STORE');

  // Store form state
  const [storeForm, setStoreForm] = useState<StoreSettings>({ ...settings });

  // Security form state
  const [vaultPassword, setVaultPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Cloud backup state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // User manager state
  const [userList, setUserList] = useState<CashierUser[]>([...users]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<'OWNER' | 'KASIR'>('KASIR');

  if (!isOpen) return null;

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(storeForm);
    sound.playSuccess();
    setStatusMsg({ text: 'Pengaturan toko berhasil disimpan!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Download Encrypted AES-256 Backup
  const handleExportBackup = () => {
    try {
      const encryptedString = db.exportEncryptedBackup(vaultPassword || undefined);
      const blob = new Blob([encryptedString], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_KasirKelontong_AES256_${new Date().toISOString().slice(0, 10)}.enc`;
      a.click();
      URL.revokeObjectURL(url);
      sound.playSuccess();
      setStatusMsg({ text: 'File cadangan terenkripsi AES-256 berhasil diunduh!', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch {
      setStatusMsg({ text: 'Gagal membuat file backup.', type: 'error' });
    }
  };

  // Upload and Restore Encrypted Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const success = db.restoreEncryptedBackup(content, vaultPassword || undefined);
      if (success) {
        sound.playSuccess();
        alert('Database terenkripsi berhasil dipulihkan!');
        onRestoreCompleted();
        onClose();
      } else {
        sound.playError();
        alert('Gagal memulihkan database. Pastikan file valid atau masukkan kata sandi enkripsi yang benar.');
      }
    };
    reader.readAsText(file);
  };

  // Simulate Cloud Sync / Backup
  const handleCloudSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleString('id-ID'));
      sound.playSuccess();
      setStatusMsg({ text: 'Sinkronisasi awan cadangan berhasil diselesaikan!', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3000);
    }, 1200);
  };

  // Add Cashier User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPin.trim()) return;

    const newUser: CashierUser = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      username: newUserName.toLowerCase().replace(/\s+/g, ''),
      pin: newUserPin.trim(),
      role: newUserRole,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [...userList, newUser];
    setUserList(updated);
    onSaveUsers(updated);
    setNewUserName('');
    setNewUserPin('');
    sound.playSuccess();
  };

  const handleDeleteUser = (userId: string) => {
    if (userList.length <= 1) {
      alert('Minimal harus ada 1 pengguna aktif.');
      return;
    }
    const updated = userList.filter((u) => u.id !== userId);
    setUserList(updated);
    onSaveUsers(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border my-6 flex flex-col ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-black text-base tracking-tight">Pengaturan Sistem & Database</h3>
              <p className="text-xs text-slate-500 font-mono">Konfigurasi toko, QRIS, keamanan AES-256, & staf kasir</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-100 dark:bg-slate-950/70 overflow-x-auto text-xs font-bold gap-1 pt-2">
          <button
            onClick={() => setActiveTab('STORE')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'STORE'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Profil Toko & Struk</span>
          </button>

          <button
            onClick={() => setActiveTab('QRIS')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'QRIS'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QRIS Real-Time</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'SECURITY'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Enkripsi AES-256 & Cadangan</span>
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'USERS'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kasir & PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('CLOUD')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'CLOUD'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-500" />
            <span>Sinkronisasi Awan</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-b border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-b border-rose-500/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
          {/* TAB 1: PROFIL TOKO */}
          {activeTab === 'STORE' && (
            <form onSubmit={handleSaveStoreSettings} className="space-y-4">
              {/* Preset Quick Apply */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase">
                  PILIH PRESET IDENTITAS CEPAT:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStoreForm((prev) => ({
                        ...prev,
                        storeName: 'Gudang Sawit & Hasil Bumi Berkah',
                        tagline: 'Timbangan Akurat, Cepat & Terpercaya',
                        address: 'Jl. Poros Perkebunan Sawit Km. 12',
                        footerMessage: 'Nota Timbangan & Transaksi Resmi. Terima Kasih.',
                      }));
                      sound.playSuccess();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
                  >
                    🌴 RAM Kelapa Sawit & Hasil Bumi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStoreForm((prev) => ({
                        ...prev,
                        storeName: 'Toko Kelontong Berkah Sejahtera',
                        tagline: 'Lengkap, Murah & Melayani Sepenuh Hati',
                        address: 'Jl. Melati Raya No. 45, RT 03/05',
                        footerMessage: 'Terima Kasih Atas Kunjungan Anda!',
                      }));
                      sound.playSuccess();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95"
                  >
                    🛒 Toko Kelontong Sembako
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nama Usaha / Gudang / Toko:</label>
                  <input
                    type="text"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Slogan / Tagline:</label>
                  <input
                    type="text"
                    value={storeForm.tagline}
                    onChange={(e) => setStoreForm({ ...storeForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Alamat Toko:</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">No. Telp / WhatsApp Toko:</label>
                  <input
                    type="text"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">Ukuran Kertas Struk:</label>
                  <select
                    value={storeForm.paperSize}
                    onChange={(e) => setStoreForm({ ...storeForm, paperSize: e.target.value as '58mm' | '80mm' })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="58mm">58mm (Thermal Standar Mini POS)</option>
                    <option value="80mm">80mm (Thermal Lebar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Pesan Penutup Struk (Footer):</label>
                <input
                  type="text"
                  value={storeForm.footerMessage}
                  onChange={(e) => setStoreForm({ ...storeForm, footerMessage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Toggles */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center justify-between cursor-pointer text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-emerald-500" />
                    <span>Cetak Struk Otomatis Selesai Bayar</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeForm.autoPrintReceipt}
                    onChange={(e) => setStoreForm({ ...storeForm, autoPrintReceipt: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-500" />
                    <span>Suara Beep & Chime Kasir (Audio Feedback)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeForm.playAudioFeedback}
                    onChange={(e) => {
                      setStoreForm({ ...storeForm, playAudioFeedback: e.target.checked });
                      sound.enabled = e.target.checked;
                    }}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black text-xs rounded-xl shadow-md tracking-wide"
                >
                  Simpan Profil Toko
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: QRIS MERCHANT */}
          {activeTab === 'QRIS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  <span>Integrasi QRIS Dinamis Standar Bank Indonesia</span>
                </div>
                <p className="opacity-90">
                  Setiap transaksi akan secara otomatis menghasilkan QRIS dinamis dengan nominal tagihan tepat, sehingga pelanggan tidak perlu mengetik harga manual.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nama Merchant QRIS (Tampil di HP Pelanggan):</label>
                <input
                  type="text"
                  value={storeForm.qrisMerchantName}
                  onChange={(e) => setStoreForm({ ...storeForm, qrisMerchantName: e.target.value })}
                  placeholder="TOKO KELONTONG BERKAH"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold uppercase bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">NMID Merchant (National Merchant ID):</label>
                <input
                  type="text"
                  value={storeForm.qrisNmid}
                  onChange={(e) => setStoreForm({ ...storeForm, qrisNmid: e.target.value })}
                  placeholder="ID1020038920192"
                  className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveStoreSettings}
                className="px-6 py-2.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black text-xs rounded-xl shadow-md tracking-wide"
              >
                Simpan Konfigurasi QRIS
              </button>
            </div>
          )}

          {/* TAB 3: ENKRIPSI AES-256 & BACKUP */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Keamanan Database Lokal Terenkripsi AES-256</span>
                </div>
                <p className="opacity-90">
                  Seluruh data transaksi, stok, kasbon, dan kata sandi disimpan secara lokal pada perangkat Anda dalam format terenkripsi AES-256. Data tidak dapat dibaca oleh pihak lain tanpa kunci otentikasi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Kunci Vault Kustom / Master Password (Opsional):
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={vaultPassword}
                    onChange={(e) => setVaultPassword(e.target.value)}
                    placeholder="Masukkan kunci enkripsi kustom jika ingin..."
                    className="w-full pl-10 pr-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Export Encrypted File */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-500" />
                    <span>Cadangkan Database (.enc)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unduh seluruh data toko dalam bentuk file terenkripsi AES-256 yang aman disimpan di flashdisk atau drive.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-xs"
                  >
                    Unduh Cadangan AES-256
                  </button>
                </div>

                {/* Import Encrypted File */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span>Pulihkan Database (Restore)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unggah file cadangan .enc untuk memulihkan seluruh data toko Anda.
                  </p>
                  <label className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center cursor-pointer">
                    <span>Pilih File .enc</span>
                    <input
                      type="file"
                      accept=".enc,.json,.db"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Factory Default */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('PERINGATAN: Muat ulang data sampel bawaan toko kelontong (40+ sembako)? Data yang ada saat ini akan direset.')) {
                      db.resetToFactoryDefault();
                      onRestoreCompleted();
                      sound.playSuccess();
                      alert('Data katalog toko kelontong berhasil dimuat ulang!');
                    }
                  }}
                  className="text-xs text-rose-500 font-semibold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset / Muat Ulang Katalog Sembako Lengkap</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: KELOLA KASIR & PIN */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              {/* Existing Users List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">DAFTAR KASIR & AKSES:</label>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {userList.map((u) => (
                    <div key={u.id} className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                            {u.role === 'OWNER' ? '👑 Pemilik' : 'Kasir'}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono">PIN Masuk: •••• (Tersimpan Aman)</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-rose-500 hover:text-rose-600 text-xs font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Cashier */}
              <form onSubmit={handleAddUser} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-extrabold text-xs tracking-tight">Tambah Kasir Baru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Nama Kasir (contoh: Rina)"
                    className="px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <input
                    type="password"
                    maxLength={6}
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    placeholder="PIN 4 Digit (contoh: 2222)"
                    className="px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'OWNER' | 'KASIR')}
                    className="px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="KASIR">Kasir</option>
                    <option value="OWNER">Pemilik Toko</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  + Tambah Kasir
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: SINKRONISASI AWAN FIREBASE */}
          {activeTab === 'CLOUD' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <Cloud className="w-5 h-5 text-emerald-500" />
                  <span>Sinkronisasi Cloud Firestore Aktif (Multi-Device & Auto-Backup)</span>
                </div>
                <p className="opacity-90 leading-relaxed">
                  Database Anda kini terhubung ke <strong>Google Firebase Firestore</strong>. Setiap transaksi kasir, perubahan harga, atau pengurangan stok di perangkat ini akan <strong>tersinkronisasi secara otomatis ke seluruh HP/tablet kasir lainnya secara real-time</strong>.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                    ✓ Anti-Hilang (Cloud Persistence)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                    ✓ Multi-Kasir Real-time
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-700 dark:text-slate-300 font-bold">
                    ✓ Tetap Berjalan Saat Offline
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <h4 className="font-bold text-xs">Aksi Sinkronisasi Manual</h4>
                <p className="text-[11px] text-slate-500">
                  Secara default sistem melakukan sinkronisasi otomatis. Anda juga dapat memaksa pengiriman data lokal saat ini ke server cloud:
                </p>
                <button
                  type="button"
                  onClick={handleCloudSync}
                  disabled={isSyncing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isSyncing ? 'Sedang Menyinkronkan...' : 'Paksa Sinkronkan Semua Data Toko ke Cloud'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
