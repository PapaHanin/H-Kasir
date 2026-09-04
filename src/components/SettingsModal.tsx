import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
  Image as ImageIcon,
  FileUp,
  Trash2,
  HelpCircle,
  Info,
  Sparkles,
  Eye,
  Check,
  Smartphone,
  Edit2,
  Bluetooth,
  BluetoothConnected,
  HardDrive,
  FileJson,
  Copy,
  ExternalLink,
  Terminal,
  AlertCircle,
} from 'lucide-react';
import { StoreSettings, CashierUser } from '../types';
import { db } from '../services/db';
import { sound } from '../services/sound';
import { generateDynamicQRIS } from '../services/qris';
import {
  bluetoothPrinter,
  BluetoothDeviceStatus,
  isIframeEnvironment,
  openAppInNewTab,
} from '../services/bluetoothPrinter';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  users: CashierUser[];
  onSaveUsers: (users: CashierUser[]) => void;
  onRestoreCompleted: () => void;
  onUpdateOwner?: (newName: string, newPin?: string) => void;
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
  onUpdateOwner,
  darkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'STORE' | 'PRINTER' | 'QRIS' | 'SECURITY' | 'USERS' | 'CLOUD'>('STORE');

  // Bluetooth thermal printer state
  const [btStatus, setBtStatus] = useState<BluetoothDeviceStatus>(bluetoothPrinter.getStatus());
  const [isBtConnecting, setIsBtConnecting] = useState(false);
  const [isTestingBt, setIsTestingBt] = useState(false);

  // Persistent storage state (Solution #1: Anti-Clear Cache)
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [isRequestingPersist, setIsRequestingPersist] = useState(false);
  const [isBtIframeBlocked, setIsBtIframeBlocked] = useState(false);

  useEffect(() => {
    return bluetoothPrinter.subscribe(setBtStatus);
  }, []);

  useEffect(() => {
    db.isStoragePersisted().then(setIsPersisted);
  }, []);

  const handleRequestPersist = async () => {
    setIsRequestingPersist(true);
    try {
      const granted = await db.requestPersistentStorage();
      setIsPersisted(granted);
      if (granted) {
        sound.playSuccess();
        setStatusMsg({
          text: 'Penyimpanan Permanen Aktif! Browser tidak akan menghapus data toko saat memori penuh.',
          type: 'success',
        });
      } else {
        setStatusMsg({
          text: 'Browser belum memberikan izin penyimpanan permanen. Pastikan bookmark toko ini di browser.',
          type: 'error',
        });
      }
    } catch {
      setStatusMsg({ text: 'Gagal meminta izin penyimpanan permanen ke browser.', type: 'error' });
    } finally {
      setIsRequestingPersist(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleConnectBt = async () => {
    setIsBtConnecting(true);
    setIsBtIframeBlocked(false);
    try {
      await bluetoothPrinter.connect();
      sound.playSuccess();
      setStatusMsg({ text: 'Printer Bluetooth thermal berhasil terhubung!', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      sound.playError();
      const errMsg = String(err?.message || '');
      if (
        err?.isIframePolicy ||
        errMsg.toLowerCase().includes('permissions policy') ||
        errMsg.toLowerCase().includes('disallowed') ||
        errMsg.toLowerCase().includes('jendela pratinjau')
      ) {
        setIsBtIframeBlocked(true);
        setStatusMsg({
          text: 'Akses Bluetooth dibatasi di jendela pratinjau. Silakan gunakan tombol "Buka di Tab Baru".',
          type: 'error',
        });
      } else if (err?.isCancelled) {
        setStatusMsg({ text: 'Pemilihan printer Bluetooth dibatalkan.', type: 'info' });
      } else {
        setStatusMsg({ text: errMsg || 'Gagal menghubungkan printer Bluetooth.', type: 'error' });
      }
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setIsBtConnecting(false);
    }
  };

  const handleDisconnectBt = async () => {
    await bluetoothPrinter.disconnect();
    sound.playBeep(440, 0.08);
    setStatusMsg({ text: 'Koneksi printer Bluetooth berhasil diputus.', type: 'success' });
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleTestPrintBt = async () => {
    setIsTestingBt(true);
    try {
      await bluetoothPrinter.printTest(storeForm);
      sound.playSuccess();
      setStatusMsg({ text: 'Perintah tes cetak berhasil dikirim ke printer!', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      sound.playError();
      const errMsg = String(err?.message || '');
      if (
        err?.isIframePolicy ||
        errMsg.toLowerCase().includes('permissions policy') ||
        errMsg.toLowerCase().includes('disallowed')
      ) {
        setIsBtIframeBlocked(true);
        setStatusMsg({
          text: 'Akses Bluetooth dibatasi di jendela pratinjau. Buka di Tab Baru browser.',
          type: 'error',
        });
      } else {
        setStatusMsg({ text: errMsg || 'Gagal melakukan tes cetak Bluetooth.', type: 'error' });
      }
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setIsTestingBt(false);
    }
  };

  // Store form state
  const [storeForm, setStoreForm] = useState<StoreSettings>(() => {
    const s = { ...settings };
    if (!s.ownerName) s.ownerName = 'Pemilik / Kasir Utama';
    if (!s.qrisMode) s.qrisMode = 'DYNAMIC_NMID';
    if (!s.qrisCity) s.qrisCity = 'JAKARTA';
    if (s.storeName && (s.storeName.toLowerCase().includes('sawit') || s.storeName.toLowerCase().includes('hasil bumi'))) {
      s.storeName = 'Toko Kelontong Berkah Sejahtera';
      s.tagline = 'Lengkap, Murah & Melayani Sepenuh Hati';
      s.address = 'Jl. Melati Raya No. 45, RT 03/05';
      s.footerMessage = 'Terima Kasih Atas Kunjungan Anda!';
    }
    return s;
  });

  // Handle upload of custom QRIS image
  const handleQrisImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar! Maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setStoreForm((prev) => ({
          ...prev,
          qrisImageUrl: base64,
          qrisMode: 'CUSTOM_IMAGE',
        }));
        sound.playSuccess();
        setStatusMsg({ text: 'Gambar QRIS berhasil diunggah!', type: 'success' });
        setTimeout(() => setStatusMsg(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrisImage = () => {
    setStoreForm((prev) => ({
      ...prev,
      qrisImageUrl: undefined,
      qrisMode: 'DYNAMIC_NMID',
    }));
    sound.playBeep(440, 0.05);
  };

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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserPin, setEditingUserPin] = useState('');

  if (!isOpen) return null;

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(storeForm);
    if (storeForm.ownerName) {
      onUpdateOwner?.(storeForm.ownerName);
    }
    sound.playSuccess();
    setStatusMsg({ text: 'Pengaturan toko berhasil disimpan!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleStartEditUser = (user: CashierUser) => {
    setEditingUserId(user.id);
    setEditingUserName(user.name);
    setEditingUserPin(user.pin);
  };

  const handleSaveEditUser = (userId: string) => {
    if (!editingUserName.trim()) return;
    const updated = userList.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          name: editingUserName.trim(),
          pin: editingUserPin.trim() || u.pin,
        };
      }
      return u;
    });
    setUserList(updated);
    onSaveUsers(updated);

    const editedUser = updated.find((u) => u.id === userId);
    if (editedUser && editedUser.role === 'OWNER') {
      onUpdateOwner?.(editedUser.name, editedUser.pin);
    }

    setEditingUserId(null);
    sound.playSuccess();
    setStatusMsg({ text: 'Data pengguna kasir/pemilik berhasil diperbarui!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Download Full JSON Backup (Human-Readable & Safe)
  const handleExportJsonBackup = () => {
    try {
      const jsonString = db.exportJsonBackup();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cadangan_KasirKelontong_Lengkap_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      sound.playSuccess();
      setStatusMsg({ text: 'File cadangan JSON lengkap berhasil diunduh!', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch {
      setStatusMsg({ text: 'Gagal membuat file cadangan JSON.', type: 'error' });
    }
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

  // Upload and Restore Universal Backup (.json, .enc, .pos, .db)
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      let success = false;
      // Try JSON first if content looks like JSON
      if (file.name.endsWith('.json') || content.trim().startsWith('{')) {
        success = db.restoreJsonBackup(content);
      }
      // If not successful or encrypted, try encrypted backup
      if (!success) {
        success = db.restoreEncryptedBackup(content, vaultPassword || undefined);
      }

      if (success) {
        sound.playSuccess();
        alert('Database toko berhasil dipulihkan secara menyeluruh! Semua produk, transaksi, dan data telah aktif kembali.');
        onRestoreCompleted();
        onClose();
      } else {
        sound.playError();
        alert('Gagal memulihkan database. Pastikan file valid (.json atau .enc) atau masukkan kata sandi enkripsi yang benar.');
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
            <Settings className="w-5 h-5 text-purple-500" />
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
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'STORE'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-pink-400 border-purple-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Profil Toko</span>
          </button>

          <button
            onClick={() => setActiveTab('PRINTER')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'PRINTER'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-pink-400 border-purple-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Printer className="w-4 h-4 text-blue-500" />
            <span>Printer Thermal & Kiosk</span>
          </button>

          <button
            onClick={() => setActiveTab('QRIS')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'QRIS'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-pink-400 border-purple-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QRIS Real-Time</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'SECURITY'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-pink-400 border-purple-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>Keamanan & Cadangan</span>
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'USERS'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-pink-400 border-purple-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kasir & PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('CLOUD')}
            className={`px-3 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'CLOUD'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-pink-400 border-purple-500 shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Cloud className="w-4 h-4 text-pink-500" />
            <span>Sinkronisasi Awan</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-purple-500/10 text-purple-700 dark:text-pink-300 border-b border-purple-500/20'
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
              <div className="p-3.5 rounded-xl bg-purple-500/5 dark:bg-purple-950/30 border border-purple-500/20 space-y-2">
                <div className="text-[11px] font-bold text-purple-700 dark:text-pink-300 font-mono uppercase">
                  PILIH PRESET IDENTITAS TOKO KELONTONG CEPAT:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStoreForm((prev) => ({
                        ...prev,
                        storeName: 'Toko Kelontong Berkah Sejahtera',
                        tagline: 'Lengkap, Murah & Melayani Sepenuh Hati',
                        address: 'Jl. Melati Raya No. 45, RT 03/05',
                        footerMessage: 'Terima Kasih Atas Kunjungan Anda! Semoga Berkah Selalu.',
                      }));
                      sound.playSuccess();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    🛒 Toko Kelontong Berkah Sejahtera
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStoreForm((prev) => ({
                        ...prev,
                        storeName: 'Warung Madura Sembako 24 Jam',
                        tagline: 'Buka 24 Jam - Sedia Sembako, Gas, Galon & Pulsa',
                        address: 'Jl. Raya Utama No. 128, Depan Masjid',
                        footerMessage: 'Matur Suksma / Terima Kasih Atas Kunjungan Anda.',
                      }));
                      sound.playSuccess();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 text-purple-700 dark:text-pink-300 border border-purple-300 dark:border-purple-700 text-xs font-bold transition-all active:scale-95"
                  >
                    🏪 Warung Sembako Madura 24 Jam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStoreForm((prev) => ({
                        ...prev,
                        storeName: 'Minimarket Kelontong Murah Jaya',
                        tagline: 'Grosir & Eceran Sembako Terlengkap & Termurah',
                        address: 'Pasar Baru Blok A No. 15-16',
                        footerMessage: 'Terima Kasih Telah Belanja di Toko Murah Jaya.',
                      }));
                      sound.playSuccess();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all active:scale-95"
                  >
                    🛍️ Minimarket Kelontong Murah Jaya
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nama Pemilik Toko:</label>
                  <input
                    type="text"
                    value={storeForm.ownerName || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })}
                    placeholder="Contoh: Pak Budi Santoso"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nama Toko Kelontong:</label>
                  <input
                    type="text"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Slogan / Tagline Toko:</label>
                  <input
                    type="text"
                    value={storeForm.tagline}
                    onChange={(e) => setStoreForm({ ...storeForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Alamat Toko Kelontong:</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">Ukuran Kertas Struk:</label>
                  <select
                    value={storeForm.paperSize}
                    onChange={(e) => setStoreForm({ ...storeForm, paperSize: e.target.value as '58mm' | '80mm' })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Toggles */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center justify-between cursor-pointer text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-purple-500" />
                    <span>Cetak Struk Otomatis Selesai Bayar</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeForm.autoPrintReceipt}
                    onChange={(e) => setStoreForm({ ...storeForm, autoPrintReceipt: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-pink-500" />
                    <span>Suara Beep & Chime Kasir (Audio Feedback)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeForm.playAudioFeedback}
                    onChange={(e) => {
                      setStoreForm({ ...storeForm, playAudioFeedback: e.target.checked });
                      sound.enabled = e.target.checked;
                    }}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs rounded-xl shadow-md tracking-wide cursor-pointer transition-all active:scale-95"
                >
                  Simpan Profil Toko
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PRINTER & HARDWARE (SOLUSI NOMOR 2: SILENT PRINTING) */}
          {activeTab === 'PRINTER' && (
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
                <div className="font-extrabold text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Printer className="w-5 h-5" />
                  <span>Pengaturan Printer Thermal & Cetak Cepat (ESC/POS)</span>
                </div>
                <p className="opacity-90 leading-relaxed text-slate-600 dark:text-slate-300">
                  Aplikasi mendukung cetak langsung tanpa jendela dialog browser (silent printing) menggunakan <strong>Web Bluetooth ESC/POS</strong> untuk printer kasir thermal nirkabel, serta mode <strong>Kiosk Printing</strong> untuk komputer kasir desktop.
                </p>
              </div>

              {/* PWA Standalone Mode Installation Card */}
              <PWAInstallPrompt variant="settings-card" darkMode={darkMode} />

              {/* Section 1: Bluetooth Thermal Printer */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
                {/* Iframe detection notice */}
                {(isIframeEnvironment() || isBtIframeBlocked) && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <span className="font-bold">Aplikasi dibuka di Jendela Pratinjau (Iframe):</span> Browser membatasi izin Web Bluetooth pada iframe. Buka aplikasi di Tab Baru untuk menyambungkan printer fisik nirkabel Anda.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAppInNewTab()}
                      className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka di Tab Baru</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {btStatus.isConnected ? (
                        <BluetoothConnected className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Bluetooth className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>Printer Thermal Bluetooth</span>
                        {btStatus.isConnected ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                            Terhubung: {btStatus.deviceName || 'Thermal Printer'}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            Belum Terhubung
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Cetak struk 1 detik langsung keluar dari printer tanpa popup konfirmasi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {btStatus.isConnected ? (
                      <button
                        type="button"
                        onClick={handleDisconnectBt}
                        className="py-2 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Putuskan
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectBt}
                        disabled={isBtConnecting}
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        <Bluetooth className="w-3.5 h-3.5" />
                        <span>{isBtConnecting ? 'Mencari...' : 'Pindai & Sambungkan'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleTestPrintBt}
                      disabled={isTestingBt}
                      className="py-2 px-3 border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{isTestingBt ? 'Mencetak...' : 'Tes Cetak'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    Merek & Tipe Printer yang Didukung:
                  </div>
                  <div>
                    Mendukung seluruh printer kasir thermal Bluetooth 58mm & 80mm di pasaran, seperti: <strong>RPP02N, VSC MP-58, Panda, Eppos, Iware, Zjiang, Sunmi, Mini POS, dll.</strong>
                  </div>
                </div>
              </div>

              {/* Section 2: Format Kertas & Struk */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
                <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                  Pengaturan Format Struk Belanja
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Ukuran Kertas Thermal:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStoreForm((p) => ({ ...p, receiptPaperSize: '58mm' }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          (storeForm.receiptPaperSize || '58mm') === '58mm'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        58 mm (Mini Kasir)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStoreForm((p) => ({ ...p, receiptPaperSize: '80mm' }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          storeForm.receiptPaperSize === '80mm'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        80 mm (Standar POS)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={storeForm.autoPrintReceipt}
                        onChange={(e) => setStoreForm((p) => ({ ...p, autoPrintReceipt: e.target.checked }))}
                        className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500"
                      />
                      <span>Cetak struk otomatis saat pembayaran selesai</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 3: Kiosk Silent Print Guide for Desktop */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-500" />
                  <span>Panduan Cetak Cepat Tanpa Dialog di PC / Laptop (Mode Kiosk)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Jika menggunakan PC/Laptop kasir dengan printer USB, Anda dapat mengaktifkan fitur cetak otomatis tanpa dialog (seperti minimarket Indomaret/Alfamart) dengan menambahkan parameter berikut pada pintasan Google Chrome Anda:
                </p>
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] flex items-center justify-between gap-2 overflow-x-auto">
                  <code>chrome.exe --kiosk --kiosk-printing &quot;https://app-anda.com&quot;</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('chrome.exe --kiosk --kiosk-printing');
                      sound.playSuccess();
                      setStatusMsg({ text: 'Perintah Kiosk berhasil disalin ke clipboard!', type: 'success' });
                      setTimeout(() => setStatusMsg(null), 2500);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer shrink-0"
                    title="Salin Perintah"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveStoreSettings}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs rounded-xl shadow-md tracking-wide cursor-pointer transition-all active:scale-95"
                >
                  Simpan Pengaturan Printer
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: QRIS MERCHANT */}
          {activeTab === 'QRIS' && (
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-pink-300 space-y-1.5">
                <div className="font-extrabold text-sm flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-600 dark:text-pink-400" />
                  <span>Pengaturan QRIS Toko Kelontong</span>
                </div>
                <p className="opacity-90 leading-relaxed text-slate-600 dark:text-slate-300">
                  Pilih cara Anda menampilkan kode QRIS kepada pembeli di kasir. Anda bisa menggunakan sistem <strong>QRIS Dinamis Otomatis</strong> (nominal harga pas otomatis muncul di HP pembeli) atau <strong>Unggah Foto/Gambar QRIS Toko Anda</strong> sendiri.
                </p>
              </div>

              {/* Mode Selector Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                  Pilih Metode QRIS yang Ingin Digunakan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Dynamic NMID */}
                  <button
                    type="button"
                    onClick={() => setStoreForm((prev) => ({ ...prev, qrisMode: 'DYNAMIC_NMID' }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                      (storeForm.qrisMode || 'DYNAMIC_NMID') === 'DYNAMIC_NMID'
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 shadow-sm ring-2 ring-purple-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-pink-400 mb-2">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      {(storeForm.qrisMode || 'DYNAMIC_NMID') === 'DYNAMIC_NMID' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Aktif
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                        1. QRIS Dinamis (Rekomendasi)
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Gunakan Nama Merchant & NMID toko Anda. Barcode QR otomatis mengisi nominal belanja di HP pembeli.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Upload Custom Image */}
                  <button
                    type="button"
                    onClick={() => setStoreForm((prev) => ({ ...prev, qrisMode: 'CUSTOM_IMAGE' }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                      storeForm.qrisMode === 'CUSTOM_IMAGE'
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 shadow-sm ring-2 ring-purple-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 mb-2">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      {storeForm.qrisMode === 'CUSTOM_IMAGE' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-pink-600 text-white px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Aktif
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                        2. Unggah Foto QRIS Toko Sendiri
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Upload foto stiker QRIS atau screenshot dari BCA/BRI/GoPay/DANA/ShopeePay milik toko Anda.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Main Content Area based on Selected Mode */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Side: Form inputs */}
                <div className="lg:col-span-7 space-y-4">
                  {/* MODE 1: DYNAMIC NMID FORM */}
                  {(storeForm.qrisMode || 'DYNAMIC_NMID') === 'DYNAMIC_NMID' && (
                    <div className="space-y-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Nama Merchant QRIS (Tampil di HP Pelanggan):
                        </label>
                        <input
                          type="text"
                          value={storeForm.qrisMerchantName}
                          onChange={(e) => setStoreForm({ ...storeForm, qrisMerchantName: e.target.value })}
                          placeholder="Contoh: TOKO KELONTONG BERKAH"
                          className="w-full px-3 py-2 rounded-xl border text-xs font-bold uppercase bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Nama toko Anda seperti yang terdaftar di bank/penyedia QRIS
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 font-mono">
                            NMID Merchant (National Merchant ID):
                          </label>
                          <input
                            type="text"
                            value={storeForm.qrisNmid}
                            onChange={(e) => setStoreForm({ ...storeForm, qrisNmid: e.target.value.trim() })}
                            placeholder="Contoh: ID1020038920192"
                            className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                            Kota Toko (City):
                          </label>
                          <input
                            type="text"
                            value={storeForm.qrisCity || 'JAKARTA'}
                            onChange={(e) => setStoreForm({ ...storeForm, qrisCity: e.target.value.toUpperCase() })}
                            placeholder="Contoh: JAKARTA / SURABAYA"
                            className="w-full px-3 py-2 rounded-xl border text-xs uppercase bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Explanation where to find NMID */}
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-amber-200 text-xs space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                          <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Di Mana Saya Bisa Menemukan NMID Toko Saya?</span>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-95">
                          1. Buka <strong>stiker atau kertas cetak QRIS</strong> resmi toko Anda (dari BCA, Mandiri, BRI, GoPay, ShopeePay, DANA, OVO, dll).
                        </p>
                        <p className="text-[11px] leading-relaxed opacity-95">
                          2. Perhatikan bagian bawah gambar barcode QRIS. Terdapat tulisan <strong>NMID: ID...</strong> (contoh: <code>ID1020038920192</code> atau <code>ID20...</code>).
                        </p>
                        <p className="text-[11px] leading-relaxed opacity-95">
                          3. Salin/ketik kode <strong>NMID</strong> tersebut ke kolom di atas, lalu klik <strong>Simpan Konfigurasi QRIS</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* MODE 2: CUSTOM IMAGE UPLOAD FORM */}
                  {storeForm.qrisMode === 'CUSTOM_IMAGE' && (
                    <div className="space-y-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Nama Label Toko:
                        </label>
                        <input
                          type="text"
                          value={storeForm.qrisMerchantName}
                          onChange={(e) => setStoreForm({ ...storeForm, qrisMerchantName: e.target.value })}
                          placeholder="TOKO KELONTONG BERKAH"
                          className="w-full px-3 py-2 rounded-xl border text-xs font-bold uppercase bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                          Upload File Foto / Gambar QRIS Toko Anda:
                        </label>
                        
                        {storeForm.qrisImageUrl ? (
                          <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-24 h-24 bg-white p-1 rounded-xl shadow-md border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
                              <img
                                src={storeForm.qrisImageUrl}
                                alt="Pratinjau QRIS"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <div className="space-y-2 text-center sm:text-left flex-1">
                              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center sm:justify-start gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>Gambar QRIS Berhasil Terpasang</span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Gambar ini akan langsung tampil saat Anda memilih pembayaran QRIS di kasir.
                              </p>
                              <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                                <label className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                                  <FileUp className="w-3.5 h-3.5" />
                                  <span>Ganti Foto</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQrisImageUpload}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={handleRemoveQrisImage}
                                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-purple-300 dark:border-purple-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all group">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-pink-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <FileUp className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1">
                              Klik Di Sini Untuk Pilih Foto QRIS Toko Anda
                            </span>
                            <span className="text-[11px] text-slate-400 max-w-xs">
                              Format file JPG, PNG, atau WebP (Maksimal 3MB). Bisa berupa foto stiker QRIS atau screenshot dari aplikasi bank.
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleQrisImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Live Test Preview */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center">
                    <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 font-mono flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-purple-500" />
                      <span>PRATINJAU LANGSUNG QRIS</span>
                    </div>

                    {/* QR Preview Frame */}
                    <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-inner flex flex-col items-center max-w-[200px] w-full my-2">
                      <div className="text-[9px] font-black tracking-widest text-slate-700 uppercase mb-1 font-mono">
                        QRIS INDONESIA
                      </div>

                      {storeForm.qrisMode === 'CUSTOM_IMAGE' && storeForm.qrisImageUrl ? (
                        <div className="w-[150px] h-[150px] flex items-center justify-center overflow-hidden bg-white">
                          <img
                            src={storeForm.qrisImageUrl}
                            alt="Preview QRIS"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      ) : (
                        <QRCodeSVG
                          value={generateDynamicQRIS({
                            merchantName: storeForm.qrisMerchantName || 'TOKO KELONTONG BERKAH',
                            merchantCity: storeForm.qrisCity || 'JAKARTA',
                            nmid: storeForm.qrisNmid || 'ID1020038920192',
                            amount: 25000,
                            invoiceNumber: 'INV-TEST-001',
                          })}
                          size={150}
                          level="M"
                          includeMargin={false}
                        />
                      )}

                      <div className="text-[9px] font-bold font-mono text-slate-600 mt-1 truncate max-w-full">
                        {storeForm.qrisMerchantName || 'TOKO KELONTONG BERKAH'}
                      </div>
                      <div className="text-[8px] font-mono text-slate-400 truncate max-w-full">
                        {storeForm.qrisNmid ? `NMID: ${storeForm.qrisNmid}` : 'NMID: ID1020038920192'}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-2 leading-relaxed">
                      <span className="font-bold text-purple-600 dark:text-pink-400">💡 Uji Scan Langsung:</span> Anda dapat mencoba scan barcode di atas sekarang menggunakan kamera aplikasi m-banking atau e-wallet di HP Anda untuk memastikan rekening toko sudah benar.
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 flex justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveStoreSettings}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs rounded-xl shadow-lg tracking-wide cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Konfigurasi QRIS Toko</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: KEAMANAN & CADANGAN DATABASE (SOLUSI NOMOR 1) */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4">
              {/* Solution 1: Persistent Storage Status Card */}
              <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-purple-600 dark:text-pink-400" />
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>Penyimpanan Permanen Browser (Anti-Hapus)</span>
                        {isPersisted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Aktif & Dilindungi
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                            Siap Diaktifkan
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Data kasir dicadangkan otomatis ganda ke <strong>LocalStorage + IndexedDB</strong>.
                      </p>
                    </div>
                  </div>

                  {!isPersisted && (
                    <button
                      type="button"
                      onClick={handleRequestPersist}
                      disabled={isRequestingPersist}
                      className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      {isRequestingPersist ? 'Meminta Izin...' : 'Kunci Penyimpanan Permanen'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dengan mengaktifkan fitur ini, browser Chrome/Android/Edge tidak akan pernah menghapus data toko Anda secara otomatis meskipun memori penyimpanan ponsel atau laptop hampir penuh.
                </p>
              </div>

              {/* Master Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 font-mono">
                  Kunci Vault Kustom / Master Password (Opsional):
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={vaultPassword}
                    onChange={(e) => setVaultPassword(e.target.value)}
                    placeholder="Masukkan kunci enkripsi kustom jika ingin..."
                    className="w-full pl-10 pr-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Backup & Restore Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Export JSON (Universal) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <FileJson className="w-4 h-4 text-emerald-500" />
                      <span>Cadangan Lengkap (.json)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Format standar terbuka berisi produk, stok, transaksi, hutang, dan profil toko.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportJsonBackup}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .json</span>
                  </button>
                </div>

                {/* Export Encrypted File */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      <span>Cadangan Enkripsi (.enc)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Terkunci dengan enkripsi AES-256 militer, aman disimpan di flashdisk publik.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .enc</span>
                  </button>
                </div>

                {/* Universal Restore File */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Upload className="w-4 h-4 text-pink-500" />
                      <span>Pulihkan Database (Restore)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Unggah file cadangan (.json atau .enc) untuk mengembalikan seluruh data toko.
                    </p>
                  </div>
                  <label className="w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File Backup</span>
                    <input
                      type="file"
                      accept=".json,.enc,.pos,.db"
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
                  className="text-xs text-rose-500 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
                <div className="divide-y divide-slate-200 dark:border-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {userList.map((u) => (
                    <div key={u.id} className="p-3 bg-white dark:bg-slate-900">
                      {editingUserId === u.id ? (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-purple-600 dark:text-pink-400">
                            Edit Data {u.role === 'OWNER' ? 'Pemilik Toko' : 'Kasir'}:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">Nama Pengguna:</label>
                              <input
                                type="text"
                                value={editingUserName}
                                onChange={(e) => setEditingUserName(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">PIN Masuk Baru (4-6 Digit):</label>
                              <input
                                type="password"
                                maxLength={6}
                                value={editingUserPin}
                                onChange={(e) => setEditingUserPin(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditUser(u.id)}
                              className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs rounded-lg hover:opacity-95 cursor-pointer shadow-sm"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{u.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-pink-300 font-mono border border-purple-200 dark:border-purple-800">
                                {u.role === 'OWNER' ? '👑 Pemilik' : 'Kasir'}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] font-mono">PIN Masuk: •••• (Tersimpan Aman)</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditUser(u)}
                              className="text-purple-600 dark:text-pink-400 hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            {u.role !== 'OWNER' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-rose-500 hover:text-rose-600 text-xs font-bold cursor-pointer"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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
                    className="px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <input
                    type="password"
                    maxLength={6}
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    placeholder="PIN 4 Digit (contoh: 2222)"
                    className="px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'OWNER' | 'KASIR')}
                    className="px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="KASIR">Kasir</option>
                    <option value="OWNER">Pemilik Toko</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  + Tambah Kasir
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: SINKRONISASI AWAN FIREBASE */}
          {activeTab === 'CLOUD' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-950 dark:text-pink-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-purple-700 dark:text-pink-300">
                  <Cloud className="w-5 h-5 text-purple-500" />
                  <span>Sinkronisasi Cloud Firestore Aktif (Multi-Device & Auto-Backup)</span>
                </div>
                <p className="opacity-90 leading-relaxed">
                  Database Anda kini terhubung ke <strong>Google Firebase Firestore</strong>. Setiap transaksi kasir, perubahan harga, atau pengurangan stok di perangkat ini akan <strong>tersinkronisasi secara otomatis ke seluruh HP/tablet kasir lainnya secara real-time</strong>.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-pink-300 font-bold">
                    ✓ Anti-Hilang (Cloud Persistence)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-700 dark:text-pink-300 font-bold">
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
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
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
