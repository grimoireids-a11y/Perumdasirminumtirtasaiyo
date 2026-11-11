import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Lock,
  Info,
  Layers,
  BookOpen,
  BarChart3,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  Filter,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/firebase';
import {
  RiskRegister,
  Unit,
  RiskLevel,
  ControlEffectiveness,
  RiskTreatmentOption,
  RiskCause5M,
  RiskDimension,
  RiskImpactArea,
} from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';
import {
  BPKP_RISK_CATEGORIES,
  BPKP_LIKELIHOOD_LEVELS,
  BPKP_IMPACT_LEVELS,
  BPKP_CASE_STUDIES,
} from '../../data/bpkpStandards';
import { RiskRegisterManualBookModal } from './RiskRegisterManualBookModal';

interface RiskRegisterModuleProps {
  onOpenAiAssistantWithContext?: (context: any) => void;
  onNavigateToPkpt?: (risk: RiskRegister) => void;
}

type ActiveViewTab = 'register' | 'heatmap' | 'spi_review' | 'bpkp_guide';

export const RiskRegisterModule: React.FC<RiskRegisterModuleProps> = ({
  onOpenAiAssistantWithContext,
  onNavigateToPkpt,
}) => {
  const { userProfile, hasRole } = useAuth();
  const currentYear = new Date().getFullYear();

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('register');

  const [risks, setRisks] = useState<RiskRegister[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [selectedReviewFilter, setSelectedReviewFilter] = useState<string>('ALL');

  // Heatmap interactive cell filter
  const [heatmapCellFilter, setHeatmapCellFilter] = useState<{ l: number; i: number } | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSpiReviewModalOpen, setIsSpiReviewModalOpen] = useState(false);
  const [isManualBookOpen, setIsManualBookOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskRegister | null>(null);
  const [reviewingRisk, setReviewingRisk] = useState<RiskRegister | null>(null);

  // Form states based on BPKP standards
  const [formCode, setFormCode] = useState('');
  const [formYear, setFormYear] = useState<number>(currentYear);
  const [formUnitId, setFormUnitId] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formBusinessProcess, setFormBusinessProcess] = useState('');
  const [formCategory, setFormCategory] = useState<string>(BPKP_RISK_CATEGORIES[6].name); // default Risiko Operasional
  const [formDimension, setFormDimension] = useState<RiskDimension>('Dimensi Kualitas');
  const [formCauseCategory5M, setFormCauseCategory5M] = useState<RiskCause5M>('MACHINE (Peralatan & Bangunan)');
  const [formCause, setFormCause] = useState('');
  const [formEvent, setFormEvent] = useState('');
  const [formImpactArea, setFormImpactArea] = useState<RiskImpactArea>('Penundaan Layanan (SOP)');
  const [formImpactDesc, setFormImpactDesc] = useState('');
  const [formExistingControl, setFormExistingControl] = useState('');
  const [formLikelihood, setFormLikelihood] = useState<number>(3);
  const [formImpact, setFormImpact] = useState<number>(3);
  const [formControlEffectiveness, setFormControlEffectiveness] = useState<ControlEffectiveness>('Sebagian Efektif');
  const [formResidualLikelihood, setFormResidualLikelihood] = useState<number>(2);
  const [formResidualImpact, setFormResidualImpact] = useState<number>(2);
  const [formTreatmentOption, setFormTreatmentOption] = useState<RiskTreatmentOption>('Mengurangi (Reduce)');
  const [formMitigationPlan, setFormMitigationPlan] = useState('');
  const [formPic, setFormPic] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formStatus, setFormStatus] = useState<'Identifikasi' | 'Mitigasi' | 'Selesai'>('Mitigasi');

  // SPI Review form states
  const [reviewStatus, setReviewStatus] = useState<'Diusulkan Auditee' | 'Sesuai Kaidah' | 'Perlu Perbaikan Kaidah'>('Sesuai Kaidah');
  const [reviewNotes, setReviewNotes] = useState('');

  // Role permissions
  const isAuditee = userProfile?.role === 'AUDITEE';
  const isSpiAuditor = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);
  const isDireksiOrDewas = hasRole(['DIREKTUR', 'DEWAN_PENGAWAS']);

  // Auditee's assigned unit
  const auditeeUnitId = userProfile?.unitId || '';
  const auditeeUnitName = userProfile?.unitName || '';

  useEffect(() => {
    const unsubRisks = onSnapshot(collection(db, 'risk_registers'), (snap) => {
      setRisks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RiskRegister)));
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });

    return () => {
      unsubRisks();
      unsubUnits();
    };
  }, []);

  // Set unit filter automatically for Auditee
  useEffect(() => {
    if (isAuditee && auditeeUnitId) {
      setSelectedUnitFilter(auditeeUnitId);
    }
  }, [isAuditee, auditeeUnitId]);

  // Risk Score Calculator (BPKP 5x5 Matrix Slide 9)
  // 1-2: Sangat Rendah | 3-4: Rendah | 5-10: Sedang | 12-16: Tinggi | 20-25: Sangat Tinggi
  const calcRiskLevel = (score: number): RiskLevel => {
    if (score >= 20) return 'Sangat Tinggi';
    if (score >= 12) return 'Tinggi';
    if (score >= 5) return 'Sedang';
    if (score >= 3) return 'Rendah';
    return 'Sangat Rendah';
  };

  const inherentScore = formLikelihood * formImpact;
  const inherentLevel = calcRiskLevel(inherentScore);

  const residualScore = formResidualLikelihood * formResidualImpact;
  const residualLevel = calcRiskLevel(residualScore);

  // Open add modal with BPKP defaults
  const openAddModal = () => {
    setEditingRisk(null);
    const nextSeq = risks.length + 1;
    setFormCode(`RSK-${currentYear}-${String(nextSeq).padStart(3, '0')}`);
    setFormYear(currentYear);

    // If auditee, restrict to auditee's unit!
    if (isAuditee && auditeeUnitId) {
      setFormUnitId(auditeeUnitId);
      setFormPic(auditeeUnitName || userProfile?.displayName || '');
    } else {
      setFormUnitId(units[0]?.id || '');
      setFormPic(units[0]?.name || '');
    }

    setFormObjective('Menjamin kontinuitas suplai air bersih dan pelayanan pelanggan prima');
    setFormBusinessProcess('Distribusi, Pemeliharaan Transmisi & Efisiensi Jaringan');
    setFormCategory('Risiko Operasional');
    setFormDimension('Dimensi Kualitas');
    setFormCauseCategory5M('MACHINE (Peralatan & Bangunan)');
    setFormCause('Pompa transmisi intake sering aus dan jadwal preventive maintenance belum terjadwal');
    setFormEvent('Terjadinya gangguan kontinuitas pengaliran air bersih kepada pelanggan');
    setFormImpactArea('Penundaan Layanan (SOP)');
    setFormImpactDesc('Pelanggan tidak memperoleh air bersih secara kontinu dan lonjakan komplain layanan');
    setFormExistingControl('Perbaikan reaktif oleh regu teknis lapangan saat terjadi kerusakan');
    setFormLikelihood(3);
    setFormImpact(3);
    setFormControlEffectiveness('Sebagian Efektif');
    setFormResidualLikelihood(2);
    setFormResidualImpact(2);
    setFormTreatmentOption('Mengurangi (Reduce)');
    setFormMitigationPlan('Penyusunan jadwal preventive maintenance pompa mingguan, pengadaan genset cadangan otomatis, dan optimalisasi bak reservoir');
    setFormTargetDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setFormStatus('Mitigasi');
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (r: RiskRegister) => {
    // Security check: Auditee can ONLY edit risks of their own unit!
    if (isAuditee && r.unitId !== auditeeUnitId && r.unitName !== auditeeUnitName) {
      alert('Akses Dibatasi: Anda hanya memiliki wewenang untuk mengedit register risiko unit kerja Anda sendiri.');
      return;
    }

    setEditingRisk(r);
    setFormCode(r.code);
    setFormYear(r.year);
    setFormUnitId(r.unitId);
    setFormObjective(r.objective || 'Menjamin kelancaran tupoksi dan pelayanan unit kerja');
    setFormBusinessProcess(r.businessProcess);
    setFormCategory(r.category);
    setFormDimension(r.dimension || 'Dimensi Kualitas');
    setFormCauseCategory5M(r.causeCategory5M || 'MACHINE (Peralatan & Bangunan)');
    setFormCause(r.cause);
    setFormEvent(r.event);
    setFormImpactArea(r.impactArea || 'Penundaan Layanan (SOP)');
    setFormImpactDesc(r.impactDesc);
    setFormExistingControl(r.existingControl);
    setFormLikelihood(r.likelihood);
    setFormImpact(r.impact);
    setFormControlEffectiveness(r.controlEffectiveness);
    setFormResidualLikelihood(r.residualLikelihood || 2);
    setFormResidualImpact(r.residualImpact || 2);
    setFormTreatmentOption(r.treatmentOption || 'Mengurangi (Reduce)');
    setFormMitigationPlan(r.mitigationPlan);
    setFormPic(r.pic);
    setFormTargetDate(r.targetDate);
    setFormStatus(r.status);
    setIsModalOpen(true);
  };

  // Open SPI Review Modal
  const openSpiReviewModal = (r: RiskRegister) => {
    setReviewingRisk(r);
    setReviewStatus(r.spiReviewStatus || 'Sesuai Kaidah');
    setReviewNotes(
      r.spiReviewNotes ||
        `Rumusan risiko telah ditelaah oleh Satuan Pengawasan Intern (SPI) sesuai kaidah evaluasi BPKP (ISO 31000). Peristiwa risiko relevan terhadap sasaran unit ${r.unitName}, dengan akar penyebab 5M dan perlakuan risiko yang realistis.`
    );
    setIsSpiReviewModalOpen(true);
  };

  const handleSaveSpiReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRisk) return;

    try {
      await updateDoc(doc(db, 'risk_registers', reviewingRisk.id), {
        spiReviewStatus: reviewStatus,
        spiReviewNotes: reviewNotes,
        spiEvaluatedBy: userProfile?.displayName || 'Kepala SPI / Auditor',
        spiEvaluatedAt: new Date().toISOString(),
      });
      setIsSpiReviewModalOpen(false);
      setReviewingRisk(null);
    } catch (err) {
      console.error('Error updating SPI review:', err);
      alert('Gagal menyimpan hasil evaluasi SPI.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce Auditee unit assignment
    const targetUnitId = isAuditee && auditeeUnitId ? auditeeUnitId : formUnitId;
    const selectedUnitObj = units.find((u) => u.id === targetUnitId);
    const unitName = isAuditee && auditeeUnitName ? auditeeUnitName : selectedUnitObj ? selectedUnitObj.name : 'Unit Kerja Tirta Saiyo';

    const riskData: Omit<RiskRegister, 'id'> = {
      code: formCode,
      year: formYear,
      unitId: targetUnitId,
      unitName,
      objective: formObjective,
      businessProcess: formBusinessProcess,
      category: formCategory,
      dimension: formDimension,
      causeCategory5M: formCauseCategory5M,
      cause: formCause,
      event: formEvent,
      impactArea: formImpactArea,
      impactDesc: formImpactDesc,
      existingControl: formExistingControl,
      likelihood: formLikelihood,
      impact: formImpact,
      inherentScore,
      inherentLevel,
      controlEffectiveness: formControlEffectiveness,
      residualLikelihood: formResidualLikelihood,
      residualImpact: formResidualImpact,
      residualScore,
      residualLevel,
      treatmentOption: formTreatmentOption,
      mitigationPlan: formMitigationPlan,
      pic: formPic || unitName,
      targetDate: formTargetDate,
      status: formStatus,
      spiReviewStatus: editingRisk?.spiReviewStatus || 'Diusulkan Auditee',
      spiReviewNotes: editingRisk?.spiReviewNotes || '',
      createdBy: editingRisk?.createdBy || userProfile?.displayName || 'Auditee Unit',
      createdAt: editingRisk?.createdAt || new Date().toISOString(),
    };

    try {
      if (editingRisk) {
        await updateDoc(doc(db, 'risk_registers', editingRisk.id), riskData);
      } else {
        const id = 'risk-' + Date.now();
        await setDoc(doc(db, 'risk_registers', id), { id, ...riskData });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving risk register:', err);
      alert('Terjadi kesalahan saat menyimpan data register risiko.');
    }
  };

  const handleDelete = async (r: RiskRegister) => {
    // Security check: Auditee can ONLY delete their own unit's risk
    if (isAuditee && r.unitId !== auditeeUnitId && r.unitName !== auditeeUnitName) {
      alert('Akses Dibatasi: Anda tidak dapat menghapus register risiko milik unit kerja lain.');
      return;
    }

    if (!window.confirm(`Hapus register risiko ${r.code} (${r.event})?`)) return;
    try {
      await deleteDoc(doc(db, 'risk_registers', r.id));
    } catch (err) {
      console.error('Error deleting risk:', err);
      alert('Gagal menghapus item risiko.');
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredRisks.map((r, idx) => ({
      No: idx + 1,
      'Kode Risiko': r.code,
      Tahun: r.year,
      'Unit Kerja': r.unitName,
      'Sasaran / Tujuan Unit': r.objective || '-',
      'Proses Bisnis': r.businessProcess,
      'Kategori Risiko BPKP': r.category,
      '3 Dimensi Risiko': r.dimension || '-',
      'Peristiwa Risiko': r.event,
      'Akar Masalah (5M)': r.causeCategory5M || '-',
      'Uraian Penyebab': r.cause,
      'Area Dampak': r.impactArea || '-',
      'Uraian Dampak': r.impactDesc,
      'Kontrol Eksisting': r.existingControl,
      'Likelihood Inherent': r.likelihood,
      'Impact Inherent': r.impact,
      'Skor Inherent': r.inherentScore,
      'Tingkat Inherent': r.inherentLevel,
      'Efektivitas Kontrol': r.controlEffectiveness,
      'Likelihood Residual': r.residualLikelihood,
      'Impact Residual': r.residualImpact,
      'Skor Residual': r.residualScore,
      'Tingkat Residual': r.residualLevel,
      'Opsi Perlakuan (BPKP)': r.treatmentOption || 'Mengurangi (Reduce)',
      'Rencana Mitigasi': r.mitigationPlan,
      PIC: r.pic,
      'Target Selesai': r.targetDate,
      Status: r.status,
      'Status Evaluasi SPI': r.spiReviewStatus || 'Diusulkan Auditee',
      'Catatan Evaluasi SPI': r.spiReviewNotes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Register Risiko BPKP');
    XLSX.writeFile(
      wb,
      `Risk_Register_BPKP_Tirta_Saiyo_${isAuditee && auditeeUnitName ? auditeeUnitName.replace(/\s+/g, '_') : 'Korporat'}_${selectedYear}.xlsx`
    );
  };

  // Filtered risks based on permissions, search, year, unit, and category
  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      // 1. Auditee strictly sees only their unit's risks!
      if (isAuditee) {
        const matchesAuditeeUnit =
          (auditeeUnitId && r.unitId === auditeeUnitId) ||
          (auditeeUnitName && r.unitName.toLowerCase().includes(auditeeUnitName.toLowerCase()));
        if (!matchesAuditeeUnit) return false;
      } else if (selectedUnitFilter !== 'ALL') {
        if (r.unitId !== selectedUnitFilter) return false;
      }

      // 2. Search filter
      const matchesSearch =
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.objective && r.objective.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.cause.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // 3. Year filter
      if (selectedYear !== 0 && r.year !== selectedYear) return false;

      // 4. Category filter
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;

      // 5. Level filter
      if (selectedLevel !== 'ALL' && r.residualLevel !== selectedLevel) return false;

      // 6. SPI Review filter
      if (selectedReviewFilter !== 'ALL' && r.spiReviewStatus !== selectedReviewFilter) return false;

      // 7. Heatmap cell filter
      if (heatmapCellFilter) {
        if (r.residualLikelihood !== heatmapCellFilter.l || r.residualImpact !== heatmapCellFilter.i) {
          return false;
        }
      }

      return true;
    });
  }, [
    risks,
    isAuditee,
    auditeeUnitId,
    auditeeUnitName,
    selectedUnitFilter,
    searchTerm,
    selectedYear,
    selectedCategory,
    selectedLevel,
    selectedReviewFilter,
    heatmapCellFilter,
  ]);

  // Risk badge styling (BPKP 5 Levels)
  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'Sangat Tinggi':
      case 'Ekstrem':
        return (
          <span className="px-2 py-0.5 text-[10px] font-black text-rose-800 bg-rose-100 border border-rose-300 rounded-md">
            Sangat Tinggi (20-25)
          </span>
        );
      case 'Tinggi':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold text-orange-800 bg-orange-100 border border-orange-300 rounded-md">
            Tinggi (12-16)
          </span>
        );
      case 'Sedang':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded-md">
            Sedang (5-10)
          </span>
        );
      case 'Rendah':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-md">
            Rendah (3-4)
          </span>
        );
      case 'Sangat Rendah':
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium text-blue-800 bg-blue-100 border border-blue-300 rounded-md">
            Sangat Rendah (1-2)
          </span>
        );
    }
  };

  // Helper for 5x5 heatmap cell color (BPKP Slide 9)
  const getCellColor = (l: number, i: number) => {
    const score = l * i;
    if (score >= 20) return 'bg-rose-500 text-white hover:bg-rose-600';
    if (score >= 12) return 'bg-orange-500 text-white hover:bg-orange-600';
    if (score >= 5) return 'bg-amber-400 text-slate-900 hover:bg-amber-500';
    if (score >= 3) return 'bg-emerald-500 text-white hover:bg-emerald-600';
    return 'bg-blue-500 text-white hover:bg-blue-600';
  };

  return (
    <div className="space-y-6">
      {/* AUDITEE RESTRICTION NOTICE BANNER */}
      {isAuditee && (
        <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-r-xl shadow-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 space-y-1">
            <p className="font-bold">
              Mode Akses Auditee: Terbatas Khusus Unit Kerja "{auditeeUnitName || 'Unit Terdaftar'}"
            </p>
            <p className="text-amber-800 leading-relaxed">
              Sesuai dengan tata kelola pengawasan intern dan pedoman manajemen risiko BPKP, akun Auditee hanya memiliki hak akses untuk menginput, memperbarui, dan memantau Register Risiko pada unit kerja Anda sendiri. Seluruh data yang Anda input akan dievaluasi oleh Satuan Pengawasan Intern (SPI).
            </p>
          </div>
        </div>
      )}

      {/* HEADER & ACTIONS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
              ISO 31000 & BPKP
            </span>
            <span className="text-xs text-slate-400 font-mono">5×5 Risk Appetite Matrix</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-emerald-700" />
            Register Risiko Unit & Evaluasi SPI (Berstandar BPKP)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penyusunan risiko berlandaskan 3 Dimensi, Akar Masalah 5M, 8 Kategori Risiko BPKP, dan Evaluasi Pengawasan Intern SPI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsManualBookOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Buka Buku Manual Lengkap Pengisian Register Risiko (Standar BPKP)"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
            <span>Buku Panduan 5×5</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            title="Cetak Naskah Dinas Register Risiko Resmi (Spasi Kop Manual 3.5 cm)"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cetak Register</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          {/* Both Auditee (for their own unit) and SPI can add new risks! */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAuditee ? '+ Input Risiko Unit' : '+ Input Risiko Baru'}</span>
          </button>
        </div>
      </div>

      {/* MODULE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('register');
            setHeatmapCellFilter(null);
          }}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'register'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Matriks Register Risiko ({filteredRisks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'heatmap'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Peta Selera Risiko 5×5 (BPKP Heatmap)</span>
        </button>

        <button
          onClick={() => setActiveTab('spi_review')}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'spi_review'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Evaluasi Manajemen Risiko oleh SPI (Slide 3 & 12)</span>
        </button>

        <button
          onClick={() => setActiveTab('bpkp_guide')}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'bpkp_guide'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kaidah & Studi Kasus BPKP</span>
        </button>
      </div>

      {/* TAB 1: REGISTER RISIKO TABLE */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Active Heatmap Filter Indicator */}
          {heatmapCellFilter && (
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-medium">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-700" />
                <span>
                  Menampilkan risiko pada sel matriks: <strong>Likelihood {heatmapCellFilter.l} × Impact {heatmapCellFilter.i}</strong> (Skor: {heatmapCellFilter.l * heatmapCellFilter.i})
                </span>
              </div>
              <button
                onClick={() => setHeatmapCellFilter(null)}
                className="text-[11px] underline font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
              >
                Hapus Filter Matriks
              </button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari peristiwa risiko, akar penyebab 5M, sasaran..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Unit Filter: Locked for Auditee */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 font-medium">Unit:</span>
                <select
                  disabled={isAuditee}
                  value={selectedUnitFilter}
                  onChange={(e) => setSelectedUnitFilter(e.target.value)}
                  className={`px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium ${
                    isAuditee ? 'opacity-80 bg-slate-100 cursor-not-allowed' : ''
                  }`}
                >
                  {!isAuditee && <option value="ALL">Semua Unit Kerja</option>}
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold"
              >
                <option value={currentYear}>{currentYear}</option>
                <option value={currentYear - 1}>{currentYear - 1}</option>
                <option value={0}>Semua Tahun</option>
              </select>

              {/* BPKP Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="ALL">Semua Kategori BPKP</option>
                {BPKP_RISK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Risk Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="ALL">Semua Level Risiko</option>
                <option value="Sangat Tinggi">Sangat Tinggi (20-25)</option>
                <option value="Tinggi">Tinggi (12-16)</option>
                <option value="Sedang">Sedang (5-10)</option>
                <option value="Rendah">Rendah (3-4)</option>
                <option value="Sangat Rendah">Sangat Rendah (1-2)</option>
              </select>

              {/* SPI Review Filter */}
              <select
                value={selectedReviewFilter}
                onChange={(e) => setSelectedReviewFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="ALL">Semua Status Telaah SPI</option>
                <option value="Sesuai Kaidah">Sesuai Kaidah BPKP</option>
                <option value="Perlu Perbaikan Kaidah">Perlu Perbaikan Kaidah</option>
                <option value="Diusulkan Auditee">Diusulkan Auditee</option>
              </select>
            </div>
          </div>

          {/* TABLE DISPLAY */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-3 px-3.5 w-24">Kode & Unit</th>
                    <th className="py-3 px-3.5 min-w-[220px]">Sasaran, Peristiwa & Kategori BPKP</th>
                    <th className="py-3 px-3.5 min-w-[200px]">Akar Masalah (5M) & Dampak</th>
                    <th className="py-3 px-3 text-center w-24">Inherent (L×I)</th>
                    <th className="py-3 px-3 text-center w-24">Residual (L×I)</th>
                    <th className="py-3 px-3.5 min-w-[220px]">Opsi & Mitigasi (BPKP)</th>
                    <th className="py-3 px-3 text-center w-24">Evaluasi SPI</th>
                    <th className="py-3 px-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredRisks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Belum ada data risiko yang sesuai dengan filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredRisks.map((r) => {
                      const isOwnRisk =
                        !isAuditee || r.unitId === auditeeUnitId || r.unitName === auditeeUnitName;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors align-top">
                          {/* Kode & Unit */}
                          <td className="py-3 px-3.5 font-mono">
                            <span className="font-bold text-emerald-800 block">{r.code}</span>
                            <span className="text-[11px] font-sans text-slate-600 block mt-0.5">
                              {r.unitName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans block">{r.year}</span>
                          </td>

                          {/* Sasaran, Peristiwa & Kategori */}
                          <td className="py-3 px-3.5 space-y-1">
                            {r.objective && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                <span className="font-semibold text-slate-700">Sasaran:</span> {r.objective}
                              </div>
                            )}
                            <p className="font-bold text-slate-900 leading-snug">{r.event}</p>
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded font-medium">
                                {r.category}
                              </span>
                              {r.dimension && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-medium">
                                  {r.dimension}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Akar Masalah (5M) & Dampak */}
                          <td className="py-3 px-3.5 space-y-1 text-[11px]">
                            <div>
                              <span className="font-bold text-slate-800 block text-[10px]">
                                Penyebab ({r.causeCategory5M || '5M'}):
                              </span>
                              <p className="text-slate-700 leading-tight">{r.cause}</p>
                            </div>
                            <div className="pt-0.5">
                              <span className="font-bold text-slate-800 block text-[10px]">
                                Dampak ({r.impactArea || 'Dampak'}):
                              </span>
                              <p className="text-slate-600 leading-tight">{r.impactDesc}</p>
                            </div>
                          </td>

                          {/* Inherent Score */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono font-bold text-slate-800 tabular-nums">
                                {r.likelihood}×{r.impact} = {r.inherentScore}
                              </span>
                              <div className="mt-1">{getRiskBadge(r.inherentLevel)}</div>
                            </div>
                          </td>

                          {/* Residual Score */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono font-bold text-emerald-900 tabular-nums">
                                {r.residualLikelihood}×{r.residualImpact} = {r.residualScore}
                              </span>
                              <div className="mt-1">{getRiskBadge(r.residualLevel)}</div>
                            </div>
                          </td>

                          {/* Opsi & Mitigasi */}
                          <td className="py-3 px-3.5 space-y-1">
                            <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded border border-emerald-200">
                              {r.treatmentOption || 'Mengurangi (Reduce)'}
                            </span>
                            <p className="text-slate-700 line-clamp-2 text-[11px] leading-tight">
                              {r.mitigationPlan || '-'}
                            </p>
                            <div className="text-[10px] text-slate-400">
                              <span>PIC: {r.pic}</span> · <span>Tgt: {r.targetDate}</span>
                            </div>
                          </td>

                          {/* SPI Review Status */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 text-[9.5px] font-bold rounded-full ${
                                r.spiReviewStatus === 'Sesuai Kaidah'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : r.spiReviewStatus === 'Perlu Perbaikan Kaidah'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {r.spiReviewStatus || 'Diusulkan Auditee'}
                            </span>
                            {r.spiReviewNotes && (
                              <p
                                className="text-[9px] text-slate-500 italic mt-1 line-clamp-2 cursor-help"
                                title={r.spiReviewNotes}
                              >
                                "{r.spiReviewNotes}"
                              </p>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex items-center gap-1">
                                {onOpenAiAssistantWithContext && (
                                  <button
                                    onClick={() =>
                                      onOpenAiAssistantWithContext({
                                        action: 'bpkp_risk_validation',
                                        event: r.event,
                                        cause: r.cause,
                                        causeCategory5M: r.causeCategory5M,
                                        impactDesc: r.impactDesc,
                                        objective: r.objective,
                                        treatmentOption: r.treatmentOption,
                                        unitName: r.unitName,
                                      })
                                    }
                                    className="p-1 text-amber-600 hover:text-amber-800 rounded-md transition-colors"
                                    title="Evaluasi Kaidah BPKP dengan Asisten AI"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Auditee can edit their own risk */}
                                {isOwnRisk && (
                                  <button
                                    onClick={() => openEditModal(r)}
                                    className="p-1 text-slate-500 hover:text-emerald-700 rounded-md transition-colors"
                                    title="Edit Risiko"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete only if own risk or SPI */}
                                {(isSpiAuditor || isOwnRisk) && (
                                  <button
                                    onClick={() => handleDelete(r)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                                    title="Hapus Risiko"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Evaluasi SPI Button: for SPI Auditors & Kepala SPI */}
                              {isSpiAuditor && (
                                <button
                                  onClick={() => openSpiReviewModal(r)}
                                  className="w-full px-2 py-0.5 text-[9.5px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition-colors"
                                  title="Evaluasi Kualitas Risiko oleh SPI (Slide 3 & 12)"
                                >
                                  Telaah SPI
                                </button>
                              )}

                              {/* Usul PKPT: only for SPI & Management */}
                              {!isAuditee && onNavigateToPkpt && (
                                <button
                                  onClick={() => onNavigateToPkpt(r)}
                                  className="w-full px-2 py-0.5 text-[9.5px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                                  title="Usulkan risiko signifikan ini ke PKPT"
                                >
                                  + PKPT
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PETA SELERA RISIKO 5X5 HEATMAP (SLIDE 9 DOKUMEN BPKP) */}
      {activeTab === 'heatmap' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                Matriks Selera Risiko 5×5 (Risk Appetite Heatmap) Sesuai Pedoman BPKP
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemetaan sebaran risiko residual berdasarkan tingkat kemungkinan (1-5) dan tingkat dampak (1-5). Klik salah satu sel untuk melihat rincian risiko.
              </p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold font-sans">
              <span className="px-2 py-1 bg-blue-500 text-white rounded">Sangat Rendah (1-2)</span>
              <span className="px-2 py-1 bg-emerald-500 text-white rounded">Rendah (3-4)</span>
              <span className="px-2 py-1 bg-amber-400 text-slate-900 rounded">Sedang (5-10)</span>
              <span className="px-2 py-1 bg-orange-500 text-white rounded">Tinggi (12-16)</span>
              <span className="px-2 py-1 bg-rose-500 text-white rounded">Sangat Tinggi (20-25)</span>
            </div>
          </div>

          {/* Interactive 5x5 Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[650px] space-y-2">
              <div className="grid grid-cols-6 gap-2 text-center text-xs font-bold font-sans">
                {/* Sumbu Y Title */}
                <div className="col-span-1 flex items-center justify-center text-slate-500 uppercase tracking-wider text-[11px]">
                  Kemungkinan ↓ \ Dampak →
                </div>
                <div className="p-2 bg-slate-100 rounded text-slate-700">1. Tidak Signifikan</div>
                <div className="p-2 bg-slate-100 rounded text-slate-700">2. Minor</div>
                <div className="p-2 bg-slate-100 rounded text-slate-700">3. Moderat</div>
                <div className="p-2 bg-slate-100 rounded text-slate-700">4. Signifikan</div>
                <div className="p-2 bg-slate-100 rounded text-slate-700">5. Sangat Signifikan</div>
              </div>

              {[5, 4, 3, 2, 1].map((likelihoodVal) => {
                const likelihoodObj = BPKP_LIKELIHOOD_LEVELS.find((l) => l.level === likelihoodVal);

                return (
                  <div key={likelihoodVal} className="grid grid-cols-6 gap-2 items-center text-xs">
                    {/* Y Axis Label */}
                    <div className="bg-slate-100 p-2.5 rounded font-bold text-slate-800 text-[11px] text-right pr-3">
                      <div>Level {likelihoodVal}</div>
                      <div className="text-[9.5px] font-normal text-slate-500">
                        {likelihoodObj?.name.split('/')[0]}
                      </div>
                    </div>

                    {/* 5 Impact Columns */}
                    {[1, 2, 3, 4, 5].map((impactVal) => {
                      const score = likelihoodVal * impactVal;
                      const matchingRisks = filteredRisks.filter(
                        (r) => r.residualLikelihood === likelihoodVal && r.residualImpact === impactVal
                      );
                      const isSelected =
                        heatmapCellFilter?.l === likelihoodVal && heatmapCellFilter?.i === impactVal;

                      return (
                        <div
                          key={impactVal}
                          onClick={() => {
                            if (matchingRisks.length > 0) {
                              setHeatmapCellFilter(isSelected ? null : { l: likelihoodVal, i: impactVal });
                              setActiveTab('register');
                            }
                          }}
                          className={`p-3 rounded-xl flex flex-col items-center justify-between transition-all cursor-pointer shadow-xs ${getCellColor(
                            likelihoodVal,
                            impactVal
                          )} ${
                            isSelected
                              ? 'ring-4 ring-slate-900 scale-105 z-10'
                              : 'hover:opacity-90 hover:scale-[1.02]'
                          }`}
                        >
                          <span className="font-mono text-xs font-black opacity-80">{score}</span>
                          <div className="my-1">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-black bg-white/30 backdrop-blur-xs rounded-full">
                              {matchingRisks.length} Risiko
                            </span>
                          </div>
                          <span className="text-[9px] opacity-75 font-sans">
                            {matchingRisks.length > 0 ? 'Klik rincian' : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVALUASI MANAJEMEN RISIKO OLEH SPI (SLIDE 3 & 12) */}
      {activeTab === 'spi_review' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Peran SPI: Melakukan Evaluasi atas Proses Manajemen Risiko
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Sesuai amanat BPKP (Slide 3 & 12), SPI bertugas melakukan evaluasi independen atas kecukupan identifikasi risiko, akurasi pemetaan akar penyebab 5M, dan ketepatan rencana perlakuan risiko (Reduce/Avoid/Transfer/Accept) yang disusun oleh masing-masing unit kerja (Auditee).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
              <span className="font-bold text-emerald-950 block mb-1">1. Evaluasi Kaidah Identifikasi</span>
              <p className="text-emerald-800 leading-relaxed">
                Memastikan Auditee tidak tertukar antara <strong>Tujuan</strong>, <strong>Peristiwa Risiko</strong>, <strong>Akar Masalah (5M)</strong>, dan <strong>Dampak</strong> (mengacu pada Studi Kasus BPKP slide 13-16).
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs">
              <span className="font-bold text-blue-950 block mb-1">2. Validasi Kriteria & Skor</span>
              <p className="text-blue-800 leading-relaxed">
                Memverifikasi apakah penetapan level kemungkinan (frekuensi/tahun) dan dampak (beban finansial/reputasi/penundaan SOP) telah realistis dan didukung bukti operasional.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs">
              <span className="font-bold text-purple-950 block mb-1">3. Pengawalan Rencana Aksi</span>
              <p className="text-purple-800 leading-relaxed">
                Memastikan rencana mitigasi efektif menekan tingkat risiko residual dan mengusulkan risiko berkategori signifikan ke dalam PKPT.
              </p>
            </div>
          </div>

          {/* List of Risks awaiting or reviewed by SPI */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Daftar Evaluasi Kaidah Risiko Per Unit Kerja:
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredRisks.map((r) => (
                <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800">{r.code}</span>
                      <span className="font-semibold text-slate-900">{r.unitName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{r.category}</span>
                      <span
                        className={`px-2 py-0.5 text-[9.5px] font-bold rounded-full ${
                          r.spiReviewStatus === 'Sesuai Kaidah'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.spiReviewStatus === 'Perlu Perbaikan Kaidah'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.spiReviewStatus || 'Diusulkan Auditee'}
                      </span>
                    </div>

                    <p className="font-bold text-slate-900">{r.event}</p>
                    <p className="text-slate-600">
                      <strong>Akar 5M:</strong> {r.causeCategory5M} — {r.cause}
                    </p>

                    {r.spiReviewNotes && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-800 mt-2">
                        <span className="font-bold text-emerald-900 block mb-0.5">Catatan Evaluasi SPI:</span>
                        <p className="italic">"{r.spiReviewNotes}"</p>
                        {r.spiEvaluatedBy && (
                          <span className="text-[9.5px] text-slate-400 mt-1 block">
                            Dievaluasi oleh: {r.spiEvaluatedBy} · {r.spiEvaluatedAt?.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isSpiAuditor && (
                    <button
                      onClick={() => openSpiReviewModal(r)}
                      className="shrink-0 px-3 py-1.5 font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
                    >
                      Beri Evaluasi SPI
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KAIDAH & STUDI KASUS BPKP (SLIDE 1-20 SUMMARY) */}
      {activeTab === 'bpkp_guide' && (
        <div className="space-y-6">
          {/* Overview Banner */}
          <div className="bg-emerald-900 text-white p-5 rounded-xl shadow-xs space-y-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-800 text-emerald-200 rounded">
              Pedoman Resmi BPKP Perwakilan Sumbar (Padang, Mei 2026)
            </span>
            <h3 className="text-base font-extrabold">
              Overview Evaluasi Manajemen Risiko pada Perumda Air Minum oleh SPI
            </h3>
            <p className="text-xs text-emerald-100 leading-relaxed max-w-3xl">
              Definisi Risiko (ISO 31000): "Risk is the effect of uncertainty on objectives" (Pengaruh ketidakpastian terhadap pencapaian tujuan). Risiko adalah kemungkinan terjadinya peristiwa yang membawa akibat yang tidak diinginkan atas pencapaian tujuan dan sasaran organisasi.
            </p>
          </div>

          {/* 8 Kategori Risiko BPKP */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              8 Kategori Risiko BPKP Resmi (Slide 5):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BPKP_RISK_CATEGORIES.map((c) => (
                <div key={c.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                      {c.id}
                    </span>
                    <span className="font-bold text-slate-900">{c.name}</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed">{c.definition}</p>
                  <p className="text-slate-500 text-[10.5px] italic pt-1 border-t border-slate-200">
                    Contoh: {c.example}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Studi Kasus Pembelajaran Kaidah BPKP (Slide 13-16) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Studi Kasus Pembelajaran Kaidah Perumusan Risiko (Slide 13 - 16):
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {BPKP_CASE_STUDIES.map((cs, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                  <span className="font-bold text-emerald-900 block border-b border-slate-200 pb-2">
                    {cs.title}
                  </span>

                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">Tujuan / Sasaran:</span>
                    <p className="text-slate-900 font-semibold">{cs.objective}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                      <span className="font-bold text-rose-900 block text-[10px] mb-1">
                        ❌ KESALAHAN UMUM:
                      </span>
                      <p className="text-rose-800 text-[11px]">{cs.wrongRiskOrCause}</p>
                    </div>

                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="font-bold text-emerald-900 block text-[10px] mb-1">
                        ✅ KAIDAH BENAR (RISIKO):
                      </span>
                      <p className="text-emerald-800 font-semibold text-[11px]">{cs.correctRisk}</p>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">Akar Masalah (5M yang Benar):</span>
                    <ul className="list-disc list-inside text-slate-600 pl-1 space-y-0.5 text-[11px]">
                      {cs.correctCauses.map((c, cIdx) => (
                        <li key={cIdx}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">Perlakuan / Mitigasi yang Tepat:</span>
                    <p className="text-emerald-800 font-medium text-[11px] bg-emerald-100/50 p-2 rounded border border-emerald-200">
                      {cs.correctMitigation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT / EDIT RISIKO (BERSTANDAR BPKP) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-emerald-800 text-emerald-200 rounded">
                  Format BPKP ISO 31000
                </span>
                <h3 className="text-sm font-bold mt-1">
                  {editingRisk ? 'Perbarui Register Risiko Unit' : 'Input Register Risiko Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Unit Kerja Selection: STRICTLY LOCKED FOR AUDITEE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Risiko</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Asesmen</label>
                  <input
                    type="number"
                    required
                    value={formYear}
                    onChange={(e) => setFormYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <span>Unit Kerja</span>
                    {isAuditee && (
                      <span title="Terkunci khusus unit Anda">
                        <Lock className="w-3 h-3 text-amber-700" />
                      </span>
                    )}
                  </label>
                  {isAuditee ? (
                    <input
                      type="text"
                      disabled
                      value={auditeeUnitName || 'Unit Kerja Anda'}
                      className="w-full px-3 py-2 bg-amber-50/80 border border-amber-300 text-amber-950 rounded-lg font-bold cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formUnitId}
                      onChange={(e) => setFormUnitId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Sasaran / Tujuan Unit (Kaidah BPKP) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Sasaran / Tujuan Unit Kerja yang Ingin Dicapai (Kaidah BPKP)
                </label>
                <input
                  type="text"
                  required
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  placeholder="Contoh: Menjamin kontinuitas distribusi air 24 jam ke pelanggan zona Pasaman..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Kategori BPKP & 3 Dimensi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Risiko BPKP (Slide 5)</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-emerald-900"
                  >
                    {BPKP_RISK_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">3 Dimensi Identifikasi (Slide 10)</label>
                  <select
                    value={formDimension}
                    onChange={(e) => setFormDimension(e.target.value as RiskDimension)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Dimensi Waktu">Dimensi Waktu (Jadwal/Keterlambatan)</option>
                    <option value="Dimensi Kualitas">Dimensi Kualitas (Mutu Air/Debit/Akurasi Meter)</option>
                    <option value="Dimensi Keselamatan/Keamanan">Dimensi Keselamatan/Keamanan (K3 & Aset Fisik)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Proses Bisnis</label>
                  <input
                    type="text"
                    required
                    value={formBusinessProcess}
                    onChange={(e) => setFormBusinessProcess(e.target.value)}
                    placeholder="Contoh: Pengolahan Air, Penagihan Kasir, Distribusi Jaringan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Peristiwa Risiko (Event) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    2. Peristiwa Risiko (Event)
                  </label>
                  <span className="text-[10px] text-amber-700 font-medium">
                    *Harus berupa peristiwa yang menghambat tujuan, bukan penyebab/dampak!
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formEvent}
                  onChange={(e) => setFormEvent(e.target.value)}
                  placeholder="Contoh: Terjadinya gangguan kontinuitas distribusi air kepada pelanggan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
                />
              </div>

              {/* Akar Penyebab (5M Framework) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    3. Akar Masalah / Penyebab (5M Framework - Slide 11)
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">Man, Money, Material, Machine, Methode</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kategori 5M</label>
                    <select
                      value={formCauseCategory5M}
                      onChange={(e) => setFormCauseCategory5M(e.target.value as RiskCause5M)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                    >
                      <option value="MACHINE (Peralatan & Bangunan)">MACHINE (Peralatan/Pompa/Bangunan)</option>
                      <option value="MAN (SDM)">MAN (SDM/Kompetensi/Kelalaian)</option>
                      <option value="MATERIAL (Bahan)">MATERIAL (Bahan Kimia/Pipa/Aksesoris)</option>
                      <option value="MONEY (Keuangan)">MONEY (Kemampuan Finansial/Anggaran)</option>
                      <option value="METHODE (Kebijakan & SOP)">METHODE (Kebijakan/SOP/Sistem)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Uraian Penyebab</label>
                    <input
                      type="text"
                      required
                      value={formCause}
                      onChange={(e) => setFormCause(e.target.value)}
                      placeholder="Contoh: Pompa transmisi intake sering aus dan pasokan listrik PLN padam tanpa genset otomatis"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Dampak Risiko */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    4. Dampak Risiko (Slide 11 & Slide 8)
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">Finansial, Pelayanan, Reputasi, K3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Area Dampak</label>
                    <select
                      value={formImpactArea}
                      onChange={(e) => setFormImpactArea(e.target.value as RiskImpactArea)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                    >
                      <option value="Penundaan Layanan (SOP)">Penundaan Layanan (SOP)</option>
                      <option value="Beban Keuangan (Finansial)">Beban Keuangan (Finansial)</option>
                      <option value="Penurunan Reputasi">Penurunan Reputasi / Keluhan</option>
                      <option value="Dampak K3 / Keselamatan">Dampak K3 / Keselamatan</option>
                      <option value="Dampak Lingkungan">Dampak Lingkungan</option>
                      <option value="Tuntutan Hukum">Tuntutan Hukum</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Uraian Dampak</label>
                    <input
                      type="text"
                      required
                      value={formImpactDesc}
                      onChange={(e) => setFormImpactDesc(e.target.value)}
                      placeholder="Contoh: Pelanggan tidak memperoleh air bersih dan lonjakan komplain di media sosial"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Inherent Score Calculation 5x5 */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <span className="font-bold text-amber-950 block text-xs">
                  5. Penilaian Risiko Inheren (Inherent Risk Matrix 5×5)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] text-slate-700 font-semibold mb-1">
                      Kemungkinan (1 - 5)
                    </label>
                    <select
                      value={formLikelihood}
                      onChange={(e) => setFormLikelihood(parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg font-semibold"
                    >
                      {BPKP_LIKELIHOOD_LEVELS.map((l) => (
                        <option key={l.level} value={l.level}>
                          {l.level} - {l.name} ({l.frequency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-semibold mb-1">
                      Dampak (1 - 5)
                    </label>
                    <select
                      value={formImpact}
                      onChange={(e) => setFormImpact(parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg font-semibold"
                    >
                      {BPKP_IMPACT_LEVELS.map((i) => (
                        <option key={i.level} value={i.level}>
                          {i.level} - {i.name} ({i.financial})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-center p-2 bg-white rounded-lg border border-amber-300">
                    <span className="text-[10px] text-slate-500 block">Skor & Level Inheren</span>
                    <span className="font-mono text-base font-black text-amber-950">
                      {inherentScore} — {inherentLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kontrol Eksisting & Residual Score */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <span className="font-bold text-emerald-950 block text-xs">
                  6. Pengendalian Eksisting & Penilaian Risiko Residual
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Kontrol / SOP yang Telah Berjalan
                    </label>
                    <input
                      type="text"
                      value={formExistingControl}
                      onChange={(e) => setFormExistingControl(e.target.value)}
                      placeholder="Contoh: SOP perbaikan pipa reaktif saat ada laporan warga"
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Efektivitas Pengendalian
                    </label>
                    <select
                      value={formControlEffectiveness}
                      onChange={(e) => setFormControlEffectiveness(e.target.value as ControlEffectiveness)}
                      className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg font-semibold"
                    >
                      <option value="Efektif">Efektif (Memadai)</option>
                      <option value="Sebagian Efektif">Sebagian Efektif</option>
                      <option value="Tidak Efektif">Tidak Efektif</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center pt-2">
                  <div>
                    <label className="block text-[11px] text-slate-700 font-semibold mb-1">
                      Residual Likelihood (1 - 5)
                    </label>
                    <select
                      value={formResidualLikelihood}
                      onChange={(e) => setFormResidualLikelihood(parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg font-semibold"
                    >
                      {BPKP_LIKELIHOOD_LEVELS.map((l) => (
                        <option key={l.level} value={l.level}>
                          {l.level} - {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-semibold mb-1">
                      Residual Impact (1 - 5)
                    </label>
                    <select
                      value={formResidualImpact}
                      onChange={(e) => setFormResidualImpact(parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded-lg font-semibold"
                    >
                      {BPKP_IMPACT_LEVELS.map((i) => (
                        <option key={i.level} value={i.level}>
                          {i.level} - {i.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-center p-2 bg-white rounded-lg border border-emerald-300">
                    <span className="text-[10px] text-slate-500 block">Skor & Level Residual</span>
                    <span className="font-mono text-base font-black text-emerald-950">
                      {residualScore} — {residualLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rencana Perlakuan / Mitigasi Risiko (Slide 17) */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      7. Opsi Perlakuan Risiko BPKP (Slide 17)
                    </label>
                    <select
                      value={formTreatmentOption}
                      onChange={(e) => setFormTreatmentOption(e.target.value as RiskTreatmentOption)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-900"
                    >
                      <option value="Mengurangi (Reduce)">Mengurangi (Reduce) - SOP & Pemeliharaan</option>
                      <option value="Menghindari (Avoid)">Menghindari (Avoid) - Hentikan Kegiatan</option>
                      <option value="Memindahkan (Transfer)">Memindahkan (Transfer) - Asuransi / Outsourcing</option>
                      <option value="Menerima (Accept)">Menerima (Accept) - Sesuai Selera Risiko</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Uraian Rencana Mitigasi SPI / Unit Kerja
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formMitigationPlan}
                      onChange={(e) => setFormMitigationPlan(e.target.value)}
                      placeholder="Langkah nyata untuk memitigasi akar masalah: preventive maintenance pompa berkala, genset cadangan otomatis, optimalisasi kapasitas reservoir..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
                    <input
                      type="text"
                      value={formPic}
                      onChange={(e) => setFormPic(e.target.value)}
                      placeholder="Kepala Unit / Bagian"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Penyelesaian</label>
                    <input
                      type="date"
                      value={formTargetDate}
                      onChange={(e) => setFormTargetDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status Mitigasi</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="Identifikasi">Identifikasi</option>
                      <option value="Mitigasi">Dalam Mitigasi</option>
                      <option value="Selesai">Selesai / Terkendali</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
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
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
                >
                  Simpan Register Risiko
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPI REVIEW MODAL (SLIDE 3 & 12 EVALUASI MANAJEMEN RISIKO OLEH SPI) */}
      {isSpiReviewModalOpen && reviewingRisk && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-emerald-800 text-emerald-200 rounded">
                  Peran Pengawasan SPI
                </span>
                <h3 className="text-sm font-bold mt-1">
                  Evaluasi Kaidah Manajemen Risiko: {reviewingRisk.code}
                </h3>
              </div>
              <button
                onClick={() => setIsSpiReviewModalOpen(false)}
                className="text-slate-300 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpiReview} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-900">{reviewingRisk.event}</p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">Unit:</span> {reviewingRisk.unitName} ·{' '}
                  <span className="font-semibold text-slate-800">Sasaran:</span> {reviewingRisk.objective || '-'}
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">Akar 5M:</span> {reviewingRisk.causeCategory5M} — {reviewingRisk.cause}
                </p>
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">Mitigasi:</span> {reviewingRisk.mitigationPlan}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Hasil Evaluasi SPI (Kaidah BPKP ISO 31000)
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                >
                  <option value="Sesuai Kaidah">✅ Sesuai Kaidah BPKP (Valid & Disetujui)</option>
                  <option value="Perlu Perbaikan Kaidah">⚠️ Perlu Perbaikan Kaidah (Koreksi Rumusan / Mitigasi)</option>
                  <option value="Diusulkan Auditee">⏳ Diusulkan Auditee (Belum Selesai Ditelaah)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Evaluasi / Saran Perbaikan SPI
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Berikan telaah atas keabsahan perumusan risiko, akurasi skor kemungkinan/dampak, serta rekomendasi penguatan mitigasi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSpiReviewModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan Evaluasi SPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOKUMEN CETAK REGISTER RISIKO RESMI WITH STANDARD KOP 3.5 CM & FITUR JABATAN */}
      {isPrintModalOpen && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="REGISTER RISIKO & PENGENDALIAN INTERN BERSTANDAR BPKP"
          documentSubtitle={`Perumda Air Minum Tirta Saiyo Kabupaten Pasaman - Tahun ${selectedYear}`}
          documentNumber={`RISK-REG/SPI-PTS/${selectedYear}`}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-6 text-xs font-serif leading-relaxed text-slate-900">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-300 grid grid-cols-3 gap-3 font-sans text-xs">
                <div>
                  <p className="text-slate-500 font-semibold">Tahun Asesmen:</p>
                  <p className="font-bold text-slate-900">{selectedYear}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold">Cakupan Pengawasan:</p>
                  <p className="font-bold text-emerald-800">
                    {isAuditee && auditeeUnitName ? auditeeUnitName : 'Seluruh Unit Kerja Korporat'} ({filteredRisks.length} Risiko)
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold">Standar & Kerangka Kerja:</p>
                  <p className="font-bold text-slate-800">ISO 31000 & Pedoman Evaluasi MR BPKP</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-xs border-b-2 border-slate-800 pb-1">
                  Matriks Register Risiko 5×5 (Inherent vs Residual) Berdasarkan Kaidah BPKP:
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9.5px] border-collapse border border-slate-400 font-sans">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-400">
                        <th className="p-1.5 border border-slate-300 w-7 text-center">No</th>
                        <th className="p-1.5 border border-slate-300 w-24">Kode & Unit</th>
                        <th className="p-1.5 border border-slate-300">Sasaran & Peristiwa Risiko</th>
                        <th className="p-1.5 border border-slate-300">Akar Masalah (5M) & Dampak</th>
                        <th className="p-1.5 border border-slate-300 w-16 text-center">Inherent (L×I)</th>
                        <th className="p-1.5 border border-slate-300">Kontrol Eksisting</th>
                        <th className="p-1.5 border border-slate-300 w-16 text-center">Residual (L×I)</th>
                        <th className="p-1.5 border border-slate-300">Opsi & Rencana Mitigasi</th>
                        <th className="p-1.5 border border-slate-300 w-20 text-center">Status SPI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {filteredRisks.map((r, idx) => (
                        <tr key={r.id} className="align-top even:bg-slate-50/50">
                          <td className="p-1.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-mono">
                            <span className="font-bold text-slate-900 block">{r.code}</span>
                            <span className="font-sans text-[9px] text-slate-600 block">{r.unitName}</span>
                          </td>
                          <td className="p-1.5 border border-slate-300 space-y-0.5">
                            {r.objective && (
                              <p className="text-[8.5px] text-slate-500 italic">
                                Sasaran: {r.objective}
                              </p>
                            )}
                            <p className="font-bold text-slate-900 leading-snug">{r.event}</p>
                            <span className="text-[8.5px] text-emerald-800 font-semibold block">
                              Kat: {r.category}
                            </span>
                          </td>
                          <td className="p-1.5 border border-slate-300 space-y-1 text-[9px]">
                            <p>
                              <strong className="text-slate-800">Sebab ({r.causeCategory5M || '5M'}):</strong> {r.cause}
                            </p>
                            <p className="text-slate-600">
                              <strong className="text-slate-800">Dampak:</strong> {r.impactDesc}
                            </p>
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold">
                            <span className="font-mono text-[10px]">{r.inherentScore}</span>
                            <div className="text-[8.5px] text-slate-500 font-normal">({r.inherentLevel})</div>
                          </td>
                          <td className="p-1.5 border border-slate-300 text-[9px]">
                            <p>{r.existingControl || '-'}</p>
                            <span className="text-[8.5px] text-slate-500 block mt-0.5 font-medium">
                              Efektivitas: {r.controlEffectiveness}
                            </span>
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold">
                            <span className="font-mono text-[10px] text-emerald-800">{r.residualScore}</span>
                            <div className="text-[8.5px] text-slate-500 font-normal">({r.residualLevel})</div>
                          </td>
                          <td className="p-1.5 border border-slate-300 text-[9px]">
                            <span className="font-bold text-emerald-900 block text-[8.5px]">
                              {r.treatmentOption || 'Mengurangi (Reduce)'}
                            </span>
                            <p className="leading-snug">{r.mitigationPlan || '-'}</p>
                            <p className="text-[8.5px] text-slate-400 mt-0.5">
                              PIC: {r.pic} · Tgt: {r.targetDate}
                            </p>
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center">
                            <span className="font-bold text-[8.5px] block text-slate-800">
                              {r.spiReviewStatus || 'Diusulkan'}
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

      {/* MANUAL BOOK MODAL (INTERAKTIF & CETAK BPKP) */}
      <RiskRegisterManualBookModal
        isOpen={isManualBookOpen}
        onClose={() => setIsManualBookOpen(false)}
      />
    </div>
  );
};
