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
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Printer,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { SPIProgram } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

export const SPIProgramsModule: React.FC = () => {
  const { hasRole } = useAuth();
  const currentYear = new Date().getFullYear();

  const [programs, setPrograms] = useState<SPIProgram[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<SPIProgram | null>(null);

  // Form states
  const [formYear, setFormYear] = useState<number>(currentYear);
  const [formActivityName, setFormActivityName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formSchedule, setFormSchedule] = useState('');
  const [formPic, setFormPic] = useState('Anggota SPI');
  const [formBudget, setFormBudget] = useState<number>(0);
  const [formKpi, setFormKpi] = useState('');
  const [formRealization, setFormRealization] = useState('');
  const [formStatus, setFormStatus] = useState<'Belum Dimulai' | 'Dalam Proses' | 'Terealisasi'>('Belum Dimulai');

  const canManage = hasRole(['KEPALA_SPI', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'spi_programs'), (snap) => {
      setPrograms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SPIProgram)));
    });
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingProg(null);
    setFormYear(currentYear);
    setFormActivityName('');
    setFormTarget('');
    setFormSchedule('Triwulan I - II');
    setFormPic('Tim SPI');
    setFormBudget(15000000);
    setFormKpi('Tersusun dokumen resmi disahkan Direktur Utama');
    setFormRealization('');
    setFormStatus('Belum Dimulai');
    setIsModalOpen(true);
  };

  const openEditModal = (p: SPIProgram) => {
    setEditingProg(p);
    setFormYear(p.year);
    setFormActivityName(p.activityName);
    setFormTarget(p.target);
    setFormSchedule(p.schedule);
    setFormPic(p.pic);
    setFormBudget(p.budget);
    setFormKpi(p.kpi);
    setFormRealization(p.realization);
    setFormStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Omit<SPIProgram, 'id'> = {
      year: formYear,
      activityName: formActivityName,
      target: formTarget,
      schedule: formSchedule,
      pic: formPic,
      budget: formBudget,
      kpi: formKpi,
      realization: formRealization,
      status: formStatus,
    };

    try {
      if (editingProg) {
        await updateDoc(doc(db, 'spi_programs', editingProg.id), data);
      } else {
        const id = 'prog-' + Date.now();
        await setDoc(doc(db, 'spi_programs', id), { id, ...data });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving SPI program:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus kegiatan program tahunan SPI ini?')) return;
    try {
      await deleteDoc(doc(db, 'spi_programs', id));
    } catch (err) {
      console.error('Error deleting SPI program:', err);
    }
  };

  const totalBudget = programs.reduce((acc, curr) => acc + (curr.budget || 0), 0);
  const terealisasiCount = programs.filter((p) => p.status === 'Terealisasi').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            Program Kerja Tahunan Kapabilitas SPI (Non-Audit)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penyusunan Audit Charter, sertifikasi kompetensi auditor, sosialisasi GCG, reviu SOP, dan koordinasi pengawasan BPKP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            title="Tinjau dan cetak dokumen program tahunan kapabilitas SPI dengan pengesahan jabatan"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cetak Program SPI</span>
          </button>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kegiatan Non-Audit</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Kegiatan SPI</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{programs.length}</p>
          <span className="text-[10px] text-slate-400">Pengembangan Internal</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Terealisasi Penuh</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">{terealisasiCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">
            {programs.length > 0 ? Math.round((terealisasiCount / programs.length) * 100) : 0}% Capaian Target
          </span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Anggaran Kapabilitas</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            Rp {totalBudget.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-slate-400">RKA Pengembangan Pengawasan</span>
        </div>
      </div>

      {/* Program Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Kegiatan Kapabilitas & Tata Kelola</th>
                <th className="py-3 px-4">Target & Indikator Kinerja (KPI)</th>
                <th className="py-3 px-4">Jadwal & PIC</th>
                <th className="py-3 px-4 text-right">Anggaran</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canManage && <th className="py-3 px-4 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="py-8 text-center text-slate-400">
                    Belum ada program kerja tahunan SPI non-audit yang didaftarkan.
                  </td>
                </tr>
              ) : (
                programs.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.activityName}</p>
                      {p.realization && (
                        <p className="text-[11px] text-emerald-700 mt-0.5">Realisasi: {p.realization}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium">{p.target}</p>
                      <span className="text-[10px] text-slate-500">KPI: {p.kpi}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{p.schedule}</p>
                      <span className="text-[10px] text-slate-500">PIC: {p.pic}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      Rp {p.budget?.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                          p.status === 'Terealisasi'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Dalam Proses'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded-md transition-colors"
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

      {/* Modal Add / Edit SPI Program */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingProg ? 'Ubah Program SPI Non-Audit' : 'Tambah Program Kapabilitas SPI'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  value={formActivityName}
                  onChange={(e) => setFormActivityName(e.target.value)}
                  placeholder="Contoh: Pembaruan Piagam Audit (Audit Charter) & Sosialisasi GCG"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Kegiatan</label>
                <textarea
                  rows={2}
                  required
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder="Target keluaran kegiatan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jadwal Pelaksanaan</label>
                  <input
                    type="text"
                    required
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value)}
                    placeholder="Contoh: Triwulan II"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIC Pelaksana</label>
                  <input
                    type="text"
                    required
                    value={formPic}
                    onChange={(e) => setFormPic(e.target.value)}
                    placeholder="Nama auditor / tim"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Anggaran Biaya (Rp)</label>
                  <input
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Progres</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Belum Dimulai">Belum Dimulai</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Terealisasi">Terealisasi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Indikator Kinerja (KPI)</label>
                <input
                  type="text"
                  value={formKpi}
                  onChange={(e) => setFormKpi(e.target.value)}
                  placeholder="Kriteria keberhasilan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Realisasi</label>
                <input
                  type="text"
                  value={formRealization}
                  onChange={(e) => setFormRealization(e.target.value)}
                  placeholder="Catatan hasil pelaksanaan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
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
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Modal with Fitur Jabatan */}
      {isPrintModalOpen && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="PROGRAM KERJA TAHUNAN PENGEMBANGAN KAPABILITAS SPI"
          documentSubtitle={`Perumda Air Minum Tirta Saiyo Kabupaten Pasaman - Tahun ${currentYear}`}
          documentNumber={`PRG-SPI/PTS/${currentYear}`}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-5 text-xs font-serif leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-3 font-sans text-xs">
                <div>
                  <p className="text-slate-500">Tahun Program:</p>
                  <p className="font-bold text-slate-900">{currentYear}</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Kegiatan Non-Audit:</p>
                  <p className="font-bold text-emerald-800">{programs.length} Kegiatan</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Anggaran Pengembangan:</p>
                  <p className="font-bold text-slate-900 font-mono">Rp {totalBudget.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-xs border-b border-slate-300 pb-1">
                  Matriks Kegiatan Penguatan Kapabilitas & Pengawasan BUMD:
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300 font-sans">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="p-2 border border-slate-300 w-8 text-center">No</th>
                        <th className="p-2 border border-slate-300">Nama Kegiatan SPI</th>
                        <th className="p-2 border border-slate-300">Sasaran / Output</th>
                        <th className="p-2 border border-slate-300 w-24">Jadwal</th>
                        <th className="p-2 border border-slate-300 w-24 text-right">Anggaran</th>
                        <th className="p-2 border border-slate-300 w-24 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {programs.map((p, idx) => (
                        <tr key={p.id}>
                          <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">{p.activityName}</td>
                          <td className="p-2 border border-slate-300">{p.target}</td>
                          <td className="p-2 border border-slate-300">{p.schedule}</td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-semibold">
                            Rp {p.budget.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-semibold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                p.status === 'Terealisasi'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'Dalam Proses'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DocumentPrintPreviewModal>
      )}
    </div>
  );
};
