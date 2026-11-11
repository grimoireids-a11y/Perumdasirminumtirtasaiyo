import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  Edit2,
  Database,
  Search,
  KeyRound,
  UserCheck,
  UserX,
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { UserProfile, UserRole, Unit } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { ProfileModal } from '../profile/ProfileModal';

export const UserManagementModule: React.FC = () => {
  const { userProfile, seedInitialDataIfEmpty, approveUser, rejectUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Form edit states
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('AUDITOR');
  const [formUnitId, setFormUnitId] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Pending user role selection helper map
  const [pendingRoleMap, setPendingRoleMap] = useState<Record<string, UserRole>>({});
  const [pendingUnitMap, setPendingUnitMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
      // Sort: pending first, then by createdAt desc
      data.sort((a, b) => {
        if (a.approvalStatus === 'PENDING' && b.approvalStatus !== 'PENDING') return -1;
        if (b.approvalStatus === 'PENDING' && a.approvalStatus !== 'PENDING') return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      setUsers(data);
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });

    return () => {
      unsubUsers();
      unsubUnits();
    };
  }, []);

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFormDisplayName(u.displayName);
    setFormRole(u.role);
    setFormUnitId(u.unitId || '');
    setFormNip(u.nip || '');
    setFormPhone(u.phone || '');
    setFormIsActive(u.isActive);
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const selUnit = units.find((un) => un.id === formUnitId);
    const unitName = selUnit ? selUnit.name : '';

    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        displayName: formDisplayName,
        role: formRole,
        unitId: formUnitId,
        unitName,
        nip: formNip,
        phone: formPhone,
        isActive: formIsActive,
      });
      setIsEditModalOpen(false);
      setActionNotice(`Data pengguna ${formDisplayName} berhasil diperbarui.`);
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const handleToggleActive = async (u: UserProfile) => {
    if (u.uid === userProfile?.uid) {
      alert('Anda tidak dapat menonaktifkan akun yang sedang aktif digunakan.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        isActive: !u.isActive,
      });
      setActionNotice(`Status akun ${u.displayName} berhasil diubah.`);
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  const handleApprove = async (u: UserProfile) => {
    try {
      const assignedRole = pendingRoleMap[u.uid] || u.role;
      const assignedUnitId = pendingUnitMap[u.uid] || u.unitId;
      const assignedUnit = units.find((un) => un.id === assignedUnitId);

      const updates: any = {
        role: assignedRole,
        isActive: true,
        approvalStatus: 'APPROVED',
      };
      if (assignedUnit) {
        updates.unitId = assignedUnit.id;
        updates.unitName = assignedUnit.name;
      }

      await updateDoc(doc(db, 'users', u.uid), updates);
      setActionNotice(`Akun ${u.displayName} (${u.email}) berhasil DISETUJUI & DIAKTIFKAN dengan peran ${assignedRole}.`);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err) {
      console.error('Error approving user:', err);
      alert('Gagal menyetujui pengguna.');
    }
  };

  const handleReject = async (u: UserProfile) => {
    if (!window.confirm(`Apakah Anda yakin ingin menolak pendaftaran akun ${u.displayName} (${u.email})?`)) {
      return;
    }
    try {
      await rejectUser(u.uid);
      setActionNotice(`Pendaftaran akun ${u.displayName} berhasil ditolak.`);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err) {
      console.error('Error rejecting user:', err);
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (u.uid === 'superman_root') {
      alert('Akun root Kepala SPI superman tidak boleh dihapus.');
      return;
    }
    if (!window.confirm(`Hapus permanen akun ${u.displayName} dari database?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', u.uid));
      setActionNotice(`Akun ${u.displayName} telah dihapus.`);
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedData = async () => {
    try {
      await seedInitialDataIfEmpty();
      setSeedSuccessMsg('Data master 12 Unit Pelayanan Pasaman dan regulasi awal berhasil disinkronisasi ke Firestore!');
      setTimeout(() => setSeedSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingUsers = users.filter((u) => u.approvalStatus === 'PENDING' || (!u.isActive && u.approvalStatus !== 'REJECTED' && u.uid !== 'superman_root'));
  const activeUsers = users.filter((u) => u.isActive && u.approvalStatus !== 'PENDING');
  const inactiveUsers = users.filter((u) => !u.isActive);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.unitName && u.unitName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;

    let matchesTab = true;
    if (activeFilterTab === 'PENDING') {
      matchesTab = u.approvalStatus === 'PENDING' || (!u.isActive && u.approvalStatus !== 'REJECTED' && u.uid !== 'superman_root');
    } else if (activeFilterTab === 'ACTIVE') {
      matchesTab = u.isActive && u.approvalStatus !== 'PENDING';
    } else if (activeFilterTab === 'INACTIVE') {
      matchesTab = !u.isActive;
    }

    return matchesSearch && matchesRole && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              Otorisasi Pengguna & Hak Akses (RBAC)
            </h2>
            {pendingUsers.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-full animate-pulse">
                {pendingUsers.length} Menunggu Persetujuan
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kepala SPI bertindak sebagai Super User untuk menyetujui pendaftaran akun baru, mengatur peran, dan mengontrol hak akses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ubah Password Superman Quick Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors"
            title="Ubah username, password, atau profil Kepala SPI (superman)"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
            <span>Pengaturan Akun & Sandi</span>
          </button>

          <button
            onClick={handleSeedData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors"
            title="Muat data master 12 unit pelayanan Pasaman dan regulasi standar BUMD"
          >
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <span>Inisialisasi Master BUMD</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {seedSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{seedSuccessMsg}</span>
        </div>
      )}

      {/* SUPER USER / KEPALA SPI HIGHLIGHT CARD */}
      <div className="p-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-xl shadow-sm border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600/40 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-inner">
            <Shield className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">Akun Super User (Kepala SPI)</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-400 text-amber-950 rounded-md">
                Root Otorisator
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              Kredensial login bawaan: <strong className="font-mono text-white">superman</strong> / <strong className="font-mono text-white">superman123</strong>. Dapat Anda ganti sewaktu-waktu sesuai kebutuhan.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="self-start md:self-auto px-3.5 py-1.5 text-xs font-bold text-emerald-950 bg-amber-300 hover:bg-amber-400 rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Ganti Username / Password</span>
        </button>
      </div>

      {/* PENDING APPROVALS ALERT BOX (If any exist) */}
      {pendingUsers.length > 0 && (
        <div className="p-5 bg-amber-50/80 border border-amber-300 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold">
                Pendaftaran Akun Baru Menunggu Persetujuan Kepala SPI ({pendingUsers.length})
              </h3>
            </div>
            <span className="text-xs font-medium text-amber-800">
              Pengguna baru belum dapat masuk sebelum Anda setujui
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingUsers.map((u) => (
              <div
                key={u.uid}
                className="p-3.5 bg-white border border-amber-200 rounded-lg shadow-2xs space-y-2.5 text-xs text-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{u.displayName}</h4>
                    <p className="font-mono text-[11px] text-slate-600">{u.email}</p>
                    {u.username && (
                      <p className="text-[10px] text-slate-500">Username: <span className="font-mono font-semibold">{u.username}</span></p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 rounded-md shrink-0">
                    Menunggu Persetujuan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-500 block mb-0.5">Tetapkan Peran:</label>
                    <select
                      value={pendingRoleMap[u.uid] || u.role}
                      onChange={(e) =>
                        setPendingRoleMap((prev) => ({ ...prev, [u.uid]: e.target.value as UserRole }))
                      }
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-800"
                    >
                      <option value="AUDITOR">Auditor SPI</option>
                      <option value="KEPALA_SPI">Kepala SPI</option>
                      <option value="DIREKTUR">Direktur</option>
                      <option value="DEWAN_PENGAWAS">Dewan Pengawas</option>
                      <option value="AUDITEE">Unit Kerja / Auditee</option>
                      <option value="ADMIN_SISTEM">Administrator Sistem</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-0.5">Penempatan Unit:</label>
                    <select
                      value={pendingUnitMap[u.uid] || u.unitId || ''}
                      onChange={(e) =>
                        setPendingUnitMap((prev) => ({ ...prev, [u.uid]: e.target.value }))
                      }
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-800"
                    >
                      <option value="">Semua Unit (Terpusat)</option>
                      {units.map((un) => (
                        <option key={un.id} value={un.id}>
                          {un.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleReject(u)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>
                  <button
                    onClick={() => handleApprove(u)}
                    className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-2xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Setujui & Aktifkan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilterTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            Semua ({users.length})
          </button>
          <button
            onClick={() => setActiveFilterTab('PENDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeFilterTab === 'PENDING'
                ? 'bg-white text-amber-900 shadow-2xs'
                : 'hover:text-amber-900'
            }`}
          >
            <span>Persetujuan</span>
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white font-bold rounded-full text-[10px]">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilterTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilterTab === 'ACTIVE'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'hover:text-emerald-900'
            }`}
          >
            Aktif ({activeUsers.length})
          </button>
          <button
            onClick={() => setActiveFilterTab('INACTIVE')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilterTab === 'INACTIVE'
                ? 'bg-white text-rose-900 shadow-2xs'
                : 'hover:text-rose-900'
            }`}
          >
            Nonaktif ({inactiveUsers.length})
          </button>
        </div>

        {/* Search & Role Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, email, unit..."
              className="w-48 sm:w-60 pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="ALL">Semua Peran</option>
            <option value="KEPALA_SPI">Kepala SPI</option>
            <option value="AUDITOR">Auditor SPI</option>
            <option value="DIREKTUR">Direktur</option>
            <option value="DEWAN_PENGAWAS">Dewan Pengawas</option>
            <option value="AUDITEE">Auditee</option>
            <option value="ADMIN_SISTEM">Admin Sistem</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap & NIP</th>
                <th className="py-3 px-4">Email / Username</th>
                <th className="py-3 px-4">Peran (RBAC)</th>
                <th className="py-3 px-4">Unit Kerja</th>
                <th className="py-3 px-4 text-center">Status Persetujuan</th>
                <th className="py-3 px-4 text-center">Status Aktif</th>
                <th className="py-3 px-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data pengguna sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-900">{u.displayName}</p>
                        {u.uid === 'superman_root' && (
                          <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-100 text-amber-900 rounded border border-amber-300">
                            SUPER USER
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{u.nip ? `NIP. ${u.nip}` : '-'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div>{u.email}</div>
                      {u.username && (
                        <div className="text-[10px] text-slate-400">user: {u.username}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-md">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{u.unitName || 'Semua Unit'}</td>
                    <td className="py-3 px-4 text-center">
                      {u.approvalStatus === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Disetujui</span>
                        </span>
                      ) : u.approvalStatus === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-900 bg-amber-100 rounded-md border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Menunggu</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-rose-800 bg-rose-100 rounded-md">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Ditolak</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Klik untuk ubah status aktif/nonaktif"
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {u.approvalStatus === 'PENDING' && (
                          <button
                            onClick={() => handleApprove(u)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Setujui pendaftaran"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Ubah Akses & Detail"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.uid !== 'superman_root' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus Akun"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit User */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Ubah Otorisasi Pengguna</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Pengguna (Akun)</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran (RBAC)</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="KEPALA_SPI">Kepala SPI</option>
                    <option value="AUDITOR">Auditor SPI</option>
                    <option value="DIREKTUR">Direktur</option>
                    <option value="DEWAN_PENGAWAS">Dewan Pengawas</option>
                    <option value="AUDITEE">Unit Kerja / Auditee</option>
                    <option value="ADMIN_SISTEM">Administrator Sistem</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Kerja Terkait</label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Semua Unit / Pengawasan Terpusat</option>
                    {units.map((un) => (
                      <option key={un.id} value={un.id}>
                        {un.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP Pegawai</label>
                  <input
                    type="text"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="userActiveCheck" className="text-slate-700 font-medium cursor-pointer">
                  Akun Diberikan Akses Aktif ke Sistem
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profile / Password Change for Kepala SPI superman */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
