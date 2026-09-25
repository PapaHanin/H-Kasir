import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronLeft,
  Wifi,
  Moon,
  Sun,
  Clock,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { CashierShift, StoreSettings } from '../types';
import { TabType } from './Sidebar';
import { isIframeEnvironment, openAppInNewTab } from '../services/bluetoothPrinter';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface TopHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  settings: StoreSettings;
  activeShift: CashierShift | null;
  onOpenShiftModal: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  cloudSyncStatus?: 'ONLINE' | 'OFFLINE' | 'SYNCED';
  onToggleMobileSidebar: () => void;
}

const TAB_TITLES: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Ringkasan operasional dan performa penjualan toko hari ini',
  },
  cashier: {
    title: 'Kasir / Penjualan (POS)',
    subtitle: 'Input transaksi belanja pembeli, scan barcode, dan cetak struk',
  },
  inventory: {
    title: 'Produk & Stok Barang',
    subtitle: 'Manajemen katalog sembako, harga modal, harga jual, dan stok fisik',
  },
  debts: {
    title: 'Buku Kasbon / Piutang',
    subtitle: 'Pencatatan hutang pembeli, riwayat cicilan, dan status jatuh tempo',
  },
  reports: {
    title: 'Laporan & Analisis',
    subtitle: 'Rekapitulasi omzet, perhitungan laba rugi, dan ekspor data',
  },
  settings: {
    title: 'Pengaturan Sistem Toko',
    subtitle: 'Pengaturan printer struk thermal, profil toko, dan backup database',
  },
  guide: {
    title: 'Buku Panduan Aplikasi',
    subtitle: 'Panduan lengkap navigasi, tombol kasir, SOP operasional & solusi printer struk',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  activeShift,
  onOpenShiftModal,
  darkMode,
  setDarkMode,
  cloudSyncStatus = 'SYNCED',
  onToggleMobileSidebar,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const info = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <header
      id="top-header-bar"
      className="h-16 px-4 sm:px-6 border-b shrink-0 flex items-center justify-between transition-colors sticky top-0 z-20 backdrop-blur-md bg-white/95 dark:bg-zinc-950/95 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
    >
      {/* Left: Mobile Drawer Toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Buka Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back Chevron to Dashboard if not on Dashboard */}
        {activeTab !== 'dashboard' && (
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
              {info.title}
            </h2>
            <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Sistem Aktif
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden lg:block truncate max-w-md">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Right Action Bar: Clock, Cloud Sync, Shift, Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Clock */}
        <div className="hidden sm:flex flex-col text-right font-mono">
          <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 leading-tight">
            {currentTime} WIB
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {currentDate}
          </span>
        </div>

        {/* Cloud Sync Status Badge */}
        <div
          title="Sinkronisasi Cloud Firestore Multi-Perangkat"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Wifi className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden lg:inline text-[11px] font-mono">Cloud Sync</span>
        </div>

        {/* Open in new tab button for full hardware access (Bluetooth) */}
        {isIframeEnvironment() && (
          <button
            type="button"
            onClick={() => openAppInNewTab()}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Buka aplikasi di Tab Baru (untuk akses penuh printer Bluetooth & layar penuh)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Tab Baru</span>
          </button>
        )}

        {/* PWA Install Button (1-Click for cashiers) */}
        <PWAInstallPrompt variant="header-button" darkMode={darkMode} />

        {/* Shift Management Pill */}
        <button
          type="button"
          onClick={onOpenShiftModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            activeShift
              ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-zinc-600'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Klik untuk melihat / tutup shift kasir"
        >
          <Clock className={`w-3.5 h-3.5 ${activeShift ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="font-numeric font-bold">
            {activeShift ? 'Shift Aktif' : 'Buka Shift'}
          </span>
        </button>

        {/* Dark Mode Switcher */}
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            darkMode
              ? 'border-zinc-800 bg-zinc-900 text-amber-400 hover:bg-zinc-800'
              : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
          title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
