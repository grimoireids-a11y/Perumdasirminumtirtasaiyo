import React from 'react';
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  FileCheck2,
  Lock,
  BookOpen,
  Users,
  Settings,
  ChevronRight,
  LogOut,
  Building2,
  Award,
  FileText,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppBranding } from '../../context/AppBrandingContext';
import { UserRole } from '../../types/audit';

export type ActiveTab =
  | 'dashboard'
  | 'risk_universe'
  | 'risk_register'
  | 'rcsa'
  | 'bpkp_assessment'
  | 'pkpt'
  | 'spi_programs'
  | 'audit_assignments'
  | 'audit_program'
  | 'work_papers'
  | 'audit_reports'
  | 'findings'
  | 'follow_ups'
  | 'investigations'
  | 'regulations'
  | 'user_management'
  | 'master_units'
  | 'signatories'
  | 'app_branding';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  const { userProfile, logout, hasRole } = useAuth();
  const { branding } = useAppBranding();

  const getRoleBadgeLabel = (role?: UserRole) => {
    switch (role) {
      case 'KEPALA_SPI':
        return 'Kepala SPI';
      case 'AUDITOR':
        return 'Auditor SPI';
      case 'DIREKTUR':
        return 'Direktur';
      case 'DEWAN_PENGAWAS':
        return 'Dewan Pengawas';
      case 'AUDITEE':
        return 'Unit Kerja / Auditee';
      case 'ADMIN_SISTEM':
        return 'Admin Sistem';
      default:
        return 'Pengguna';
    }
  };

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    hideFor?: UserRole[];
    roles?: UserRole[];
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const isFullAccess = userProfile?.role === 'KEPALA_SPI' || userProfile?.role === 'ADMIN_SISTEM';

  const navSections: NavSection[] = isFullAccess
    ? [
        {
          title: 'Pusat Komando',
          items: [
            { id: 'dashboard', label: 'Dashboard Pengawasan', icon: LayoutDashboard },
          ],
        },
        {
          title: 'Perencanaan Berbasis Risiko',
          items: [
            { id: 'risk_universe', label: 'Risk Universe', icon: Building2 },
            { id: 'risk_register', label: 'Register Risiko 5x5', icon: AlertTriangle },
            { id: 'rcsa', label: 'Penilaian RCSA Unit', icon: ClipboardList },
            { id: 'bpkp_assessment', label: 'Self Assessment BPKP', icon: Award },
            { id: 'pkpt', label: 'Penyusunan PKPT', icon: CalendarCheck },
            { id: 'spi_programs', label: 'Program Tahunan SPI', icon: BookOpen },
          ],
        },
        {
          title: 'Pelaksanaan Audit',
          items: [
            { id: 'audit_assignments', label: 'Surat Tugas & Tim', icon: FileCheck2 },
            { id: 'audit_program', label: 'Program Audit (PKA)', icon: ClipboardList },
            { id: 'work_papers', label: 'Kertas Kerja Audit (KKA)', icon: BookOpen, hideFor: ['AUDITEE'] },
            { id: 'audit_reports', label: 'Laporan Hasil Audit (LHA)', icon: FileText },
          ],
        },
        {
          title: 'Temuan & Tindak Lanjut',
          items: [
            { id: 'findings', label: 'Temuan Audit (5C)', icon: AlertTriangle },
            { id: 'follow_ups', label: 'Tindak Lanjut Rekomendasi', icon: FileCheck2 },
          ],
        },
        {
          title: 'Investigasi & Regulasi',
          items: [
            {
              id: 'investigations',
              label: 'Audit Investigatif & Fraud',
              icon: Lock,
              roles: ['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM', 'DIREKTUR'],
            },
            { id: 'regulations', label: 'Review Produk Hukum', icon: BookOpen },
          ],
        },
        {
          title: 'Tata Kelola Sistem',
          items: [
            {
              id: 'app_branding',
              label: 'Logo & Identitas Kantor',
              icon: Palette,
              roles: ['KEPALA_SPI', 'ADMIN_SISTEM'],
            },
            {
              id: 'user_management',
              label: 'Manajemen Pengguna',
              icon: Users,
              roles: ['KEPALA_SPI', 'ADMIN_SISTEM'],
            },
            {
              id: 'master_units',
              label: 'Master Unit & Wilayah',
              icon: Settings,
              roles: ['KEPALA_SPI', 'ADMIN_SISTEM'],
            },
            {
              id: 'signatories',
              label: 'Fitur Jabatan & TTD',
              icon: Award,
            },
          ],
        },
      ]
    : [
        {
          title: 'Pusat Kendali Pengawasan',
          items: [
            { id: 'dashboard', label: 'Peta Risiko Korporat (5x5 Heat Map)', icon: LayoutDashboard },
          ],
        },
        {
          title: 'Manajemen Risiko Korporat',
          items: [
            { id: 'risk_register', label: 'Register Risiko Korporat (5x5)', icon: AlertTriangle },
          ],
        },
      ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-gradient-to-b from-[#0a2f1c] via-[#0d3824] to-[#082416] text-slate-100 transition-transform duration-300 ease-in-out border-r border-emerald-950/40 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Dynamic Logo & Name */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-emerald-900/40">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md shadow-emerald-950/60 ring-2 ring-emerald-400/20 overflow-hidden shrink-0"
            style={{
              backgroundColor: branding.logoType === 'image' && branding.logoUrl ? '#ffffff' : (branding.logoThemeColor || '#10b981'),
            }}
          >
            {branding.logoType === 'image' && branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo Kantor"
                className="w-full h-full object-contain p-1 rounded-xl"
              />
            ) : (
              <Shield className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white truncate">
                {branding.appName || 'SPI SMART'}
              </span>
              {branding.appTagline && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-300 uppercase bg-amber-950/60 border border-amber-600/30 rounded-xs shrink-0">
                  {branding.appTagline}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-emerald-300 truncate" title={branding.shortInstitutionName || branding.institutionName}>
              {branding.shortInstitutionName || 'Perumda Tirta Saiyo Pasaman'}
            </p>
          </div>
        </div>

        {/* User Identity Preview */}
        <div className="px-5 py-3.5 bg-emerald-950/40 border-b border-emerald-900/30 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {userProfile?.displayName || 'Pengguna SPI'}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80">
              <span className="truncate">{getRoleBadgeLabel(userProfile?.role)}</span>
              {userProfile?.unitName && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[100px]">{userProfile.unitName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navSections.map((sec) => {
            const filteredItems = sec.items.filter((item) => {
              if (item.hideFor && userProfile?.role && item.hideFor.includes(userProfile.role)) {
                return false;
              }
              if (item.roles && (!userProfile?.role || !item.roles.includes(userProfile.role))) {
                return false;
              }
              return true;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={sec.title} className="space-y-1">
                <h3 className="px-3 text-[11px] font-semibold tracking-wider text-emerald-400/70 uppercase">
                  {sec.title}
                </h3>
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-950/40 font-semibold'
                          : 'text-emerald-100/80 hover:bg-emerald-900/40 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-emerald-400/80'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer Logout & Settings */}
        <div className="p-3 border-t border-emerald-900/40 bg-[#072114] space-y-1.5">
          <button
            onClick={() => {
              if (setActiveTab) setActiveTab('user_management');
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-emerald-200 bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-800/40 rounded-lg transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pengaturan Akun & Profil</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/40 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
};
