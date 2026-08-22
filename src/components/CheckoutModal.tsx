import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  DollarSign,
  QrCode,
  Smartphone,
  BookOpen,
  CheckCircle,
  X,
  CreditCard,
  Building2,
  Sparkles,
  Timer,
  AlertCircle,
  User,
} from 'lucide-react';
import { CartItem, PaymentMethod, Transaction, StoreSettings, CashierUser } from '../types';
import { formatRupiah } from '../services/export';
import { generateDynamicQRIS } from '../services/qris';
import { sound } from '../services/sound';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  totalCost: number;
  settings: StoreSettings;
  currentUser: CashierUser | null;
  onPaymentSuccess: (transaction: Transaction) => void;
  darkMode: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  discount,
  grandTotal,
  totalCost,
  settings,
  currentUser,
  onPaymentSuccess,
  darkMode,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [digitalProvider, setDigitalProvider] = useState<'GOPAY' | 'OVO' | 'DANA' | 'SHOPEEPAY' | 'TRANSFER_BANK'>('GOPAY');
  const [bankName, setBankName] = useState<string>('BCA');
  const [qrisTimer, setQrisTimer] = useState<number>(300); // 5 mins
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Suggested Cash Denominations
  const quickCashOptions = [
    grandTotal, // Uang Pas
    10000,
    20000,
    50000,
    100000,
    150000,
    200000,
    300000,
    500000,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && (v >= grandTotal || v === 10000 || v === 20000 || v === 50000 || v === 100000));

  // Initialize cash given to exact amount or next round up
  useEffect(() => {
    if (isOpen) {
      setCashGiven(grandTotal);
      setPaymentMethod('TUNAI');
      setQrisTimer(300);
      setIsProcessing(false);
    }
  }, [isOpen, grandTotal]);

  // QRIS Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && paymentMethod === 'QRIS' && qrisTimer > 0) {
      interval = setInterval(() => {
        setQrisTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, paymentMethod, qrisTimer]);

  if (!isOpen) return null;

  const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const changeAmount = Math.max(0, cashGiven - grandTotal);
  const isCashSufficient = cashGiven >= grandTotal;

  // Dynamic QRIS Payload
  const qrisPayload = generateDynamicQRIS({
    merchantName: settings.qrisMerchantName || settings.storeName,
    merchantCity: 'JAKARTA',
    nmid: settings.qrisNmid || 'ID1020038920192',
    amount: grandTotal,
    invoiceNumber,
  });

  const handleCompleteTransaction = (chosenMethod: PaymentMethod = paymentMethod) => {
    if (chosenMethod === 'TUNAI' && !isCashSufficient) {
      sound.playError();
      return;
    }

    if (chosenMethod === 'KASBON' && !customerName.trim()) {
      sound.playError();
      alert('Untuk pembayaran Kasbon / Hutang, wajib mengisi nama pelanggan.');
      return;
    }

    setIsProcessing(true);
    sound.playSuccess();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore confetti error
    }

    const totalProfit = grandTotal - totalCost;

    const transaction: Transaction = {
      id: `trx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      invoiceNumber,
      date: new Date().toISOString(),
      cashierId: currentUser?.id || 'cashier-1',
      cashierName: currentUser?.name || 'Kasir',
      items: items.map((i) => {
        const effectiveSellPrice = i.customPricePerKg || i.product.sellPrice;
        return {
          productId: i.product.id,
          productName: i.product.name,
          barcode: i.product.barcode,
          category: i.product.category,
          buyPrice: i.product.buyPrice,
          sellPrice: effectiveSellPrice,
          quantity: i.quantity,
          unit: i.product.unit,
          discount: i.discount,
          subtotal: i.subtotal,
          profit: (effectiveSellPrice - i.product.buyPrice) * i.quantity - i.discount,
          gradingGrade: i.gradingGrade,
          sortasiPercentage: i.sortasiPercentage,
          sortasiKg: i.sortasiKg,
          grossWeight: i.grossWeight,
          netWeight: i.netWeight,
          customPricePerKg: i.customPricePerKg,
        };
      }),
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      discount,
      grandTotal,
      totalCost,
      totalProfit,
      paymentMethod: chosenMethod,
      cashAmount: chosenMethod === 'TUNAI' ? cashGiven : grandTotal,
      changeAmount: chosenMethod === 'TUNAI' ? changeAmount : 0,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'COMPLETED',
      qrisRef: chosenMethod === 'QRIS' ? `QRIS-${Date.now().toString().slice(-6)}` : undefined,
    };

    setTimeout(() => {
      onPaymentSuccess(transaction);
      setIsProcessing(false);
    }, 200);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="checkout-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="checkout-modal-card"
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border my-6 transition-all ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div>
            <h2 className="text-lg font-black tracking-tight">Pembayaran Kasir</h2>
            <p className="text-xs text-slate-500 font-mono">
              Total {items.length} item ({items.reduce((s, i) => s + i.quantity, 0)} pcs)
            </p>
          </div>
          <button
            id="btn-close-checkout"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grand Total Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white flex items-center justify-between shadow-inner">
          <div>
            <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest font-mono">TOTAL TAGIHAN</div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-numeric">
              {formatRupiah(grandTotal)}
            </div>
          </div>
          <div className="text-right text-xs text-emerald-100 hidden sm:block font-mono">
            <div>Faktur: <span className="font-bold text-white">#{invoiceNumber}</span></div>
            <div>Kasir: <span className="font-bold text-white">{currentUser?.name || 'Kasir'}</span></div>
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-4 p-2 bg-slate-100 dark:bg-slate-950 gap-1.5 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            id="tab-pay-tunai"
            type="button"
            onClick={() => {
              sound.playBeep(520, 0.04);
              setPaymentMethod('TUNAI');
            }}
            className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
              paymentMethod === 'TUNAI'
                ? 'bg-white dark:bg-slate-900 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Tunai / Cash</span>
          </button>

          <button
            id="tab-pay-qris"
            type="button"
            onClick={() => {
              sound.playBeep(520, 0.04);
              setPaymentMethod('QRIS');
            }}
            className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
              paymentMethod === 'QRIS'
                ? 'bg-white dark:bg-slate-900 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-500" />
            <span>QRIS Real-Time</span>
          </button>

          <button
            id="tab-pay-digital"
            type="button"
            onClick={() => {
              sound.playBeep(520, 0.04);
              setPaymentMethod(digitalProvider);
            }}
            className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
              ['GOPAY', 'OVO', 'DANA', 'SHOPEEPAY', 'TRANSFER_BANK'].includes(paymentMethod)
                ? 'bg-white dark:bg-slate-900 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-500" />
            <span>E-Wallet / Bank</span>
          </button>

          <button
            id="tab-pay-kasbon"
            type="button"
            onClick={() => {
              sound.playBeep(520, 0.04);
              setPaymentMethod('KASBON');
            }}
            className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
              paymentMethod === 'KASBON'
                ? 'bg-white dark:bg-slate-900 border-amber-500/50 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Kasbon / Bon</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-5">
          {/* 1. TUNAI / CASH METHOD */}
          {paymentMethod === 'TUNAI' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 font-mono">
                  PILIH PECAHAN CEPAT PEMBAYARAN:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {quickCashOptions.map((amount) => {
                    const isExact = amount === grandTotal;
                    const isSelected = cashGiven === amount;
                    return (
                      <button
                        key={amount}
                        id={`btn-cash-quick-${amount}`}
                        type="button"
                        onClick={() => {
                          sound.playBeep(650, 0.04);
                          setCashGiven(amount);
                        }}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-bold font-numeric transition-all active:scale-95 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                            : isExact
                            ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {isExact ? `Uang Pas (${formatRupiah(amount)})` : formatRupiah(amount)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Cash Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">
                    Uang Diterima (Rp):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm">Rp</span>
                    <input
                      id="input-cash-amount"
                      type="number"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      placeholder="0"
                      className={`w-full pl-11 pr-3 py-2.5 rounded-xl border text-base font-bold font-numeric focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        darkMode
                          ? 'bg-slate-950 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Change Calculation Box */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-center ${
                    isCashSufficient
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                    {isCashSufficient ? 'UANG KEMBALIAN:' : 'UANG KURANG:'}
                  </span>
                  <span
                    className={`text-xl font-black font-numeric ${
                      isCashSufficient ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {isCashSufficient ? formatRupiah(changeAmount) : formatRupiah(grandTotal - cashGiven)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. QRIS REAL-TIME METHOD */}
          {paymentMethod === 'QRIS' && (
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center shrink-0">
                <div className="text-[10px] font-black tracking-widest text-slate-700 uppercase mb-1.5 font-mono">
                  QRIS STANDAR NASIONAL
                </div>
                <QRCodeSVG
                  value={qrisPayload}
                  size={170}
                  level="M"
                  includeMargin={false}
                />
                <div className="text-[9px] font-semibold font-mono text-slate-500 mt-2">
                  NMID: {settings.qrisNmid || 'ID1020038920192'}
                </div>
              </div>

              {/* QRIS Instructions & Status */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/10 border border-rose-500/20 text-rose-500">
                    <Timer className="w-3.5 h-3.5 animate-spin" />
                    <span>Kadaluwarsa dalam {formatTimer(qrisTimer)}</span>
                  </div>
                  <h4 className="font-extrabold text-base mt-1.5">{settings.qrisMerchantName || settings.storeName}</h4>
                  <p className="text-xs text-slate-400">
                    Mendukung semua aplikasi perbankan & e-wallet: BCA Mobile, Mandiri Livin, BRImo, GoPay, OVO, ShopeePay, DANA, LinkAja.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Jumlah tagihan <strong className="font-numeric font-black">{formatRupiah(grandTotal)}</strong> otomatis tercantum di QR (Dinamis)!</span>
                </div>

                {/* Instant Verification & Notification */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Status: Menunggu Pembayaran QRIS
                    </span>
                    <span className="text-emerald-600 font-bold">NMID Terdaftar</span>
                  </div>
                  
                  <button
                    id="btn-simulate-qris-paid"
                    type="button"
                    onClick={() => handleCompleteTransaction('QRIS')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran QRIS Masuk</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. E-WALLET / DIGITAL / BANK METHOD */}
          {['GOPAY', 'OVO', 'DANA', 'SHOPEEPAY', 'TRANSFER_BANK'].includes(paymentMethod) && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                PILIH PENYEDIA E-WALLET / BANK:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'GOPAY', name: 'GoPay', color: 'text-emerald-600' },
                  { id: 'OVO', name: 'OVO', color: 'text-purple-600' },
                  { id: 'DANA', name: 'DANA', color: 'text-blue-500' },
                  { id: 'SHOPEEPAY', name: 'ShopeePay', color: 'text-orange-500' },
                  { id: 'TRANSFER_BANK', name: 'Transfer Bank', color: 'text-slate-700' },
                ].map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => {
                      sound.playBeep(600, 0.04);
                      setDigitalProvider(prov.id as any);
                      setPaymentMethod(prov.id as any);
                    }}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === prov.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate">{prov.name}</div>
                  </button>
                ))}
              </div>

              {paymentMethod === 'TRANSFER_BANK' && (
                <div className="flex gap-2">
                  {['BCA', 'BRI', 'Mandiri', 'BNI', 'BSI'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBankName(b)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        bankName === b
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-300 dark:border-slate-800'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>
                  Pastikan saldo pembayaran sudah masuk ke rekening toko sebelum menyelesaikan transaksi.
                </span>
              </div>
            </div>
          )}

          {/* 4. KASBON / HUTANG METHOD */}
          {paymentMethod === 'KASBON' && (
            <div className="space-y-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Pencatatan Buku Kasbon / Hutang Pelanggan Toko Kelontong</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pelanggan (Wajib):
                  </label>
                  <input
                    id="input-kasbon-customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Bu Hj. Aminah (RT 03)"
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      darkMode
                        ? 'bg-slate-900 border-slate-800 text-white'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp Pelanggan:
                  </label>
                  <input
                    id="input-kasbon-customer-phone"
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      darkMode
                        ? 'bg-slate-900 border-slate-800 text-white'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Optional Customer info for standard receipt */}
          {paymentMethod !== 'KASBON' && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="input-opt-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pelanggan (opsional untuk struk)..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>
              <input
                id="input-opt-customer-phone"
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="No. WA (opsional)..."
                className={`w-40 px-3 py-1.5 rounded-lg border text-xs ${
                  darkMode
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            id="btn-cancel-checkout"
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            id="btn-confirm-payment-done"
            type="button"
            onClick={() => handleCompleteTransaction(paymentMethod)}
            disabled={isProcessing || (paymentMethod === 'TUNAI' && !isCashSufficient)}
            className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-98"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {paymentMethod === 'KASBON'
                ? 'Catat ke Buku Kasbon'
                : `Konfirmasi Bayar (${formatRupiah(grandTotal)})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
