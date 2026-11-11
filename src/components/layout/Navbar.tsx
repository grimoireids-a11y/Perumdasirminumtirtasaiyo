import React, { useState, useEffect } from 'react';
import { Menu, Calendar, Building, Sparkles, KeyRound, Bell, Palette } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from './Sidebar';
import { ProfileModal } from '../profile/ProfileModal';
import { useAppBranding } from '../../context/AppBrandingContext';

interface NavbarProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onOpenAiAssistant?: () => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenAiAssistant,
  onNavigateToTab,
}) => {
  const { userProfile } = useAuth();
  const { branding } = useAppBranding();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  useEffect(() => {
    if (userProfile?.role === 'KEPALA_SPI' || userProfile?.role === 'ADMIN_SISTEM') {
      const q = query(collection(db, 'users'), where('approvalStatus', '==', 'PENDING'));
      const unsub = onSnapshot(q, (snap) => {
        setPendingApprovalsCount(snap.docs.length);
      });
      return () => unsub();
    }
  }, [userProfile?.role]);

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Pusat Kendali Pengawasan (Dashboard SPI)';
      case 'risk_universe':
        return 'Risk Universe & Struktur Proses BUMD';
      case 'risk_register':
        return 'Register Risiko Korporat (Matriks 5x5)';
      case 'rcsa':
        return 'Penilaian Sendiri Risiko Unit (RCSA)';
      case 'bpkp_assessment':
        return 'Self Assessment Kinerja & Maturitas SPIP Berstandar BPKP';
      case 'pkpt':
        return 'Penyusunan Program Kerja Pengawasan Tahunan (PKPT)';
      case 'spi_programs':
        return 'Program Kerja Tahunan Kapabilitas SPI';
      case 'audit_assignments':
        return 'Penugasan & Penerbitan Surat Tugas Audit';
      case 'audit_program':
        return 'Program Kerja Pemeriksaan (PKA)';
      case 'work_papers':
        return 'Kertas Kerja Audit (KKA) & Pengujian Substantif';
      case 'audit_reports':
        return 'Laporan Hasil Audit (LHA) & Pengawasan SPI (Asistensi AI)';
      case 'findings':
        return 'Matriks Temuan Audit 5C & Potensi Kerugian';
      case 'follow_ups':
        return 'Pemantauan & Verifikasi Tindak Lanjut Rekomendasi';
      case 'investigations':
        return 'Audit Investigatif & Penanganan Indikasi Fraud';
      case 'regulations':
        return 'Basis Data Peraturan & Review Kepatuhan Hukum';
      case 'user_management':
        return 'Manajemen Pengguna & Otorisasi RBAC';
      case 'master_units':
        return 'Master Data Unit Kerja & Wilayah Pelayanan';
      case 'signatories':
        return 'Fitur Jabatan & Pejabat Penandatangan Dokumen';
      case 'app_branding':
        return 'Pengaturan Logo, Nama Aplikasi & Identitas Kantor';
      default:
        return `Sistem Informasi ${branding.appName || 'SPI SMART'}`;
    }
  };

  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const canEditBranding = userProfile?.role === 'KEPALA_SPI' || userProfile?.role === 'ADMIN_SISTEM';

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate tracking-tight">
              {getTabTitle(activeTab)}
            </h1>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1 truncate max-w-md">
                <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{branding.institutionName || 'Perumda Air Minum Tirta Saiyo Kab. Pasaman'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pending Registrations Notification for Kepala SPI */}
          {(userProfile?.role === 'KEPALA_SPI' || userProfile?.role === 'ADMIN_SISTEM') && pendingApprovalsCount > 0 && (
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('user_management')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors animate-pulse"
              title={`${pendingApprovalsCount} pengguna baru menunggu persetujuan Kepala SPI`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingApprovalsCount} Baru</span>
            </button>
          )}

          {/* Tanggal Hari Ini */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 text-xs text-slate-600 bg-slate-100/80 rounded-md border border-slate-200/60 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span>{today}</span>
          </div>

          {/* Quick Branding Settings Trigger for Kepala SPI / Admin */}
          {canEditBranding && onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('app_branding')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-2xs ${
                activeTab === 'app_branding'
                  ? 'bg-emerald-800 text-white border-emerald-900 ring-2 ring-emerald-500/30'
                  : 'bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-300'
              }`}
              title="Ganti Logo, Nama Aplikasi & Nama Kantor (Khusus Kepala SPI & Admin)"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Logo & Identitas</span>
            </button>
          )}

          {/* AI Assistant Quick Trigger */}
          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/80 rounded-lg transition-colors shadow-2xs"
              title="Buka Asisten AI SPI (Gemini 3.8 Flash)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Asisten AI SPI</span>
            </button>
          )}

          {/* User Profile & Password Change Trigger */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100/80 transition-colors border-l border-slate-200 text-left group"
            title="Klik untuk membuka pengaturan akun & ganti sandi"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-800 to-teal-600 text-white flex items-center justify-center font-bold text-xs ring-1 ring-emerald-600/30 group-hover:ring-emerald-600 transition-all">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <p className="font-semibold text-slate-900 truncate max-w-[120px] flex items-center gap-1">
                <span>{userProfile?.displayName || 'Pengguna'}</span>
                <KeyRound className="w-3 h-3 text-slate-400 group-hover:text-emerald-700 opacity-60" />
              </p>
              <p className="text-[10px] text-slate-500 truncate">{userProfile?.role}</p>
            </div>
          </button>
        </div>
      </header>

      {/* Modal Profile / Ganti Sandi */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
