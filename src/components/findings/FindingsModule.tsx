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
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Download,
  Search,
  Sparkles,
  DollarSign,
  Flame,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Printer,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/firebase';
import { Finding, Unit, AuditAssignment, FindingRiskLevel, FindingStatus, Recommendation } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

interface FindingsModuleProps {
  onOpenAiAssistantWithContext?: (context: any) => void;
  onNavigateToLha?: (assignmentId: string) => void;
  onNavigateToFollowUp?: (findingId: string) => void;
  initialPrefillFromKka?: any;
  initialAssignmentId?: string;
}

export const FindingsModule: React.FC<FindingsModuleProps> = ({
  onOpenAiAssistantWithContext,
  onNavigateToLha,
  onNavigateToFollowUp,
  initialPrefillFromKka,
  initialAssignmentId,
}) => {
  const { userProfile, hasRole } = useAuth();
  const currentYear = new Date().getFullYear();

  const [findings, setFindings] = useState<Finding[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [assignments, setAssignments] = useState<AuditAssignment[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);
  const [isPrintDetailOpen, setIsPrintDetailOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [targetFindingForRec, setTargetFindingForRec] = useState<Finding | null>(null);
  const [activeFindingForPrint, setActiveFindingForPrint] = useState<Finding | null>(null);
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  // Form Finding states
  const [formFindingNumber, setFormFindingNumber] = useState('');
  const [formYear, setFormYear] = useState<number>(currentYear);
  const [formAssignmentId, setFormAssignmentId] = useState('');
  const [formUnitId, setFormUnitId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Operasional & Efisiensi');
  const [formRiskLevel, setFormRiskLevel] = useState<FindingRiskLevel>('Tinggi');
  const [formCondition, setFormCondition] = useState('');
  const [formCriteria, setFormCriteria] = useState('');
  const [formCause, setFormCause] = useState('');
  const [formConsequence, setFormConsequence] = useState('');
  const [formPotentialLoss, setFormPotentialLoss] = useState<number>(0);
  const [formAuditorAnalysis, setFormAuditorAnalysis] = useState('');
  const [formAuditeeResponse, setFormAuditeeResponse] = useState('');
  const [formStatus, setFormStatus] = useState<FindingStatus>('Disetujui');

  // Form Recommendation states
  const [formRecNumber, setFormRecNumber] = useState('');
  const [formRecDescription, setFormRecDescription] = useState('');
  const [formRecPic, setFormRecPic] = useState('');
  const [formRecTargetDate, setFormRecTargetDate] = useState('');
  const [formRecSuccessIndicator, setFormRecSuccessIndicator] = useState('');

  const canManage = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsubFindings = onSnapshot(collection(db, 'findings'), (snap) => {
      setFindings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Finding)));
    });

    const unsubRecs = onSnapshot(collection(db, 'recommendations'), (snap) => {
      setRecommendations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recommendation)));
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });

    const unsubAssignments = onSnapshot(collection(db, 'audit_assignments'), (snap) => {
      setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditAssignment)));
    });

    return () => {
      unsubFindings();
      unsubRecs();
      unsubUnits();
      unsubAssignments();
    };
  }, []);

  // Handle prefill when an auditor raises a finding from KKA
  useEffect(() => {
    if (initialPrefillFromKka) {
      setEditingFinding(null);
      const count = findings.length + 1;
      setFormFindingNumber(`TMN-${currentYear}-${String(count).padStart(3, '0')}`);
      setFormYear(currentYear);
      setFormAssignmentId(initialPrefillFromKka.assignmentId || (assignments[0]?.id || ''));
      setFormUnitId(initialPrefillFromKka.unitId || (units[0]?.id || ''));
      setFormTitle(initialPrefillFromKka.title || 'Temuan Kelemahan Hasil Pengujian KKA');
      setFormCondition(initialPrefillFromKka.condition || '');
      setFormCriteria(initialPrefillFromKka.criteria || 'Ketentuan Standar Operasional Prosedur (SOP) Perumda Tirta Saiyo');
      setFormCause(initialPrefillFromKka.cause || 'Pengendalian intern dan pemantauan prosedur belum berjalan konsisten.');
      setFormConsequence(initialPrefillFromKka.consequence || 'Risiko ketidaksesuaian administrasi atau inefisiensi operasional.');
      setFormPotentialLoss(initialPrefillFromKka.potentialLoss || 0);
      setFormAuditorAnalysis(initialPrefillFromKka.auditorAnalysis || '');
      setFormAuditeeResponse('');
      setFormStatus('Draft');
      setIsModalOpen(true);
    }
  }, [initialPrefillFromKka, currentYear, findings.length, assignments, units]);

  const openAddModal = () => {
    setEditingFinding(null);
    const count = findings.length + 1;
    setFormFindingNumber(`TMN-${currentYear}-${String(count).padStart(3, '0')}`);
    setFormYear(currentYear);
    setFormAssignmentId(assignments[0]?.id || '');
    setFormUnitId(units[0]?.id || '');
    setFormTitle('Tingkat Kehilangan Air Fisik pada Jaringan Distribusi Melebihi Batas Toleransi Standar');
    setFormCategory('Operasional & Efisiensi');
    setFormRiskLevel('Tinggi');
    setFormCondition('Tingkat kehilangan air fisik (NRW) pada triwulan berjalan mencapai 38,4%, melampaui batas toleransi yang ditetapkan maksimal 20%. Ditemukan kebocoran pipa transmisi yang tidak tertangani lebih dari 48 jam.');
    setFormCriteria('Permendagri No. 23/2024 tentang BUMD Air Minum dan Standar Pelayanan Minimal (SPM) Perumda Tirta Saiyo pasal 14 mengenai kecepatan tanggap kebocoran pipa maksimal 12 jam.');
    setFormCause('Kurangnya ketersediaan fitting pipa sambungan darurat pada gudang unit pelayanan dan pemantauan tekanan pipa berkala yang belum optimal.');
    setFormConsequence('Kehilangan potensi pendapatan air bersih sebesar Rp 84.500.000,- per bulan dan terganggunya suplai air minum ke 350 pelanggan.');
    setFormPotentialLoss(84500000);
    setFormAuditorAnalysis('Kelemahan sistemik terletak pada koordinasi logistik tanggap darurat dan jadwal inspeksi jaringan distribusi TRC.');
    setFormAuditeeResponse('Unit pelayanan berkomitmen melengkapi cadangan fitting pipa darurat dan meningkatkan patroli malam.');
    setFormStatus('Disetujui');
    setIsModalOpen(true);
  };

  const openEditModal = (f: Finding) => {
    setEditingFinding(f);
    setFormFindingNumber(f.findingNumber);
    setFormYear(f.year);
    setFormAssignmentId(f.assignmentId);
    setFormUnitId(f.unitId);
    setFormTitle(f.title);
    setFormCategory(f.category);
    setFormRiskLevel(f.riskLevel);
    setFormCondition(f.condition);
    setFormCriteria(f.criteria);
    setFormCause(f.cause);
    setFormConsequence(f.consequence);
    setFormPotentialLoss(f.potentialLoss || 0);
    setFormAuditorAnalysis(f.auditorAnalysis);
    setFormAuditeeResponse(f.auditeeResponse || '');
    setFormStatus(f.status);
    setIsModalOpen(true);
  };

  const handleSaveFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    const selUnit = units.find((u) => u.id === formUnitId);
    const unitName = selUnit ? selUnit.name : 'Unit Pelayanan Pasaman';
    const selAssign = assignments.find((a) => a.id === formAssignmentId);
    const assignmentTitle = selAssign ? selAssign.objectName : 'Audit Operasional';

    const findingData: Omit<Finding, 'id'> = {
      findingNumber: formFindingNumber,
      year: formYear,
      assignmentId: formAssignmentId,
      assignmentTitle,
      unitId: formUnitId,
      unitName,
      title: formTitle,
      category: formCategory,
      riskLevel: formRiskLevel,
      condition: formCondition,
      criteria: formCriteria,
      cause: formCause,
      consequence: formConsequence,
      potentialLoss: formPotentialLoss,
      auditorAnalysis: formAuditorAnalysis,
      auditeeResponse: formAuditeeResponse,
      status: formStatus,
      createdAt: editingFinding?.createdAt || new Date().toISOString(),
    };

    try {
      if (editingFinding) {
        await updateDoc(doc(db, 'findings', editingFinding.id), findingData);
      } else {
        const id = 'find-' + Date.now();
        await setDoc(doc(db, 'findings', id), { id, ...findingData });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving finding:', err);
    }
  };

  const handleDeleteFinding = async (id: string) => {
    if (!window.confirm('Hapus temuan audit 5C ini? Seluruh rekomendasi terkait juga akan dihapus.')) return;
    try {
      await deleteDoc(doc(db, 'findings', id));
    } catch (err) {
      console.error('Error deleting finding:', err);
    }
  };

  const openAddRecModal = (f: Finding) => {
    setTargetFindingForRec(f);
    const count = recommendations.filter((r) => r.findingId === f.id).length + 1;
    setFormRecNumber(`REC-${f.findingNumber.replace('TMN-', '')}.${count}`);
    setFormRecDescription('Memerintahkan Kepala Bagian Teknik dan Kepala Unit Pelayanan untuk menyusun SOP penanganan kebocoran maksimal 6 jam serta menyediakan stok cadangan material perbaikan.');
    setFormRecPic(f.unitName);
    setFormRecTargetDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setFormRecSuccessIndicator('Penurunan angka NRW menjadi maksimal 22% dan tersedianya buffer stock material pipa.');
    setIsRecModalOpen(true);
  };

  const handleSaveRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFindingForRec) return;

    const id = 'rec-' + Date.now();
    const recData: Recommendation = {
      id,
      findingId: targetFindingForRec.id,
      findingNumber: targetFindingForRec.findingNumber,
      findingTitle: targetFindingForRec.title,
      unitId: targetFindingForRec.unitId,
      unitName: targetFindingForRec.unitName,
      recNumber: formRecNumber,
      description: formRecDescription,
      pic: formRecPic,
      targetDate: formRecTargetDate,
      successIndicator: formRecSuccessIndicator,
      status: 'Belum Ditindaklanjuti',
    };

    try {
      await setDoc(doc(db, 'recommendations', id), recData);
      setIsRecModalOpen(false);
    } catch (err) {
      console.error('Error adding recommendation:', err);
    }
  };

  const exportToExcel = () => {
    const dataToExport = findings.map((f, idx) => ({
      No: idx + 1,
      'Nomor Temuan': f.findingNumber,
      Tahun: f.year,
      'Unit Kerja': f.unitName,
      'Judul Temuan': f.title,
      Kategori: f.category,
      'Tingkat Risiko': f.riskLevel,
      Kondisi: f.condition,
      Kriteria: f.criteria,
      Sebab: f.cause,
      Akibat: f.consequence,
      'Potensi Kerugian (Rp)': f.potentialLoss || 0,
      'Analisis Auditor': f.auditorAnalysis,
      'Tanggapan Auditee': f.auditeeResponse || '-',
      Status: f.status,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Temuan 5C');
    XLSX.writeFile(wb, `Temuan_Audit_SPI_Tirta_Saiyo_${selectedYear}.xlsx`);
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.findingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.unitName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 0 || f.year === selectedYear;
    const matchesLevel = selectedLevel === 'ALL' || f.riskLevel === selectedLevel;
    return matchesSearch && matchesYear && matchesLevel;
  });

  const totalPotensi = findings.reduce((acc, curr) => acc + (curr.potentialLoss || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-emerald-700" />
            Matriks Temuan Audit 5C & Rekomendasi SPI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pendekatan 5C: Condition (Kondisi), Criteria (Kriteria), Cause (Sebab), Consequence (Akibat), Corrective Action (Rekomendasi)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrintSummaryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            title="Tinjau dan cetak laporan matriks temuan audit lengkap dengan pengesahan jabatan"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cetak Matriks LHA</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Temuan 5C Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Bar: Total Loss & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari temuan, unit, atau klausul..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={0}>Semua Tahun</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="ALL">Semua Tingkat Risiko</option>
            <option value="Kritis">Kritis</option>
            <option value="Tinggi">Tinggi</option>
            <option value="Sedang">Sedang</option>
            <option value="Rendah">Rendah</option>
          </select>

          <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-rose-600" />
            <span>Potensi Kerugian: Rp {totalPotensi.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            Belum ada temuan audit 5C yang tercatat. Klik tombol "Input Temuan 5C Baru".
          </div>
        ) : (
          filteredFindings.map((f) => {
            const findingRecs = recommendations.filter((r) => r.findingId === f.id);
            const isExpanded = expandedFindingId === f.id;

            return (
              <div
                key={f.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 transition-all overflow-hidden"
              >
                {/* Header Card */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        {f.findingNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          f.riskLevel === 'Kritis'
                            ? 'bg-rose-600 text-white'
                            : f.riskLevel === 'Tinggi'
                            ? 'bg-amber-500 text-white'
                            : f.riskLevel === 'Sedang'
                            ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        Risiko {f.riskLevel}
                      </span>
                      <span className="text-xs text-slate-400">· {f.category}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{f.title}</h3>

                    <p className="text-xs text-slate-600">
                      Unit: <span className="font-semibold text-slate-800">{f.unitName}</span>
                      {f.potentialLoss > 0 && (
                        <span className="ml-3 font-bold text-rose-700 font-mono">
                          Potensi Kerugian: Rp {f.potentialLoss.toLocaleString('id-ID')}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenAiAssistantWithContext && (
                      <button
                        onClick={() =>
                          onOpenAiAssistantWithContext({
                            action: 'formulate_5c',
                            title: f.title,
                            unitName: f.unitName,
                            facts: f.condition,
                            procedure: f.criteria,
                          })
                        }
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300 transition-colors"
                        title="Perbaiki klausul 5C dengan AI"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Sempurnakan 5C AI</span>
                      </button>
                    )}

                    {onNavigateToLha && f.assignmentId && (
                      <button
                        onClick={() => onNavigateToLha(f.assignmentId)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300 transition-colors"
                        title="Tautkan / Buka Laporan Hasil Audit (LHA) untuk penugasan temuan ini"
                      >
                        <FileCheck2 className="w-3 h-3 text-emerald-700" />
                        <span>Buka LHA</span>
                      </button>
                    )}

                    {onNavigateToFollowUp && (
                      <button
                        onClick={() => onNavigateToFollowUp(f.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                        title="Pantau Tindak Lanjut Rekomendasi (TLR)"
                      >
                        <Clock className="w-3 h-3 text-blue-700" />
                        <span>Pantau TLR</span>
                      </button>
                    )}

                    {canManage && (
                      <button
                        onClick={() => openAddRecModal(f)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-2xs transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Rekomendasi</span>
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedFindingId(isExpanded ? null : f.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 5C Structured Grid */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/50">
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-emerald-900 block mb-1">1. Condition (Kondisi / Fakta):</span>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">{f.condition}</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-blue-900 block mb-1">2. Criteria (Kriteria / SOP / Aturan):</span>
                      <p className="text-slate-700 leading-relaxed">{f.criteria}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-amber-900 block mb-1">3. Cause (Sebab / Root Cause):</span>
                      <p className="text-slate-700 leading-relaxed">{f.cause}</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-rose-900 block mb-1">4. Consequence (Akibat / Dampak Kerugian):</span>
                      <p className="text-slate-700 leading-relaxed">{f.consequence}</p>
                    </div>
                  </div>
                </div>

                {/* Auditee Response & Recommendations Section */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-200 bg-white space-y-4">
                    {/* Auditee Response */}
                    <div className="p-3 bg-slate-100 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-slate-900">Tanggapan Resmi Auditee (Unit Kerja):</span>
                      <p className="text-slate-700 italic">{f.auditeeResponse || 'Belum ada tanggapan resmi dari unit.'}</p>
                    </div>

                    {/* Recommendations Linked to this Finding */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Rekomendasi Perbaikan SPI ({findingRecs.length} Butir)</span>
                      </h4>

                      {findingRecs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Belum ada butir rekomendasi yang ditambahkan.</p>
                      ) : (
                        <div className="space-y-2">
                          {findingRecs.map((r) => (
                            <div
                              key={r.id}
                              className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-emerald-900">{r.recNumber}</span>
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-emerald-300 text-emerald-800 rounded-md">
                                  {r.status}
                                </span>
                              </div>
                              <p className="text-slate-800 font-medium">{r.description}</p>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                <span>PIC: {r.pic}</span>
                                <span>Target: {r.targetDate}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setActiveFindingForPrint(f);
                          setIsPrintDetailOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md"
                        title="Tinjau & cetak dokumen lembar temuan 5C ini"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Cetak Lembar 5C</span>
                      </button>

                      {canManage && (
                        <>
                          <button
                            onClick={() => openEditModal(f)}
                            className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                          >
                            Ubah Temuan
                          </button>
                          <button
                            onClick={() => handleDeleteFinding(f.id)}
                            className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md"
                          >
                            Hapus Temuan
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Finding */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingFinding ? 'Ubah Temuan Audit 5C' : 'Input Temuan Audit Baru Berdasarkan Kerangka 5C'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveFinding} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Temuan</label>
                  <input
                    type="text"
                    required
                    value={formFindingNumber}
                    onChange={(e) => setFormFindingNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat Risiko</label>
                  <select
                    value={formRiskLevel}
                    onChange={(e) => setFormRiskLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Kritis">Kritis</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Potensi Kerugian (Rp)</label>
                  <input
                    type="number"
                    value={formPotentialLoss}
                    onChange={(e) => setFormPotentialLoss(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Pokok Temuan</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Rumusan ringkas temuan audit..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Kerja Yang Diperiksa</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Temuan</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Operasional & Efisiensi">Operasional & Efisiensi</option>
                    <option value="Keuangan & Pembukuan">Keuangan & Pembukuan</option>
                    <option value="Kepatuhan Regulasi">Kepatuhan Regulasi</option>
                    <option value="Pelayanan & Pelanggan">Pelayanan & Pelanggan</option>
                    <option value="Pengadaan Barang & Gudang">Pengadaan Barang & Gudang</option>
                    <option value="Aset & Distribusi Air">Aset & Distribusi Air</option>
                    <option value="Pengendalian Internal">Kelemahan Pengendalian Internal</option>
                    <option value="Indikasi Fraud">Indikasi Fraud / Penyimpangan</option>
                  </select>
                </div>
              </div>

              {/* 5C Fields */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 block">Formulasi Lengkap 5C:</span>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900 mb-1">1. Condition (Kondisi Nyata)</label>
                  <textarea
                    rows={2}
                    required
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                    placeholder="Uraian fakta nyata yang ditemukan saat audit..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-blue-900 mb-1">2. Criteria (Kriteria / SOP / Aturan)</label>
                  <textarea
                    rows={2}
                    required
                    value={formCriteria}
                    onChange={(e) => setFormCriteria(e.target.value)}
                    placeholder="Standar baku, perdir, atau regulasi yang seharusnya ditaati..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">3. Cause (Sebab / Root Cause)</label>
                  <textarea
                    rows={2}
                    required
                    value={formCause}
                    onChange={(e) => setFormCause(e.target.value)}
                    placeholder="Akar masalah timbulnya ketidaksesuaian..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-900 mb-1">4. Consequence (Akibat / Dampak Kerugian)</label>
                  <textarea
                    rows={2}
                    required
                    value={formConsequence}
                    onChange={(e) => setFormConsequence(e.target.value)}
                    placeholder="Akibat terhadap pelayanan, reputasi, atau potensi kerugian kas..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggapan Unit / Auditee</label>
                <textarea
                  rows={2}
                  value={formAuditeeResponse}
                  onChange={(e) => setFormAuditeeResponse(e.target.value)}
                  placeholder="Klarifikasi atau komitmen perbaikan unit kerja..."
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
                  Simpan Temuan 5C
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Recommendation */}
      {isRecModalOpen && targetFindingForRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Tambah Rekomendasi SPI (Corrective Action)</h3>
              <button onClick={() => setIsRecModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRecommendation} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <span className="font-bold text-slate-900 block">{targetFindingForRec.findingNumber}</span>
                <p className="line-clamp-2">{targetFindingForRec.title}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Rekomendasi</label>
                <input
                  type="text"
                  required
                  value={formRecNumber}
                  onChange={(e) => setFormRecNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian Rekomendasi SPI</label>
                <textarea
                  rows={3}
                  required
                  value={formRecDescription}
                  onChange={(e) => setFormRecDescription(e.target.value)}
                  placeholder="Langkah terukur yang wajib ditindaklanjuti auditee..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
                  <input
                    type="text"
                    required
                    value={formRecPic}
                    onChange={(e) => setFormRecPic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batas Waktu (Target)</label>
                  <input
                    type="date"
                    required
                    value={formRecTargetDate}
                    onChange={(e) => setFormRecTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Indikator Keberhasilan Tindak Lanjut</label>
                <input
                  type="text"
                  required
                  value={formRecSuccessIndicator}
                  onChange={(e) => setFormRecSuccessIndicator(e.target.value)}
                  placeholder="Bukti fisik penyelesaian / perbaikan yang dapat diverifikasi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan Rekomendasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Official Print Modal for Complete Findings Matrix (LHA) */}
      {isPrintSummaryOpen && (
        <DocumentPrintPreviewModal
          isOpen={isPrintSummaryOpen}
          onClose={() => setIsPrintSummaryOpen(false)}
          documentTitle="LAPORAN MATRIKS TEMUAN AUDIT & REKOMENDASI SPI"
          documentSubtitle={`Periode Tahun Anggaran ${selectedYear}`}
          documentNumber={`LHA/SPI-PTS/MATRIKS/${selectedYear}`}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-6 text-xs font-serif leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-3 font-sans text-xs">
                <div>
                  <p className="text-slate-500">Tahun Pemeriksaan:</p>
                  <p className="font-bold text-slate-900">{selectedYear}</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Temuan Teridentifikasi:</p>
                  <p className="font-bold text-emerald-800">{filteredFindings.length} Temuan</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Estimasi Potensi Kerugian:</p>
                  <p className="font-bold text-rose-700 font-mono">Rp {totalPotensi.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-xs border-b border-slate-300 pb-1">
                  Daftar Temuan Pengawasan Berbasis 5C:
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-sans font-bold text-slate-800 border-b border-slate-300">
                        <th className="p-2 border border-slate-300 w-8 text-center">No</th>
                        <th className="p-2 border border-slate-300 w-24">Nomor & Unit</th>
                        <th className="p-2 border border-slate-300">Judul & Fakta Temuan (5C)</th>
                        <th className="p-2 border border-slate-300 w-28">Potensi Kerugian</th>
                        <th className="p-2 border border-slate-300">Rekomendasi Utama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredFindings.map((f, idx) => {
                        const recs = recommendations.filter((r) => r.findingId === f.id);
                        return (
                          <tr key={f.id} className="align-top">
                            <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                            <td className="p-2 border border-slate-300">
                              <p className="font-bold font-mono text-[10px] text-slate-900">{f.findingNumber}</p>
                              <p className="text-[10px] text-slate-600 font-sans mt-0.5">{f.unitName}</p>
                            </td>
                            <td className="p-2 border border-slate-300 space-y-1">
                              <p className="font-bold font-sans text-slate-900">{f.title}</p>
                              <p><strong>Kondisi:</strong> {f.condition}</p>
                              <p><strong>Kriteria:</strong> {f.criteria}</p>
                              <p><strong>Sebab:</strong> {f.cause}</p>
                              <p><strong>Akibat:</strong> {f.consequence}</p>
                            </td>
                            <td className="p-2 border border-slate-300 font-mono font-semibold text-rose-800">
                              {f.potentialLoss > 0 ? `Rp ${f.potentialLoss.toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td className="p-2 border border-slate-300">
                              {recs.length === 0 ? (
                                <span className="text-slate-400 italic">Belum ada rekomendasi</span>
                              ) : (
                                <ul className="list-disc pl-3 space-y-0.5">
                                  {recs.map((r) => (
                                    <li key={r.id}>
                                      <span className="font-semibold">{r.recNumber}:</span> {r.description}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DocumentPrintPreviewModal>
      )}

      {/* 2. Official Print Modal for Single 5C Finding Sheet */}
      {isPrintDetailOpen && activeFindingForPrint && (
        <DocumentPrintPreviewModal
          isOpen={isPrintDetailOpen}
          onClose={() => setIsPrintDetailOpen(false)}
          documentTitle="LEMBAR TEMUAN PEMERIKSAAN (5C)"
          documentSubtitle={`Unit Kerja: ${activeFindingForPrint.unitName}`}
          documentNumber={activeFindingForPrint.findingNumber}
          initialSignatory1Role="Ketua Tim Pemeriksa / Auditor Muda SPI"
          initialSignatory2Role="Kepala Satuan Pengawasan Intern"
          defaultShowSignatory2={true}
        >
          {() => {
            const recs = recommendations.filter((r) => r.findingId === activeFindingForPrint.id);
            return (
              <div className="space-y-4 text-xs font-serif leading-relaxed">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 font-sans text-xs">
                  <div>
                    <p><span className="text-slate-500">Judul Temuan:</span> <strong>{activeFindingForPrint.title}</strong></p>
                    <p><span className="text-slate-500">Bidang / Kategori:</span> <strong>{activeFindingForPrint.category}</strong></p>
                  </div>
                  <div>
                    <p><span className="text-slate-500">Tingkat Risiko:</span> <strong>{activeFindingForPrint.riskLevel}</strong></p>
                    <p>
                      <span className="text-slate-500">Estimasi Kerugian:</span>{' '}
                      <strong className="text-rose-700 font-mono">
                        {activeFindingForPrint.potentialLoss > 0
                          ? `Rp ${activeFindingForPrint.potentialLoss.toLocaleString('id-ID')}`
                          : 'Tidak Ada Dampak Finansial Langsung'}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                      1. Condition (Kondisi / Fakta yang Ditemukan):
                    </h4>
                    <p className="mt-1 pl-3 border-l-2 border-emerald-600 whitespace-pre-line">{activeFindingForPrint.condition}</p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                      2. Criteria (Kriteria / SOP / Regulasi Acuan):
                    </h4>
                    <p className="mt-1 pl-3 border-l-2 border-emerald-600 whitespace-pre-line">{activeFindingForPrint.criteria}</p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                      3. Cause (Sebab / Akar Masalah):
                    </h4>
                    <p className="mt-1 pl-3 border-l-2 border-emerald-600 whitespace-pre-line">{activeFindingForPrint.cause}</p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                      4. Consequence (Akibat / Dampak Risiko):
                    </h4>
                    <p className="mt-1 pl-3 border-l-2 border-emerald-600 whitespace-pre-line">{activeFindingForPrint.consequence}</p>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <h4 className="font-bold text-emerald-950 font-sans uppercase tracking-wider text-[11px]">
                      5. Corrective Action (Rekomendasi Perbaikan Tata Kelola):
                    </h4>
                    {recs.length === 0 ? (
                      <p className="mt-1 text-slate-500 italic pl-3">Belum ada rekomendasi yang diformalkan.</p>
                    ) : (
                      <div className="mt-1.5 space-y-2 pl-3">
                        {recs.map((r) => (
                          <div key={r.id} className="p-2 bg-white rounded border border-emerald-300 font-sans text-xs">
                            <p className="font-bold text-emerald-900">{r.recNumber}: {r.description}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              <strong>PIC:</strong> {r.pic} | <strong>Target Selesai:</strong> {r.targetDate}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              <strong>Indikator:</strong> {r.successIndicator}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
        </DocumentPrintPreviewModal>
      )}
    </div>
  );
};
