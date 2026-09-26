import React, { useState } from 'react';
import {
  FileText,
  Printer,
  CheckCircle2,
  Phone,
  Shield,
  Smartphone,
  WifiOff,
  Cloud,
  Users,
  CreditCard,
  QrCode,
  Package,
  Layers,
  Sparkles,
  Download,
  Share2,
  X,
  EyeOff,
  HelpCircle,
} from 'lucide-react';

interface BrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  onHideBrochurePermanently?: () => void;
}

export const BrochureModal: React.FC<BrochureModalProps> = ({
  isOpen,
  onClose,
  storeName = 'Aplikasi Kasir Toko Modern',
  onHideBrochurePermanently,
}) => {
  const [salesPhone, setSalesPhone] = useState('0812-XXXX-XXXX');
  const [salesName, setSalesName] = useState('Tim Konsultan POS');
  const [isEditingContact, setIsEditingContact] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWA = () => {
    const message = `Halo Bapak/Ibu Pemilik Toko! 👋

Ingin pembukuan toko lebih rapi, uang laci kasir tidak selisih, dan omzet toko bisa dipantau langsung dari HP pribadi dari mana saja?

Yuk gunakan *Solusi Kasir Toko Modern*!
✅ 100% Bebas Biaya Langganan Bulanan
✅ Bisa Jalan Tanpa Kuota Internet (Offline Mandiri)
✅ Buku Kasbon Digital & Pengingat Tagihan
✅ Pantau Penjualan & Laba Real-Time dari HP
✅ Support Printer Struk Bluetooth & Scan Kamera HP

Tersedia Paket Hemat Bayar Sekali & Paket Lengkap + Printer Struk.
Info & Uji Coba Gratis, hubungi kami di:
WhatsApp: ${salesPhone} (${salesName})`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 overflow-hidden my-4 max-h-[95vh] flex flex-col">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="print:hidden px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2 text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm">Brosur & Lembar Penawaran 1 Halaman (One-Pager)</h3>
              <p className="text-[10px] text-zinc-400">Siap cetak, laminating, atau bagikan via WhatsApp ke calon pembeli</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingContact(!isEditingContact)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isEditingContact ? 'Selesai Edit' : 'Edit Kontak WA'}</span>
            </button>
            <button
              type="button"
              onClick={handleShareWA}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim ke WA</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            {onHideBrochurePermanently && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Sembunyikan menu Brosur Penawaran ini dari aplikasi sekarang?\n\n(Menu ini tidak akan tampil lagi di kasir. Anda bisa mengaktifkannya kembali kapan saja lewat Pengaturan Toko).')) {
                    onHideBrochurePermanently();
                    onClose();
                  }
                }}
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Sembunyikan brosur dari aplikasi sebelum diserahkan ke klien"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sembunyikan Brosur</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Edit Bar (Hidden when printed) */}
        {isEditingContact && (
          <div className="print:hidden p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="font-bold text-amber-900 dark:text-amber-200">No. WhatsApp Anda:</label>
              <input
                type="text"
                value={salesPhone}
                onChange={(e) => setSalesPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-bold text-amber-900 dark:text-amber-200">Nama Kontak / Usaha:</label>
              <input
                type="text"
                value={salesName}
                onChange={(e) => setSalesName(e.target.value)}
                placeholder="Budi - Solusi POS"
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs"
              />
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 italic">
              *Nomor ini akan langsung tertulis di bagian footer brosur saat dicetak.
            </span>
          </div>
        )}

        {/* Printable One-Pager Document Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-slate-900 print:p-0 print:m-0 print:overflow-visible font-sans">
          <div className="max-w-[210mm] mx-auto bg-white border border-slate-200 print:border-none p-6 sm:p-8 rounded-xl shadow-xs space-y-6">
            
            {/* Header Banner */}
            <div className="border-b-2 border-amber-500 pb-5 flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black tracking-wider uppercase">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  SISTEM KASIR POS & STOK KELAS MODERN
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  Solusi Kasir Toko Modern: Pantau Omzet Toko Kelontong dari Mana Saja via HP!
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Tinggalkan buku catatan usang. Kelola transaksi, stok barang, kasbon tetangga, dan laci kasir secara akurat tanpa takut uang bocor saat toko ditinggal.
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500 text-zinc-950 flex flex-col items-center justify-center font-black shadow-md">
                  <span className="text-xl">🛒</span>
                  <span className="text-[9px] font-mono tracking-tighter">POS MODERN</span>
                </div>
              </div>
            </div>

            {/* 4 Poin Keunggulan Utama (dengan centang hijau) */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>4 KEUNGGULAN UTAMA UNTUK TOKO ANDA</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Poin 1 */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      1. Pantau Penjualan & Laba Real-Time via HP Pribadi
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Pemilik bisa santai bepergian ke luar kota atau istirahat di rumah. Setiap ada belanjaan yang dibayar kasir di toko, omzet dan laba bersih langsung ter-update detik itu juga di HP Anda.
                    </p>
                  </div>
                </div>

                {/* Poin 2 */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      2. Bebas Biaya Bulanan & Bisa Jalan 100% Offline
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Tanpa iuran langganan bulanan yang memberatkan. Jika WiFi toko mati atau tidak ada kuota internet, kasir tetap lancar melayani pembeli dan mencetak struk thermal tanpa kendala.
                    </p>
                  </div>
                </div>

                {/* Poin 3 */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      3. Buku Kasbon Digital & Rekap Uang Laci Kasir
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Catat hutang pelanggan otomatis tanpa takut buku hilang. Setiap shift kasir berganti, sistem mencocokkan uang fisik di laci dengan hasil penjualan kasir sehingga bebas risiko kecurangan.
                    </p>
                  </div>
                </div>

                {/* Poin 4 */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      4. Scan Barcode Kamera HP & Foto Produk Ringan
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Cukup pakai kamera HP sebagai scanner barcode cepat tanpa wajib beli alat scanner mahal. Dilengkapi foto produk mini (~25 KB) agar kasir tidak salah klik barang dagangan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Paket Harga Transparan */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>PILIHAN PAKET HARGA TRANSPARAN (BAYAR SEKALI / SEKALI SEUMUR HIDUP)</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Paket 1: Standar */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Toko Mandiri</div>
                    <div className="font-extrabold text-sm text-slate-900 mt-0.5">Paket Standar Offline</div>
                    <div className="text-lg font-black text-slate-900 mt-2 font-mono">
                      Rp 250.000 <span className="text-[10px] font-normal text-slate-500">/ sekali bayar</span>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 mt-3">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Aplikasi Kasir POS Standalone</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Support Scan Barcode HP</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Buku Kasbon & Rekap Penjualan</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Bantuan input 30 barang awal</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-semibold text-center">
                    Cocok untuk toko yang ditunggui sendiri
                  </div>
                </div>

                {/* Paket 2: Pro Cloud (Populer) */}
                <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50/30 flex flex-col justify-between relative shadow-xs">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                    PALING DIMINATI
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Toko Ber-Karyawan</div>
                    <div className="font-extrabold text-sm text-slate-900 mt-0.5">Paket Pro Cloud (Pantau Jauh)</div>
                    <div className="text-lg font-black text-amber-600 mt-2 font-mono">
                      Rp 499.000 <span className="text-[10px] font-normal text-slate-500">/ sekali bayar</span>
                    </div>
                    <ul className="text-[11px] text-slate-700 space-y-1.5 mt-3">
                      <li className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Semua fitur Paket Standar</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Pantau omzet jarak jauh via HP</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Multi-user (Akun Kasir & Owner)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Backup otomatis Google Cloud</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-2 border-t border-amber-200 text-[10px] text-amber-800 font-bold text-center">
                    Bisa santai ditinggal bepergian
                  </div>
                </div>

                {/* Paket 3: Komplit + Printer */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Siap Pakai Terima Beres</div>
                    <div className="font-extrabold text-sm text-slate-900 mt-0.5">Paket Komplit + Printer Struk</div>
                    <div className="text-lg font-black text-slate-900 mt-2 font-mono">
                      Rp 799.000 <span className="text-[10px] font-normal text-slate-500">/ all in</span>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 mt-3">
                      <li className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Semua fitur Paket Pro Cloud</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-slate-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>1x Unit Printer Bluetooth 58mm</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Free 3 Roll Kertas Struk Kasir</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Instalasi & Pelatihan Langsung</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-semibold text-center">
                    Langsung jualan layaknya minimarket
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: Garansi Pendampingan & Kontak WhatsApp */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                    <span>GARANSI PENDAMPINGAN 30 HARI &amp; UJI COBA GRATIS</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Kami dampingi hingga kasir Anda lancar. Jika dalam 3 hari tidak cocok, 100% uang Anda kembali.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">Hubungi / WhatsApp Kami:</div>
                  <div className="text-sm font-black font-mono text-emerald-400 tracking-wide">
                    {salesPhone}
                  </div>
                  <div className="text-[10px] text-slate-300 font-semibold">{salesName}</div>
                </div>
              </div>
            </div>

            {/* Bottom mini disclaimer */}
            <div className="text-center text-[10px] text-slate-400 pt-1">
              Dapat digunakan di seluruh jenis Android, Tablet, iPhone, Laptop, atau PC Komputer. Tidak memerlukan perangkat kasir khusus yang mahal.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
