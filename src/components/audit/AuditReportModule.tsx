import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Sparkles,
  Building,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  Eye,
  Trash2,
  Edit,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Send,
  Loader2,
  HelpCircle,
  Copy,
  Layers,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import {
  AuditAssignment,
  WorkPaper,
  Finding,
  AuditReport,
  AuditOpinion,
  AuditReportStatus,
} from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

interface AuditReportModuleProps {
  onOpenAiAssistantWithContext?: (ctx: any) => void;
  initialAssignmentId?: string;
}

export const AuditReportModule: React.FC<AuditReportModuleProps> = ({
  onOpenAiAssistantWithContext,
  initialAssignmentId,
}) => {
  const { userProfile, hasRole } = useAuth();

  const [reports, setReports] = useState<AuditReport[]>([]);
  const [assignments, setAssignments] = useState<AuditAssignment[]>([]);
  const [workPapers, setWorkPapers] = useState<WorkPaper[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null);

  // Editor Tabs
  const [editorTab, setEditorTab] = useState<'general' | 'exec_summary' | 'internal_control' | 'conclusion' | 'status'>('general');

  // AI Generation States
  const [isAiGeneratingAll, setIsAiGeneratingAll] = useState(false);
  const [isAiGeneratingSection, setIsAiGeneratingSection] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [reportId, setReportId] = useState('');
  const [reportNumber, setReportNumber] = useState('');
  const [reportDate, setReportDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [assignmentId, setAssignmentId] = useState('');
  const [assignmentNumber, setAssignmentNumber] = useState('');
  const [auditTitle, setAuditTitle] = useState('');
  const [unitId, setUnitId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [auditPeriod, setAuditPeriod] = useState('');
  const [auditType, setAuditType] = useState('Audit Kepatuhan & Operasional');
  const [supervisor, setSupervisor] = useState('');
  const [teamLeader, setTeamLeader] = useState('');
  const [teamMembers, setTeamMembers] = useState('');

  const [executiveSummary, setExecutiveSummary] = useState('');
  const [backgroundAndBasis, setBackgroundAndBasis] = useState('');
  const [auditScope, setAuditScope] = useState('');
  const [generalOverview, setGeneralOverview] = useState('');
  const [internalControlEvaluation, setInternalControlEvaluation] = useState('');
  const [keyFindingsSummary, setKeyFindingsSummary] = useState('');
  const [auditOpinion, setAuditOpinion] = useState<AuditOpinion>('Efektif (Dengan Catatan Minor)');
  const [overallConclusion, setOverallConclusion] = useState('');
  const [strategicRecommendations, setStrategicRecommendations] = useState('');
  const [managementCommitment, setManagementCommitment] = useState('');
  const [status, setStatus] = useState<AuditReportStatus>('Draft');

  const canManage = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);
  const canApprove = hasRole(['KEPALA_SPI', 'ADMIN_SISTEM']);

  // Load Data Realtime
  useEffect(() => {
    const unsubReports = onSnapshot(collection(db, 'audit_reports'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditReport));
      data.sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
      setReports(data);
    });

    const unsubAssignments = onSnapshot(collection(db, 'audit_assignments'), (snap) => {
      setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditAssignment)));
    });

    const unsubWorkPapers = onSnapshot(collection(db, 'work_papers'), (snap) => {
      setWorkPapers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkPaper)));
    });

    const unsubFindings = onSnapshot(collection(db, 'findings'), (snap) => {
      setFindings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Finding)));
    });

    return () => {
      unsubReports();
      unsubAssignments();
      unsubWorkPapers();
      unsubFindings();
    };
  }, []);

  // Handle initialAssignmentId if navigated from another page
  useEffect(() => {
    if (initialAssignmentId && assignments.length > 0) {
      const found = assignments.find((a) => a.id === initialAssignmentId);
      if (found) {
        handleOpenCreateModal(found);
      }
    }
  }, [initialAssignmentId, assignments]);

  // Handle Assignment Selection
  const handleSelectAssignment = (selectedAssId: string) => {
    setAssignmentId(selectedAssId);
    const ass = assignments.find((a) => a.id === selectedAssId);
    if (!ass) return;

    setAssignmentNumber(ass.letterNumber);
    setAuditTitle(`Laporan Hasil Pengawasan atas ${ass.objectName}`);
    setUnitId(ass.unitId);
    setUnitName(ass.unitName);
    setAuditPeriod(`${ass.startDate} s.d. ${ass.endDate}`);
    setAuditType(ass.auditType);
    setSupervisor(ass.supervisor);
    setTeamLeader(ass.teamLeader);
    setTeamMembers(ass.teamMembers);

    // Multi-paragraph default chapters
    setBackgroundAndBasis(
      `Pengawasan intern ini dilaksanakan berlandaskan mandat Undang-Undang Nomor 23 Tahun 2014 tentang Pemerintahan Daerah, Peraturan Pemerintah Nomor 54 Tahun 2017 tentang Badan Usaha Milik Daerah (BUMD), serta Peraturan Daerah Kabupaten Pasaman tentang Pembentukan Perumda Air Minum Tirta Saiyo.\n\nPemeriksaan ini merupakan wujud kepatuhan terhadap Piagam Pengawasan Intern (Internal Audit Charter) SPI, Standar Audit Intern Pemerintah Indonesia (AAIPI), serta Global Internal Audit Standards (GIAS 2024) yang mewajibkan audit independen, objektif, dan berorientasi pada penciptaan nilai tambah tata kelola.\n\nSecara administratif operasional, penugasan ini didasarkan pada Surat Perintah Tugas (SPT) Direksi Perumda Air Minum Tirta Saiyo Nomor: ${ass.letterNumber} tanggal ${ass.letterDate}, guna memenuhi target Program Kerja Pengawasan Tahunan (PKPT) SPI Tahun ${new Date().getFullYear()}.`
    );

    setAuditScope(
      `Ruang lingkup pengawasan mencakup evaluasi kepatuhan operasional, keandalan pencatatan billing dan penerimaan kasir, keabsahan dokumen bukti pengeluaran, serta efektivitas mitigasi risiko atas ${ass.objectName} pada ${ass.unitName} untuk periode ${ass.startDate} s.d. ${ass.endDate}.\n\nPemeriksaan difokuskan pada 4 (empat) aspek utama:\n1. Kepatuhan pelaksanaan Standar Operasional Prosedur (SOP) teknis dan pelayanan pelanggan.\n2. Akurasi pencatatan pembukuan, rekonsiliasi kas harian, dan mutasi saldo piutang air.\n3. Pengendalian fisik infrastruktur pipa transmisi, distribusi, serta keandalan water meter pelanggan.\n4. Kepatuhan pelaporan operasional berkala dan tindak lanjut rekomendasi audit sebelumnya.\n\nBatasan pemeriksaan meliputi metode uji petik (sampling substantif) terhadap dokumen transaksi, pengujian fisik di lapangan, wawancara mendalam dengan personil operasional, serta rekonsiliasi data sistem informasi.`
    );

    setGeneralOverview(
      `${ass.unitName} merupakan unit kerja operasional dan pelayanan strategis di lingkungan Perumda Air Minum Tirta Saiyo Kabupaten Pasaman yang mengemban tugas pokok menyelenggarakan pelayanan penyediaan air minum yang memenuhi standar kualitas, kuantitas, kontinuitas (K3), dan keterjangkauan bagi masyarakat di wilayah kerjanya.\n\nDalam menjalankan aktivitas hariannya, unit ini mengoperasikan instalasi pengolahan air (IPA), jaringan perpipaan transmisi dan distribusi, serta loket kasir pelayanan pembayaran rekening air yang didukung oleh jajaran personil teknis dan administrasi.\n\nSebagai garda terdepan pendapatan BUMD di Kabupaten Pasaman, unit ini menghadapi tantangan utama berupa penurunan tingkat kehilangan air fisik (Non-Revenue Water), penertiban sambungan liar, dan percepatan penagihan tunggakan rekening air pelanggan lama.`
    );

    setExecutiveSummary(
      `Berdasarkan Program Kerja Pengawasan Tahunan (PKPT) dan Surat Perintah Tugas Nomor: ${ass.letterNumber}, Satuan Pengawasan Intern (SPI) Perumda Air Minum Tirta Saiyo Kabupaten Pasaman telah merampungkan audit operasional dan kepatuhan atas ${ass.objectName} pada ${ass.unitName}.\n\nSecara umum, sistem tata kelola dan pengendalian intern pada ${ass.unitName} telah berjalan dengan predikat EFEKTIF DENGAN CATATAN MINOR. Manajemen unit telah menunjukkan dedikasi dan komitmen operasional yang baik dalam menjaga kelancaran distribusi air minum kepada pelanggan.\n\nNamun demikian, Tim Pemeriksa SPI mengidentifikasi beberapa area kelemahan pengendalian dan kepatuhan administratif yang memerlukan tindakan korektif terukur dari Manajemen, khususnya terkait pengawasan kehilangan air fisik dan percepatan rekonsiliasi penerimaan kasir.\n\nRekomendasi strategis yang kami rumuskan berfokus pada penguatan pengawasan berjenjang, penertiban sambungan ilegal, kalibrasi berkala meter air pelanggan, dan kepatuhan SOP perbaikan pipa darurat.`
    );

    setInternalControlEvaluation(
      `Evaluasi komprehensif atas 5 (lima) unsur Sistem Pengendalian Intern Pemerintah (SPIP) berstandar BPKP pada ${ass.unitName} menunjukkan hasil sebagai berikut:\n\n1. Lingkungan Pengendalian: Pimpinan dan staf unit menunjukkan integritas serta kepatuhan etika kerja yang baik, namun pendelegasian wewenang dan supervisi harian masih perlu dipertegas melalui dokumentasi tertulis.\n\n2. Penilaian Risiko: Unit telah mengenali risiko operasional teknis kebocoran pipa, namun mitigasi terhadap risiko piutang rekening air macet dan risiko keterlambatan setoran kasir belum diidentifikasi secara formal.\n\n3. Kegiatan Pengendalian: Pemisahan tugas operasional telah berjalan, namun verifikasi berkala atas akurasi fisik meter air dan pencatatan mutasi barang fitting di gudang unit memerlukan pengawasan melekat.\n\n4. Informasi dan Komunikasi: Sistem billing terpusat telah beroperasi, namun integrasi pelaporan keluhan pelanggan dan kecepatan feedback dari tim teknis lapangan perlu ditingkatkan agar waktu respon < 24 jam.\n\n5. Pemantauan Pengendalian Intern: Pemantauan mandiri berkala oleh kepala unit masih bersifat insidental dan tindak lanjut rekomendasi audit sebelumnya perlu dipantau secara berkesinambungan.`
    );

    setOverallConclusion(
      `Berdasarkan seluruh prosedur pengujian audit substantif, verifikasi dokumen, dan observasi fisik lapangan yang telah dilaksanakan, Tim Pemeriksa SPI menyimpulkan bahwa pengelolaan ${ass.objectName} pada ${ass.unitName} secara menyeluruh telah berjalan CUKUP EFEKTIF dan berorientasi pada pelayanan prima kepada masyarakat Kabupaten Pasaman.\n\nArea kelemahan dan penyimpangan yang ditemukan selama proses audit bukan merupakan kegagalan sistematis yang bersifat kecurangan (fraud) material, melainkan kelemahan koordinasi operasional dan perlunya penguatan kepatuhan terhadap Standar Operasional Prosedur (SOP) internal.\n\nKeberhasilan mitigasi risiko dan peningkatan efisiensi operasional sangat bergantung pada komitmen nyata pimpinan unit dalam menindaklanjuti rekomendasi yang telah dirumuskan dalam Laporan Hasil Audit ini secara disiplin dan tepat waktu.`
    );

    setStrategicRecommendations(
      `1. Memperketat pengawasan berjenjang atas transaksi operasional harian dan rekonsiliasi kasir dengan rekening bank penampung setiap akhir hari kerja.\n\n2. Membentuk gugus tugas (satgas) penanganan Non-Revenue Water (NRW) untuk mendeteksi titik kebocoran pipa transmisi dan penertiban sambungan liar secara berkala.\n\n3. Mengintensifkan penagihan tunggakan rekening air pelanggan melalui surat teguran berjenjang dan penegakan sanksi pemutusan sementara sesuai Peraturan Direksi.\n\n4. Melaksanakan kalibrasi dan peremajaan meter air pelanggan yang telah berusia pakai di atas 5 (lima) tahun guna menjamin akurasi volume pemakaian air.`
    );

    setManagementCommitment(
      `Pihak Manajemen ${ass.unitName} menyatakan menerima secara utuh seluruh hasil evaluasi dan temuan pemeriksaan Satuan Pengawasan Intern (SPI), serta berkomitmen menyusun Matriks Rencana Aksi (Action Plan) perbaikan selambat-lambatnya dalam waktu 60 (enam puluh) hari kalender sejak laporan ini disahkan.\n\nManajemen juga menunjuk penanggung jawab teknis (PIC) untuk setiap rekomendasi guna memastikan perbaikan tata kelola terlaksana secara tuntas dan terdokumentasi dengan baik.`
    );

    // Auto calculate auto report number if blank
    if (!reportNumber) {
      const year = new Date().getFullYear();
      const num = String(reports.length + 1).padStart(2, '0');
      setReportNumber(`700.1/${num}/LHA-SPI/PTS/${year}`);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = (prefillAssignment?: AuditAssignment) => {
    setReportId('');
    const year = new Date().getFullYear();
    const num = String(reports.length + 1).padStart(2, '0');
    setReportNumber(`700.1/${num}/LHA-SPI/PTS/${year}`);
    setReportDate(new Date().toISOString().split('T')[0]);

    if (prefillAssignment) {
      handleSelectAssignment(prefillAssignment.id);
    } else {
      setAssignmentId('');
      setAssignmentNumber('');
      setAuditTitle('');
      setUnitId('');
      setUnitName('');
      setAuditPeriod('');
      setAuditType('Audit Kepatuhan & Operasional');
      setSupervisor('Hendra Saputra, S.E., M.M., CRMP');
      setTeamLeader('');
      setTeamMembers('');
      setExecutiveSummary('');
      setBackgroundAndBasis('');
      setAuditScope('');
      setGeneralOverview('');
      setInternalControlEvaluation('');
      setKeyFindingsSummary('');
      setAuditOpinion('Efektif (Dengan Catatan Minor)');
      setOverallConclusion('');
      setStrategicRecommendations('');
      setManagementCommitment('');
    }

    setStatus('Draft');
    setEditorTab('general');
    setAiError(null);
    setAiSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rep: AuditReport) => {
    setReportId(rep.id);
    setReportNumber(rep.reportNumber);
    setReportDate(rep.reportDate);
    setAssignmentId(rep.assignmentId);
    setAssignmentNumber(rep.assignmentNumber || '');
    setAuditTitle(rep.auditTitle);
    setUnitId(rep.unitId);
    setUnitName(rep.unitName);
    setAuditPeriod(rep.auditPeriod);
    setAuditType(rep.auditType);
    setSupervisor(rep.supervisor);
    setTeamLeader(rep.teamLeader);
    setTeamMembers(rep.teamMembers);

    setExecutiveSummary(rep.executiveSummary || '');
    setBackgroundAndBasis(rep.backgroundAndBasis || '');
    setAuditScope(rep.auditScope || '');
    setGeneralOverview(rep.generalOverview || '');
    setInternalControlEvaluation(rep.internalControlEvaluation || '');
    setKeyFindingsSummary(rep.keyFindingsSummary || '');
    setAuditOpinion(rep.auditOpinion || 'Efektif (Dengan Catatan Minor)');
    setOverallConclusion(rep.overallConclusion || '');
    setStrategicRecommendations(rep.strategicRecommendations || '');
    setManagementCommitment(rep.managementCommitment || '');
    setStatus(rep.status);

    setEditorTab('general');
    setAiError(null);
    setAiSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  // Open Print Preview Modal
  const handleOpenPrintModal = (rep: AuditReport) => {
    setSelectedReport(rep);
    setIsPrintModalOpen(true);
  };

  // Save Report
  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNumber.trim() || !auditTitle.trim()) {
      alert('Nomor Laporan dan Judul Audit wajib diisi.');
      return;
    }

    try {
      const newId = reportId || `LHA-${Date.now()}`;
      const payload: AuditReport = {
        id: newId,
        reportNumber,
        reportDate,
        assignmentId,
        assignmentNumber,
        auditTitle,
        unitId,
        unitName,
        auditPeriod,
        auditType,
        supervisor,
        teamLeader,
        teamMembers,
        executiveSummary,
        backgroundAndBasis,
        auditScope,
        generalOverview,
        internalControlEvaluation,
        keyFindingsSummary,
        auditOpinion,
        overallConclusion,
        strategicRecommendations,
        managementCommitment,
        status,
        createdBy: userProfile?.displayName || 'Auditor SPI',
        createdAt: reportId ? (selectedReport?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'audit_reports', newId), payload, { merge: true });
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyimpan Laporan Hasil Audit: ' + err.message);
    }
  };

  // Delete Report
  const handleDeleteReport = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus Laporan Hasil Audit ini?')) return;
    try {
      await deleteDoc(doc(db, 'audit_reports', id));
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus laporan: ' + err.message);
    }
  };

  // AI: Full LHA Draft Generation
  const handleGenerateFullLhaWithAi = async () => {
    if (!assignmentId) {
      alert('Silakan pilih Surat Perintah Tugas (SPT) terlebih dahulu sebelum melakukan asistensi AI.');
      return;
    }

    setIsAiGeneratingAll(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const selectedAssignment = assignments.find((a) => a.id === assignmentId);
      const relevantWorkPapers = workPapers.filter((w) => w.assignmentId === assignmentId);
      const relevantFindings = findings.filter((f) => f.assignmentId === assignmentId);

      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_lha_draft',
          payload: {
            assignment: selectedAssignment,
            workPapers: relevantWorkPapers,
            findings: relevantFindings,
            notes: 'Susun laporan hasil audit formal dan terstruktur sesuai standar SPI BUMD Air Minum Pasaman.',
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal memproses asistensi AI.');
      }

      const data = await response.json();
      const rawText = data.text || '';

      // Try parsing JSON block from AI output with regex
      let parsedJson: any = null;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedJson = JSON.parse(jsonMatch[0]);
        } else {
          const cleaned = rawText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          parsedJson = JSON.parse(cleaned);
        }
      } catch (e) {
        console.warn('AI output is not pure JSON, will assign raw text to Executive Summary');
      }

      if (parsedJson) {
        if (parsedJson.executiveSummary) setExecutiveSummary(parsedJson.executiveSummary);
        if (parsedJson.backgroundAndBasis) setBackgroundAndBasis(parsedJson.backgroundAndBasis);
        if (parsedJson.auditScope) setAuditScope(parsedJson.auditScope);
        if (parsedJson.generalOverview) setGeneralOverview(parsedJson.generalOverview);
        if (parsedJson.internalControlEvaluation) setInternalControlEvaluation(parsedJson.internalControlEvaluation);
        if (parsedJson.keyFindingsSummary) setKeyFindingsSummary(parsedJson.keyFindingsSummary);
        if (parsedJson.auditOpinion) setAuditOpinion(parsedJson.auditOpinion as AuditOpinion);
        if (parsedJson.overallConclusion) setOverallConclusion(parsedJson.overallConclusion);
        if (parsedJson.strategicRecommendations) setStrategicRecommendations(parsedJson.strategicRecommendations);
        if (parsedJson.managementCommitment) setManagementCommitment(parsedJson.managementCommitment);
      } else {
        setExecutiveSummary(rawText);
      }

      setAiSuccessMessage('Draft LHA berhasil disusun secara otomatis oleh AI Gemini berdasarkan data penugasan, KKA, dan temuan 5C.');
      setTimeout(() => setAiSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Terjadi kesalahan saat memproses asistensi AI.');
    } finally {
      setIsAiGeneratingAll(false);
    }
  };

  // AI: Section-Specific Assistance
  const handleAssistSectionWithAi = async (sectionKey: string, sectionTitle: string, currentVal: string, setter: (val: string) => void) => {
    setIsAiGeneratingSection(sectionKey);
    setAiError(null);
    try {
      const selectedAssignment = assignments.find((a) => a.id === assignmentId);
      const relevantFindings = findings.filter((f) => f.assignmentId === assignmentId);

      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assist_lha_section',
          payload: {
            sectionName: sectionTitle,
            assignment: selectedAssignment,
            findings: relevantFindings,
            currentContent: currentVal,
            userPrompt: 'Formulasikan narasi yang sangat tajam, berbobot, berbasis bukti, dan bernilai strategis bagi perbaikan tata kelola Perumda Tirta Saiyo.',
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal memproses asistensi AI pada seksi ini.');
      }

      const data = await response.json();
      if (data.text) {
        setter(data.text.trim());
        setAiSuccessMessage(`Bagian "${sectionTitle}" berhasil disempurnakan oleh AI.`);
        setTimeout(() => setAiSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Gagal menyempurnakan bagian dengan AI.');
    } finally {
      setIsAiGeneratingSection(null);
    }
  };

  // Filtered list
  const filteredReports = reports.filter((r) => {
    const matchSearch =
      r.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.auditTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.unitName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Calculate statistics
  const totalReports = reports.length;
  const publishedReports = reports.filter((r) => r.status === 'Final / Diterbitkan ke Direktur').length;
  const reviewReports = reports.filter((r) => r.status.includes('Review') || r.status.includes('Persetujuan')).length;
  const effectiveOpinions = reports.filter((r) => r.auditOpinion.includes('Efektif') || r.auditOpinion.includes('Sangat Baik')).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 rounded-lg">
              Pelaporan Pengawasan SPI
            </span>
            <span className="text-xs text-slate-500 font-medium">GIAS 2024 & Standar BUMD</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-700" />
            <span>Laporan Hasil Audit (LHA) & Pengawasan</span>
          </h1>
          <p className="text-xs text-slate-600 max-w-3xl">
            Penyusunan dokumen formal Laporan Hasil Audit / Pengawasan Perumda Air Minum Tirta Saiyo yang terintegrasi dari Surat Tugas, KKA, dan Temuan 5C dengan asistensi kecerdasan buatan (AI Gemini).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {canManage && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Susun LHA Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total LHA Terdaftar</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalReports}</p>
          <p className="text-[10px] text-slate-500">Seluruh dokumen laporan SPI</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Final / Ke Direktur</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-emerald-800">{publishedReports}</p>
          <p className="text-[10px] text-emerald-700 font-semibold">Telah disahkan Kepala SPI</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Dalam Review / Validasi</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700">{reviewReports}</p>
          <p className="text-[10px] text-slate-500">Menunggu persetujuan berjenjang</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Opini Pengendalian Baik</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-800">{effectiveOpinions}</p>
          <p className="text-[10px] text-slate-500">Sangat Baik / Efektif Minor</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor LHA, judul, atau unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold shrink-0">Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700"
          >
            <option value="ALL">Semua Status LHA</option>
            <option value="Draft">Draft</option>
            <option value="Review Pengendali Teknis">Review Pengendali Teknis</option>
            <option value="Persetujuan Kepala SPI">Persetujuan Kepala SPI</option>
            <option value="Final / Diterbitkan ke Direktur">Final / Diterbitkan ke Direktur</option>
          </select>
        </div>
      </div>

      {/* LHA List / Cards */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Belum Ada Dokumen Laporan Hasil Audit</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Susun Laporan Hasil Audit (LHA) dari penugasan audit yang telah memiliki kertas kerja (KKA) dan temuan 5C. Anda dapat memanfaatkan asistensi AI untuk menyusun draf secara instan.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Susun LHA Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-3.5">
                {/* Header Status & Opinion */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                      r.status === 'Final / Diterbitkan ke Direktur'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : r.status.includes('Review')
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {r.status}
                  </span>

                  <span
                    className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wide ${
                      r.auditOpinion.includes('Sangat Baik') || r.auditOpinion.includes('Efektif (Dengan')
                        ? 'bg-teal-100 text-teal-800'
                        : r.auditOpinion.includes('Cukup Efektif')
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {r.auditOpinion.split('(')[0].trim()}
                  </span>
                </div>

                {/* Title & Number */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {r.auditTitle}
                  </h3>
                  <p className="text-[11px] font-mono font-semibold text-emerald-800 mt-1">
                    {r.reportNumber}
                  </p>
                </div>

                {/* Details */}
                <div className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{r.unitName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Tanggal LHA: {r.reportDate}</span>
                  </div>
                  {r.assignmentNumber && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <FileCheck2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">SPT: {r.assignmentNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Ketua Tim: {r.teamLeader || '-'}</span>
                  </div>
                </div>

                {/* Executive Summary Snippet */}
                {r.executiveSummary && (
                  <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 line-clamp-3 leading-relaxed border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-0.5">Ringkasan Eksekutif:</span>
                    {r.executiveSummary}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenPrintModal(r)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Tinjau & Cetak LHA</span>
                </button>

                <div className="flex items-center gap-1">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(r)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                      title="Edit Laporan"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReport(r.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Hapus Laporan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL EDITOR LAPORAN HASIL AUDIT (LHA) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[95vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900">
            {/* Header Toolbar */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-700/50 border border-emerald-500/40 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    {reportId ? 'Edit Laporan Hasil Audit (LHA)' : 'Penyusunan Laporan Hasil Audit (LHA) Baru'}
                  </h3>
                  <p className="text-[11px] text-emerald-300">
                    Satuan Pengawasan Intern · Perumda Air Minum Tirta Saiyo
                  </p>
                </div>
              </div>

              {/* AI Auto-Generate Button in Top Header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateFullLhaWithAi}
                  disabled={isAiGeneratingAll || !assignmentId}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  title="Generate draf lengkap LHA secara otomatis dengan AI Gemini berdasarkan data SPT, KKA, dan Temuan 5C"
                >
                  {isAiGeneratingAll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-900" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-900" />
                  )}
                  <span>{isAiGeneratingAll ? 'Menyusun LHA...' : '✨ Generate Draft LHA (AI)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* AI Notification Banners */}
            {aiSuccessMessage && (
              <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{aiSuccessMessage}</span>
              </div>
            )}
            {aiError && (
              <div className="px-6 py-2 bg-rose-50 border-b border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Tab Navigation in Editor */}
            <div className="px-6 pt-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setEditorTab('general')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer ${
                  editorTab === 'general'
                    ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                1. Info Penugasan & Ruang Lingkup
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('exec_summary')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer ${
                  editorTab === 'exec_summary'
                    ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                2. Ringkasan Eksekutif & Opini
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('internal_control')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer ${
                  editorTab === 'internal_control'
                    ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                3. Evaluasi Pengendalian & Temuan
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('conclusion')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer ${
                  editorTab === 'conclusion'
                    ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                4. Kesimpulan & Rekomendasi
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('status')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer ${
                  editorTab === 'status'
                    ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                5. Komitmen & Pengesahan
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveReport} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: GENERAL & SCOPE */}
              {editorTab === 'general' && (
                <div className="space-y-4">
                  {/* Penugasan Picker */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-emerald-950">
                      Pilih Penugasan Audit (Surat Perintah Tugas):
                    </label>
                    <select
                      value={assignmentId}
                      onChange={(e) => handleSelectAssignment(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg font-bold text-slate-800"
                    >
                      <option value="">-- Pilih Surat Perintah Tugas Terdaftar --</option>
                      {assignments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.letterNumber} - {a.objectName} ({a.unitName})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-emerald-800">
                      * Memilih SPT akan otomatis menghubungkan data Kertas Kerja Audit (KKA) dan Temuan Pemeriksaan 5C yang ada di sistem ke LHA ini.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Laporan Hasil Audit (LHA) *
                      </label>
                      <input
                        type="text"
                        required
                        value={reportNumber}
                        onChange={(e) => setReportNumber(e.target.value)}
                        placeholder="Contoh: 700.1/01/LHA-SPI/PTS/2026"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tanggal Laporan *
                      </label>
                      <input
                        type="date"
                        required
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Laporan Hasil Pengawasan *
                    </label>
                    <input
                      type="text"
                      required
                      value={auditTitle}
                      onChange={(e) => setAuditTitle(e.target.value)}
                      placeholder="Contoh: Laporan Hasil Audit Kepatuhan Operasional dan Pendapatan Air Unit Pelayanan Lubuk Sikaping"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Unit Objek Audit</label>
                      <input
                        type="text"
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Periode Pengawasan</label>
                      <input
                        type="text"
                        value={auditPeriod}
                        onChange={(e) => setAuditPeriod(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Jenis Pengawasan</label>
                      <input
                        type="text"
                        value={auditType}
                        onChange={(e) => setAuditType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Pengendali Teknis</label>
                      <input
                        type="text"
                        value={supervisor}
                        onChange={(e) => setSupervisor(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Ketua Tim Pemeriksa</label>
                      <input
                        type="text"
                        value={teamLeader}
                        onChange={(e) => setTeamLeader(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Anggota Tim</label>
                      <input
                        type="text"
                        value={teamMembers}
                        onChange={(e) => setTeamMembers(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Dasar Penugasan & Latar Belakang (Bab I)
                      </label>
                      <textarea
                        rows={5}
                        value={backgroundAndBasis}
                        onChange={(e) => setBackgroundAndBasis(e.target.value)}
                        placeholder="Dasar hukum penugasan, regulasi, dan urgensi pengawasan..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ruang Lingkup & Tujuan Pemeriksaan
                      </label>
                      <textarea
                        rows={4}
                        value={auditScope}
                        onChange={(e) => setAuditScope(e.target.value)}
                        placeholder="Batasan pengujian, periode sampling, dan tujuan audit..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gambaran Umum Objek yang Diaudit
                      </label>
                      <textarea
                        rows={4}
                        value={generalOverview}
                        onChange={(e) => setGeneralOverview(e.target.value)}
                        placeholder="Profil unit kerja, tupoksi, dan kapasitas layanan..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXECUTIVE SUMMARY & OPINION */}
              {editorTab === 'exec_summary' && (
                <div className="space-y-5">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-700" />
                        Opini / Simpulan Hasil Pengawasan SPI
                      </label>
                      <span className="text-[10px] text-amber-800 font-semibold">Tingkat Efektivitas Pengendalian</span>
                    </div>

                    <select
                      value={auditOpinion}
                      onChange={(e) => setAuditOpinion(e.target.value as AuditOpinion)}
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg font-bold text-slate-800"
                    >
                      <option value="Sangat Baik (Tanpa Catatan)">Sangat Baik (Tanpa Catatan) - Pengendalian andal & tata kelola prima</option>
                      <option value="Efektif (Dengan Catatan Minor)">Efektif (Dengan Catatan Minor) - Berjalan baik, temuan administratif minor</option>
                      <option value="Cukup Efektif (Perlu Perbaikan Signifikan)">Cukup Efektif (Perlu Perbaikan Signifikan) - Terdapat kelemahan sistemik yang harus dibenahi</option>
                      <option value="Kurang Efektif (Kelemahan Kritis)">Kurang Efektif (Kelemahan Kritis) - Pengendalian lemah, potensi kerugian operasional/finansial</option>
                      <option value="Tidak Efektif (Gagal Sistem)">Tidak Efektif (Gagal Sistem) - Sistem pengendalian tidak berfungsi atau indikasi fraud masif</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Ringkasan Eksekutif (Executive Summary)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          handleAssistSectionWithAi(
                            'exec_summary',
                            'Ringkasan Eksekutif (Executive Summary)',
                            executiveSummary,
                            setExecutiveSummary
                          )
                        }
                        disabled={isAiGeneratingSection === 'exec_summary'}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        {isAiGeneratingSection === 'exec_summary' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>✨ Sempurnakan dengan AI</span>
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={executiveSummary}
                      onChange={(e) => setExecutiveSummary(e.target.value)}
                      placeholder="Ringkasan eksekutif padat 2-3 paragraf untuk disampaikan langsung kepada Direktur dan Dewan Pengawas Perumda Tirta Saiyo..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed font-sans"
                    />
                    <p className="text-[10px] text-slate-400">
                      * Ringkasan eksekutif harus merangkum tujuan utama, simpulan umum opini SPI, jumlah temuan berbobot, potensi dampak keuangan/layanan, dan rekomendasi utama.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: INTERNAL CONTROL & FINDINGS */}
              {editorTab === 'internal_control' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Evaluasi Sistem Pengendalian Intern (SPIP & 5 Unsur Pengendalian)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          handleAssistSectionWithAi(
                            'internal_control',
                            'Evaluasi Sistem Pengendalian Intern',
                            internalControlEvaluation,
                            setInternalControlEvaluation
                          )
                        }
                        disabled={isAiGeneratingSection === 'internal_control'}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        {isAiGeneratingSection === 'internal_control' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>✨ Analisis SPI dengan AI</span>
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={internalControlEvaluation}
                      onChange={(e) => setInternalControlEvaluation(e.target.value)}
                      placeholder="Evaluasi kecukupan dan efektivitas pengendalian intern: lingkungan pengendalian, penilaian risiko unit, aktivitas pemisahan tugas/otorisasi, keandalan sistem billing/kasir, dan pemantauan manajemen..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Sintesis & Uraian Temuan Pemeriksaan Signifikan (5C)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          handleAssistSectionWithAi(
                            'findings_summary',
                            'Sintesis Temuan Pemeriksaan 5C',
                            keyFindingsSummary,
                            setKeyFindingsSummary
                          )
                        }
                        disabled={isAiGeneratingSection === 'findings_summary'}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        {isAiGeneratingSection === 'findings_summary' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>✨ Rangkum Temuan dengan AI</span>
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={keyFindingsSummary}
                      onChange={(e) => setKeyFindingsSummary(e.target.value)}
                      placeholder="Rangkuman temuan audit dengan struktur 5C: Condition, Criteria, Cause, Consequence, Corrective Action. Jelaskan pola kelemahan mendasar yang berulang..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed font-sans"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: CONCLUSION & RECOMMENDATIONS */}
              {editorTab === 'conclusion' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Kesimpulan Menyeluruh Hasil Audit
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          handleAssistSectionWithAi(
                            'overall_conclusion',
                            'Kesimpulan Menyeluruh Hasil Audit',
                            overallConclusion,
                            setOverallConclusion
                          )
                        }
                        disabled={isAiGeneratingSection === 'overall_conclusion'}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        {isAiGeneratingSection === 'overall_conclusion' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>✨ Formulasikan dengan AI</span>
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={overallConclusion}
                      onChange={(e) => setOverallConclusion(e.target.value)}
                      placeholder="Kesimpulan akhir SPI atas tata kelola dan pencapaian target unit kerja..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Rekomendasi Strategis & Perbaikan Sistemik
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          handleAssistSectionWithAi(
                            'strategic_recommendations',
                            'Rekomendasi Strategis dan Perbaikan Sistemik',
                            strategicRecommendations,
                            setStrategicRecommendations
                          )
                        }
                        disabled={isAiGeneratingSection === 'strategic_recommendations'}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        {isAiGeneratingSection === 'strategic_recommendations' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>✨ Pertajam Rekomendasi (AI)</span>
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={strategicRecommendations}
                      onChange={(e) => setStrategicRecommendations(e.target.value)}
                      placeholder="Daftar rekomendasi bernilai tambah tinggi: perbaikan SOP, penguatan supervisi, penagihan piutang, penurunan tingkat kebocoran air (NRW), dan mitigasi risiko..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed font-sans"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: COMMITMENT & APPROVAL */}
              {editorTab === 'status' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800">
                      Komitmen Manajemen & Rencana Aksi Auditee
                    </label>
                    <textarea
                      rows={4}
                      value={managementCommitment}
                      onChange={(e) => setManagementCommitment(e.target.value)}
                      placeholder="Kesepakatan jadwal tindak lanjut dan PIC pejabat unit kerja yang ditunjuk untuk menyelesaikan rekomendasi..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Status Alur Dokumen LHA:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        {
                          val: 'Draft',
                          title: 'Draft Awal',
                          desc: 'Disusun oleh Tim Pemeriksa SPI',
                        },
                        {
                          val: 'Review Pengendali Teknis',
                          title: 'Review Pengendali Teknis',
                          desc: 'Penelaahan mutu KKA dan bukti',
                        },
                        {
                          val: 'Persetujuan Kepala SPI',
                          title: 'Persetujuan Kepala SPI',
                          desc: 'Validasi akhir pimpinan pengawasan',
                        },
                        {
                          val: 'Final / Diterbitkan ke Direktur',
                          title: 'Final / Diterbitkan ke Direktur',
                          desc: 'Laporan resmi diserahkan ke Direksi',
                        },
                      ].map((item) => (
                        <label
                          key={item.val}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                            status === item.val
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportStatus"
                            value={item.val}
                            checked={status === item.val}
                            onChange={() => setStatus(item.val as AuditReportStatus)}
                            className="mt-0.5 text-emerald-700 focus:ring-emerald-600"
                          />
                          <div>
                            <div className="text-xs">{item.title}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Dokumen LHA</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CETAK & TINJAU LAPORAN HASIL AUDIT (LHA) */}
      {isPrintModalOpen && selectedReport && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="LAPORAN HASIL PENGAWASAN / AUDIT (LHA)"
          documentSubtitle={`OBJEK PENGAWASAN: ${selectedReport.unitName.toUpperCase()}`}
          documentNumber={selectedReport.reportNumber}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {(_config) => {
            const reportFindings = findings.filter(
              (f) =>
                (selectedReport.assignmentId && f.assignmentId === selectedReport.assignmentId) ||
                (selectedReport.unitId && f.unitId === selectedReport.unitId)
            );

            const formatIdr = (val?: number) => {
              if (!val || val === 0) return 'Rp 0';
              return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0,
              }).format(val);
            };

            const formatIndoDate = (dateStr?: string) => {
              if (!dateStr) return '-';
              try {
                const d = new Date(dateStr);
                return new Intl.DateTimeFormat('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(d);
              } catch {
                return dateStr;
              }
            };

            // Helper to render official audit text with clean, multi-paragraph formatting and indentation
            const renderReportSection = (
              customContent?: string,
              fallbackParagraphs: string[] = []
            ) => {
              const raw = customContent?.trim() || '';
              // Use custom content if it has substance or multiple paragraphs; otherwise use official multi-paragraph standard text
              const useRaw = raw.length > 180 || (raw.length > 50 && raw.includes('\n'));
              const contentToRender = useRaw ? raw : fallbackParagraphs.join('\n\n');
              const blocks = contentToRender
                .split(/\n\s*\n/)
                .map((b) => b.trim())
                .filter(Boolean);

              return (
                <div className="space-y-2.5 text-justify leading-relaxed text-slate-900 font-serif text-[11px]">
                  {blocks.map((block, bIdx) => {
                    const lines = block
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean);
                    const isPureList =
                      lines.length > 0 &&
                      lines.every((l) => /^(\d+[\.\)]|[-*•–—])\s+/.test(l));

                    if (isPureList) {
                      return (
                        <div key={bIdx} className="space-y-1.5 my-2 pl-4">
                          {lines.map((line, lIdx) => {
                            const match = line.match(/^(\d+[\.\)]|[-*•–—])\s*(.*)$/);
                            return (
                              <div key={lIdx} className="flex items-start gap-2 text-justify">
                                <span className="font-bold text-slate-800 font-mono text-[10px] shrink-0 pt-0.5">
                                  {match ? match[1] : '•'}
                                </span>
                                <span className="flex-1 text-[11px] leading-relaxed text-slate-900">
                                  {match ? match[2] : line}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    // If mixed text containing bullet points
                    if (lines.length > 1 && lines.some((l) => /^(\d+[\.\)]|[-*•–—])\s+/.test(l))) {
                      return (
                        <div key={bIdx} className="space-y-1.5 my-1.5">
                          {lines.map((line, lIdx) => {
                            const match = line.match(/^(\d+[\.\)]|[-*•–—])\s*(.*)$/);
                            if (match) {
                              return (
                                <div key={lIdx} className="flex items-start gap-2 pl-4 text-justify">
                                  <span className="font-bold text-slate-800 font-mono text-[10px] shrink-0 pt-0.5">
                                    {match[1]}
                                  </span>
                                  <span className="flex-1 text-[11px] leading-relaxed text-slate-900">
                                    {match[2]}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <p key={lIdx} className="indent-8 text-justify leading-relaxed text-[11px] text-slate-900">
                                {line}
                              </p>
                            );
                          })}
                        </div>
                      );
                    }

                    return (
                      <p key={bIdx} className="indent-8 text-justify leading-relaxed text-[11px] text-slate-900">
                        {block}
                      </p>
                    );
                  })}
                </div>
              );
            };

            return (
              <div className="space-y-7 text-slate-900 leading-relaxed font-serif text-[11px]">
                {/* 1. NOTA DINAS / METADATA NASKAH DINAS RESMI (BORDERLESS) */}
                <div className="border-b-2 border-slate-900 pb-4 mb-4">
                  <table className="table-borderless borderless w-full text-xs font-sans">
                    <tbody>
                      <tr className="align-top">
                        <td className="w-1/2 p-0 pr-4">
                          <table className="table-borderless borderless w-full text-[11px] leading-tight">
                            <tbody>
                              <tr>
                                <td className="w-20 font-semibold text-slate-700 py-0.5">Nomor</td>
                                <td className="w-3 text-center py-0.5">:</td>
                                <td className="font-mono font-bold text-slate-900 py-0.5">{selectedReport.reportNumber}</td>
                              </tr>
                              <tr>
                                <td className="font-semibold text-slate-700 py-0.5">Sifat</td>
                                <td className="text-center py-0.5">:</td>
                                <td className="font-bold text-rose-800 uppercase py-0.5 tracking-wider">RAHASIA (CONFIDENTIAL)</td>
                              </tr>
                              <tr>
                                <td className="font-semibold text-slate-700 py-0.5">Lampiran</td>
                                <td className="text-center py-0.5">:</td>
                                <td className="py-0.5 text-slate-800">1 (Satu) Berkas Lengkap</td>
                              </tr>
                              <tr>
                                <td className="font-semibold text-slate-700 py-0.5">Perihal</td>
                                <td className="text-center py-0.5">:</td>
                                <td className="font-bold py-0.5 text-slate-900">
                                  Penyampaian Laporan Hasil Pengawasan / Audit ({selectedReport.auditType})
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>

                        <td className="w-1/2 p-0 pl-4 border-l border-slate-300">
                          <div className="text-[11px] font-sans space-y-1">
                            <p className="text-slate-700">Lubuk Sikaping, {formatIndoDate(selectedReport.reportDate)}</p>
                            <p className="text-slate-800 font-semibold pt-1">Kepada Yth.</p>
                            <p className="font-bold text-slate-950 uppercase">
                              Direktur Perumda Air Minum Tirta Saiyo
                            </p>
                            <p className="text-slate-700">Kabupaten Pasaman</p>
                            <p className="text-slate-600 italic">di -</p>
                            <p className="font-bold tracking-widest text-slate-800 pl-4">TEMPAT</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. TABEL INFORMASI OBJEK & TIM PENGAWAS */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-300 font-sans text-xs">
                  <table className="table-borderless borderless w-full leading-relaxed">
                    <tbody>
                      <tr>
                        <td className="w-40 font-bold text-slate-700 py-0.5">Objek Pengawasan / Unit</td>
                        <td className="w-3 text-center py-0.5">:</td>
                        <td className="font-bold text-slate-900 py-0.5 uppercase">{selectedReport.unitName}</td>
                      </tr>
                      <tr>
                        <td className="font-bold text-slate-700 py-0.5">Dasar Surat Perintah Tugas</td>
                        <td className="text-center py-0.5">:</td>
                        <td className="font-mono font-semibold text-slate-900 py-0.5">
                          {selectedReport.assignmentNumber || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold text-slate-700 py-0.5">Periode Pemeriksaan</td>
                        <td className="text-center py-0.5">:</td>
                        <td className="py-0.5 text-slate-800">{selectedReport.auditPeriod || '-'}</td>
                      </tr>
                      <tr>
                        <td className="font-bold text-slate-700 py-0.5">Jenis Pengawasan</td>
                        <td className="text-center py-0.5">:</td>
                        <td className="py-0.5 text-slate-800">{selectedReport.auditType}</td>
                      </tr>
                      <tr>
                        <td className="font-bold text-slate-700 py-0.5">Susunan Tim Auditor SPI</td>
                        <td className="text-center py-0.5">:</td>
                        <td className="py-0.5 text-slate-800">
                          <span className="font-semibold text-slate-900">Pengendali Teknis:</span> {selectedReport.supervisor || '-'} ·{' '}
                          <span className="font-semibold text-slate-900">Ketua Tim:</span> {selectedReport.teamLeader || '-'} ·{' '}
                          <span className="font-semibold text-slate-900">Anggota:</span> {selectedReport.teamMembers || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. OPINI PENGAWASAN SPI (CALLOUT BOX RESMI) */}
                <div className="p-4 bg-emerald-50/60 border-2 border-emerald-800 rounded-lg text-justify font-sans">
                  <div className="flex items-center justify-between border-b border-emerald-300 pb-2 mb-2">
                    <span className="font-bold uppercase tracking-wider text-xs text-emerald-950">
                      Pernyataan Opini Pengawasan Satuan Pengawasan Intern (SPI)
                    </span>
                    <span className="font-bold font-mono text-xs px-2.5 py-0.5 bg-emerald-800 text-white rounded">
                      {selectedReport.auditOpinion.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-950 leading-relaxed font-serif">
                    Berdasarkan pengujian audit ketaatan, verifikasi dokumen substantif, rekonsiliasi data operasional, dan observasi fisik di lapangan, Satuan Pengawasan Intern (SPI) Perumda Air Minum Tirta Saiyo menyimpulkan bahwa sistem tata kelola, manajemen risiko, dan pengendalian intern pada <strong>{selectedReport.unitName}</strong> dinilai berkategori <strong>"{selectedReport.auditOpinion}"</strong>, dengan pertimbangan dan uraian rincian temuan serta rekomendasi strategis sebagaimana disajikan dalam laporan ini.
                  </p>
                </div>

                {/* 4. BAB I: DASAR HUKUM, RUANG LINGKUP & GAMBARAN UMUM */}
                <div className="space-y-4">
                  <div className="border-b-2 border-slate-800 pb-1 font-sans font-bold text-xs uppercase tracking-wider text-slate-950">
                    BAB I. INFORMASI UMUM & DASAR PENUGASAN
                  </div>
                  <div className="space-y-4 pl-3">
                    <div>
                      <h5 className="font-sans font-bold text-xs text-slate-900 mb-1.5">
                        1.1 Dasar Hukum & Mandat Pengawasan
                      </h5>
                      {renderReportSection(selectedReport.backgroundAndBasis, [
                        'Pelaksanaan pengawasan intern ini berlandaskan pada Undang-Undang Republik Indonesia Nomor 23 Tahun 2014 tentang Pemerintahan Daerah, Peraturan Pemerintah Republik Indonesia Nomor 54 Tahun 2017 tentang Badan Usaha Milik Daerah, serta Peraturan Daerah Kabupaten Pasaman tentang Pendirian Perusahaan Umum Daerah Air Minum Tirta Saiyo Kabupaten Pasaman.',
                        'Secara operasional pengawasan, Tim Satuan Pengawasan Intern (SPI) berpedoman pada Piagam Pengawasan Intern (Internal Audit Charter) SPI Tirta Saiyo, Standar Audit Intern Pemerintah Indonesia (AAIPI) yang diterbitkan oleh Asosiasi Auditor Intern Pemerintah Indonesia, serta Peraturan Pemerintah Nomor 60 Tahun 2008 tentang Sistem Pengendalian Intern Pemerintah (SPIP).',
                        `Penugasan audit ini dilaksanakan secara resmi berdasarkan Surat Perintah Tugas (SPT) Nomor: ${selectedReport.assignmentNumber || 'SPT/SPI-PAS/2025'} yang diterbitkan oleh Direksi Perumda Air Minum Tirta Saiyo. Seluruh auditor yang ditugaskan telah menandatangani pakta integritas, bersikap objektif, serta bebas dari segala benturan kepentingan (conflict of interest) demi menjaga independensi hasil pengawasan.`
                      ])}
                    </div>

                    <div>
                      <h5 className="font-sans font-bold text-xs text-slate-900 mb-1.5">
                        1.2 Ruang Lingkup & Tujuan Pemeriksaan
                      </h5>
                      {renderReportSection(selectedReport.auditScope, [
                        `Pengawasan intern atas ${selectedReport.unitName} bertujuan untuk memberikan keyakinan memadai (reasonable assurance) mengenai kepatuhan terhadap peraturan perundang-undangan dan tata tertib operasional perusahaan, keandalan pelaporan data transaksi penerimaan, perlindungan dan efisiensi pengelolaan aset fisik, serta efektivitas sistem pengendalian intern pada periode pemeriksaan ${selectedReport.auditPeriod || '-'}.`,
                        'Adapun ruang lingkup pengujian substantif dan audit ketaatan mencakup area strategis operasional:\n1. Uji petik ketaatan terhadap Standar Operasional Prosedur (SOP) pelayanan, distribusi air, dan administrasi operasional;\n2. Rekonsiliasi berkala penerimaan kas, buku kasir, dan integrasi penagihan rekening air pelanggan;\n3. Pemeriksaan fisik meter air pelanggan, pengelolaan sambungan langganan (SL), dan penertiban sambungan liar guna menekan tingkat kehilangan air (NRW);\n4. Tata kelola persediaan barang/material perpipaan dan bahan kimia pengolahan air minum di gudang unit;\n5. Pengujian keabsahan dokumen pendukung pertanggungjawaban operasional dan kepatuhan perpajakan/administrasi.',
                        'Metodologi pemeriksaan dilaksanakan melalui penelaahan regulasi (desk audit), konfirmasi saldo dan dokumen sumber, wawancara mendalam dengan personil pelaksana, observasi fisik langsung di lapangan (on-site verification), serta rekonsiliasi data elektronik pada sistem billing Tirta Saiyo.'
                      ])}
                    </div>

                    <div>
                      <h5 className="font-sans font-bold text-xs text-slate-900 mb-1.5">
                        1.3 Gambaran Umum Objek Audit
                      </h5>
                      {renderReportSection(selectedReport.generalOverview, [
                        `${selectedReport.unitName} merupakan unit kerja operasional pelayanan strategis pada Perumda Air Minum Tirta Saiyo Kabupaten Pasaman. Unit ini mengemban mandat vital dalam menjamin kelancaran kontinuitas distribusi air minum yang memenuhi standar kualitas Permenkes, pemeliharaan keandalan jaringan transmisi/distribusi, serta peningkatan cakupan sambungan pelanggan di wilayah pelayanannya.`,
                        `Dalam aktivitas bisnis hariannya, ${selectedReport.unitName} melayani kebutuhan air minum masyarakat dengan didukung oleh infrastruktur intake air baku, instalasi pengolahan air (IPA), reservoir penampungan, dan jaringan perpipaan distribusi. Seluruh transaksi pelayanan sambungan baru, perbaikan gangguan teknis kebocoran, pencatatan stand meter, dan pelaporan penerimaan kas dikelola secara bertahap terkoordinasi dengan kantor pusat di Lubuk Sikaping.`,
                        'Mengingat peran strategis unit kerja ini terhadap pendapatan operasional dan citra pelayanan Perumda Air Minum Tirta Saiyo di mata masyarakat Kabupaten Pasaman, penerapan tata kelola yang transparan, akuntabel, dan bebas dari potensi kebocoran merupakan prioritas utama yang senantiasa dipantau oleh Satuan Pengawasan Intern.'
                      ])}
                    </div>
                  </div>
                </div>

                {/* 5. BAB II: RINGKASAN EKSEKUTIF */}
                <div className="space-y-4">
                  <div className="border-b-2 border-slate-800 pb-1 font-sans font-bold text-xs uppercase tracking-wider text-slate-950">
                    BAB II. RINGKASAN EKSEKUTIF
                  </div>
                  <div className="pl-3 space-y-2">
                    {renderReportSection(selectedReport.executiveSummary, [
                      `Satuan Pengawasan Intern (SPI) Perumda Air Minum Tirta Saiyo Kabupaten Pasaman telah menyelesaikan penugasan pengawasan ketaatan dan operasional atas ${selectedReport.unitName} untuk periode ${selectedReport.auditPeriod || '-'}. Pemeriksaan diarahkan untuk mengevaluasi keandalan sistem pengendalian intern serta mengidentifikasi area yang mengandung risiko kepatuhan dan finansial.`,
                      `Secara umum, manajemen dan staf ${selectedReport.unitName} telah menunjukkan komitmen dalam menjaga kontinuitas suplai air bersih kepada masyarakat. Namun demikian, pengujian audit mengungkap beberapa kelemahan dalam pemisahan fungsi operasional, ketertiban administrasi pencatatan kas/tagihan rekening, keterlambatan pelaporan opname fisik material, serta belum optimalnya pengendalian atas meter air rusak yang berpotensi memicu kehilangan air (NRW) dan penurunan realisasi pendapatan perusahaan.`,
                      `Berdasarkan simpulan pengujian 5 unsur SPIP dan analisis temuan berlandaskan metodologi 5C (Condition, Criteria, Cause, Consequence, Corrective Action), SPI menyatakan opini pengawasan berkategori "${selectedReport.auditOpinion}". Opini ini mengindikasikan bahwa sistem pengendalian intern yang ada telah berfungsi secara umum, namun memerlukan tindakan korektif terstruktur dan pengawasan berjenjang yang ketat agar risiko kerugian dapat diminimalisir sedini mungkin.`,
                      'Pimpinan unit kerja bersama segenap jajaran terkait diharapkan segera menyusun dan menindaklanjuti rencana aksi perbaikan (Action Plan) sesuai dengan rekomendasi yang tertuang dalam Bab IV laporan ini, dengan batas waktu pemenuhan tindak lanjut maksimal 30 (tiga puluh) hari kalender sejak laporan ini diserahkan secara resmi.'
                    ])}
                  </div>
                </div>

                {/* 6. BAB III: EVALUASI SISTEM PENGENDALIAN INTERN & MATRIKS TEMUAN 5C */}
                <div className="space-y-4">
                  <div className="border-b-2 border-slate-800 pb-1 font-sans font-bold text-xs uppercase tracking-wider text-slate-950">
                    BAB III. EVALUASI SISTEM PENGENDALIAN INTERN (SPIP) & HASIL TEMUAN 5C
                  </div>
                  <div className="pl-3 space-y-4">
                    <div>
                      <h5 className="font-sans font-bold text-xs text-slate-900 mb-1.5">
                        3.1 Evaluasi Sistem Pengendalian Intern Berstandar SPIP
                      </h5>
                      {renderReportSection(selectedReport.internalControlEvaluation, [
                        `Evaluasi pengendalian intern dilaksanakan mengacu pada Peraturan Pemerintah Nomor 60 Tahun 2008 tentang Sistem Pengendalian Intern Pemerintah (SPIP) yang mencakup 5 (lima) unsur utama pada lingkungan ${selectedReport.unitName}:`,
                        '1. Lingkungan Pengendalian: Komitmen pimpinan unit dalam menegakkan disiplin kerja dan integritas pelayanan tergolong baik, namun penegakan pendelegasian wewenang dan pembagian tugas tertulis antara fungsi penagihan, pencatatan, dan penyimpanan kas masih perlu dipertegas untuk mencegah risiko perangkapan tugas (segregation of duties).',
                        '2. Penilaian Risiko (Risk Assessment): Unit kerja belum mendokumentasikan register risiko operasional secara komprehensif, khususnya dalam memetakan potensi risiko kebocoran fisik pipa transmisi, fluktuasi debit air baku pada musim kemarau, dan risiko tunggakan piutang rekening air pelanggan lama.',
                        '3. Kegiatan Pengendalian (Control Activities): Mekanisme otorisasi berjenjang belum sepenuhnya terdokumentasi dalam lembar verifikasi tertulis, terutama pada bukti penerimaan setoran kasir harian dan berita acara pengeluaran material pemeliharaan dari gudang unit.',
                        '4. Informasi dan Komunikasi: Alur penyampaian laporan mutasi pelanggan, keluhan teknis air keruh/mati, dan data meter rusak ke sistem informasi pusat telah berjalan, tetapi masih sering mengalami jeda waktu (time-lag) rekonsiliasi yang menghambat keakuratan laporan billing akhir bulan.',
                        '5. Pemantauan Pengendalian Intern (Monitoring): Supervisi berkala oleh kepala unit atas kepatuhan SOP lapangan dan tindak lanjut rekomendasi audit periode sebelumnya belum dilakukan secara terjadwal dan terarsip dengan tertib.'
                      ])}
                    </div>

                    <div>
                      <h5 className="font-sans font-bold text-xs text-slate-900 mb-2">
                        3.2 Matriks Temuan Pemeriksaan Berdasarkan Metodologi 5C
                      </h5>
                      <p className="text-justify leading-relaxed text-[10.5px] text-slate-600 mb-2">
                        Hasil audit dirumuskan dengan metodologi baku 5C: <em>Condition</em> (Kondisi Nyata), <em>Criteria</em> (Ketentuan/SOP yang Dilanggar), <em>Cause</em> (Akar Masalah), <em>Consequence</em> (Dampak/Potensi Kerugian), dan <em>Corrective Action</em> (Rekomendasi Perbaikan SPI):
                      </p>

                      {/* TABEL DATA MATRIKS TEMUAN 5C RESMI */}
                      {reportFindings.length > 0 ? (
                        <table className="w-full text-[10px] font-sans border border-slate-400">
                          <thead>
                            <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                              <th className="w-8 text-center p-2 border-r border-slate-300">No.</th>
                              <th className="w-36 text-left p-2 border-r border-slate-300">Kode & Judul Temuan</th>
                              <th className="w-20 text-center p-2 border-r border-slate-300">Tingkat Risiko</th>
                              <th className="text-left p-2 border-r border-slate-300">Kondisi (Fakta) & Kriteria (Aturan)</th>
                              <th className="text-left p-2 border-r border-slate-300">Sebab & Akibat (Kerugian)</th>
                              <th className="w-48 text-left p-2">Rekomendasi SPI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportFindings.map((f, idx) => (
                              <tr key={f.id} className="align-top border-b border-slate-300 even:bg-slate-50/50">
                                <td className="text-center font-bold p-2 border-r border-slate-300">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-300">
                                  <div className="font-bold text-slate-900">{f.title}</div>
                                  <div className="font-mono text-[9px] text-slate-500 mt-0.5">{f.findingNumber}</div>
                                  <div className="text-[9px] text-slate-600 mt-1 italic">{f.category}</div>
                                </td>
                                <td className="text-center p-2 border-r border-slate-300">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 font-bold rounded text-[9px] ${
                                      f.riskLevel === 'Kritis'
                                        ? 'bg-rose-100 text-rose-800'
                                        : f.riskLevel === 'Tinggi'
                                        ? 'bg-amber-100 text-amber-800'
                                        : f.riskLevel === 'Sedang'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {f.riskLevel.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-2 border-r border-slate-300">
                                  <div className="mb-1.5">
                                    <span className="font-bold text-slate-800 block text-[9px]">Kondisi:</span>
                                    <p className="text-slate-700 leading-snug">{f.condition}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 block text-[9px]">Kriteria:</span>
                                    <p className="text-slate-600 leading-snug italic">{f.criteria}</p>
                                  </div>
                                </td>
                                <td className="p-2 border-r border-slate-300">
                                  <div className="mb-1.5">
                                    <span className="font-bold text-slate-800 block text-[9px]">Sebab:</span>
                                    <p className="text-slate-700 leading-snug">{f.cause}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 block text-[9px]">Akibat:</span>
                                    <p className="text-slate-600 leading-snug">{f.consequence}</p>
                                    {f.potentialLoss > 0 && (
                                      <p className="font-bold font-mono text-rose-700 mt-1">
                                        Nilai Risiko: {formatIdr(f.potentialLoss)}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2">
                                  <p className="text-slate-800 leading-snug font-medium">
                                    {f.auditorAnalysis || 'Direkomendasikan perbaikan SOP dan tindak lanjut penagihan/verifikasi langsung.'}
                                  </p>
                                  {f.auditeeResponse && (
                                    <div className="mt-1 pt-1 border-t border-slate-200 text-[9px] text-slate-500 italic">
                                      Tanggapan: {f.auditeeResponse}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : null}

                      {/* Ringkasan Naratif Temuan (Jika diisi atau sebagai pengantar) */}
                      {selectedReport.keyFindingsSummary && (
                        <div className="mt-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-justify leading-relaxed whitespace-pre-line font-serif text-[11px]">
                          <span className="font-sans font-bold text-xs text-slate-900 block mb-1">
                            Uraian Penjelasan Temuan Pemeriksaan:
                          </span>
                          {selectedReport.keyFindingsSummary}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 7. BAB IV: KESIMPULAN MENYELURUH & REKOMENDASI STRATEGIS */}
                <div className="space-y-4">
                  <div className="border-b-2 border-slate-800 pb-1 font-sans font-bold text-xs uppercase tracking-wider text-slate-950">
                    BAB IV. KESIMPULAN & REKOMENDASI STRATEGIS
                  </div>
                  <div className="pl-3 space-y-4">
                    <div>
                      <h5 className="font-sans font-bold text-xs text-slate-900 mb-1.5">
                        4.1 Kesimpulan Menyeluruh
                      </h5>
                      {renderReportSection(selectedReport.overallConclusion, [
                        `Berdasarkan seluruh rangkaian prosedur pemeriksaan ketaatan, verifikasi dokumen, uji petik transaksi, dan observasi fisik lapangan yang telah diselesaikan oleh Tim Satuan Pengawasan Intern, disimpulkan bahwa kegiatan operasional pada ${selectedReport.unitName} telah berjalan dalam koridor pelayanan umum.`,
                        'Meskipun demikian, SPI menggarisbawahi bahwa beberapa kelemahan dalam kepatuhan administrasi, penanganan meter air pelanggan, dan rekonsiliasi penerimaan kas harus segera diselesaikan. Kelemahan-kelemahan tersebut jika dibiarkan dapat bermuara pada penurunan efisiensi operasional, risiko kehilangan air (NRW) komersial, serta kerugian finansial yang dapat mengganggu pencapaian target kinerja Perumda Air Minum Tirta Saiyo.',
                        'Dukungan penuh Direksi serta kesungguhan jajaran manajemen objek audit dalam mengeksekusi rekomendasi perbaikan secara cepat, tepat, dan terukur akan menjadi kunci keberhasilan pembenahan tata kelola dan keberlanjutan pelayanan air minum di Kabupaten Pasaman.'
                      ])}
                    </div>

                    <div>
                      <h5 className="font-sans font-bold text-xs text-slate-900 mb-1.5">
                        4.2 Rekomendasi Strategis Tata Kelola (Corporate Governance)
                      </h5>
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                        {renderReportSection(selectedReport.strategicRecommendations, [
                          '1. Penguatan Supervisi Berjenjang & Pemisahan Fungsi: Menginstruksikan Kepala Unit untuk menerapkan sistem validasi dan paraf berjenjang pada setiap lembar bukti kasir harian, serta memastikan adanya pemisahan tugas yang tegas antara petugas pencatat, penagih, dan pemegang kas.',
                          '2. Kepatuhan Ketat terhadap SOP Operasional & Distribusi: Mewajibkan seluruh staf teknis dan administrasi mematuhi SOP penerimaan kas, SOP perbaikan kebocoran pipa, dan SOP pemeliharaan meter air secara konsisten, disertai berita acara tertulis pada setiap penanganan lapangan.',
                          '3. Percepatan Penggantian Meter Rusak & Penertiban NRW: Segera menyusun jadwal uji tera dan peremajaan meter air pelanggan yang berusia di atas 5 (lima) tahun atau tidak berputar, serta mengintensifkan razia terpadu pemakaian air tanpa meter guna menekan kehilangan air komersial.',
                          '4. Rekonsiliasi Rutin Data Billing dan Keuangan: Melakukan rekonsiliasi berkala antara data penerimaan fisik, rekening koran bank persepsi, dan buku besar sistem billing sebelum tanggal penutupan kas bulanan guna menjamin zero-discrepancy.',
                          '5. Pembentukan Rencana Aksi Pemantauan Tindak Lanjut: Membentuk tim kerja internal unit untuk menyelesaikan seluruh rekomendasi SPI selambat-lambatnya 30 (tiga puluh) hari kalender dan menyampaikan formulir TP-RHA resmi kepada Direktur dengan tembusan Kepala SPI.'
                        ])}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-sans font-bold text-xs text-slate-900 mb-1.5">
                        4.3 Komitmen & Rencana Aksi Manajemen (Action Plan)
                      </h5>
                      {renderReportSection(selectedReport.managementCommitment, [
                        `Manajemen ${selectedReport.unitName} menyatakan menerima secara utuh seluruh hasil pemeriksaan, temuan, dan rekomendasi yang dirumuskan oleh Satuan Pengawasan Intern (SPI) Perumda Air Minum Tirta Saiyo Kabupaten Pasaman.`,
                        'Sebagai wujud tata kelola perusahaan yang baik (Good Corporate Governance), pimpinan unit berkomitmen untuk segera merealisasikan seluruh rekomendasi perbaikan sesuai jadwal matriks rencana aksi (Action Plan) dan melaporkan perkembangannya secara tertulis setiap minggu hingga seluruh temuan dinyatakan tuntas (selesai).'
                      ])}
                    </div>
                  </div>
                </div>

                {/* 8. TEMBUSAN NASKAH DINAS (DISTRIBUTION LIST) */}
                <div className="pt-4 border-t border-slate-300 font-sans text-[10.5px] text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">Tembusan disampaikan kepada Yth:</p>
                  <ol className="list-decimal list-inside pl-1 space-y-0.5">
                    <li>Bupati Pasaman (selaku Kuasa Pemilik Modal / KPM Perumda Air Minum Tirta Saiyo);</li>
                    <li>Dewan Pengawas Perumda Air Minum Tirta Saiyo Kabupaten Pasaman;</li>
                    <li>Kepala Satuan Pengawasan Intern (SPI);</li>
                    <li>Kepala Unit / Bagian {selectedReport.unitName} (Auditee);</li>
                    <li>Pertinggal / Arsip Dokumen Pengawasan SPI.</li>
                  </ol>
                </div>
              </div>
            );
          }}
        </DocumentPrintPreviewModal>
      )}
    </div>
  );
};
