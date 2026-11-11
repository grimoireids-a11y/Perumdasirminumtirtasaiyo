import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
  User,
  FileText,
  Briefcase,
  Building,
  Search,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { OfficialSignatory } from '../../types/audit';
import { INITIAL_OFFICIALS } from '../../data/initialData';

export const SignatoriesModule: React.FC = () => {
  const [officials, setOfficials] = useState<OfficialSignatory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states: 1. Nama, 2. NIP, 3. Jabatan
  const [formName, setFormName] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'signatories'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OfficialSignatory));
      data.sort((a, b) => (a.order || 99) - (b.order || 99));
      setOfficials(data);
    });

    return () => unsub();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormName('');
    setFormNip('');
    setFormPosition('');
    setFormDepartment('Satuan Pengawasan Intern');
    setIsFormOpen(true);
  };

  const openEditForm = (ofc: OfficialSignatory) => {
    setEditingId(ofc.id);
    setFormName(ofc.name);
    setFormNip(ofc.nip);
    setFormPosition(ofc.position);
    setFormDepartment(ofc.department || '');
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPosition.trim()) {
      alert('Nama dan Jabatan wajib diisi.');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'signatories', editingId), {
          name: formName.trim(),
          nip: formNip.trim(),
          position: formPosition.trim(),
          department: formDepartment.trim(),
        });
        setNotice(`Jabatan "${formPosition}" berhasil diperbarui.`);
      } else {
        const id = 'ofc-' + Date.now();
        const newOfc: OfficialSignatory = {
          id,
          name: formName.trim(),
          nip: formNip.trim(),
          position: formPosition.trim(),
          department: formDepartment.trim(),
          order: officials.length + 1,
          isActive: true,
        };
        await setDoc(doc(db, 'signatories', id), newOfc);
        setNotice(`Jabatan "${formPosition}" berhasil ditambahkan.`);
      }

      setIsFormOpen(false);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      console.error('Error saving signatory:', err);
      alert('Gagal menyimpan data jabatan.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus jabatan untuk "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'signatories', id));
      setNotice('Jabatan berhasil dihapus.');
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      console.error('Error deleting signatory:', err);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Muat ulang seluruh daftar pejabat standar BUMD Tirta Saiyo?')) return;
    try {
      for (const ofc of INITIAL_OFFICIALS) {
        await setDoc(doc(db, 'signatories', ofc.id), ofc);
      }
      setNotice('Data pejabat standar berhasil dipulihkan.');
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOfficials = officials.filter(
    (o) =>
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.department && o.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-700" />
            Fitur Jabatan & Pejabat Penandatangan Dokumen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola master data pejabat penandatangan (1. Nama, 2. NIP, 3. Jabatan) yang otomatis dapat dipilih saat meninjau dan mencetak semua dokumen resmi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Muat Pejabat Standar</span>
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Jabatan Baru</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Form Tambah/Ubah */}
      {isFormOpen && (
        <div className="p-5 bg-white border border-emerald-300 rounded-xl shadow-md space-y-4 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>{editingId ? 'Ubah Data Jabatan & Pejabat' : 'Tambah Jabatan & Pejabat Baru'}</span>
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: H. Ahmad Zaki, S.T., M.M."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. NIP Pegawai
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    placeholder="Contoh: 19740612 199803 1 002"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Jabatan Penandatangan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="Contoh: Direktur Perumda Air Minum Tirta Saiyo"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Satuan / Bagian / Unit Kerja
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="Contoh: Satuan Pengawasan Intern"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
              >
                {editingId ? 'Simpan Perubahan' : 'Tambahkan Pejabat'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, NIP, atau jabatan..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">1. Nama Lengkap & Gelar</th>
                <th className="py-3 px-4">2. NIP Pegawai</th>
                <th className="py-3 px-4">3. Jabatan Penandatangan</th>
                <th className="py-3 px-4">Unit / Departemen</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredOfficials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data jabatan.
                  </td>
                </tr>
              ) : (
                filteredOfficials.map((ofc, idx) => (
                  <tr key={ofc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{ofc.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{ofc.nip || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-md">
                        {ofc.position}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{ofc.department || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditForm(ofc)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Ubah Jabatan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ofc.id, ofc.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Hapus Jabatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
