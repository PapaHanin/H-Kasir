import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Info, X, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isIframeEnvironment, openAppInNewTab } from '../services/bluetoothPrinter';

interface PWAInstallPromptProps {
  variant?: 'banner' | 'header-button' | 'settings-card';
  darkMode?: boolean;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  variant = 'header-button',
  darkMode = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const inIframe = isIframeEnvironment();

  // If already installed as standalone PWA
  if (isInstalled) {
    if (variant === 'settings-card') {
      return (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              Aplikasi Kasir Sudah Terpasang (Mode Standalone)
            </h4>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              Aplikasi berjalan langsung dari perangkat tanpa bilah browser. Printer thermal Bluetooth dan cetak instan bekerja optimal.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Inside iframe, browser does not fire 'beforeinstallprompt', so advise opening new tab or installing
  if (inIframe) {
    if (variant === 'header-button') {
      return (
        <button
          type="button"
          onClick={() => openAppInNewTab()}
          title="Buka Layar Penuh & Pasang Aplikasi"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang Aplikasi</span>
        </button>
      );
    }

    if (variant === 'settings-card') {
      return (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Pasang Aplikasi Kasir di HP / Laptop (1-Klik)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Buka di tab tersendiri agar dapat dipasang langsung ke Home Screen / Desktop seperti aplikasi kasir sungguhan tanpa perlu Play Store.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAppInNewTab()}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Tab Baru untuk Memasang</span>
          </button>
        </div>
      );
    }

    return null;
  }

  // iOS Safari Guide
  if (isIOS) {
    if (variant === 'header-button') {
      return (
        <button
          type="button"
          onClick={() => alert('Untuk iPhone/iPad: Ketuk ikon "Bagikan" (Share) di Safari bawah, lalu pilih "Tambah ke Layar Utama" (Add to Home Screen).')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Pasang ke iPhone</span>
        </button>
      );
    }

    if (variant === 'settings-card') {
      return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>Cara Pasang di iPhone / iPad (iOS):</span>
          </h4>
          <ol className="text-xs text-slate-600 dark:text-slate-400 list-decimal list-inside space-y-1">
            <li>Buka halaman ini di browser <strong>Safari</strong>.</li>
            <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah layar.</li>
            <li>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</li>
          </ol>
        </div>
      );
    }
  }

  // Standard Chrome/Edge/Android install prompt
  if (variant === 'header-button') {
    return (
      <button
        id="btn-pwa-header-install"
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer animate-pulse hover:animate-none"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Pasang Aplikasi</span>
        <span className="sm:hidden">Pasang</span>
      </button>
    );
  }

  if (variant === 'settings-card') {
    return (
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Pasang Aplikasi Kasir ke Perangkat
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Jadikan aplikasi kasir mandiri tanpa bilah browser, dapat diakses dari Layar Utama HP / Desktop dan mendukung cetak printer thermal secara langsung.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={install}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Pasang Sekarang (Instal PWA)</span>
        </button>
      </div>
    );
  }

  // Banner variant
  if (dismissed || !isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
            🛒
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
              Pasang Aplikasi Kasir
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Akses cepat di layar utama & cetak printer lancar
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={install}
          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang ke Layar</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
        >
          Nanti
        </button>
      </div>
    </div>
  );
};
