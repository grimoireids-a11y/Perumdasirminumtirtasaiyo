import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle2, Info, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppBranding } from '../../context/AppBrandingContext';
import { UserRole } from '../../types/audit';
import { INITIAL_UNITS } from '../../data/initialData';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, register } = useAuth();
  const { branding } = useAppBranding();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('AUDITOR');
  const [selectedUnitId, setSelectedUnitId] = useState(INITIAL_UNITS[5]?.name || 'Bidang Umum dan Keuangan');
  const [selectedUnitName, setSelectedUnitName] = useState(INITIAL_UNITS[5]?.name || 'Bidang Umum dan Keuangan');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!displayName.trim()) {
          throw new Error('Nama lengkap wajib diisi.');
        }
        const res = await register(
          identifier,
          password,
          displayName,
          role,
          role === 'AUDITEE' ? selectedUnitId : undefined,
          role === 'AUDITEE' ? selectedUnitName : undefined
        );
        if (res.pendingApproval) {
          setSuccessMsg(
            'Pendaftaran berhasil! Akun Anda saat ini berstatus MENUNGGU PERSETUJUAN dari Kepala SPI (Super User). Hubungi Kepala SPI untuk aktivasi akun Anda.'
          );
          setIsRegisterMode(false);
        }
      } else {
        await login(identifier, password);
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memproses autentikasi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes('popup-closed-by-user')) {
          setError('Jendela masuk Google ditutup sebelum selesai.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Gagal masuk dengan Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#062415] via-[#0d3824] to-[#04170d] p-4 sm:p-6 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-950/20 overflow-hidden text-slate-900">
        {/* Brand Banner */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-[#0a2f1c] to-[#0d3824] text-white text-center border-b border-emerald-900/40">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xs p-2 shadow-lg shadow-emerald-950/70 mb-3 ring-4 ring-emerald-400/20 overflow-hidden">
            {branding.logoType === 'image' && branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.appName || 'Logo SPI'}
                className="w-full h-full object-contain"
              />
            ) : (
              <div
                className="w-full h-full rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: branding.logoThemeColor || branding.accentColor || '#059669' }}
              >
                <Shield className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>{branding.appName || 'SPI SMART'}</span>
            {branding.appTagline && (
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-600/30">
                {branding.appTagline}
              </span>
            )}
          </h1>
          <p className="text-xs font-semibold text-emerald-200 mt-1 uppercase tracking-wider">
            {branding.institutionName || 'Perumda Air Minum Tirta Saiyo'}
          </p>
          {(branding.address || branding.officeAddress || branding.shortInstitutionName) && (
            <p className="text-[11px] text-emerald-300/80 mt-0.5 line-clamp-1">
              {branding.address || branding.officeAddress || 'Kabupaten Pasaman, Sumatera Barat'}
            </p>
          )}
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900">
              {isRegisterMode ? 'Pendaftaran Akun Pengguna' : 'Masuk ke Sistem Pengawasan'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRegisterMode
                ? 'Pendaftaran akun baru wajib disetujui Kepala SPI sebelum dapat digunakan'
                : 'Silakan masukkan kredensial akun terverifikasi Anda'}
            </p>
          </div>

          {successMsg && (
            <div className="p-3 text-xs text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Contoh: Rahmat Hidayat, S.E."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilihan Peran yang Dimohonkan
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white font-semibold"
                  >
                    <option value="AUDITOR">Auditor / Pembantu SPI</option>
                    <option value="DIREKTUR">Direktur Perumda Tirta Saiyo</option>
                    <option value="DEWAN_PENGAWAS">Dewan Pengawas</option>
                    <option value="AUDITEE">Unit Kerja / Auditee</option>
                    <option value="ADMIN_SISTEM">Administrator Sistem</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    * Peran definitif dan aktivasi akan diverifikasi & disetujui oleh Kepala SPI.
                  </p>
                </div>

                {role === 'AUDITEE' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Unit Kerja yang Anda Wakili</span>
                    </label>
                    <select
                      value={selectedUnitName}
                      onChange={(e) => {
                        setSelectedUnitId(e.target.value);
                        setSelectedUnitName(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs bg-emerald-50/60 border border-emerald-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white font-semibold text-emerald-950"
                    >
                      {INITIAL_UNITS.map((u) => (
                        <option key={u.code} value={u.name}>
                          {u.name} ({u.category === 'UNIT_PELAYANAN' ? 'Cabang Pasaman' : 'Kantor Pusat'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-emerald-800 mt-1">
                      * Sesuai mandat tata kelola, akun Auditee dibatasi khusus untuk menyusun dan menginput Register Risiko unit kerja ini.
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username atau Email Kedinasan
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="superman atau nama@tirtasaiyo.co.id"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 rounded-lg shadow-md shadow-emerald-950/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? 'Memproses...' : isRegisterMode ? 'Ajukan Pendaftaran Akun' : 'Masuk ke Aplikasi'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Google Sign-in Alternative */}
          {!isRegisterMode && (
            <>
              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                  atau
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2 px-4 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
              </button>
            </>
          )}

          {/* Toggle Register / Login */}
          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              {isRegisterMode
                ? 'Sudah memiliki akun? Masuk di sini'
                : 'Pengguna baru? Ajukan pendaftaran akun di sini'}
            </button>
          </div>
        </div>

        {/* Footer Principles */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Independen
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Berbasis Risiko
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terdokumentasi
          </span>
        </div>
      </div>
    </div>
  );
};
