import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  CheckCircle,
  X,
  ExternalLink,
  Sparkles,
  Share2,
  PlusSquare,
  Monitor,
} from 'lucide-react';
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
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios' | 'laptop'>('android');
  const inIframe = isIframeEnvironment();

  const handleInstallClick = async () => {
    if (inIframe) {
      // In iframe preview, open in new tab and show guide
      openAppInNewTab();
      setIsGuideModalOpen(true);
      return;
    }

    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setIsGuideModalOpen(true);
      }
    } else {
      setIsGuideModalOpen(true);
    }
  };

  // Render Installation Guide Modal
  const renderGuideModal = () => {
    if (!isGuideModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-base tracking-tight">
                  Pasang Kasir-Q di Perangkat
                </h3>
                <p className="text-xs text-emerald-100">
                  Tersedia untuk HP Android, iPhone, dan Laptop
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Device Tabs */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveGuideTab('android')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeGuideTab === 'android'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>HP Android</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('laptop')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeGuideTab === 'laptop'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Laptop / PC</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('ios')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeGuideTab === 'ios'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone (iOS)</span>
            </button>
          </div>

          {/* Guide Steps Body */}
          <div className="p-6 space-y-4 overflow-y-auto">
            {activeGuideTab === 'android' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    Q
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Nama Aplikasi di Layar: <span className="font-black text-sm">Kasir-Q</span>
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Berfungsi offline tanpa sinyal & terhubung langsung ke printer thermal Bluetooth.
                    </p>
                  </div>
                </div>

                <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      Buka aplikasi melalui browser <strong>Google Chrome</strong> di HP Anda.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      Ketuk menu titik tiga <strong>(⋮)</strong> di sudut kanan atas Chrome.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      Pilih menu <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div>
                      Konfirmasi nama <strong>Kasir-Q</strong> dan ketuk <strong>Instal</strong>. Aplikasi akan muncul di layar beranda HP Anda!
                    </div>
                  </li>
                </ol>
              </div>
            )}

            {activeGuideTab === 'laptop' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                  <Laptop className="w-8 h-8 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      Instal di Laptop / Komputer Desktop (Windows & Mac)
                    </h4>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400">
                      Membuka jendela aplikasi mandiri (tanpa kolom alamat URL browser) dengan performa maksimal.
                    </p>
                  </div>
                </div>

                <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      Buka aplikasi di browser <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> di laptop.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      Perhatikan bilah alamat (URL bar) di kanan atas: klik ikon <strong>Komputer Kecil / Tanda Plus (⊕)</strong> berlabel <em>"Instal Kasir-Q"</em>.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      Atau klik menu titik tiga browser (⋮) &gt; pilih <strong>"Instal Kasir-Q..."</strong>.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div>
                      Selesai! Ikon <strong>Kasir-Q</strong> akan dibuat di Desktop laptop dan menu Start.
                    </div>
                  </li>
                </ol>
              </div>
            )}

            {activeGuideTab === 'ios' && (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-500/20 rounded-2xl flex items-center gap-3">
                  <Share2 className="w-7 h-7 text-purple-600 dark:text-pink-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300">
                      Instal di iPhone & iPad (Safari)
                    </h4>
                    <p className="text-[11px] text-purple-700 dark:text-purple-400">
                      Bisa diakses langsung dari Home Screen iOS seperti aplikasi App Store.
                    </p>
                  </div>
                </div>

                <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      Pastikan Anda membuka tautan di browser bawaan <strong>Safari</strong>.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      Ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah layar (ikon kotak dengan panah ke atas).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      Gulir ke bawah dan ketuk <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div>
                      Pastikan judul bernama <strong>Kasir-Q</strong>, lalu ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.
                    </div>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => openAppInNewTab()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Tautan Tab Penuh</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  // If already installed as standalone PWA
  if (isInstalled) {
    if (variant === 'settings-card') {
      return (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              Kasir-Q Sudah Terpasang (Mode Standalone)
            </h4>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              Aplikasi berjalan langsung dari perangkat tanpa bilah browser. Printer thermal Bluetooth dan cetak struk instan bekerja optimal.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Header Button Variant
  if (variant === 'header-button') {
    return (
      <>
        <button
          id="btn-pwa-header-install"
          type="button"
          onClick={handleInstallClick}
          title="Pasang Kasir-Q di HP atau Laptop"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer border border-emerald-400/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pasang Kasir-Q</span>
          <span className="sm:hidden">Pasang</span>
        </button>
        {renderGuideModal()}
      </>
    );
  }

  // Settings Card Variant
  if (variant === 'settings-card') {
    return (
      <>
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">
              Q
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Pasang Aplikasi Kasir-Q</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white">
                  PWA
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Pasang langsung ke Layar Utama HP (Android &amp; iPhone) atau Desktop Laptop (Windows &amp; Mac) dengan nama tampilan <strong>Kasir-Q</strong>. Akses kasir tanpa bilah browser dan cetak printer lancar.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Instal Kasir-Q Sekarang</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Petunjuk HP &amp; Laptop</span>
            </button>
          </div>
        </div>
        {renderGuideModal()}
      </>
    );
  }

  // Floating Banner Variant
  if (dismissed) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              Q
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                Pasang Kasir-Q di Perangkat
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Akses cepat di HP &amp; Laptop tanpa unduh Play Store
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
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang Sekarang</span>
          </button>
          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
          >
            Petunjuk
          </button>
        </div>
      </div>
      {renderGuideModal()}
    </>
  );
};
