import React, { useState } from 'react';
import { Lock, ShieldCheck, UserCheck, Delete, ArrowRight, UserPlus, X } from 'lucide-react';
import { CashierUser } from '../types';
import { sound } from '../services/sound';

interface LoginModalProps {
  users: CashierUser[];
  onLoginSuccess: (user: CashierUser) => void;
  onAddUser?: (name: string, pin: string, role: 'OWNER' | 'KASIR') => void;
  darkMode: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  onLoginSuccess,
  onAddUser,
  darkMode,
}) => {
  const [selectedUser, setSelectedUser] = useState<CashierUser | null>(
    users.find((u) => u.isActive) || users[0] || null
  );
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserPin, setNewUserPin] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'OWNER' | 'KASIR'>('KASIR');

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      sound.playBeep(600, 0.05);
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg('');

      // Auto-validate if PIN matches selected user
      if (selectedUser && newPin === selectedUser.pin) {
        sound.playSuccess();
        setTimeout(() => {
          onLoginSuccess(selectedUser);
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    sound.playBeep(400, 0.04);
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMsg('Pilih profil kasir terlebih dahulu.');
      return;
    }
    if (pin === selectedUser.pin) {
      sound.playSuccess();
      onLoginSuccess(selectedUser);
    } else {
      sound.playError();
      setErrorMsg('PIN salah! Silakan coba lagi.');
      setPin('');
    }
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || newUserPin.length < 4) {
      setErrorMsg('Nama wajib diisi dan PIN minimal 4 angka');
      return;
    }

    if (onAddUser) {
      onAddUser(newUserName.trim(), newUserPin, newUserRole);
    }
    setShowAddForm(false);
    setNewUserName('');
    setNewUserPin('');
    setErrorMsg('');
  };

  return (
    <div
      id="login-screen-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
    >
      <div
        id="login-card"
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border transition-all ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-emerald-500 px-6 py-5 text-white dark:text-slate-950 text-center relative">
          <div className="w-12 h-12 rounded-xl bg-white/10 dark:bg-slate-950/10 flex items-center justify-center mx-auto mb-2 backdrop-blur">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Kunci Layar Kasir / RAM</h2>
          <p className="text-xs opacity-90 mt-1 flex items-center justify-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Database Lokal Terenkripsi AES-256
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {showAddForm ? (
            /* Inline Form to Add New Cashier */
            <form onSubmit={handleCreateNewUser} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="font-extrabold text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  <span>Daftarkan Kasir / Petugas Baru</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Nama Petugas Kasir / Timbangan:
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Contoh: Kasir Timbang 1 / Budi"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  PIN Masuk (4-6 Digit Angka Rahasia):
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan 4 digit PIN..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm font-mono tracking-widest bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Peran / Akses:
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'OWNER' | 'KASIR')}
                  className="w-full px-3 py-2.5 rounded-xl border text-xs font-bold bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="KASIR">Petugas Kasir / Timbang</option>
                  <option value="OWNER">Pemilik Toko / Gudang (Akses Penuh)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 text-white dark:text-slate-950 text-xs font-black rounded-xl shadow-md"
                >
                  Simpan Kasir
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* User selector chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                    PILIH KASIR BERTUGAS:
                  </label>
                  {onAddUser && (
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Tambah Kasir</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {users.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        id={`login-user-select-${u.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setPin('');
                          setErrorMsg('');
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 dark:border-emerald-500 font-bold shadow-2xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                            isSelected
                              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs truncate font-bold text-slate-900 dark:text-slate-100">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-mono flex items-center gap-1">
                            <span>{u.role === 'OWNER' ? '👑 Pemilik' : 'Petugas Kasir'}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PIN Input Indicator */}
              <div>
                <div className="text-center text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-mono">
                  Masukkan PIN Kasir Anda:
                </div>
                <div className="flex justify-center items-center gap-3 my-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        pin.length > idx
                          ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-sm shadow-emerald-500/40'
                          : 'border-slate-300 dark:border-slate-700 bg-transparent'
                      }`}
                    />
                  ))}
                </div>

                {errorMsg && (
                  <p className="text-center text-xs font-semibold text-rose-600 dark:text-rose-400 mt-2 font-mono">
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Numeric Keypad for Tablet & Touch */}
              <div className="grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    id={`btn-pin-${d}`}
                    onClick={() => handleDigit(d)}
                    className={`py-3.5 text-lg font-bold font-numeric rounded-xl border transition-all active:scale-95 ${
                      darkMode
                        ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-white'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  id="btn-pin-clear"
                  onClick={handleClear}
                  className={`py-3.5 text-xs font-bold font-mono rounded-xl border transition-all active:scale-95 ${
                    darkMode
                      ? 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  HAPUS
                </button>
                <button
                  type="button"
                  id="btn-pin-0"
                  onClick={() => handleDigit('0')}
                  className={`py-3.5 text-lg font-bold font-numeric rounded-xl border transition-all active:scale-95 ${
                    darkMode
                      ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  0
                </button>
                <button
                  type="button"
                  id="btn-pin-backspace"
                  onClick={handleDelete}
                  className={`py-3.5 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
                    darkMode
                      ? 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Submit Button */}
              <button
                type="button"
                id="btn-login-submit"
                onClick={handleManualSubmit}
                disabled={!pin}
                className="w-full py-3.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-40 text-white dark:text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-98 tracking-wide"
              >
                <UserCheck className="w-4 h-4" />
                <span>Masuk Kasir</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
