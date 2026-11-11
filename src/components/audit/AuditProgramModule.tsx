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
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Calculator,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { AuditProgramStep, AuditAssignment } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';

interface AuditProgramModuleProps {
  initialAssignmentId?: string;
}

export const AuditProgramModule: React.FC<AuditProgramModuleProps> = ({ initialAssignmentId }) => {
  const { userProfile, hasRole } = useAuth();
  const [steps, setSteps] = useState<AuditProgramStep[]>([]);
  const [assignments, setAssignments] = useState<AuditAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(initialAssignmentId || '');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSamplingModalOpen, setIsSamplingModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<AuditProgramStep | null>(null);

  // Form states
  const [formStepNumber, setFormStepNumber] = useState<number>(1);
  const [formTestObjective, setFormTestObjective] = useState('');
  const [formTestRisk, setFormTestRisk] = useState('');
  const [formTestControl, setFormTestControl] = useState('');
  const [formProcedure, setFormProcedure] = useState('');
  const [formRequiredDocs, setFormRequiredDocs] = useState('');
  const [formTestMethod, setFormTestMethod] = useState('Uji Fisik & Penelusuran Dokumen');
  const [formSampleSize, setFormSampleSize] = useState('Sampel 30 dari 150 transaksi');
  const [formAuditor, setFormAuditor] = useState('');
  const [formWorkPaperRef, setFormWorkPaperRef] = useState('KKA-01');
  const [formStatus, setFormStatus] = useState<'Belum Dilaksanakan' | 'Sedang Berjalan' | 'Selesai'>('Sedang Berjalan');

  // Sampling calculator states
  const [calcPopulation, setCalcPopulation] = useState<number>(500);
  const [calcSample, setCalcSample] = useState<number>(50);
  const [calcMethod, setCalcMethod] = useState<'Random' | 'HighRisk' | 'Nominal'>('HighRisk');

  const canManage = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsubAssignments = onSnapshot(collection(db, 'audit_assignments'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditAssignment));
      setAssignments(list);
      if (list.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(list[0].id);
      }
    });

    const unsubSteps = onSnapshot(collection(db, 'audit_programs'), (snap) => {
      setSteps(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditProgramStep)));
    });

    return () => {
      unsubAssignments();
      unsubSteps();
    };
  }, [selectedAssignmentId]);

  useEffect(() => {
    if (initialAssignmentId) {
      setSelectedAssignmentId(initialAssignmentId);
    }
  }, [initialAssignmentId]);

  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const openAddModal = () => {
    setEditingStep(null);
    const existingCount = steps.filter((s) => s.assignmentId === selectedAssignmentId).length;
    setFormStepNumber(existingCount + 1);
    setFormTestObjective('Menguji kesesuaian fisik kas dan saldo rekening koran bank');
    setFormTestRisk('Potensi selisih kas fisik atau keterlambatan penyetoran penerimaan rekening');
    setFormTestControl('Rekonsiliasi bank bulanan dan cash count berkala');
    setFormProcedure('1. Lakukan kas opname fisik brankas secara mendadak.\n2. Bandingkan bukti setor bank dengan buku kas umum.');
    setFormRequiredDocs('Buku Kas Umum, Rekening Koran Bank, Berita Acara Kas Opname');
    setFormTestMethod('Inspeksi Fisik & Rekonsiliasi');
    setFormSampleSize('Sampel transaksi 1 bulan terakhir');
    setFormAuditor(userProfile?.displayName || 'Auditor SPI');
    setFormWorkPaperRef(`KKA-${String(existingCount + 1).padStart(2, '0')}`);
    setFormStatus('Sedang Berjalan');
    setIsModalOpen(true);
  };

  const openEditModal = (s: AuditProgramStep) => {
    setEditingStep(s);
    setFormStepNumber(s.stepNumber);
    setFormTestObjective(s.testObjective);
    setFormTestRisk(s.testRisk);
    setFormTestControl(s.testControl);
    setFormProcedure(s.procedure);
    setFormRequiredDocs(s.requiredDocs);
    setFormTestMethod(s.testMethod);
    setFormSampleSize(s.sampleSize);
    setFormAuditor(s.auditor);
    setFormWorkPaperRef(s.workPaperRef);
    setFormStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;

    const data: Omit<AuditProgramStep, 'id'> = {
      assignmentId: selectedAssignmentId,
      stepNumber: formStepNumber,
      testObjective: formTestObjective,
      testRisk: formTestRisk,
      testControl: formTestControl,
      procedure: formProcedure,
      requiredDocs: formRequiredDocs,
      testMethod: formTestMethod,
      sampleSize: formSampleSize,
      auditor: formAuditor,
      workPaperRef: formWorkPaperRef,
      status: formStatus,
    };

    try {
      if (editingStep) {
        await updateDoc(doc(db, 'audit_programs', editingStep.id), data);
      } else {
        const id = 'step-' + Date.now();
        await setDoc(doc(db, 'audit_programs', id), { id, ...data });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving audit step:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus langkah prosedur audit ini?')) return;
    try {
      await deleteDoc(doc(db, 'audit_programs', id));
    } catch (err) {
      console.error('Error deleting step:', err);
    }
  };

  const filteredSteps = steps
    .filter((s) => s.assignmentId === selectedAssignmentId)
    .sort((a, b) => a.stepNumber - b.stepNumber);

  const coveragePercent = calcPopulation > 0 ? Math.round((calcSample / calcPopulation) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-700" />
            Program Kerja Pemeriksaan (PKA) & Prosedur Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Langkah kerja pengujian terstruktur, penentuan sampel uji, dan referensi kertas kerja pemeriksaan (KKA)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSamplingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-700" />
            <span>Kalkulator Sampel</span>
          </button>

          {canManage && (
            <button
              onClick={openAddModal}
              disabled={!selectedAssignmentId}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Langkah PKA</span>
            </button>
          )}
        </div>
      </div>

      {/* Select Assignment */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Pilih Penugasan Audit:</label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg max-w-md truncate"
          >
            {assignments.length === 0 ? (
              <option value="">Belum ada penugasan terdaftar</option>
            ) : (
              assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.letterNumber} - {a.objectName} ({a.unitName})
                </option>
              ))
            )}
          </select>
        </div>

        {currentAssignment && (
          <div className="text-xs text-slate-600 font-medium">
            Ketua Tim: <span className="font-bold text-slate-900">{currentAssignment.teamLeader}</span>
          </div>
        )}
      </div>

      {/* Steps Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-48">Tujuan Pengujian</th>
                <th className="py-3 px-4">Prosedur & Metodologi Audit</th>
                <th className="py-3 px-4 w-36">Dokumen Sumber</th>
                <th className="py-3 px-4 text-center">Sampel & Metode</th>
                <th className="py-3 px-4 text-center">Ref KKA</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canManage && <th className="py-3 px-4 text-center w-20">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredSteps.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="py-8 text-center text-slate-400">
                    Belum ada langkah kerja audit yang disusun untuk penugasan ini.
                  </td>
                </tr>
              ) : (
                filteredSteps.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400 tabular-nums">
                      {s.stepNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.testObjective}</p>
                      <p className="text-[11px] text-slate-500">Risiko: {s.testRisk}</p>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-slate-700 whitespace-pre-line line-clamp-3">{s.procedure}</p>
                      <span className="text-[10px] text-slate-400">Auditor: {s.auditor}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{s.requiredDocs}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-slate-900 block">{s.testMethod}</span>
                      <span className="text-[10px] text-slate-500">{s.sampleSize}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">
                      {s.workPaperRef}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                          s.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'Sedang Berjalan'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded-md"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded-md"
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

      {/* Modal Add / Edit Step */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingStep ? 'Ubah Prosedur Program Audit' : 'Tambah Langkah Pengujian (PKA)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Langkah</label>
                  <input
                    type="number"
                    required
                    value={formStepNumber}
                    onChange={(e) => setFormStepNumber(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Referensi Kertas Kerja (KKA)</label>
                  <input
                    type="text"
                    required
                    value={formWorkPaperRef}
                    onChange={(e) => setFormWorkPaperRef(e.target.value)}
                    placeholder="Contoh: KKA-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tujuan Pengujian</label>
                <input
                  type="text"
                  required
                  value={formTestObjective}
                  onChange={(e) => setFormTestObjective(e.target.value)}
                  placeholder="Menguji keandalan kontrol internal..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Risiko yang Diuji</label>
                  <input
                    type="text"
                    value={formTestRisk}
                    onChange={(e) => setFormTestRisk(e.target.value)}
                    placeholder="Potensi kegagalan atau deviasi..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pengendalian yang Diuji</label>
                  <input
                    type="text"
                    value={formTestControl}
                    onChange={(e) => setFormTestControl(e.target.value)}
                    placeholder="SOP otorisasi, register harian..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian Prosedur Audit</label>
                <textarea
                  rows={3}
                  required
                  value={formProcedure}
                  onChange={(e) => setFormProcedure(e.target.value)}
                  placeholder="1. Lakukan wawancara...&#10;2. Telusuri bukti transaksi...&#10;3. Bandingkan dengan saldo fisik..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dokumen yang Diperlukan</label>
                  <input
                    type="text"
                    value={formRequiredDocs}
                    onChange={(e) => setFormRequiredDocs(e.target.value)}
                    placeholder="Buku kas, voucher, invoice..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode & Sampel</label>
                  <input
                    type="text"
                    value={formTestMethod}
                    onChange={(e) => setFormTestMethod(e.target.value)}
                    placeholder="Sampling representatif 30 berkas..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pelaksana Auditor</label>
                  <input
                    type="text"
                    value={formAuditor}
                    onChange={(e) => setFormAuditor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Prosedur</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Belum Dilaksanakan">Belum Dilaksanakan</option>
                    <option value="Sedang Berjalan">Sedang Berjalan</option>
                    <option value="Selesai">Selesai Dilaksanakan</option>
                  </select>
                </div>
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
                  Simpan Langkah Kerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sampling Calculator Modal */}
      {isSamplingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-300" />
                Kalkulator Sampling Audit SPI
              </h3>
              <button onClick={() => setIsSamplingModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Sampling Audit</label>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="HighRisk">Sampling Berbasis Risiko (Risk-Based Sampling)</option>
                  <option value="Nominal">Sampling Nominal Materialitas Tertinggi</option>
                  <option value="Random">Sampling Acak Sederhana (Random Sampling)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Populasi Total</label>
                  <input
                    type="number"
                    min={1}
                    value={calcPopulation}
                    onChange={(e) => setCalcPopulation(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Sampel Diuji</label>
                  <input
                    type="number"
                    min={1}
                    value={calcSample}
                    onChange={(e) => setCalcSample(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Coverage Result */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-center">
                <span className="text-[11px] font-semibold text-emerald-800">Tingkat Cakupan Pengujian (Audit Coverage)</span>
                <p className="text-2xl font-black text-emerald-950 tabular-nums">{coveragePercent}%</p>
                <p className="text-[10px] text-emerald-700">
                  {calcSample} dari total {calcPopulation} transaksi/item populasi
                </p>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Catatan Metodologi: Hasil sampling memberikan keyakinan memadai (reasonable assurance). Pertimbangkan batas materialitas dan risiko bawaan operasional.
              </p>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsSamplingModalOpen(false)}
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Tutup Kalkulator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
