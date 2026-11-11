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
  X,
  User,
  FileText,
  Briefcase,
  Building,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { OfficialSignatory } from '../../types/audit';
import { INITIAL_OFFICIALS } from '../../data/initialData';

interface SignatoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSignatory?: (signatory: OfficialSignatory) => void;
}

export const SignatoryManagerModal: React.FC<SignatoryManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectSignatory,
}) => {
  const [officials, setOfficials] = useState<OfficialSignatory[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states: 1. Nama, 2. NIP, 3. Jabatan
  const [formName, setFormName] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const unsub = onSnapshot(collection(db, 'signatories'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OfficialSignatory));
      data.sort((a, b) => (a.order || 99) - (b.order || 99));
      setOfficials(data);
    });

    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Fitur Jabatan & Pejabat Penandatangan Dokumen</h3>
              <p className="text-[11px] text-emerald-200">
                Kelola Nama, NIP, dan Jabatan penandatangan untuk seluruh dokumen resmi BUMD
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

        {/* Action bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Total Jabatan: <strong className="text-emerald-800">{officials.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
              title="Pulihkan data standar pimpinan Tirta Saiyo"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Muat Pejabat Standar</span>
            </button>
            <button
              onClick={openAddForm}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Jabatan Baru</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Form Create/Edit */}
          {isFormOpen && (
            <form onSubmit={handleSave} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>{editingId ? 'Ubah Data Jabatan & Pejabat' : 'Tambah Jabatan & Pejabat Baru'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                >
                  ✕ Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    1. Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: H. Ahmad Zaki, S.T., M.M."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    2. NIP Pegawai / Pejabat
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={formNip}
                      onChange={(e) => setFormNip(e.target.value)}
                      placeholder="Contoh: 19740612 199803 1 002"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    3. Jabatan Penandatangan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value)}
                      placeholder="Contoh: Direktur Perumda Tirta Saiyo"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bagian / Satuan / Unit Kerja
                  </label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="Contoh: Satuan Pengawasan Intern"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambahkan Pejabat'}
                </button>
              </div>
            </form>
          )}

          {/* List of Officials */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            {officials.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada data jabatan. Klik tombol <strong>"Muat Pejabat Standar"</strong> di atas.
              </div>
            ) : (
              officials.map((ofc, idx) => (
                <div
                  key={ofc.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{ofc.name}</h4>
                        {ofc.department && (
                          <span className="px-1.5 py-0.2 text-[10px] font-medium text-emerald-800 bg-emerald-50 rounded border border-emerald-200 truncate">
                            {ofc.department}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                        Jabatan: <span className="text-slate-800">{ofc.position}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {ofc.nip ? `NIP. ${ofc.nip}` : 'NIP. -'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {onSelectSignatory && (
                      <button
                        onClick={() => {
                          onSelectSignatory(ofc);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-2xs transition-colors"
                      >
                        Pilih Pejabat
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(ofc)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Ubah data pejabat"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ofc.id, ofc.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Hapus data pejabat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Setiap jabatan yang disimpan di sini dapat dipilih langsung pada preview cetak semua dokumen.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
