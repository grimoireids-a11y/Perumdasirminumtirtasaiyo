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
  CheckCircle2,
  XCircle,
  MapPin,
  Search,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { Unit } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';

export const MasterUnitsModule: React.FC = () => {
  const { hasRole } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<Unit['category']>('UNIT_PELAYANAN');
  const [headName, setHeadName] = useState('');
  const [location, setLocation] = useState('');
  const [isActive, setIsActive] = useState(true);

  const canManage = hasRole(['KEPALA_SPI', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });
    return () => unsub();
  }, []);

  const openAdd = () => {
    setEditingUnit(null);
    setName('');
    setCode('');
    setCategory('UNIT_PELAYANAN');
    setHeadName('');
    setLocation('Pasaman');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEdit = (u: Unit) => {
    setEditingUnit(u);
    setName(u.name);
    setCode(u.code);
    setCategory(u.category);
    setHeadName(u.headName || '');
    setLocation(u.location || '');
    setIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Omit<Unit, 'id'> = {
      name,
      code,
      category,
      headName,
      location,
      isActive,
    };

    try {
      if (editingUnit) {
        await updateDoc(doc(db, 'units', editingUnit.id), data);
      } else {
        const id = code.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
        await setDoc(doc(db, 'units', id), { id, ...data });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus master data unit kerja ini?')) return;
    try {
      await deleteDoc(doc(db, 'units', id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = units.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.location && u.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            Master Unit Kerja & 12 Wilayah Pelayanan Tirta Saiyo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar kantor pelayanan Lubuk Sikaping, Tigo Nagari, Malampah, Simpati, Kumpulan, Bonjol, Petok, Panti, Cubadak, Sontang, Rao, Duo Koto
          </p>
        </div>

        {canManage && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Unit / Cabang</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari unit atau kecamatan..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
        />
      </div>

      {/* Grid of Units */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                  {u.code}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                    u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {u.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">{u.name}</h3>

              <div className="text-xs text-slate-600 space-y-1">
                <p>Kategori: <strong className="text-slate-800">{u.category}</strong></p>
                <p>Kepala Unit: <strong className="text-slate-800">{u.headName || '-'}</strong></p>
                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{u.location || 'Kabupaten Pasaman'}</span>
                </p>
              </div>
            </div>

            {canManage && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                <button
                  onClick={() => openEdit(u)}
                  className="p-1 text-slate-500 hover:text-emerald-700 rounded-md"
                  title="Edit Unit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="p-1 text-slate-500 hover:text-rose-600 rounded-md"
                  title="Hapus Unit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingUnit ? 'Ubah Data Unit' : 'Tambah Unit Kerja / Wilayah'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Unit / Kantor</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Unit</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="UNIT_PELAYANAN">Unit Pelayanan Pasaman</option>
                    <option value="BIDANG">Bidang Operasional</option>
                    <option value="PENGAWASAN">Pengawasan & SPI</option>
                    <option value="PIMPINAN">Pimpinan / Direksi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Unit</label>
                <input
                  type="text"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Wilayah / Lokasi</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="unitActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="unitActiveCheck" className="text-slate-700 font-medium cursor-pointer">
                  Unit Kerja Aktif Beroperasi
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
