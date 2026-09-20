import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  BookOpen,
  Settings,
  Clock,
  ShieldCheck,
  Moon,
  Sun,
  Lock,
  LogOut,
  Wifi,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Store,
  UserCheck,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { CashierUser, CashierShift, StoreSettings } from '../types';

export type TabType = 'dashboard' | 'cashier' | 'inventory' | 'reports' | 'debts' | 'settings' | 'guide';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: CashierUser | null;
  activeShift: CashierShift | null;
  settings: StoreSettings;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenShiftModal: () => void;
  onLogout: () => void;
  cartItemCount: number;
  cloudSyncStatus?: 'ONLINE' | 'OFFLINE' | 'SYNCED';
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  onUpdateOwner?: (newName: string, newPin?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  activeShift,
  settings,
  darkMode,
  setDarkMode,
  onOpenShiftModal,
  onLogout,
  cartItemCount,
  cloudSyncStatus = 'SYNCED',
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  onUpdateOwner,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditOwnerModalOpen, setIsEditOwnerModalOpen] = useState(false);
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerPin, setEditOwnerPin] = useState('');

  // Close mobile drawer on navigation
  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const navItems = [
    {
      group: 'MENU UTAMA',
      items: [
        {
          id: 'dashboard' as TabType,
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'cashier' as TabType,
          label: 'Kasir / Penjualan',
          icon: ShoppingCart,
          badge: cartItemCount > 0 ? `${cartItemCount}` : null,
          badgeColor: 'bg-pink-500 text-white',
        },
        {
          id: 'inventory' as TabType,
          label: 'Produk & Stok',
          icon: Package,
          badge: null,
        },
        {
          id: 'debts' as TabType,
          label: 'Tagihan / Kasbon',
          icon: BookOpen,
          badge: null,
        },
      ],
    },
    {
      group: 'KEUANGAN & SHIFT',
      items: [
        {
          id: 'reports' as TabType,
          label: 'Laporan & Analisis',
          icon: BarChart3,
          badge: null,
        },
      ],
    },
    {
      group: 'ADMINISTRASI',
      items: [
        {
          id: 'settings' as TabType,
          label: 'Pengaturan Toko',
          icon: Settings,
          badge: null,
        },
        {
          id: 'guide' as TabType,
          label: 'Panduan Aplikasi',
          icon: BookOpen,
          badge: 'Buku',
          badgeColor: 'bg-emerald-600 text-white',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Vertical Sidebar (Locked to Viewport / h-screen) */}
      <aside
        id="pos-main-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-between transition-all duration-300 select-none shadow-2xl md:shadow-none border-r ${
          isCollapsed ? 'w-20' : 'w-64 lg:w-72'
        } ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          darkMode
            ? 'bg-[#0B132B] border-slate-800 text-slate-100'
            : 'bg-[#0F172A] border-slate-800 text-slate-100'
        }`}
      >
        {/* Top Header: Brand & Logo */}
        <div className="p-4 border-b border-slate-800/80 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 font-bold text-lg border border-purple-400/40 shrink-0">
              🛒
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="font-black text-sm tracking-tight text-white uppercase truncate">
                  {settings.storeName || 'UD. TOKO KELONTONG'}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="truncate">Kasir-Q POS &amp; Stok</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Mobile Close Button */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={isCollapsed ? 'Perluas Menu' : 'Persempit Menu'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shift Quick Status Bar inside Sidebar */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            type="button"
            onClick={onOpenShiftModal}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeShift
                ? 'bg-purple-950/40 border-purple-500/30 text-purple-200 hover:bg-purple-900/40'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-200 hover:bg-amber-900/40'
            }`}
            title="Kelola Shift & Kas Fisik"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Clock className={`w-4 h-4 shrink-0 ${activeShift ? 'text-pink-400' : 'text-amber-400'}`} />
              {!isCollapsed && (
                <div className="text-left truncate">
                  <div className="text-[11px] font-bold leading-none">
                    {activeShift ? 'Shift Aktif' : 'Shift Belum Buka'}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                    {activeShift ? 'Klik untuk Tutup/Rekap' : 'Klik untuk Buka Shift'}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeShift ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            )}
          </button>
        </div>

        {/* Middle: Navigation Links (Scrolls internally only if screen is very short) */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin">
          {navItems.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                  {group.group}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-tab-${item.id}`}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      title={item.label}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate tracking-wide">{item.label}</span>
                        )}
                      </div>

                      {/* Badge if available */}
                      {!isCollapsed && item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono shadow-xs ${
                            item.badgeColor || 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Profile Card & Logout (Styled exactly as in the photo) */}
        <div className="p-3 border-t border-slate-800/80 bg-[#080E1E] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              id="btn-sidebar-edit-profile"
              onClick={() => {
                setEditOwnerName(currentUser?.name || settings.ownerName || 'Pemilik / Kasir Utama');
                setEditOwnerPin(currentUser?.pin || '1234');
                setIsEditOwnerModalOpen(true);
              }}
              className="flex items-center gap-2.5 overflow-hidden text-left hover:bg-slate-800/60 p-1.5 rounded-xl transition-all cursor-pointer group flex-1"
              title="Klik untuk Edit Nama Pemilik Toko & PIN"
            >
              {/* User Avatar Circle */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0 group-hover:scale-105 transition-transform">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              {!isCollapsed && (
                <div className="text-left truncate flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
                    <span className="truncate">{currentUser?.name || 'Administrator'}</span>
                    <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-pink-400 shrink-0 transition-colors" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold truncate">
                    {currentUser?.role === 'OWNER' ? 'ADMINISTRATOR' : 'KASIR PETUGAS'}
                  </div>
                </div>
              )}
            </button>

            {/* Logout / Lock Button */}
            <button
              id="sidebar-btn-lock"
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              title="Kunci Layar Kasir / Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Edit Nama Pemilik Toko & PIN */}
      {isEditOwnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Edit Nama Pemilik Toko
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ubah nama pemilik & PIN akses akun utama
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOwnerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editOwnerName.trim()) return;
                onUpdateOwner?.(editOwnerName.trim(), editOwnerPin.trim());
                setIsEditOwnerModalOpen(false);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Nama Pemilik Toko / Kasir Utama:
                </label>
                <input
                  type="text"
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                  placeholder="Contoh: Pak Budi Santoso / Bu Hj. Maryam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Nama ini akan muncul di pojok bawah menu sidebar, laporan harian kasir, dan identitas toko.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  PIN Masuk Akun Pemilik (4-6 Digit Angka):
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={editOwnerPin}
                  onChange={(e) => setEditOwnerPin(e.target.value)}
                  placeholder="Contoh: 1234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  PIN keamanan saat mengunci atau membuka aplikasi kasir.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOwnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
