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
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  FileText,
  Search,
  MessageSquare,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { WorkPaper, AuditAssignment, KKAStatus } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

import { AlertTriangle } from 'lucide-react';

interface WorkPaperModuleProps {
  onOpenAiAssistantWithContext?: (context: any) => void;
  onNavigateToFindings?: (prefill: {
    assignmentId?: string;
    title?: string;
    condition?: string;
    criteria?: string;
    auditorAnalysis?: string;
  }) => void;
  initialAssignmentId?: string;
}

export const WorkPaperModule: React.FC<WorkPaperModuleProps> = ({
  onOpenAiAssistantWithContext,
  onNavigateToFindings,
  initialAssignmentId,
}) => {
  const { userProfile, hasRole } = useAuth();
  const [workPapers, setWorkPapers] = useState<WorkPaper[]>([]);
  const [assignments, setAssignments] = useState<AuditAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(initialAssignmentId || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingKka, setEditingKka] = useState<WorkPaper | null>(null);
  const [reviewingKka, setReviewingKka] = useState<WorkPaper | null>(null);
  const [activeKkaForPrint, setActiveKkaForPrint] = useState<WorkPaper | null>(null);

  // Form states
  const [formAssignmentId, setFormAssignmentId] = useState('');
  const [formKkaNumber, setFormKkaNumber] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formAuditBasis, setFormAuditBasis] = useState('');
  const [formProcedure, setFormProcedure] = useState('');
  const [formTestedData, setFormTestedData] = useState('');
  const [formSampleSize, setFormSampleSize] = useState('');
  const [formTestResult, setFormTestResult] = useState('');
  const [formEvidenceRef, setFormEvidenceRef] = useState('');
  const [formAnalysis, setFormAnalysis] = useState('');
  const [formConclusion, setFormConclusion] = useState('');
  const [formCrossRefs, setFormCrossRefs] = useState('');
  const [formStatus, setFormStatus] = useState<KKAStatus>('Draft');

  // Review states
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [approvalAction, setApprovalAction] = useState<KKAStatus>('Approved');

  const isKepalaSPI = hasRole(['KEPALA_SPI', 'ADMIN_SISTEM']);
  const isAuditor = hasRole(['AUDITOR', 'KEPALA_SPI', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsubAssignments = onSnapshot(collection(db, 'audit_assignments'), (snap) => {
      setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditAssignment)));
    });

    const unsubKka = onSnapshot(collection(db, 'work_papers'), (snap) => {
      setWorkPapers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkPaper)));
    });

    return () => {
      unsubAssignments();
      unsubKka();
    };
  }, []);

  const openAddModal = () => {
    setEditingKka(null);
    const count = workPapers.length + 1;
    setFormAssignmentId(assignments[0]?.id || '');
    setFormKkaNumber(`KKA-${String(count).padStart(3, '0')}`);
    setFormTitle('Pengujian Fisik Saldo Kas Kecil dan Rekonsiliasi Bank');
    setFormObjective('Memastikan fisik kas sesuai saldo buku dan tidak terjadi keterlambatan penyetoran penerimaan rekening air.');
    setFormAuditBasis('SOP Pengelolaan Kas dan Perdir Keuangan Perumda Tirta Saiyo');
    setFormProcedure('1. Melakukan kas opname fisik mendadak pada brankas kasir.\n2. Menghitung uang kertas dan koin disaksikan bendahara.\n3. Membandingkan dengan saldo buku kas umum.');
    setFormTestedData('Buku Kas Umum periode berjalan dan bukti transaksi kas 30 hari terakhir.');
    setFormSampleSize('100% populasi saldo brankas per tanggal pemeriksaan.');
    setFormTestResult('Ditemukan selisih fisik kas sebesar Rp 1.450.000 lebih kecil dari catatan pembukuan.');
    setFormEvidenceRef('BA-KAS-01, Lembar Berita Acara Kas Opname bertandatangan kasir');
    setFormAnalysis('Terdapat uang penerimaan tagihan pelanggan yang belum disetor ke rekening bank dan tersimpan di luar brankas resmi.');
    setFormConclusion('Pengendalian internal kas masih memiliki kelemahan pemisahan fungsi dan penatausahaan.');
    setFormCrossRefs('PKA-01 / Ref Temuan No. 01');
    setFormStatus('Draft');
    setIsModalOpen(true);
  };

  const openEditModal = (k: WorkPaper) => {
    if (k.isLocked && !isKepalaSPI) {
      alert('Kertas Kerja Audit (KKA) ini telah disetujui dan terkunci. Hanya Kepala SPI yang berwenang membuka kunci revisi.');
      return;
    }
    setEditingKka(k);
    setFormAssignmentId(k.assignmentId);
    setFormKkaNumber(k.kkaNumber);
    setFormTitle(k.title);
    setFormObjective(k.objective);
    setFormAuditBasis(k.auditBasis);
    setFormProcedure(k.procedure);
    setFormTestedData(k.testedData);
    setFormSampleSize(k.sampleSize);
    setFormTestResult(k.testResult);
    setFormEvidenceRef(k.evidenceRef);
    setFormAnalysis(k.analysis);
    setFormConclusion(k.conclusion);
    setFormCrossRefs(k.crossRefs);
    setFormStatus(k.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selAssign = assignments.find((a) => a.id === formAssignmentId);
    const assignmentTitle = selAssign ? selAssign.objectName : 'Penugasan Audit';

    const data: Omit<WorkPaper, 'id'> = {
      assignmentId: formAssignmentId,
      assignmentTitle,
      kkaNumber: formKkaNumber,
      title: formTitle,
      objective: formObjective,
      auditBasis: formAuditBasis,
      procedure: formProcedure,
      testedData: formTestedData,
      sampleSize: formSampleSize,
      testResult: formTestResult,
      evidenceRef: formEvidenceRef,
      analysis: formAnalysis,
      conclusion: formConclusion,
      crossRefs: formCrossRefs,
      preparer: editingKka?.preparer || userProfile?.displayName || 'Auditor SPI',
      status: formStatus,
      isLocked: formStatus === 'Approved',
      createdAt: editingKka?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingKka) {
        await updateDoc(doc(db, 'work_papers', editingKka.id), data);
      } else {
        const id = 'kka-' + Date.now();
        await setDoc(doc(db, 'work_papers', id), { id, ...data });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving KKA:', err);
    }
  };

  const openReviewModal = (k: WorkPaper) => {
    setReviewingKka(k);
    setReviewerNotes(k.reviewerNotes || '');
    setApprovalAction(k.status === 'Approved' ? 'Approved' : 'Reviewed');
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingKka) return;

    try {
      await updateDoc(doc(db, 'work_papers', reviewingKka.id), {
        status: approvalAction,
        isLocked: approvalAction === 'Approved',
        reviewer: userProfile?.displayName || 'Kepala SPI',
        reviewerNotes,
        updatedAt: new Date().toISOString(),
      });
      setIsReviewModalOpen(false);
    } catch (err) {
      console.error('Error reviewing KKA:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const k = workPapers.find((item) => item.id === id);
    if (k?.isLocked && !isKepalaSPI) {
      alert('KKA terkunci tidak dapat dihapus.');
      return;
    }
    if (!window.confirm('Hapus Kertas Kerja Audit (KKA) ini?')) return;
    try {
      await deleteDoc(doc(db, 'work_papers', id));
    } catch (err) {
      console.error('Error deleting KKA:', err);
    }
  };

  const filteredKka = workPapers.filter((k) => {
    const matchesAssign = selectedAssignmentId === 'ALL' || k.assignmentId === selectedAssignmentId;
    const matchesSearch =
      k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.kkaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.analysis.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAssign && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            Kertas Kerja Audit (KKA) & Pengujian Substantif
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi berjenjang bukti audit, pengujian transaksi, analisis auditor, dan pengesahan berjenjang Kepala SPI
          </p>
        </div>

        {isAuditor && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat KKA Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Assignment Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor KKA, judul, atau kesimpulan..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium max-w-xs truncate"
          >
            <option value="ALL">Semua Penugasan Audit</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.letterNumber} ({a.unitName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KKA Cards List */}
      <div className="space-y-3">
        {filteredKka.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            Belum ada Kertas Kerja Audit (KKA) yang dicatat. Klik tombol "Buat KKA Baru" untuk menginput hasil pengujian.
          </div>
        ) : (
          filteredKka.map((k) => (
            <div
              key={k.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                    {k.kkaNumber}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{k.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      k.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : k.status === 'Reviewed'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : k.status === 'Submitted'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {k.isLocked ? <Lock className="w-3 h-3 text-emerald-700" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                    <span>{k.status}</span>
                  </span>

                  {isKepalaSPI && (
                    <button
                      onClick={() => openReviewModal(k)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                    >
                      Reviu & Pengesahan
                    </button>
                  )}
                </div>
              </div>

              {/* Grid 2 Column Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                <div className="space-y-1.5">
                  <p>
                    <span className="font-semibold text-slate-900">Dasar Pengujian:</span> {k.auditBasis}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Data & Sampel:</span> {k.testedData} ({k.sampleSize})
                  </p>
                  <p className="whitespace-pre-line">
                    <span className="font-semibold text-slate-900">Hasil Pengujian:</span> {k.testResult}
                  </p>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <p>
                    <span className="font-semibold text-slate-900">Analisis Auditor:</span> {k.analysis}
                  </p>
                  <p className="font-bold text-slate-900">
                    <span className="text-emerald-800">Kesimpulan:</span> {k.conclusion}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Bukti Pendukung: <span className="font-mono text-emerald-900 font-semibold">{k.evidenceRef}</span>
                  </p>
                </div>
              </div>

              {/* Reviewer notes if any */}
              {k.reviewerNotes && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                  <div>
                    <span className="font-bold">Catatan Review Kepala SPI:</span> {k.reviewerNotes}
                  </div>
                </div>
              )}

              {/* Footer Meta & AI Action */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Penyusun: <strong className="text-slate-700">{k.preparer}</strong></span>
                  {k.reviewer && <span>Direviu: <strong className="text-slate-700">{k.reviewer}</strong></span>}
                  <span>Ref Silang: <strong className="text-slate-700 font-mono">{k.crossRefs || '-'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenAiAssistantWithContext && (
                    <button
                      onClick={() =>
                        onOpenAiAssistantWithContext({
                          action: 'formulate_5c',
                          title: k.title,
                          unitName: k.assignmentTitle,
                          facts: k.testResult + '\n' + k.analysis,
                          procedure: k.procedure,
                        })
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300"
                      title="Rumuskan temuan 5C dari hasil KKA ini menggunakan AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Rumuskan 5C via AI</span>
                    </button>
                  )}

                  {onNavigateToFindings && (
                    <button
                      onClick={() =>
                        onNavigateToFindings({
                          assignmentId: k.assignmentId,
                          title: k.title,
                          condition: k.testResult || k.analysis,
                          criteria: k.auditBasis || 'Standar Operasional Prosedur (SOP) & Perdir Tirta Saiyo',
                          auditorAnalysis: k.conclusion || k.analysis,
                        })
                      }
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-300 transition-colors"
                      title="Angkat hasil KKA ini menjadi draft Temuan 5C Resmi"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Angkat Jadi Temuan</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveKkaForPrint(k);
                      setIsPrintModalOpen(true);
                    }}
                    className="p-1 text-slate-500 hover:text-emerald-700 rounded-md"
                    title="Tinjau & Cetak KKA"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => openEditModal(k)}
                    className="p-1 text-slate-500 hover:text-emerald-700 rounded-md"
                    title="Edit KKA"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {isKepalaSPI && (
                    <button
                      onClick={() => handleDelete(k.id)}
                      className="p-1 text-slate-500 hover:text-rose-600 rounded-md"
                      title="Hapus KKA"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit KKA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingKka ? 'Ubah Kertas Kerja Audit' : 'Pengisian Lembar Kertas Kerja Audit (KKA)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor KKA</label>
                  <input
                    type="text"
                    required
                    value={formKkaNumber}
                    onChange={(e) => setFormKkaNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Penugasan Audit Terkait</label>
                  <select
                    value={formAssignmentId}
                    onChange={(e) => setFormAssignmentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {assignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.letterNumber} - {a.objectName} ({a.unitName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Pemeriksaan / Fokus Pengujian</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tujuan Pemeriksaan</label>
                  <textarea
                    rows={2}
                    value={formObjective}
                    onChange={(e) => setFormObjective(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dasar Pemeriksaan / Kriteria</label>
                  <textarea
                    rows={2}
                    value={formAuditBasis}
                    onChange={(e) => setFormAuditBasis(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Langkah / Prosedur Pemeriksaan Yang Dijalankan</label>
                <textarea
                  rows={2}
                  value={formProcedure}
                  onChange={(e) => setFormProcedure(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data / Populasi Yang Diuji</label>
                  <input
                    type="text"
                    value={formTestedData}
                    onChange={(e) => setFormTestedData(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Sampel</label>
                  <input
                    type="text"
                    value={formSampleSize}
                    onChange={(e) => setFormSampleSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fakta / Hasil Pengujian (Test Result)</label>
                <textarea
                  rows={2}
                  required
                  value={formTestResult}
                  onChange={(e) => setFormTestResult(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Analisis Auditor</label>
                  <textarea
                    rows={2}
                    value={formAnalysis}
                    onChange={(e) => setFormAnalysis(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kesimpulan Pemeriksaan</label>
                  <textarea
                    rows={2}
                    value={formConclusion}
                    onChange={(e) => setFormConclusion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Referensi Bukti Fisik</label>
                  <input
                    type="text"
                    value={formEvidenceRef}
                    onChange={(e) => setFormEvidenceRef(e.target.value)}
                    placeholder="BA-01, Invoice #402..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Referensi Silang (Cross-Ref)</label>
                  <input
                    type="text"
                    value={formCrossRefs}
                    onChange={(e) => setFormCrossRefs(e.target.value)}
                    placeholder="PKA-01 / Temuan No. 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status KKA</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Diajukan ke Kepala SPI</option>
                    {isKepalaSPI && <option value="Reviewed">Sudah Direviu</option>}
                    {isKepalaSPI && <option value="Approved">Disetujui & Dikunci</option>}
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
                  Simpan KKA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Review Kepala SPI */}
      {isReviewModalOpen && reviewingKka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Review & Pengesahan KKA oleh Kepala SPI
              </h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveReview} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p className="font-bold text-slate-900">{reviewingKka.title}</p>
                <p className="text-slate-600">Nomor: {reviewingKka.kkaNumber} · Penyusun: {reviewingKka.preparer}</p>
                <p className="text-[11px] text-slate-500 italic">Kesimpulan: {reviewingKka.conclusion}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keputusan Status Pengesahan</label>
                <select
                  value={approvalAction}
                  onChange={(e) => setApprovalAction(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                >
                  <option value="Approved">Disetujui Penuh & Kunci KKA (Locked)</option>
                  <option value="Reviewed">Sudah Direviu (Perlu Koreksi Tambahan)</option>
                  <option value="Draft">Kembalikan ke Auditor Sebagai Draft</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Koreksi / Arahan Kepala SPI</label>
                <textarea
                  rows={3}
                  required
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Catatan telaah metodologi, kedalaman pengujian, atau konfirmasi bukti..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan Pengesahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Modal with Fitur Jabatan */}
      {isPrintModalOpen && activeKkaForPrint && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="KERTAS KERJA AUDIT (KKA) PENGAWASAN INTERN"
          documentSubtitle={`Penugasan: ${activeKkaForPrint.assignmentTitle || 'Pemeriksaan BUMD Tirta Saiyo'}`}
          documentNumber={activeKkaForPrint.kkaNumber}
          initialSignatory1Role="Ketua Tim Pemeriksa / Auditor Muda SPI"
          initialSignatory2Role="Kepala Satuan Pengawasan Intern"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-4 text-xs font-serif leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 font-sans text-xs">
                <div>
                  <p><span className="text-slate-500">Judul Pengujian:</span> <strong>{activeKkaForPrint.title}</strong></p>
                  <p><span className="text-slate-500">Ref Silang:</span> <strong>{activeKkaForPrint.crossRefs || '-'}</strong></p>
                </div>
                <div>
                  <p><span className="text-slate-500">Status KKA:</span> <strong>{activeKkaForPrint.status}</strong></p>
                  <p><span className="text-slate-500">Bukti Fisik:</span> <strong>{activeKkaForPrint.evidenceRef || '-'}</strong></p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    1. Tujuan Pemeriksaan / Pengujian:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-emerald-600">{activeKkaForPrint.objective}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    2. Dasar / Kriteria Pengujian:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-emerald-600">{activeKkaForPrint.auditBasis}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    3. Prosedur Audit yang Dilakukan:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-emerald-600 whitespace-pre-line">{activeKkaForPrint.procedure}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    4. Data yang Diuji & Ukuran Sampel:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-emerald-600">
                    Data: {activeKkaForPrint.testedData} (Sampel: {activeKkaForPrint.sampleSize})
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    5. Hasil Pengujian Substantif:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-emerald-600 whitespace-pre-line">{activeKkaForPrint.testResult}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    6. Analisis Auditor:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-emerald-600 whitespace-pre-line">{activeKkaForPrint.analysis}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    7. Kesimpulan Pemeriksa:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-emerald-600 font-bold text-slate-900">{activeKkaForPrint.conclusion}</p>
                </div>

                {activeKkaForPrint.reviewerNotes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <h5 className="font-bold text-amber-900 font-sans text-[11px]">Catatan Telaah / Reviu Kepala SPI:</h5>
                    <p className="text-amber-800 mt-0.5">{activeKkaForPrint.reviewerNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DocumentPrintPreviewModal>
      )}
    </div>
  );
};
