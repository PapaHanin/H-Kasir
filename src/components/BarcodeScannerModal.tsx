import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, Keyboard, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { sound } from '../services/sound';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScanSuccess: (barcode: string) => void;
  darkMode: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onScanSuccess,
  darkMode,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      }
    } catch {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const code = manualCode.trim();
    triggerScan(code);
    setManualCode('');
  };

  const triggerScan = (barcode: string) => {
    sound.playBeep(880, 0.08);
    setLastScanned(barcode);
    onScanSuccess(barcode);
    setTimeout(() => {
      setLastScanned(null);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      id="scanner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
    >
      <div
        id="scanner-modal-card"
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${
          darkMode
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Pemindai Barcode Produk</h3>
              <p className="text-xs text-zinc-500">Scan barcode fisik atau pilih cepat produk</p>
            </div>
          </div>
          <button
            id="btn-close-scanner"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Camera View Area */}
          <div className="relative w-full h-52 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-zinc-700 shadow-inner">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-28 border-2 border-emerald-500 rounded-lg relative flex items-center justify-center bg-emerald-500/5">
                <div className="w-full h-0.5 bg-emerald-500/80 animate-pulse shadow-sm shadow-emerald-400" />
                <span className="absolute -bottom-6 text-[11px] font-semibold text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                  Arahkan Barcode ke Garis Hijau
                </span>
              </div>
            </div>

            {!cameraActive && (
              <div className="text-center p-4 text-zinc-400 space-y-2">
                <Camera className="w-8 h-8 mx-auto text-zinc-500" />
                <p className="text-xs">
                  Kamera tidak aktif atau butuh izin. Gunakan input manual atau tombol cepat di bawah.
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="text-xs px-3 py-1 bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-700 hover:bg-zinc-700"
                >
                  Coba Aktifkan Kamera
                </button>
              </div>
            )}

            {lastScanned && (
              <div className="absolute top-3 inset-x-4 bg-emerald-600 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold shadow-lg animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                <span>Barcode Terbaca: {lastScanned}</span>
              </div>
            )}
          </div>

          {/* Manual Barcode Input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                id="input-manual-barcode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ketik angka barcode atau gunakan scanner USB..."
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  darkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-800 placeholder-zinc-400'
                }`}
                autoFocus
              />
            </div>
            <button
              id="btn-submit-manual-barcode"
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl"
            >
              Scan
            </button>
          </form>

          {/* Fast Test Barcodes from Catalog */}
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>SIMULASI SCAN CEPAT BARANG POPULER:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {products.slice(0, 8).map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => triggerScan(prod.barcode)}
                  className={`text-left p-2 rounded-lg border text-xs transition-all hover:scale-[1.02] flex items-center justify-between ${
                    darkMode
                      ? 'bg-zinc-800/60 border-zinc-700 hover:border-emerald-500 text-zinc-200'
                      : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500 text-zinc-800'
                  }`}
                >
                  <div className="truncate pr-1">
                    <div className="font-semibold truncate">{prod.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{prod.barcode}</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                    + Cart
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl hover:opacity-90"
          >
            Tutup Pemindai
          </button>
        </div>
      </div>
    </div>
  );
};
