import React, { useState } from 'react';
import { Shield, KeyRound, User, Mail, Phone, FileText, CheckCircle2, AlertCircle, X, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateProfileData } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [username, setUsername] = useState(userProfile?.username || 'superman');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [nip, setNip] = useState(userProfile?.nip || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSaving(true);
    try {
      const updates: any = {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        nip: nip.trim(),
        phone: phone.trim(),
      };

      if (newPassword.trim()) {
        updates.password = newPassword.trim();
      }

      await updateProfileData(updates);
      setSuccessMsg('Profil dan data akun Anda berhasil diperbarui di database Firestore!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg('');
      }, 3500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menyimpan pembaruan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Pengaturan Akun & Kredensial</h3>
              <p className="text-[11px] text-emerald-200">
                Ubah informasi profil, username, dan kata sandi login Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Role & Super User Badge */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-slate-800">Peran Sistem:</span>
              <span className="px-2 py-0.5 font-extrabold text-[10px] bg-emerald-200 text-emerald-900 rounded-md border border-emerald-300">
                {userProfile?.role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {userProfile?.unitName && (
                <span className="text-[10px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                  {userProfile.unitName}
                </span>
              )}
              {userProfile?.role === 'KEPALA_SPI' && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Super User Otorisator
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap & Gelar
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username (Bisa Dirubah)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: superman"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Digunakan untuk login cepat ke sistem</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Kedinasan
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superman@tirtasaiyo.co.id"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NIP Pegawai
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="19780415 200501 1 004"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nomor Telepon / WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081267890123"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ganti Kata Sandi (Opsional)</span>
            </h4>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Kosongkan jika Anda tidak ingin mengubah kata sandi saat ini.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Konfirmasi Sandi Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-950/20 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
