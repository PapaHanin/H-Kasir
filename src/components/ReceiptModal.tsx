import React, { useRef } from 'react';
import {
  Printer,
  FileDown,
  Share2,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Transaction, StoreSettings } from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  settings: StoreSettings;
  darkMode: boolean;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  settings,
  darkMode,
  onNewTransaction,
}) => {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !transaction) return null;

  // Direct Web Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const receiptHtml = receiptRef.current ? receiptRef.current.innerHTML : '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk_${transaction.invoiceNumber}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              color: #000;
              margin: 0;
              padding: 10px;
              width: ${settings.paperSize === '80mm' ? '72mm' : '48mm'};
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .double-divider { border-top: 2px dashed #000; margin: 6px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            .item-row { margin-bottom: 4px; }
            @media print {
              @page { margin: 0; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${receiptHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Download PDF receipt
  const handleDownloadPDF = () => {
    const is80mm = settings.paperSize === '80mm';
    const docWidth = is80mm ? 80 : 58;
    const itemsCount = transaction.items.length;
    const docHeight = Math.max(120, 90 + itemsCount * 8);

    const doc = new jsPDF({
      unit: 'mm',
      format: [docWidth, docHeight],
    });

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(settings.storeName.slice(0, 24), docWidth / 2, 8, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(settings.address.slice(0, 32), docWidth / 2, 12, { align: 'center' });
    doc.text(`Telp: ${settings.phone}`, docWidth / 2, 16, { align: 'center' });

    doc.text('-'.repeat(is80mm ? 42 : 30), docWidth / 2, 20, { align: 'center' });

    doc.setFontSize(7);
    doc.text(`No: ${transaction.invoiceNumber}`, 4, 24);
    doc.text(`Tgl: ${formatDateIndo(transaction.date)}`, 4, 28);
    doc.text(`Kasir: ${transaction.cashierName.slice(0, 15)}`, 4, 32);
    if (transaction.customerName) {
      doc.text(`Pelanggan: ${transaction.customerName.slice(0, 15)}`, 4, 36);
    }

    let currentY = transaction.customerName ? 40 : 36;
    doc.text('-'.repeat(is80mm ? 42 : 30), docWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    // Items
    transaction.items.forEach((item) => {
      doc.setFont('courier', 'bold');
      doc.text(item.productName.slice(0, is80mm ? 28 : 20), 4, currentY);
      currentY += 3.5;
      doc.setFont('courier', 'normal');

      const itemDetail = `${item.quantity} ${item.unit || 'pcs'} x @${formatRupiah(item.sellPrice).replace('Rp', '')}`;
      doc.text(itemDetail, 4, currentY);
      doc.text(formatRupiah(item.subtotal), docWidth - 4, currentY, { align: 'right' });
      currentY += 4.5;
    });

    doc.text('-'.repeat(is80mm ? 42 : 30), docWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    doc.text('Subtotal:', 4, currentY);
    doc.text(formatRupiah(transaction.subtotal), docWidth - 4, currentY, { align: 'right' });
    currentY += 4;

    if (transaction.discount > 0) {
      doc.text('Diskon:', 4, currentY);
      doc.text(`-${formatRupiah(transaction.discount)}`, docWidth - 4, currentY, { align: 'right' });
      currentY += 4;
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text('TOTAL:', 4, currentY);
    doc.text(formatRupiah(transaction.grandTotal), docWidth - 4, currentY, { align: 'right' });
    currentY += 4.5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(`Metode: ${transaction.paymentMethod}`, 4, currentY);
    currentY += 4;

    if (transaction.paymentMethod === 'TUNAI' && transaction.cashAmount) {
      doc.text('Tunai:', 4, currentY);
      doc.text(formatRupiah(transaction.cashAmount), docWidth - 4, currentY, { align: 'right' });
      currentY += 4;
      doc.text('Kembalian:', 4, currentY);
      doc.text(formatRupiah(transaction.changeAmount || 0), docWidth - 4, currentY, { align: 'right' });
      currentY += 4.5;
    }

    doc.text('='.repeat(is80mm ? 42 : 30), docWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    doc.setFontSize(6.5);
    doc.text(settings.footerMessage.slice(0, 36), docWidth / 2, currentY, { align: 'center' });

    doc.save(`Struk_${transaction.invoiceNumber}.pdf`);
  };

  // Share via WhatsApp
  const handleShareWA = () => {
    let msg = `*STRUK PEMBELIAN - ${settings.storeName.toUpperCase()}*\n`;
    msg += `No. Faktur: ${transaction.invoiceNumber}\n`;
    msg += `Tanggal: ${formatDateIndo(transaction.date)}\n`;
    msg += `Kasir: ${transaction.cashierName}\n`;
    msg += `-----------------------------\n`;

    transaction.items.forEach((item) => {
      msg += `• *${item.productName}*\n`;
      msg += `  ${item.quantity} ${item.unit || 'pcs'} x ${formatRupiah(item.sellPrice)} = ${formatRupiah(item.subtotal)}\n`;
    });

    msg += `-----------------------------\n`;
    msg += `*TOTAL BAYAR: ${formatRupiah(transaction.grandTotal)}*\n`;
    msg += `Metode: ${transaction.paymentMethod}\n`;
    if (transaction.cashAmount) {
      msg += `Tunai: ${formatRupiah(transaction.cashAmount)}\n`;
      msg += `Kembalian: ${formatRupiah(transaction.changeAmount || 0)}\n`;
    }
    msg += `\n_${settings.footerMessage}_`;

    const phone = transaction.customerPhone ? transaction.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="receipt-modal-card"
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border my-8 flex flex-col ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header Notification Banner */}
        <div className="bg-emerald-600 dark:bg-emerald-500 px-6 py-4 text-white dark:text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-slate-950/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight">Pembayaran Berhasil!</h3>
              <p className="text-xs opacity-90 font-mono">Faktur #{transaction.invoiceNumber}</p>
            </div>
          </div>
          <button
            id="btn-close-receipt"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div className="p-5 flex justify-center bg-slate-100 dark:bg-slate-950">
          <div
            ref={receiptRef}
            id="thermal-receipt-paper"
            className="bg-white text-slate-900 p-5 rounded-xl shadow-lg font-mono text-xs w-full max-w-[340px] border border-slate-200 select-all"
          >
            {/* Store Header */}
            <div className="text-center pb-2">
              <div className="font-black text-sm tracking-tight">{settings.storeName}</div>
              <div className="text-[11px] text-slate-600">{settings.address}</div>
              <div className="text-[11px] text-slate-600">Telp/WA: {settings.phone}</div>
            </div>

            <div className="border-t border-dashed border-slate-300 my-2.5" />

            {/* Metadata */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Faktur:</span>
                <span className="font-bold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span>{formatDateIndo(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-semibold text-emerald-700">{transaction.customerName}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-slate-300 my-2.5" />

            {/* Items Table */}
            <div className="space-y-1.5 py-1 text-[11px]">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{item.productName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {item.quantity} {item.unit || 'pcs'} x {formatRupiah(item.sellPrice)}
                    </span>
                    <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 my-2.5" />

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1.5 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className="text-emerald-700">{formatRupiah(transaction.grandTotal)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Metode:</span>
                <span className="font-bold uppercase text-slate-800">{transaction.paymentMethod}</span>
              </div>
              {transaction.paymentMethod === 'TUNAI' && transaction.cashAmount && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tunai:</span>
                    <span>{formatRupiah(transaction.cashAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="text-slate-500">Kembalian:</span>
                    <span>{formatRupiah(transaction.changeAmount || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-slate-300 my-3" />

            {/* Footer Thank You Note */}
            <div className="text-center text-[10px] text-slate-500 space-y-1">
              <p>{settings.footerMessage}</p>
              <p className="font-bold text-slate-700">~ Terima Kasih Atas Kunjungan Anda ~</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-receipt-print"
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>
            <button
              id="btn-receipt-pdf"
              type="button"
              onClick={handleDownloadPDF}
              className={`py-2.5 px-3 border font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                darkMode
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <FileDown className="w-4 h-4 text-emerald-500" />
              <span>Unduh PDF</span>
            </button>
            <button
              id="btn-receipt-wa"
              type="button"
              onClick={handleShareWA}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim WA</span>
            </button>
          </div>

          <button
            id="btn-receipt-new-transaction"
            type="button"
            onClick={() => {
              onClose();
              onNewTransaction();
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 tracking-wide"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Selesai & Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
