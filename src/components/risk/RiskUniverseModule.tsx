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
  Building2,
  Plus,
  Edit2,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/firebase';
import { Unit } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';

export const RiskUniverseModule: React.FC = () => {
  const { hasRole } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<'PIMPINAN' | 'PENGAWASAN' | 'BIDANG' | 'UNIT_PELAYANAN'>('UNIT_PELAYANAN');
  const [formHeadName, setFormHeadName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const canEdit = hasRole(['KEPALA_SPI', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingUnit(null);
    setFormName('');
    setFormCode('');
    setFormCategory('UNIT_PELAYANAN');
    setFormHeadName('');
    setFormLocation('Pasaman');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: Unit) => {
    setEditingUnit(u);
    setFormName(u.name);
    setFormCode(u.code);
    setFormCategory(u.category);
    setFormHeadName(u.headName || '');
    setFormLocation(u.location || '');
    setFormIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    try {
      if (editingUnit) {
        await updateDoc(doc(db, 'units', editingUnit.id), {
          name: formName,
          code: formCode,
          category: formCategory,
          headName: formHeadName,
          location: formLocation,
          isActive: formIsActive,
        });
      } else {
        const id = formCode.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
        await setDoc(doc(db, 'units', id), {
          id,
          name: formName,
          code: formCode,
          category: formCategory,
          headName: formHeadName,
          location: formLocation,
          isActive: formIsActive,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving unit:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus unit kerja ini dari Risk Universe?')) return;
    try {
      await deleteDoc(doc(db, 'units', id));
    } catch (err) {
      console.error('Error deleting unit:', err);
    }
  };

  const exportToExcel = () => {
    const dataToExport = units.map((u, idx) => ({
      No: idx + 1,
      'Kode Unit': u.code,
      'Nama Unit / Proses Bisnis': u.name,
      Kategori: u.category,
      'Kepala / Penanggung Jawab': u.headName || '-',
      Lokasi: u.location || '-',
      Status: u.isActive ? 'Aktif' : 'Non-Aktif',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Risk Universe');
    XLSX.writeFile(wb, `Risk_Universe_Tirta_Saiyo_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.location && u.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || u.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            Risk Universe Perumda Air Minum Tirta Saiyo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inventarisasi struktur organisasi, 8 divisi utama, dan 12 unit pelayanan di seluruh Kabupaten Pasaman
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          {canEdit && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Objek Universe</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari unit atau wilayah Pasaman..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="UNIT_PELAYANAN">Unit Pelayanan Pasaman (12 Unit)</option>
            <option value="BIDANG">Bidang Operasional</option>
            <option value="PENGAWASAN">Pengawasan & SPI</option>
            <option value="PIMPINAN">Pimpinan & Direksi</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">Kode Unit</th>
                <th className="py-3 px-4">Nama Unit Kerja / Proses Bisnis</th>
                <th className="py-3 px-4">Kategori Struktur</th>
                <th className="py-3 px-4">Kepala / Penanggung Jawab</th>
                <th className="py-3 px-4">Wilayah Operasional</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canEdit && <th className="py-3 px-4 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data unit kerja.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{u.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium text-slate-600">
                        {u.category === 'UNIT_PELAYANAN'
                          ? 'Unit Pelayanan'
                          : u.category === 'BIDANG'
                          ? 'Bidang Kantor Pusat'
                          : u.category === 'PENGAWASAN'
                          ? 'SPI & Dewas'
                          : 'Direksi / KPM'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.headName || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{u.location || 'Pasaman'}</td>
                    <td className="py-3 px-4 text-center">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <XCircle className="w-3.5 h-3.5" /> Nonaktif
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded-md transition-colors"
                            title="Edit Unit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded-md transition-colors"
                            title="Hapus Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Unit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingUnit ? 'Edit Unit Risk Universe' : 'Tambah Objek Risk Universe'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Unit / Proses Bisnis</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Unit Pelayanan Lubuk Sikaping"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Singkat</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Contoh: UP-LBS"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Struktur</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="UNIT_PELAYANAN">Unit Pelayanan Pasaman</option>
                    <option value="BIDANG">Bidang Operasional</option>
                    <option value="PENGAWASAN">Pengawasan & SPI</option>
                    <option value="PIMPINAN">Pimpinan / Direksi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Kepala / Pejabat</label>
                  <input
                    type="text"
                    value={formHeadName}
                    onChange={(e) => setFormHeadName(e.target.value)}
                    placeholder="Nama kepala unit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wilayah / Lokasi</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Contoh: Lubuk Sikaping"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveCheck" className="text-slate-700 font-medium cursor-pointer">
                  Status Objek Pengawasan Aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
