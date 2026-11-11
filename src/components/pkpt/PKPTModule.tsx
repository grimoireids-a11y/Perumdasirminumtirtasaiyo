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
  CalendarCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/firebase';
import { PKPT, Unit, RiskRegister } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { AUDIT_TYPES } from '../../data/initialData';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

interface PKPTModuleProps {
  onNavigateToAssignment?: (pkptItem: PKPT) => void;
}

export const PKPTModule: React.FC<PKPTModuleProps> = ({ onNavigateToAssignment }) => {
  const { userProfile, hasRole } = useAuth();
  const currentYear = new Date().getFullYear();

  const [pkptList, setPkptList] = useState<PKPT[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [risks, setRisks] = useState<RiskRegister[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingPkpt, setEditingPkpt] = useState<PKPT | null>(null);

  // Form states
  const [formYear, setFormYear] = useState<number>(currentYear);
  const [formTitle, setFormTitle] = useState('');
  const [formUnitId, setFormUnitId] = useState('');
  const [formBusinessProcess, setFormBusinessProcess] = useState('');
  const [formAuditType, setFormAuditType] = useState('Audit Operasional');
  const [formObjective, setFormObjective] = useState('');
  const [formScope, setFormScope] = useState('');
  const [formEstimatedDays, setFormEstimatedDays] = useState<number>(10);
  const [formQuarter, setFormQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [formStatus, setFormStatus] = useState<'Rencana' | 'Berlangsung' | 'Selesai'>('Rencana');
  const [formApprovalStatus, setFormApprovalStatus] = useState<'Draft' | 'Disetujui' | 'Ditolak'>('Draft');
  const [formRiskScore, setFormRiskScore] = useState<number>(12);
  const [formPriorityScore, setFormPriorityScore] = useState<number>(85);
  const [formManualOverrideReason, setFormManualOverrideReason] = useState('');

  const isKepalaSPI = hasRole(['KEPALA_SPI', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsubPkpt = onSnapshot(collection(db, 'pkpt'), (snap) => {
      setPkptList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PKPT)));
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });

    const unsubRisks = onSnapshot(collection(db, 'risk_registers'), (snap) => {
      setRisks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RiskRegister)));
    });

    return () => {
      unsubPkpt();
      unsubUnits();
      unsubRisks();
    };
  }, []);

  const openAddModal = () => {
    setEditingPkpt(null);
    setFormYear(selectedYear || currentYear);
    setFormTitle('Audit Operasional Penurunan Tingkat Kehilangan Air (NRW)');
    setFormUnitId(units[0]?.id || '');
    setFormBusinessProcess('Transmisi, Distribusi & Pemeliharaan Jaringan');
    setFormAuditType('Audit Operasional');
    setFormObjective('Memberikan assurance atas kepatuhan SOP perbaikan pipa dan akurasi meter induk');
    setFormScope('Jaringan distribusi unit pelayanan Pasaman dan pencatatan volume produksi');
    setFormEstimatedDays(12);
    setFormQuarter('Q1');
    setFormStatus('Rencana');
    setFormApprovalStatus(isKepalaSPI ? 'Disetujui' : 'Draft');
    setFormRiskScore(16);
    setFormPriorityScore(88);
    setFormManualOverrideReason('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: PKPT) => {
    setEditingPkpt(p);
    setFormYear(p.year);
    setFormTitle(p.title);
    setFormUnitId(p.unitId);
    setFormBusinessProcess(p.businessProcess);
    setFormAuditType(p.auditType);
    setFormObjective(p.objective);
    setFormScope(p.scope);
    setFormEstimatedDays(p.estimatedDays);
    setFormQuarter(p.quarter);
    setFormStatus(p.status);
    setFormApprovalStatus(p.approvalStatus);
    setFormRiskScore(p.riskScore);
    setFormPriorityScore(p.priorityScore);
    setFormManualOverrideReason(p.manualOverrideReason || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selUnit = units.find((u) => u.id === formUnitId);
    const unitName = selUnit ? selUnit.name : 'Unit Kerja';

    const pkptData: Omit<PKPT, 'id'> = {
      year: formYear,
      title: formTitle,
      unitId: formUnitId,
      unitName,
      businessProcess: formBusinessProcess,
      auditType: formAuditType,
      objective: formObjective,
      scope: formScope,
      estimatedDays: formEstimatedDays,
      quarter: formQuarter,
      status: formStatus,
      approvalStatus: formApprovalStatus,
      riskScore: formRiskScore,
      priorityScore: formPriorityScore,
      priorityRank: formPriorityScore >= 80 ? 'Prioritas 1 (Krusial)' : formPriorityScore >= 60 ? 'Prioritas 2' : 'Prioritas 3',
      manualOverrideReason: formManualOverrideReason,
      approvedBy: formApprovalStatus === 'Disetujui' ? userProfile?.displayName || 'Kepala SPI' : undefined,
      approvedAt: formApprovalStatus === 'Disetujui' ? new Date().toISOString().slice(0, 10) : undefined,
    };

    try {
      if (editingPkpt) {
        await updateDoc(doc(db, 'pkpt', editingPkpt.id), pkptData);
      } else {
        const id = 'pkpt-' + Date.now();
        await setDoc(doc(db, 'pkpt', id), { id, ...pkptData });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving PKPT:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus item rencana audit PKPT ini?')) return;
    try {
      await deleteDoc(doc(db, 'pkpt', id));
    } catch (err) {
      console.error('Error deleting PKPT:', err);
    }
  };

  const exportToExcel = () => {
    const dataToExport = pkptList.map((p, idx) => ({
      No: idx + 1,
      Tahun: p.year,
      'Judul Pengawasan': p.title,
      'Unit Kerja': p.unitName,
      'Proses Bisnis': p.businessProcess,
      'Jenis Audit': p.auditType,
      'Skor Prioritas': p.priorityScore,
      Peringkat: p.priorityRank || '-',
      Triwulan: p.quarter,
      'Estimasi Hari Kerja': p.estimatedDays,
      'Status Pelaksanaan': p.status,
      'Status Persetujuan': p.approvalStatus,
      'Disetujui Oleh': p.approvedBy || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PKPT');
    XLSX.writeFile(wb, `PKPT_Tirta_Saiyo_${selectedYear}.xlsx`);
  };

  // Filter & sort by priorityScore descending
  const filteredPkpt = pkptList
    .filter((p) => {
      const matchesYear = selectedYear === 0 || p.year === selectedYear;
      const matchesQuarter = selectedQuarter === 'ALL' || p.quarter === selectedQuarter;
      return matchesYear && matchesQuarter;
    })
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-700" />
            Program Kerja Pengawasan Tahunan (PKPT Berbasis Risiko)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penetapan prioritas pengawasan tahunan berbasis register risiko, riwayat temuan, dan mitigasi korporat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            title="Tinjau dan cetak dokumen PKPT resmi dengan pengesahan jabatan"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cetak Dokumen PKPT</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          {isKepalaSPI && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Susun Rencana PKPT</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800"
          >
            <option value={currentYear}>Tahun {currentYear}</option>
            <option value={currentYear - 1}>Tahun {currentYear - 1}</option>
            <option value={0}>Semua Tahun</option>
          </select>

          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="ALL">Semua Triwulan (Q1 - Q4)</option>
            <option value="Q1">Triwulan I (Q1)</option>
            <option value="Q2">Triwulan II (Q2)</option>
            <option value="Q3">Triwulan III (Q3)</option>
            <option value="Q4">Triwulan IV (Q4)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Objek Pengawasan: <span className="font-bold text-slate-900 tabular-nums">{filteredPkpt.length}</span>
        </div>
      </div>

      {/* PKPT Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">Prioritas</th>
                <th className="py-3 px-4">Judul Objek Pengawasan</th>
                <th className="py-3 px-4">Unit Kerja / Auditee</th>
                <th className="py-3 px-4">Jenis Audit</th>
                <th className="py-3 px-4 text-center">Jadwal & Durasi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Pengesahan</th>
                <th className="py-3 px-4 text-center w-40">Tindak Lanjut & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredPkpt.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada program kerja audit PKPT pada tahun ini.
                  </td>
                </tr>
              ) : (
                filteredPkpt.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs font-mono">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.title}</p>
                      <p className="text-[11px] text-slate-500">Proses: {p.businessProcess}</p>
                      {p.manualOverrideReason && (
                        <p className="text-[10px] text-amber-700 italic mt-0.5">
                          * Override Kepala SPI: {p.manualOverrideReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.unitName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 rounded-md">
                        {p.auditType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-900">{p.quarter}</span>
                      <p className="text-[11px] text-slate-400 tabular-nums">{p.estimatedDays} hari kerja</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                          p.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Berlangsung'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          p.approvalStatus === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {p.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {onNavigateToAssignment && (
                          <button
                            onClick={() => onNavigateToAssignment(p)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300 transition-colors"
                            title="Terbitkan Surat Perintah Tugas (SPT) dari PKPT ini"
                          >
                            <CalendarCheck className="w-3 h-3 text-emerald-700" />
                            <span>Terbitkan SPT</span>
                          </button>
                        )}
                        {isKepalaSPI && (
                          <>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1 text-slate-500 hover:text-emerald-700 rounded-md transition-colors"
                              title="Edit PKPT"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded-md transition-colors"
                              title="Hapus PKPT"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* Modal Add / Edit PKPT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingPkpt ? 'Ubah Rencana Kerja PKPT' : 'Penyusunan Rencana Audit Tahunan (PKPT)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Kegiatan / Objek Audit</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Kerja / Auditee</label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Pemeriksaan</label>
                  <select
                    value={formAuditType}
                    onChange={(e) => setFormAuditType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {AUDIT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proses Bisnis Terkait</label>
                <input
                  type="text"
                  required
                  value={formBusinessProcess}
                  onChange={(e) => setFormBusinessProcess(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tujuan Pemeriksaan</label>
                <textarea
                  rows={2}
                  required
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ruang Lingkup Pemeriksaan</label>
                <textarea
                  rows={2}
                  required
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jadwal Triwulan</label>
                  <select
                    value={formQuarter}
                    onChange={(e) => setFormQuarter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Q1">Triwulan I</option>
                    <option value="Q2">Triwulan II</option>
                    <option value="Q3">Triwulan III</option>
                    <option value="Q4">Triwulan IV</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Hari</label>
                  <input
                    type="number"
                    value={formEstimatedDays}
                    onChange={(e) => setFormEstimatedDays(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Skor Prioritas (1-100)</label>
                  <input
                    type="number"
                    value={formPriorityScore}
                    onChange={(e) => setFormPriorityScore(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pelaksanaan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Rencana">Rencana</option>
                    <option value="Berlangsung">Sedang Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pengesahan Kepala SPI</label>
                  <select
                    value={formApprovalStatus}
                    onChange={(e) => setFormApprovalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Draft">Draft Usulan</option>
                    <option value="Disetujui">Disetujui Kepala SPI</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Penyesuaian / Override Manual (Jika Ada)</label>
                <input
                  type="text"
                  value={formManualOverrideReason}
                  onChange={(e) => setFormManualOverrideReason(e.target.value)}
                  placeholder="Instruksi khusus Direktur / perubahan regulasi mendadak..."
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
                  Simpan Rencana PKPT
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
          documentTitle="PROGRAM KERJA PENGAWASAN TAHUNAN (PKPT) BERBASIS RISIKO"
          documentSubtitle={`Tahun Anggaran ${selectedYear}`}
          documentNumber={`PKPT/SPI-PTS/${selectedYear}`}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-5 text-xs font-serif leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-3 font-sans text-xs">
                <div>
                  <p className="text-slate-500">Tahun Anggaran:</p>
                  <p className="font-bold text-slate-900">{selectedYear}</p>
                </div>
                <div>
                  <p className="text-slate-500">Jumlah Penugasan Pengawasan:</p>
                  <p className="font-bold text-emerald-800">{filteredPkpt.length} Objek Pengawasan</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Hari Kerja Pemeriksaan:</p>
                  <p className="font-bold text-slate-800">{filteredPkpt.reduce((a, b) => a + (b.estimatedDays || 0), 0)} Hari Pemeriksaan</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-xs border-b border-slate-300 pb-1">
                  Matriks Rencana Pengawasan Intern Berbasis Risiko (RBIA):
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300 font-sans">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="p-2 border border-slate-300 w-8 text-center">No</th>
                        <th className="p-2 border border-slate-300">Unit Kerja & Objek Pengawasan</th>
                        <th className="p-2 border border-slate-300 w-28">Jenis Audit</th>
                        <th className="p-2 border border-slate-300 w-16 text-center">Jadwal</th>
                        <th className="p-2 border border-slate-300 w-16 text-center">Durasi</th>
                        <th className="p-2 border border-slate-300 w-20 text-center">Skor Prioritas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredPkpt.map((p, idx) => (
                        <tr key={p.id}>
                          <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-300">
                            <p className="font-bold text-slate-900">{p.title}</p>
                            <p className="text-[10px] text-slate-600">Unit: {p.unitName} · Proses: {p.businessProcess}</p>
                          </td>
                          <td className="p-2 border border-slate-300">{p.auditType}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-emerald-800">{p.quarter}</td>
                          <td className="p-2 border border-slate-300 text-center">{p.estimatedDays} Hari</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-800">
                            {p.priorityScore}
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
