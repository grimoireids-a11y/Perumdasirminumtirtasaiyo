import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Building,
  Calendar,
  Eye,
  Trash2,
  Edit,
  Save,
  Check,
  Loader2,
  FileSpreadsheet,
  ChevronRight,
  Shield,
  Activity,
  Droplets,
  DollarSign,
  Users,
  Settings,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import {
  BPKPSelfAssessment,
  BPKPIndicatorAssessment,
  SPIPElementAssessment,
  BPKPKategoriKinerja,
  SPIPMaturityLevel,
} from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_BPKP_KINERJA_INDICATORS, INITIAL_SPIP_ELEMENTS } from '../../data/bpkpStandards';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

export const SelfAssessmentBPKPModule: React.FC = () => {
  const { userProfile, hasRole } = useAuth();
  const currentYear = new Date().getFullYear();

  const [assessments, setAssessments] = useState<BPKPSelfAssessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<BPKPSelfAssessment | null>(null);

  // Active framework tab inside an assessment
  const [viewTab, setViewTab] = useState<'kinerja' | 'spip' | 'diagnostic' | 'history'>('kinerja');
  const [filterAspect, setFilterAspect] = useState<string>('ALL');

  // Edit / Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editableIndicators, setEditableIndicators] = useState<BPKPIndicatorAssessment[]>([]);
  const [editableSpipElements, setEditableSpipElements] = useState<SPIPElementAssessment[]>([]);

  // Print Preview Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // AI Diagnostic Generation
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  const canManage = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);
  const canApprove = hasRole(['KEPALA_SPI', 'DIREKTUR', 'ADMIN_SISTEM']);

  // Real-time listener for BPKP Assessments
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bpkp_assessments'), (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BPKPSelfAssessment));
        data.sort((a, b) => b.year - a.year);
        setAssessments(data);
        if (!activeAssessment && data.length > 0) {
          setActiveAssessment(data[0]);
          setEditableIndicators(data[0].indicators || INITIAL_BPKP_KINERJA_INDICATORS);
          setEditableSpipElements(data[0].spipElements || INITIAL_SPIP_ELEMENTS);
        }
      } else {
        // Automatically bootstrap first official BPKP baseline assessment if empty
        bootstrapInitialBpkpAssessment();
      }
    });

    return () => unsub();
  }, []);

  // Bootstrap initial BPKP baseline assessment
  const bootstrapInitialBpkpAssessment = async () => {
    const initialId = `BPKP-SA-${currentYear}`;
    const initialDoc: BPKPSelfAssessment = {
      id: initialId,
      year: currentYear,
      assessmentTitle: `Self Assessment Kinerja BUMD & Maturitas SPIP Perumda Tirta Saiyo Tahun ${currentYear}`,
      assessmentDate: new Date().toISOString().split('T')[0],
      evaluatorName: userProfile?.displayName || 'Tim Asesor SPI Tirta Saiyo',
      evaluatorRole: 'Kepala Satuan Pengawasan Intern',
      status: 'Verifikasi SPI',
      kinerjaScore: 4.41,
      kinerjaCategory: 'SEHAT - BAIK SEKALI',
      aspectScores: {
        keuangan: 1.195,
        pelayanan: 1.150,
        operasional: 1.320,
        sdm: 0.750,
      },
      indicators: INITIAL_BPKP_KINERJA_INDICATORS,
      spipMaturityScore: 4.18,
      spipMaturityLevel: 'Level 4 - Terkelola & Terukur',
      spipElements: INITIAL_SPIP_ELEMENTS,
      aiExecutiveSummary:
        'Kinerja Perumda Air Minum Tirta Saiyo Kabupaten Pasaman berdasarkan petunjuk teknis penilaian kinerja BPKP berada pada predikat SEHAT - BAIK SEKALI (Skor 4.41). Kinerja keuangan dan aspek pelayanan sangat solid dengan likuiditas tinggi. Pengendalian internal SPIP mencapai Level 4 (Terkelola & Terukur) dengan catatan perbaikan prioritas pada penurunan tingkat kehilangan air (NRW) dan sertifikasi kompetensi SDM.',
      aiStrategicRecommendations:
        '1. Implementasikan District Metered Area (DMA) dan percepatan program kalibrasi water meter untuk menekan NRW di bawah target 25%.\n2. Tingkatkan porsi audit kepatuhan berbasis risiko pada unit transmisi dan pelayanan cabang.\n3. Perkuat sistem Whistleblowing System (WBS) dan evaluasi SOP pelayanan air yang telah berusia lebih dari 3 tahun.',
      createdBy: userProfile?.displayName || 'Kepala SPI',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'bpkp_assessments', initialId), initialDoc, { merge: true });
      setActiveAssessment(initialDoc);
      setEditableIndicators(INITIAL_BPKP_KINERJA_INDICATORS);
      setEditableSpipElements(INITIAL_SPIP_ELEMENTS);
    } catch (e) {
      console.error('Failed to bootstrap initial BPKP assessment:', e);
    }
  };

  // Switch Active Assessment
  const handleSelectAssessment = (ass: BPKPSelfAssessment) => {
    setActiveAssessment(ass);
    setEditableIndicators(ass.indicators || INITIAL_BPKP_KINERJA_INDICATORS);
    setEditableSpipElements(ass.spipElements || INITIAL_SPIP_ELEMENTS);
    setIsEditing(false);
    setAiError(null);
    setAiSuccessMsg(null);
  };

  // Create New Year Assessment
  const handleCreateNewYearAssessment = async () => {
    const targetYear = prompt('Masukkan Tahun Anggaran Penilaian Self Assessment BPKP:', String(currentYear + 1));
    if (!targetYear) return;
    const yearNum = parseInt(targetYear, 10);
    if (isNaN(yearNum)) {
      alert('Tahun harus berupa angka.');
      return;
    }

    const newId = `BPKP-SA-${yearNum}`;
    const newDoc: BPKPSelfAssessment = {
      id: newId,
      year: yearNum,
      assessmentTitle: `Self Assessment Kinerja BUMD & Maturitas SPIP Perumda Tirta Saiyo Tahun ${yearNum}`,
      assessmentDate: new Date().toISOString().split('T')[0],
      evaluatorName: userProfile?.displayName || 'Tim Asesor SPI Tirta Saiyo',
      evaluatorRole: 'Kepala SPI',
      status: 'Draft',
      kinerjaScore: 4.35,
      kinerjaCategory: 'SEHAT - BAIK SEKALI',
      aspectScores: {
        keuangan: 1.15,
        pelayanan: 1.10,
        operasional: 1.35,
        sdm: 0.75,
      },
      indicators: INITIAL_BPKP_KINERJA_INDICATORS,
      spipMaturityScore: 4.10,
      spipMaturityLevel: 'Level 4 - Terkelola & Terukur',
      spipElements: INITIAL_SPIP_ELEMENTS,
      createdBy: userProfile?.displayName || 'Kepala SPI',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'bpkp_assessments', newId), newDoc);
      setActiveAssessment(newDoc);
      setEditableIndicators(INITIAL_BPKP_KINERJA_INDICATORS);
      setEditableSpipElements(INITIAL_SPIP_ELEMENTS);
      alert(`Lembar Self Assessment BPKP Tahun ${yearNum} berhasil dibuat.`);
    } catch (err: any) {
      alert('Gagal membuat asesmen: ' + err.message);
    }
  };

  // Handle Indicator Score / Actual Value Change
  const handleIndicatorChange = (id: string, field: 'actualValue' | 'score' | 'evidenceRef' | 'notes', val: any) => {
    setEditableIndicators((prev) =>
      prev.map((ind) => {
        if (ind.id !== id) return ind;
        const updated = { ...ind, [field]: val };
        if (field === 'score') {
          const scoreNum = Number(val) || 1;
          updated.score = scoreNum;
          updated.weightedScore = Math.round(scoreNum * updated.weight * 1000) / 1000;
        }
        return updated;
      })
    );
  };

  // Handle SPIP Element Rating Change
  const handleSpipElementChange = (id: string, field: 'selfRating' | 'evidenceRef' | 'improvementPlan', val: any) => {
    setEditableSpipElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, [field]: val } : el))
    );
  };

  // Recalculate Totals & Save
  const handleSaveAssessmentChanges = async () => {
    if (!activeAssessment) return;

    // Calculate Aspect Scores & Total Kinerja Score
    let sumKeuangan = 0;
    let sumPelayanan = 0;
    let sumOperasional = 0;
    let sumSdm = 0;

    editableIndicators.forEach((ind) => {
      const wScore = ind.score * ind.weight;
      if (ind.aspect === 'KEUANGAN') sumKeuangan += wScore;
      if (ind.aspect === 'PELAYANAN') sumPelayanan += wScore;
      if (ind.aspect === 'OPERASIONAL') sumOperasional += wScore;
      if (ind.aspect === 'SDM') sumSdm += wScore;
    });

    const totalKinerja = Math.round((sumKeuangan + sumPelayanan + sumOperasional + sumSdm) * 100) / 100;
    let category: BPKPKategoriKinerja = 'SEHAT - BAIK';
    if (totalKinerja >= 4.2) category = 'SEHAT - BAIK SEKALI';
    else if (totalKinerja >= 3.5) category = 'SEHAT - BAIK';
    else if (totalKinerja >= 2.8) category = 'SEHAT - CUKUP';
    else if (totalKinerja >= 2.2) category = 'KURANG SEHAT';
    else category = 'SAKIT';

    // Calculate SPIP Maturity Score
    const totalSpipScore = editableSpipElements.reduce((acc, curr) => acc + (Number(curr.selfRating) || 1), 0);
    const avgSpip = Math.round((totalSpipScore / (editableSpipElements.length || 1)) * 100) / 100;

    let maturityLevel: SPIPMaturityLevel = 'Level 3 - Terdefinisi';
    if (avgSpip >= 4.5) maturityLevel = 'Level 5 - Optimum';
    else if (avgSpip >= 4.0) maturityLevel = 'Level 4 - Terkelola & Terukur';
    else if (avgSpip >= 3.0) maturityLevel = 'Level 3 - Terdefinisi';
    else if (avgSpip >= 2.0) maturityLevel = 'Level 2 - Berkembang';
    else maturityLevel = 'Level 1 - Rintisan';

    const updatedDoc: BPKPSelfAssessment = {
      ...activeAssessment,
      kinerjaScore: totalKinerja,
      kinerjaCategory: category,
      aspectScores: {
        keuangan: Math.round(sumKeuangan * 1000) / 1000,
        pelayanan: Math.round(sumPelayanan * 1000) / 1000,
        operasional: Math.round(sumOperasional * 1000) / 1000,
        sdm: Math.round(sumSdm * 1000) / 1000,
      },
      indicators: editableIndicators,
      spipMaturityScore: avgSpip,
      spipMaturityLevel: maturityLevel,
      spipElements: editableSpipElements,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'bpkp_assessments', activeAssessment.id), updatedDoc, { merge: true });
      setActiveAssessment(updatedDoc);
      setIsEditing(false);
      alert('Perubahan Self Assessment BPKP berhasil disimpan.');
    } catch (err: any) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  // AI Diagnostic Analysis
  const handleRunAiDiagnostic = async () => {
    if (!activeAssessment) return;
    setIsAiAnalyzing(true);
    setAiError(null);
    setAiSuccessMsg(null);

    try {
      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_bpkp_assessment',
          payload: {
            year: activeAssessment.year,
            kinerjaScore: activeAssessment.kinerjaScore,
            kinerjaCategory: activeAssessment.kinerjaCategory,
            aspectScores: activeAssessment.aspectScores,
            indicators: editableIndicators,
            spipMaturityScore: activeAssessment.spipMaturityScore,
            spipMaturityLevel: activeAssessment.spipMaturityLevel,
            spipElements: editableSpipElements,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal memproses analisis diagnostik BPKP.');
      }

      const res = await response.json();
      const rawText = res.text || '';

      let parsed: any = null;
      try {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.warn('AI output is text');
      }

      setAiAnalysisResult(parsed || { executiveSummary: rawText });

      // Save into assessment record
      const updatedAssessment: BPKPSelfAssessment = {
        ...activeAssessment,
        aiExecutiveSummary: parsed?.executiveSummary || rawText,
        aiStrategicRecommendations: parsed?.strategicRecommendations || '',
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'bpkp_assessments', activeAssessment.id), updatedAssessment, { merge: true });
      setActiveAssessment(updatedAssessment);

      setAiSuccessMsg('Analisis Diagnostik BPKP oleh AI Gemini berhasil diselesaikan.');
      setViewTab('diagnostic');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Terjadi kesalahan saat memproses asistensi AI.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Filter indicators by aspect
  const filteredIndicators = editableIndicators.filter(
    (ind) => filterAspect === 'ALL' || ind.aspect === filterAspect
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 rounded-lg">
              Standar Resmi BPKP RI
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Petunjuk Teknis BUMD Air Minum & Peraturan BPKP No. 5/2021
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-700" />
            <span>Self Assessment Kinerja & Maturitas SPIP Berstandar BPKP</span>
          </h1>
          <p className="text-xs text-slate-600 max-w-3xl">
            Instrumen evaluasi mandiri komprehensif Perumda Air Minum Tirta Saiyo Kabupaten Pasaman mencakup 4 Aspek Kinerja BUMD Air Minum (Keuangan, Pelayanan, Operasional, SDM) dan 5 Unsur Maturitas SPIP Terintegrasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunAiDiagnostic}
            disabled={isAiAnalyzing || !activeAssessment}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Jalankan evaluasi diagnostik dan rekomendasi peningkatan BPKP dengan AI Gemini"
          >
            {isAiAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-900" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-900" />
            )}
            <span>{isAiAnalyzing ? 'Menganalisis BPKP...' : '✨ Diagnostik AI BPKP'}</span>
          </button>

          {activeAssessment && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-emerald-900 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-700" />
              <span>Tinjau & Cetak Laporan</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={handleCreateNewYearAssessment}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Asesmen Tahun Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Notifications */}
      {aiSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-medium text-emerald-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {aiSuccessMsg}
          </span>
          <button onClick={() => setAiSuccessMsg(null)} className="text-emerald-800 hover:underline">
            Tutup
          </button>
        </div>
      )}
      {aiError && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-medium text-rose-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            {aiError}
          </span>
          <button onClick={() => setAiError(null)} className="text-rose-800 hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Active Assessment Executive KPI Dashboard */}
      {activeAssessment && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Kategori Kinerja BPKP */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-emerald-200 mb-1">
              <span>Status Kinerja BPKP</span>
              <Award className="w-4 h-4 text-amber-300" />
            </div>
            <p className="text-xl font-black text-amber-300 tracking-tight">
              {activeAssessment.kinerjaCategory}
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black">{activeAssessment.kinerjaScore.toFixed(2)}</span>
              <span className="text-xs text-emerald-200">/ 5.00 Skor Standar</span>
            </div>
            <p className="text-[10px] text-emerald-300/80 mt-1">
              Tahun Anggaran {activeAssessment.year} · Nilai Ambang SEHAT &gt; 2.80
            </p>
          </div>

          {/* Card 2: Maturitas SPIP Terintegrasi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Maturitas SPIP (PP 60/2008)</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-base font-extrabold text-slate-900">
              {activeAssessment.spipMaturityLevel}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-800">
                {activeAssessment.spipMaturityScore.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/ 5.00 Indeks</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Tingkat kematangan pengendalian intern 5 unsur
            </p>
          </div>

          {/* Card 3: Rincian 4 Aspek Kinerja BPKP */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
            <div className="font-bold text-slate-800 flex items-center justify-between pb-1 border-b border-slate-100">
              <span>Bobot Aspek BPKP:</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Capaian</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Keuangan (25%)</span>
                <strong className="text-slate-900 font-mono font-bold">
                  {(activeAssessment.aspectScores?.keuangan || 0).toFixed(2)}
                </strong>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Pelayanan (25%)</span>
                <strong className="text-slate-900 font-mono font-bold">
                  {(activeAssessment.aspectScores?.pelayanan || 0).toFixed(2)}
                </strong>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Operasi (35%)</span>
                <strong className="text-slate-900 font-mono font-bold">
                  {(activeAssessment.aspectScores?.operasional || 0).toFixed(2)}
                </strong>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">SDM (15%)</span>
                <strong className="text-slate-900 font-mono font-bold">
                  {(activeAssessment.aspectScores?.sdm || 0).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          {/* Card 4: Status Alur & Asesor */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between text-xs space-y-2">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span>Status Asesmen Mandiri</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-900">
                  {activeAssessment.status}
                </span>
              </div>
              <p className="font-bold text-slate-900 truncate">{activeAssessment.assessmentTitle}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Asesor: {activeAssessment.evaluatorName}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <select
                value={activeAssessment.id}
                onChange={(e) => {
                  const sel = assessments.find((a) => a.id === e.target.value);
                  if (sel) handleSelectAssessment(sel);
                }}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
              >
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    Tahun {a.year} ({a.kinerjaCategory})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Framework Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tab Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setViewTab('kinerja')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                viewTab === 'kinerja'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>1. Evaluasi Kinerja BUMD BPKP (18 Indikator)</span>
            </button>

            <button
              onClick={() => setViewTab('spip')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                viewTab === 'spip'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>2. Maturitas SPIP Terintegrasi (25 Sub-Unsur)</span>
            </button>

            <button
              onClick={() => setViewTab('diagnostic')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                viewTab === 'diagnostic'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>3. Diagnostik & Analisis AI BPKP</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <>
                {isEditing ? (
                  <button
                    onClick={handleSaveAssessmentChanges}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan Asesmen</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-900 bg-white border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Edit Nilai & Bukti Dukung</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* TAB 1: EVALUASI KINERJA BUMD AIR MINUM STANDAR BPKP */}
        {viewTab === 'kinerja' && (
          <div className="p-5 space-y-4">
            {/* Filter Aspek */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Filter Aspek:</span>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  {['ALL', 'KEUANGAN', 'PELAYANAN', 'OPERASIONAL', 'SDM'].map((asp) => (
                    <button
                      key={asp}
                      onClick={() => setFilterAspect(asp)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        filterAspect === asp
                          ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {asp === 'ALL' ? 'Semua (18 Indikator)' : asp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Standar Petunjuk Teknis Evaluasi BPKP RI · Bobot Maksimum Total 100% (5.00)
              </div>
            </div>

            {/* Table of Indicators */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">Kode</th>
                    <th className="p-3">Indikator Kinerja Standar BPKP</th>
                    <th className="p-3 w-28">Rumus & Acuan</th>
                    <th className="p-3 w-20 text-center">Target</th>
                    <th className="p-3 w-24 text-center">Realisasi</th>
                    <th className="p-3 w-16 text-center">Skor (1-5)</th>
                    <th className="p-3 w-20 text-center">Skor Bobot</th>
                    <th className="p-3 w-56">Bukti Dukung (Evidence Reference)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredIndicators.map((ind) => (
                    <tr key={ind.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center font-bold text-emerald-800 font-mono">
                        {ind.code}
                      </td>
                      <td className="p-3 space-y-0.5">
                        <span className="font-bold text-slate-900 block">{ind.name}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Aspek {ind.aspect} (Bobot: {(ind.weight * 100).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-slate-500 leading-tight">
                        {ind.formulaDesc}
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-700">
                        {ind.targetValue} {ind.unitMeasurement}
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={ind.actualValue}
                            onChange={(e) =>
                              handleIndicatorChange(ind.id, 'actualValue', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-1.5 py-1 text-center font-mono font-bold bg-white border border-emerald-400 rounded text-xs"
                          />
                        ) : (
                          <span className="font-mono font-bold text-slate-900">
                            {ind.actualValue} {ind.unitMeasurement}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <select
                            value={ind.score}
                            onChange={(e) => handleIndicatorChange(ind.id, 'score', e.target.value)}
                            className="px-1.5 py-1 text-center font-bold text-emerald-950 bg-emerald-50 border border-emerald-300 rounded text-xs"
                          >
                            <option value={5}>5 (Sangat Baik)</option>
                            <option value={4}>4 (Baik)</option>
                            <option value={3}>3 (Cukup)</option>
                            <option value={2}>2 (Kurang)</option>
                            <option value={1}>1 (Sakit/Buruk)</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              ind.score >= 4
                                ? 'bg-emerald-100 text-emerald-900'
                                : ind.score === 3
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {ind.score}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">
                        {(ind.score * ind.weight).toFixed(3)}
                      </td>
                      <td className="p-3 text-xs">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={ind.evidenceRef}
                            onChange={(e) => handleIndicatorChange(ind.id, 'evidenceRef', e.target.value)}
                            className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded leading-tight"
                            placeholder="SOP, dokumen, atau nomor SK..."
                          />
                        ) : (
                          <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                            {ind.evidenceRef || '-'}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MATURITAS PENYELENGGARAAN SPIP TERINTEGRASI BPKP */}
        {viewTab === 'spip' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Evaluasi Maturitas SPIP Terintegrasi (PP 60/2008 & Peraturan BPKP 5/2021)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Penilaian mandiri atas kecukupan rancangan dan efektivitas implementasi 5 unsur pengendalian intern.
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-extrabold bg-emerald-100 text-emerald-900 rounded-lg">
                Target Standar BPKP: Level 3 (Terdefinisi)
              </span>
            </div>

            <div className="space-y-4">
              {editableSpipElements.map((el) => (
                <div
                  key={el.id}
                  className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-800 text-white rounded">
                        {el.subElementCode}
                      </span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {el.subElementName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium hidden md:inline">
                        ({el.elementName})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500 font-semibold">Tingkat Maturitas:</span>
                      {isEditing ? (
                        <select
                          value={el.selfRating}
                          onChange={(e) =>
                            handleSpipElementChange(el.id, 'selfRating', parseInt(e.target.value, 10))
                          }
                          className="px-2 py-1 text-xs font-bold bg-white border border-emerald-400 rounded"
                        >
                          <option value={1}>Level 1 - Rintisan</option>
                          <option value={2}>Level 2 - Berkembang</option>
                          <option value={3}>Level 3 - Terdefinisi</option>
                          <option value={4}>Level 4 - Terkelola & Terukur</option>
                          <option value={5}>Level 5 - Optimum</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            el.selfRating >= 4
                              ? 'bg-emerald-100 text-emerald-900'
                              : el.selfRating === 3
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          Level {el.selfRating}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 leading-relaxed">
                    <strong className="text-slate-800 font-semibold">Kriteria BPKP: </strong>
                    {el.bpkpCriteria}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">Bukti Dukung / Regulasi:</span>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={el.evidenceRef}
                          onChange={(e) => handleSpipElementChange(el.id, 'evidenceRef', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                          {el.evidenceRef || 'Belum diisi'}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">Rencana Peningkatan / Aksi:</span>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={el.improvementPlan}
                          onChange={(e) => handleSpipElementChange(el.id, 'improvementPlan', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                          {el.improvementPlan || 'Belum ada rencana tindak lanjut'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DIAGNOSTIK & ANALISIS AI BPKP */}
        {viewTab === 'diagnostic' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Hasil Analisis Diagnostik & Rekomendasi Peningkatan BPKP</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Dianalisis secara komprehensif menggunakan kecerdasan buatan (Gemini) berstandar BPKP RI.
                </p>
              </div>

              <button
                onClick={handleRunAiDiagnostic}
                disabled={isAiAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-amber-300 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
              >
                {isAiAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Perbarui Analisis</span>
              </button>
            </div>

            {/* Diagnostic Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Executive Summary */}
              <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  Ringkasan Eksekutif Hasil Asesmen BPKP
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  {aiAnalysisResult?.executiveSummary || activeAssessment?.aiExecutiveSummary || (
                    <span className="italic text-slate-400">
                      Klik tombol "Diagnostik AI BPKP" di bagian atas untuk merumuskan ringkasan eksekutif secara otomatis.
                    </span>
                  )}
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Kekuatan & Titik Kritis Perumda
                </h4>
                <div className="text-xs text-slate-700 leading-relaxed space-y-2">
                  <p>
                    <strong className="text-slate-900">Area Unggulan: </strong>
                    Likuiditas dan solvabilitas perusahaan sangat kuat (Cash ratio {editableIndicators.find(i => i.code === 'K.3')?.actualValue}%), efektivitas penagihan rekening air mencapai {editableIndicators.find(i => i.code === 'K.4')?.actualValue}%, serta rasio pegawai per 1.000 pelanggan sangat efisien.
                  </p>
                  <p>
                    <strong className="text-rose-700">Area Perhatian Kritis: </strong>
                    Tingkat Kehilangan Air (NRW) sebesar {editableIndicators.find(i => i.code === 'O.2')?.actualValue}% masih memerlukan langkah penanganan District Metered Area (DMA) dan peremajaan meter air langganan.
                  </p>
                </div>
              </div>
            </div>

            {/* Strategic Recommendations Roadmap */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                Rekomendasi Tindak Lanjut Strategis & Roadmap Peningkatan BPKP
              </h4>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
                {aiAnalysisResult?.strategicRecommendations || activeAssessment?.aiStrategicRecommendations || (
                  `1. Pengendalian Kehilangan Air (NRW): Alokasikan anggaran peremajaan pipa distribusi usia > 20 tahun dan bentuk Tim Reaksi Cepat Kebocoran Pipa.\n2. Digitalisasi Baca Meter: Lanjutkan penggunaan aplikasi pembacaan meter berbasis Android dengan geolokasi foto water meter.\n3. Peningkatan Kapabilitas SPI: Targetkan pencapaian Level 3 IACM (Internal Audit Capability Model) dan perbanyak audit operasional di wilayah cabang.\n4. Kepatuhan Regulasi: Tinjau dan perbarui SOP yang telah berusia lebih dari 3 tahun serta perkuat whistleblowing system.`
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRINT PREVIEW MODAL DOKUMEN LAPORAN SELF ASSESSMENT BPKP */}
      {isPrintModalOpen && activeAssessment && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="LAPORAN HASIL SELF ASSESSMENT KINERJA & MATURITAS SPIP"
          documentSubtitle={`Standar BPKP RI · Tahun Anggaran ${activeAssessment.year}`}
          documentNumber={`700.1/SA-BPKP/PTS/${activeAssessment.year}`}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {(_config) => (
            <div className="space-y-6 text-slate-900 leading-relaxed font-serif text-[11px]">
              {/* Ringkasan Cover */}
              <div className="border-b border-slate-300 pb-3 mb-4 font-sans">
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="w-40 font-bold text-slate-700 py-0.5">Nama Entitas</td>
                      <td className="w-3 text-center">:</td>
                      <td className="font-bold text-slate-900 py-0.5">Perumda Air Minum Tirta Saiyo Kabupaten Pasaman</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-700 py-0.5">Tahun Penilaian</td>
                      <td className="text-center">:</td>
                      <td className="py-0.5 font-bold">{activeAssessment.year}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-700 py-0.5">Predikat Kinerja BPKP</td>
                      <td className="text-center">:</td>
                      <td className="py-0.5 font-bold text-emerald-900">
                        {activeAssessment.kinerjaCategory} (Skor: {activeAssessment.kinerjaScore.toFixed(2)} / 5.00)
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-700 py-0.5">Maturitas SPIP</td>
                      <td className="text-center">:</td>
                      <td className="py-0.5 font-bold">
                        {activeAssessment.spipMaturityLevel} (Indeks: {activeAssessment.spipMaturityScore.toFixed(2)})
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-700 py-0.5">Tim Asesor Pengawasan</td>
                      <td className="text-center">:</td>
                      <td className="py-0.5">{activeAssessment.evaluatorName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bab I: Ringkasan Eksekutif */}
              <div className="space-y-2">
                <h4 className="font-sans font-bold uppercase tracking-wider text-xs border-b border-slate-400 pb-1 text-slate-900">
                  I. RINGKASAN EKSEKUTIF HASIL ASESMEN MANDIRI BPKP
                </h4>
                <p className="text-justify leading-relaxed">
                  {activeAssessment.aiExecutiveSummary ||
                    'Self assessment kinerja dan maturitas sistem pengendalian intern pemerintah (SPIP) dilaksanakan berpedoman pada Petunjuk Teknis Penilaian Kinerja BUMD Air Minum BPKP dan Peraturan BPKP No. 5 Tahun 2021.'}
                </p>
              </div>

              {/* Bab II: Tabel Evaluasi 4 Aspek Kinerja BPKP */}
              <div className="space-y-2">
                <h4 className="font-sans font-bold uppercase tracking-wider text-xs border-b border-slate-400 pb-1 text-slate-900">
                  II. EVALUASI INDIKATOR KINERJA BUMD AIR MINUM STANDAR BPKP
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-400 text-[10px]">
                    <thead className="bg-slate-100 font-sans font-bold text-center">
                      <tr>
                        <th className="border border-slate-400 p-1 w-8">No</th>
                        <th className="border border-slate-400 p-1">Indikator Standar BPKP</th>
                        <th className="border border-slate-400 p-1 w-14">Bobot</th>
                        <th className="border border-slate-400 p-1 w-16">Target</th>
                        <th className="border border-slate-400 p-1 w-16">Realisasi</th>
                        <th className="border border-slate-400 p-1 w-12">Skor</th>
                        <th className="border border-slate-400 p-1 w-14">Skor Bobot</th>
                        <th className="border border-slate-400 p-1">Bukti Dokumen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableIndicators.map((ind, idx) => (
                        <tr key={ind.id}>
                          <td className="border border-slate-400 p-1 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-400 p-1">
                            <span className="font-bold">{ind.name}</span> ({ind.aspect})
                          </td>
                          <td className="border border-slate-400 p-1 text-center">
                            {(ind.weight * 100).toFixed(1)}%
                          </td>
                          <td className="border border-slate-400 p-1 text-center">
                            {ind.targetValue} {ind.unitMeasurement}
                          </td>
                          <td className="border border-slate-400 p-1 text-center font-bold">
                            {ind.actualValue} {ind.unitMeasurement}
                          </td>
                          <td className="border border-slate-400 p-1 text-center font-bold">{ind.score}</td>
                          <td className="border border-slate-400 p-1 text-center font-bold font-mono">
                            {(ind.score * ind.weight).toFixed(3)}
                          </td>
                          <td className="border border-slate-400 p-1 text-[9px]">{ind.evidenceRef || '-'}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold font-sans">
                        <td colSpan={6} className="border border-slate-400 p-1 text-right">
                          TOTAL SKOR KINERJA BPKP (PREDIKAT: {activeAssessment.kinerjaCategory}):
                        </td>
                        <td className="border border-slate-400 p-1 text-center font-mono text-emerald-900">
                          {activeAssessment.kinerjaScore.toFixed(3)}
                        </td>
                        <td className="border border-slate-400 p-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bab III: Ringkasan Maturitas SPIP */}
              <div className="space-y-2">
                <h4 className="font-sans font-bold uppercase tracking-wider text-xs border-b border-slate-400 pb-1 text-slate-900">
                  III. MATURITAS PENYELENGGARAAN SPIP TERINTEGRASI (PP 60/2008)
                </h4>
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded font-sans text-xs">
                  <p>
                    <strong>Tingkat Kematangan: </strong>
                    {activeAssessment.spipMaturityLevel} dengan Indeks Rata-rata <strong>{activeAssessment.spipMaturityScore.toFixed(2)}</strong> dari skala 5.00.
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Seluruh 5 Unsur Pengendalian Intern (Lingkungan Pengendalian, Penilaian Risiko, Kegiatan Pengendalian, Informasi & Komunikasi, Pemantauan) telah terdefinisi dan terkelola secara konsisten.
                  </p>
                </div>
              </div>

              {/* Bab IV: Rekomendasi Peningkatan */}
              <div className="space-y-2">
                <h4 className="font-sans font-bold uppercase tracking-wider text-xs border-b border-slate-400 pb-1 text-slate-900">
                  IV. REKOMENDASI TINDAK LANJUT STRATEGIS
                </h4>
                <div className="whitespace-pre-line text-justify leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                  {activeAssessment.aiStrategicRecommendations ||
                    '1. Penguatan program penurunan kehilangan air (NRW) menuju target nasional.\n2. Peningkatan jam pelatihan dan kompetensi teknis pegawai.\n3. Monitoring berkelanjutan atas tindak lanjut rekomendasi audit SPI dan BPKP.'}
                </div>
              </div>
            </div>
          )}
        </DocumentPrintPreviewModal>
      )}
    </div>
  );
};
