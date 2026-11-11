import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
} from 'firebase/firestore';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle,
  Clock,
  TrendingUp,
  ShieldAlert,
  FileCheck2,
  Filter,
  Flame,
  ArrowUpRight,
  Sparkles,
  FileText,
  Award,
  Shield,
  Info,
  Layers,
  RefreshCw,
  Building2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { PKPT, Finding, Recommendation, RiskRegister, Unit, AuditAssignment } from '../../types/audit';
import { RiskRegisterManualBookModal } from '../risk/RiskRegisterManualBookModal';

interface DashboardOverviewProps {
  onNavigateTo: (tab: any) => void;
  onOpenAiAssistant?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTo,
  onOpenAiAssistant,
}) => {
  const { userProfile } = useAuth();
  const isFullAccess = userProfile?.role === 'KEPALA_SPI' || userProfile?.role === 'ADMIN_SISTEM';

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedAuditType, setSelectedAuditType] = useState<string>('ALL');
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{ l: number; i: number } | null>(null);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [isManualBookOpen, setIsManualBookOpen] = useState(false);

  // Real-time states
  const [pkptList, setPkptList] = useState<PKPT[]>([]);
  const [findingsList, setFindingsList] = useState<Finding[]>([]);
  const [recommendationsList, setRecommendationsList] = useState<Recommendation[]>([]);
  const [risksList, setRisksList] = useState<RiskRegister[]>([]);
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<AuditAssignment[]>([]);

  useEffect(() => {
    const unsubPkpt = onSnapshot(collection(db, 'pkpt'), (snap) => {
      setPkptList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PKPT)));
    });

    const unsubFindings = onSnapshot(collection(db, 'findings'), (snap) => {
      setFindingsList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Finding)));
    });

    const unsubRecs = onSnapshot(collection(db, 'recommendations'), (snap) => {
      setRecommendationsList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recommendation)));
    });

    const unsubRisks = onSnapshot(collection(db, 'risk_registers'), (snap) => {
      setRisksList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RiskRegister)));
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snap) => {
      setUnitsList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });

    const unsubAssignments = onSnapshot(collection(db, 'audit_assignments'), (snap) => {
      setAssignmentsList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditAssignment)));
    });

    return () => {
      unsubPkpt();
      unsubFindings();
      unsubRecs();
      unsubRisks();
      unsubUnits();
      unsubAssignments();
    };
  }, []);

  // Filtered collections
  const filteredPkpt = pkptList.filter((p) => {
    if (selectedYear !== 0 && p.year !== selectedYear) return false;
    if (selectedUnit !== 'ALL' && p.unitId !== selectedUnit) return false;
    if (selectedAuditType !== 'ALL' && p.auditType !== selectedAuditType) return false;
    return true;
  });

  const filteredFindings = findingsList.filter((f) => {
    if (selectedYear !== 0 && f.year !== selectedYear) return false;
    if (selectedUnit !== 'ALL' && f.unitId !== selectedUnit) return false;
    return true;
  });

  const filteredRisks = risksList.filter((r) => {
    if (selectedYear !== 0 && r.year !== selectedYear) return false;
    if (selectedUnit !== 'ALL' && r.unitId !== selectedUnit) return false;
    return true;
  });

  // Calculate the 15 Required Stat Cards (for Kepala SPI & Admin)
  const totalPkpt = filteredPkpt.length;
  const totalAudit = assignmentsList.length;
  const auditSelesai = filteredPkpt.filter((p) => p.status === 'Selesai').length;
  const auditBerlangsung = filteredPkpt.filter((p) => p.status === 'Berlangsung').length;
  const auditBelum = filteredPkpt.filter((p) => p.status === 'Rencana').length;
  const totalTemuan = filteredFindings.length;
  const temuanTinggi = filteredFindings.filter((f) => f.riskLevel === 'Tinggi' || f.riskLevel === 'Kritis').length;
  const temuanSedang = filteredFindings.filter((f) => f.riskLevel === 'Sedang').length;
  const temuanRendah = filteredFindings.filter((f) => f.riskLevel === 'Rendah').length;
  const recBelum = recommendationsList.filter((r) => r.status === 'Belum Ditindaklanjuti').length;
  const recProses = recommendationsList.filter((r) => r.status === 'Dalam Proses' || r.status === 'Menunggu Verifikasi').length;
  const recSelesai = recommendationsList.filter((r) => r.status === 'Selesai').length;
  const persenRealisasiPkpt = totalPkpt > 0 ? Math.round((auditSelesai / totalPkpt) * 100) : 0;
  const totalRec = recommendationsList.length;
  const persenPenyelesaianTl = totalRec > 0 ? Math.round((recSelesai / totalRec) * 100) : 0;
  const totalRisikoKritis = filteredRisks.filter((r) => {
    const l = Math.min(5, Math.max(1, r.residualLikelihood || r.likelihood || 1));
    const i = Math.min(5, Math.max(1, r.residualImpact || r.impact || 1));
    return l * i >= 20;
  }).length;

  const totalLoss = filteredFindings.reduce((acc, curr) => acc + (curr.potentialLoss || 0), 0);

  // 5x5 Heat Map Grid Counter (Likelihood 1-5, Impact 1-5)
  const heatmapGrid: { [key: string]: number } = {};
  for (let l = 1; l <= 5; l++) {
    for (let i = 1; i <= 5; i++) {
      heatmapGrid[`${l}-${i}`] = 0;
    }
  }
  filteredRisks.forEach((r) => {
    const l = Math.min(5, Math.max(1, r.residualLikelihood || r.likelihood || 1));
    const i = Math.min(5, Math.max(1, r.residualImpact || r.impact || 1));
    heatmapGrid[`${l}-${i}`] = (heatmapGrid[`${l}-${i}`] || 0) + 1;
  });

  // BPKP 5-Level Risk Classification Helper
  const getBpkpLevel = (score: number) => {
    if (score >= 20) {
      return {
        label: 'Sangat Tinggi (Ekstrem)',
        shortLabel: 'Sangat Tinggi',
        color: 'bg-rose-600 text-white hover:bg-rose-700',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        border: 'border-rose-600',
        ring: 'ring-rose-500',
        desc: 'Prioritas mitigasi Direksi / tindakan darurat',
      };
    }
    if (score >= 12) {
      return {
        label: 'Tinggi',
        shortLabel: 'Tinggi',
        color: 'bg-orange-500 text-white hover:bg-orange-600',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        border: 'border-orange-500',
        ring: 'ring-orange-500',
        desc: 'Mitigasi aktif & pemantauan intensif bulanan',
      };
    }
    if (score >= 5) {
      return {
        label: 'Sedang',
        shortLabel: 'Sedang',
        color: 'bg-yellow-400 text-slate-900 hover:bg-yellow-500',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        border: 'border-yellow-400',
        ring: 'ring-yellow-400',
        desc: 'Pengendalian berkala triwulanan sesuai SOP',
      };
    }
    if (score >= 3) {
      return {
        label: 'Rendah',
        shortLabel: 'Rendah',
        color: 'bg-lime-500 text-slate-900 hover:bg-lime-600',
        badge: 'bg-lime-100 text-lime-800 border-lime-300',
        border: 'border-lime-500',
        ring: 'ring-lime-500',
        desc: 'Pemantauan berkala unit kerja pelaksana',
      };
    }
    return {
      label: 'Sangat Rendah',
      shortLabel: 'Sangat Rendah',
      color: 'bg-emerald-500 text-white hover:bg-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      border: 'border-emerald-500',
      ring: 'ring-emerald-500',
      desc: 'Risiko dapat diterima (Risk Acceptance)',
    };
  };

  const getHeatmapColor = (score: number) => {
    return getBpkpLevel(score).color;
  };

  // Counts for the 5 BPKP Risk Levels
  const sangatTinggiCount = filteredRisks.filter((r) => {
    const l = Math.min(5, Math.max(1, r.residualLikelihood || r.likelihood || 1));
    const i = Math.min(5, Math.max(1, r.residualImpact || r.impact || 1));
    return l * i >= 20;
  }).length;

  const tinggiCount = filteredRisks.filter((r) => {
    const l = Math.min(5, Math.max(1, r.residualLikelihood || r.likelihood || 1));
    const i = Math.min(5, Math.max(1, r.residualImpact || r.impact || 1));
    const score = l * i;
    return score >= 12 && score < 20;
  }).length;

  const sedangCount = filteredRisks.filter((r) => {
    const l = Math.min(5, Math.max(1, r.residualLikelihood || r.likelihood || 1));
    const i = Math.min(5, Math.max(1, r.residualImpact || r.impact || 1));
    const score = l * i;
    return score >= 5 && score < 12;
  }).length;

  const rendahCount = filteredRisks.filter((r) => {
    const l = Math.min(5, Math.max(1, r.residualLikelihood || r.likelihood || 1));
    const i = Math.min(5, Math.max(1, r.residualImpact || r.impact || 1));
    const score = l * i;
    return score >= 3 && score < 5;
  }).length;

  const sangatRendahCount = filteredRisks.filter((r) => {
    const l = Math.min(5, Math.max(1, r.residualLikelihood || r.likelihood || 1));
    const i = Math.min(5, Math.max(1, r.residualImpact || r.impact || 1));
    const score = l * i;
    return score <= 2;
  }).length;

  // Filtered risks for display in the interactive heat map breakdown
  const displayedHeatmapRisks = filteredRisks.filter((r) => {
    const l = Math.min(5, Math.max(1, r.residualLikelihood || r.likelihood || 1));
    const i = Math.min(5, Math.max(1, r.residualImpact || r.impact || 1));
    const score = l * i;

    if (selectedHeatmapCell) {
      return l === selectedHeatmapCell.l && i === selectedHeatmapCell.i;
    }
    if (selectedLevelFilter === 'Sangat Tinggi') return score >= 20;
    if (selectedLevelFilter === 'Tinggi') return score >= 12 && score < 20;
    if (selectedLevelFilter === 'Sedang') return score >= 5 && score < 12;
    if (selectedLevelFilter === 'Rendah') return score >= 3 && score < 5;
    if (selectedLevelFilter === 'Sangat Rendah') return score <= 2;
    return true;
  });

  // RESTRICTED VIEW: For non-Kepala SPI and non-Admin Sistem users
  // Specifically requested: Dashboard Pengawasan only displays Peta Risiko Korporat (5x5 Risk Heat Map)
  if (!isFullAccess) {
    return (
      <div className="space-y-6">
        {/* Executive Header Peta Risiko Korporat */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200">
                <Flame className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Peta Risiko Korporat (5x5 Risk Heat Map)
              </h2>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md border border-emerald-300">
                Tahun Anggaran {selectedYear === 0 ? 'Semua Tahun' : selectedYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Perumda Air Minum Tirta Saiyo Kabupaten Pasaman · Pemetaan sebaran risiko residual berstandar BPKP
            </p>
          </div>

          {/* Filter Bar & Quick Link */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              <span>Filter:</span>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            >
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear - 2}>{currentYear - 2}</option>
              <option value={0}>Semua Tahun</option>
            </select>

            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 max-w-[200px] truncate"
            >
              <option value="ALL">Semua Unit Kerja Korporat</option>
              {unitsList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsManualBookOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Buka Buku Manual Pengisian Register Risiko Korporat (Matriks 5x5)"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
              <span>Buku Panduan 5×5</span>
            </button>

            <button
              onClick={() => onNavigateTo('risk_register')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-900 hover:to-teal-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Register Risiko Korporat (5x5)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-200" />
            </button>
          </div>
        </div>

        {/* 5-Level BPKP Risk Profile Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => {
              setSelectedHeatmapCell(null);
              setSelectedLevelFilter('ALL');
            }}
            className={`p-3.5 bg-white rounded-xl border cursor-pointer transition-all ${
              selectedLevelFilter === 'ALL' && !selectedHeatmapCell
                ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Total Risiko</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {filteredRisks.length}
            </p>
            <span className="text-[10px] text-slate-500">Semua Kategori</span>
          </div>

          <div
            onClick={() => {
              setSelectedHeatmapCell(null);
              setSelectedLevelFilter(selectedLevelFilter === 'Sangat Tinggi' ? 'ALL' : 'Sangat Tinggi');
            }}
            className={`p-3.5 bg-white rounded-xl border cursor-pointer transition-all ${
              selectedLevelFilter === 'Sangat Tinggi'
                ? 'border-rose-600 ring-2 ring-rose-500/20 shadow-sm bg-rose-50/20'
                : 'border-slate-200/90 shadow-2xs hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-700">
              <span>Sangat Tinggi</span>
              <Flame className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-extrabold text-rose-700 mt-1 tabular-nums">
              {sangatTinggiCount}
            </p>
            <span className="text-[10px] text-rose-600 font-semibold">Skor 20–25 (Ekstrem)</span>
          </div>

          <div
            onClick={() => {
              setSelectedHeatmapCell(null);
              setSelectedLevelFilter(selectedLevelFilter === 'Tinggi' ? 'ALL' : 'Tinggi');
            }}
            className={`p-3.5 bg-white rounded-xl border cursor-pointer transition-all ${
              selectedLevelFilter === 'Tinggi'
                ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-sm bg-orange-50/20'
                : 'border-slate-200/90 shadow-2xs hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-orange-700">
              <span>Tinggi</span>
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-extrabold text-orange-600 mt-1 tabular-nums">
              {tinggiCount}
            </p>
            <span className="text-[10px] text-orange-600 font-semibold">Skor 12–16</span>
          </div>

          <div
            onClick={() => {
              setSelectedHeatmapCell(null);
              setSelectedLevelFilter(selectedLevelFilter === 'Sedang' ? 'ALL' : 'Sedang');
            }}
            className={`p-3.5 bg-white rounded-xl border cursor-pointer transition-all ${
              selectedLevelFilter === 'Sedang'
                ? 'border-yellow-500 ring-2 ring-yellow-500/20 shadow-sm bg-yellow-50/20'
                : 'border-slate-200/90 shadow-2xs hover:border-yellow-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-yellow-800">
              <span>Sedang</span>
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-extrabold text-yellow-700 mt-1 tabular-nums">
              {sedangCount}
            </p>
            <span className="text-[10px] text-yellow-700 font-semibold">Skor 5–10</span>
          </div>

          <div
            onClick={() => {
              setSelectedHeatmapCell(null);
              setSelectedLevelFilter(selectedLevelFilter === 'Rendah' ? 'ALL' : 'Rendah');
            }}
            className={`p-3.5 bg-white rounded-xl border cursor-pointer transition-all ${
              selectedLevelFilter === 'Rendah'
                ? 'border-lime-500 ring-2 ring-lime-500/20 shadow-sm bg-lime-50/20'
                : 'border-slate-200/90 shadow-2xs hover:border-lime-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-lime-800">
              <span>Rendah</span>
              <CheckCircle className="w-4 h-4 text-lime-600" />
            </div>
            <p className="text-2xl font-extrabold text-lime-700 mt-1 tabular-nums">
              {rendahCount}
            </p>
            <span className="text-[10px] text-lime-700 font-semibold">Skor 3–4</span>
          </div>

          <div
            onClick={() => {
              setSelectedHeatmapCell(null);
              setSelectedLevelFilter(selectedLevelFilter === 'Sangat Rendah' ? 'ALL' : 'Sangat Rendah');
            }}
            className={`p-3.5 bg-white rounded-xl border cursor-pointer transition-all ${
              selectedLevelFilter === 'Sangat Rendah'
                ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm bg-emerald-50/20'
                : 'border-slate-200/90 shadow-2xs hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
              <span>Sangat Rendah</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
              {sangatRendahCount}
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold">Skor 1–2 (Diterima)</span>
          </div>
        </div>

        {/* 5x5 Heat Map Matrix Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600" />
                Matriks Peta Risiko 5×5 (Kemungkinan × Dampak Residual)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik sel matriks untuk memfilter daftar risiko terkait di tabel bawah
              </p>
            </div>
            {selectedHeatmapCell && (
              <button
                onClick={() => setSelectedHeatmapCell(null)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Pilihan Sel ({selectedHeatmapCell.l} × {selectedHeatmapCell.i})</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[620px] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                <span>Kemungkinan Terjadinya (Tingkat 5 ke 1) ↓</span>
                <span>Tingkat Dampak Finansial / Operasional (1 ke 5) →</span>
              </div>

              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                {/* Header labels */}
                <div className="p-2 font-bold text-[11px] text-slate-500 bg-slate-100/80 rounded-lg flex items-center justify-center">
                  Level \ Dampak
                </div>
                <div className="p-2 font-bold text-[11px] text-slate-700 bg-slate-100/80 rounded-lg">
                  1 (Sangat Rendah)
                </div>
                <div className="p-2 font-bold text-[11px] text-slate-700 bg-slate-100/80 rounded-lg">
                  2 (Rendah)
                </div>
                <div className="p-2 font-bold text-[11px] text-slate-700 bg-slate-100/80 rounded-lg">
                  3 (Sedang)
                </div>
                <div className="p-2 font-bold text-[11px] text-slate-700 bg-slate-100/80 rounded-lg">
                  4 (Tinggi)
                </div>
                <div className="p-2 font-bold text-[11px] text-slate-700 bg-slate-100/80 rounded-lg">
                  5 (Sangat Tinggi)
                </div>

                {/* Rows from Likelihood 5 down to 1 */}
                {[5, 4, 3, 2, 1].map((l) => {
                  const likelihoodLabels: Record<number, string> = {
                    5: '5 (Sangat Sering)',
                    4: '4 (Sering)',
                    3: '3 (Sedang)',
                    2: '2 (Jarang)',
                    1: '1 (Sangat Jarang)',
                  };
                  return (
                    <React.Fragment key={`restrict-row-${l}`}>
                      <div className="p-2.5 font-bold text-[11px] text-slate-700 bg-slate-100/80 rounded-lg flex items-center justify-center text-left">
                        {likelihoodLabels[l]}
                      </div>
                      {[1, 2, 3, 4, 5].map((i) => {
                        const score = l * i;
                        const count = heatmapGrid[`${l}-${i}`] || 0;
                        const isSelected = selectedHeatmapCell?.l === l && selectedHeatmapCell?.i === i;
                        const bpkpInfo = getBpkpLevel(score);

                        return (
                          <button
                            key={`restrict-cell-${l}-${i}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedHeatmapCell(null);
                              } else {
                                setSelectedHeatmapCell({ l, i });
                                setSelectedLevelFilter('ALL');
                              }
                            }}
                            className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                              bpkpInfo.color
                            } ${
                              isSelected
                                ? 'ring-4 ring-slate-900 scale-[1.03] shadow-lg z-10'
                                : 'hover:scale-[1.02] shadow-2xs'
                            }`}
                            title={`Kemungkinan: ${l}, Dampak: ${i} | Skor: ${score} (${bpkpInfo.label}) | Jumlah: ${count} risiko`}
                          >
                            <span className="text-base font-black tabular-nums">{count}</span>
                            <span className="text-[10px] opacity-85 font-medium">skor {score}</span>
                          </button>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Legend BPKP */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs font-semibold text-slate-700 border-t border-slate-100">
                <span className="text-slate-400 font-normal">Keterangan Selera Risiko BPKP:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-rose-600"></span> Sangat Tinggi (20–25)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-orange-500"></span> Tinggi (12–16)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-yellow-400"></span> Sedang (5–10)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-lime-500"></span> Rendah (3–4)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500"></span> Sangat Rendah (1–2)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown List of Risks for Selected Cell or Level */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                {selectedHeatmapCell ? (
                  <span>
                    Daftar Risiko Sel Matriks [Kemungkinan {selectedHeatmapCell.l} × Dampak {selectedHeatmapCell.i}]
                    {' · Skor '}{selectedHeatmapCell.l * selectedHeatmapCell.i} (
                    {getBpkpLevel(selectedHeatmapCell.l * selectedHeatmapCell.i).label})
                  </span>
                ) : selectedLevelFilter !== 'ALL' ? (
                  <span>Daftar Risiko Kategori: {selectedLevelFilter}</span>
                ) : (
                  <span>Daftar Seluruh Risiko Korporat Terpetakan</span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan {displayedHeatmapRisks.length} dari total {filteredRisks.length} risiko korporat
              </p>
            </div>

            <button
              onClick={() => onNavigateTo('risk_register')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
            >
              <span>Kelola di Register Risiko</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {displayedHeatmapRisks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">Tidak ada risiko yang terpetakan pada kriteria ini.</p>
              <p className="text-slate-400 mt-1">Pilih sel matriks lain atau reset filter untuk melihat risiko korporat lainnya.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Kode & Judul Risiko</th>
                    <th className="py-2.5 px-3">Unit Kerja</th>
                    <th className="py-2.5 px-3">Kategori BPKP</th>
                    <th className="py-2.5 px-3 text-center">L × D</th>
                    <th className="py-2.5 px-3 text-center">Skor & Level</th>
                    <th className="py-2.5 px-3">Rencana Pengendalian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedHeatmapRisks.map((r) => {
                    const l = Math.min(5, Math.max(1, r.residualLikelihood || r.likelihood || 1));
                    const i = Math.min(5, Math.max(1, r.residualImpact || r.impact || 1));
                    const score = l * i;
                    const bpkpInfo = getBpkpLevel(score);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] font-bold text-emerald-800 block">
                            {r.code || 'RSK-00'}
                          </span>
                          <span className="font-bold text-slate-900 block mt-0.5 line-clamp-2">
                            {r.event || r.impactDesc || 'Peristiwa risiko'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                          {r.unitName || 'Semua Unit'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200 whitespace-nowrap">
                            {r.category || 'Operasional'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 whitespace-nowrap">
                          {l} × {i}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${bpkpInfo.badge}`}
                          >
                            {score} - {bpkpInfo.shortLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[260px]">
                          <p className="line-clamp-2 text-[11px]">
                            {r.mitigationPlan || r.existingControl || 'Pengendalian rutin SOP unit'}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Governance / Access Policy Notice */}
        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold text-emerald-950">
              Kebijakan Akses Pengawasan SPI SMART · Perumda Air Minum Tirta Saiyo Pasaman
            </p>
            <p className="text-emerald-800 text-[11px]">
              Berdasarkan pedoman tata kelola pengawasan intern berstandar BPKP, role Anda memiliki akses resmi pada
              <strong> Peta Risiko Korporat (5x5 Heat Map)</strong> dan <strong>Register Risiko Korporat</strong>.
              Seluruh modul perencanaan audit (PKPT), pelaksanaan pemeriksaan (PKA, KKA, LHA), temuan klausul 5C, tindak
              lanjut rekomendasi, serta pengaturan tata kelola sistem dibatasi khusus untuk Kepala SPI dan Administrator Sistem.
            </p>
          </div>
        </div>

        {/* MANUAL BOOK MODAL (INTERAKTIF & CETAK) */}
        <RiskRegisterManualBookModal
          isOpen={isManualBookOpen}
          onClose={() => setIsManualBookOpen(false)}
        />
      </div>
    );
  }

  // FULL ACCESS VIEW: For Kepala SPI & Admin Sistem
  return (
    <div className="space-y-6">
      {/* Executive Welcome & Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Pusat Kendali Pengawasan Intern (SPI SMART)
            </h2>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
              Tahun Anggaran {selectedYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring pengawasan berbasis risiko, kepatuhan BUMD, dan penyelesaian rekomendasi perbaikan
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
            <option value={0}>Semua Tahun</option>
          </select>

          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 max-w-[180px] truncate"
          >
            <option value="ALL">Semua Unit Kerja</option>
            {unitsList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-900 hover:to-teal-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Analisis AI</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTo('audit_reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-900 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Kelola Laporan Hasil Audit (LHA) dengan Asistensi AI"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>Laporan Hasil Audit (LHA)</span>
          </button>

          <button
            onClick={() => onNavigateTo('bpkp_assessment')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Self Assessment Kinerja BUMD Air Minum & Maturitas SPIP Standar BPKP"
          >
            <Award className="w-3.5 h-3.5 text-emerald-800" />
            <span>Self Assessment BPKP</span>
          </button>

          <button
            onClick={() => setIsManualBookOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Buka Buku Manual Pengisian Register Risiko Korporat (Matriks 5x5)"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span>Buku Panduan 5×5</span>
          </button>
        </div>
      </div>

      {/* 15 Primary Stat Cards Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>Ringkasan Eksekutif 15 Indikator Pengawasan</span>
          <span className="text-[11px] font-normal text-slate-400">Diperbarui real-time dari Firestore</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Total PKPT */}
          <div
            onClick={() => onNavigateTo('pkpt')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">1. Total PKPT</span>
              <CalendarCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalPkpt}</p>
            <span className="text-[10px] text-slate-400">Objek Audit Berjalan</span>
          </div>

          {/* 2. Total Kegiatan Audit */}
          <div
            onClick={() => onNavigateTo('audit_assignments')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">2. Penugasan Audit</span>
              <FileCheck2 className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalAudit}</p>
            <span className="text-[10px] text-slate-400">Surat Tugas Terbit</span>
          </div>

          {/* 3. Audit Selesai */}
          <div
            onClick={() => onNavigateTo('pkpt')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">3. Audit Selesai</span>
              <CheckCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-emerald-700 mt-1 tabular-nums">{auditSelesai}</p>
            <span className="text-[10px] text-emerald-600 font-medium">{persenRealisasiPkpt}% Target PKPT</span>
          </div>

          {/* 4. Audit Berlangsung */}
          <div
            onClick={() => onNavigateTo('pkpt')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">4. Audit Berjalan</span>
              <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-amber-600 mt-1 tabular-nums">{auditBerlangsung}</p>
            <span className="text-[10px] text-slate-400">Proses Pengujian</span>
          </div>

          {/* 5. Audit Belum Dilaksanakan */}
          <div
            onClick={() => onNavigateTo('pkpt')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">5. Belum Audit</span>
              <Clock className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-slate-600 mt-1 tabular-nums">{auditBelum}</p>
            <span className="text-[10px] text-slate-400">Rencana Terjadwal</span>
          </div>

          {/* 6. Total Temuan */}
          <div
            onClick={() => onNavigateTo('findings')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">6. Total Temuan</span>
              <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">{totalTemuan}</p>
            <span className="text-[10px] text-slate-400">Klausul 5C Tercatat</span>
          </div>

          {/* 7. Temuan Kategori Tinggi */}
          <div
            onClick={() => onNavigateTo('findings')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">7. Temuan Tinggi</span>
              <Flame className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-rose-700 mt-1 tabular-nums">{temuanTinggi}</p>
            <span className="text-[10px] text-rose-600 font-medium">Perhatian Khusus</span>
          </div>

          {/* 8. Temuan Kategori Sedang */}
          <div
            onClick={() => onNavigateTo('findings')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">8. Temuan Sedang</span>
              <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-amber-600 mt-1 tabular-nums">{temuanSedang}</p>
            <span className="text-[10px] text-slate-400">Tingkat Moderat</span>
          </div>

          {/* 9. Temuan Kategori Rendah */}
          <div
            onClick={() => onNavigateTo('findings')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">9. Temuan Rendah</span>
              <CheckCircle className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-slate-700 mt-1 tabular-nums">{temuanRendah}</p>
            <span className="text-[10px] text-slate-400">Penyempurnaan SOP</span>
          </div>

          {/* 10. Rekomendasi Belum Ditindaklanjuti */}
          <div
            onClick={() => onNavigateTo('follow_ups')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">10. TL Belum Ada</span>
              <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-rose-600 mt-1 tabular-nums">{recBelum}</p>
            <span className="text-[10px] text-slate-400">Menunggu Respon Unit</span>
          </div>

          {/* 11. Rekomendasi Dalam Proses */}
          <div
            onClick={() => onNavigateTo('follow_ups')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">11. TL Diproses</span>
              <Clock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-blue-600 mt-1 tabular-nums">{recProses}</p>
            <span className="text-[10px] text-slate-400">Verifikasi SPI</span>
          </div>

          {/* 12. Rekomendasi Selesai */}
          <div
            onClick={() => onNavigateTo('follow_ups')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">12. TL Selesai</span>
              <CheckCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-emerald-700 mt-1 tabular-nums">{recSelesai}</p>
            <span className="text-[10px] text-emerald-600 font-medium">Tervalidasi SPI</span>
          </div>

          {/* 13. Persentase Realisasi PKPT */}
          <div
            onClick={() => onNavigateTo('pkpt')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">13. Realisasi PKPT</span>
              <TrendingUp className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-teal-700 mt-1 tabular-nums">{persenRealisasiPkpt}%</p>
            <span className="text-[10px] text-slate-400">Capaian Tahunan</span>
          </div>

          {/* 14. Persentase Penyelesaian Tindak Lanjut */}
          <div
            onClick={() => onNavigateTo('follow_ups')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">14. Capaian TL</span>
              <CheckCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-emerald-800 mt-1 tabular-nums">{persenPenyelesaianTl}%</p>
            <span className="text-[10px] text-slate-400">Efektivitas Tindak Lanjut</span>
          </div>

          {/* 15. Total Risiko Kritis */}
          <div
            onClick={() => onNavigateTo('risk_register')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">15. Risiko Kritis</span>
              <ShieldAlert className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xl font-extrabold text-rose-700 mt-1 tabular-nums">{totalRisikoKritis}</p>
            <span className="text-[10px] text-rose-600 font-medium">Prioritas Mitigasi</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Risk Heatmap Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Heatmap (5x5 Matrix) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600" />
                Peta Risiko Korporat (5x5 Risk Heat Map)
              </h4>
              <p className="text-xs text-slate-500">
                Pemetaan sebaran risiko residual berdasarkan kemungkinan × dampak
              </p>
            </div>
            <button
              onClick={() => onNavigateTo('risk_register')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Lihat Detail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5x5 Matrix Layout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
              <span>Kemungkinan (Tinggi 5 ke 1) ↓</span>
              <span>Dampak (1 ke 5) →</span>
            </div>

            <div className="grid grid-cols-6 gap-1 text-center text-xs">
              {/* Header col labels */}
              <div className="p-1 font-bold text-[10px] text-slate-400">L \ D</div>
              <div className="p-1 font-bold text-[10px] text-slate-500 bg-slate-100 rounded-sm">1 (Minor)</div>
              <div className="p-1 font-bold text-[10px] text-slate-500 bg-slate-100 rounded-sm">2 (Kecil)</div>
              <div className="p-1 font-bold text-[10px] text-slate-500 bg-slate-100 rounded-sm">3 (Moderat)</div>
              <div className="p-1 font-bold text-[10px] text-slate-500 bg-slate-100 rounded-sm">4 (Besar)</div>
              <div className="p-1 font-bold text-[10px] text-slate-500 bg-slate-100 rounded-sm">5 (Kritis)</div>

              {/* Rows from Likelihood 5 down to 1 */}
              {[5, 4, 3, 2, 1].map((l) => (
                <React.Fragment key={`row-${l}`}>
                  <div className="p-2 font-bold text-[10px] text-slate-500 bg-slate-100 rounded-sm flex items-center justify-center">
                    {l}
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const score = l * i;
                    const count = heatmapGrid[`${l}-${i}`] || 0;
                    return (
                      <div
                        key={`cell-${l}-${i}`}
                        className={`p-2.5 rounded-lg font-bold text-xs flex flex-col items-center justify-center transition-all ${getHeatmapColor(
                          score
                        )}`}
                        title={`Kemungkinan ${l}, Dampak ${i} (Skor: ${score}) - Jumlah: ${count}`}
                      >
                        <span className="text-sm font-black tabular-nums">{count}</span>
                        <span className="text-[9px] opacity-75 font-normal">skor {score}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* Legend BPKP */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500"></span> Sangat Rendah (1-2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-lime-500"></span> Rendah (3-4)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-yellow-400"></span> Sedang (5-10)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-orange-500"></span> Tinggi (12-16)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-600"></span> Sangat Tinggi (20-25)
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress: Temuan Berdasarkan Kategori & Nilai Potensi Kerugian */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Validasi Kerugian Finansial & Klasifikasi Temuan
              </h4>
              <p className="text-xs text-slate-500">Total potensi kerugian teridentifikasi dari hasil audit</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Potensi Kerugian</span>
              <span className="text-sm font-black text-rose-700 tabular-nums">
                Rp {totalLoss.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-3 pt-1">
            {[
              {
                label: 'Operasional & Efisiensi Distribusi (NRW)',
                count: filteredFindings.filter((f) => f.category?.includes('Operasional') || f.category?.includes('Teknik')).length,
                color: 'bg-emerald-600',
              },
              {
                label: 'Keuangan, Kas, & Piutang Rekening Air',
                count: filteredFindings.filter((f) => f.category?.includes('Keuangan') || f.category?.includes('Piutang')).length,
                color: 'bg-amber-500',
              },
              {
                label: 'Kepatuhan Regulasi & SOP Internal',
                count: filteredFindings.filter((f) => f.category?.includes('Kepatuhan') || f.category?.includes('SOP')).length,
                color: 'bg-blue-600',
              },
              {
                label: 'Pengadaan Barang & Jasa / Gudang',
                count: filteredFindings.filter((f) => f.category?.includes('Pengadaan') || f.category?.includes('Gudang')).length,
                color: 'bg-teal-600',
              },
              {
                label: 'Pelayanan Pelanggan & Pembacaan Meter',
                count: filteredFindings.filter((f) => f.category?.includes('Pelayanan') || f.category?.includes('Meter')).length,
                color: 'bg-purple-600',
              },
            ].map((item) => {
              const pct = totalTemuan > 0 ? Math.round((item.count / totalTemuan) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[280px]">{item.label}</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {item.count} temuan ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Tindak Lanjut Progress Bar */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-slate-700">
              <span>Progres Keseluruhan Tindak Lanjut Rekomendasi</span>
              <span className="text-emerald-700 font-extrabold tabular-nums">{persenPenyelesaianTl}% Selesai</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${persenPenyelesaianTl}%` }}
                className="bg-emerald-600 h-full transition-all"
                title={`Selesai: ${persenPenyelesaianTl}%`}
              />
              <div
                style={{
                  width: `${
                    totalRec > 0 ? Math.round((recProses / totalRec) * 100) : 0
                  }%`,
                }}
                className="bg-blue-500 h-full transition-all"
                title="Dalam Proses"
              />
              <div
                style={{
                  width: `${
                    totalRec > 0 ? Math.round((recBelum / totalRec) * 100) : 0
                  }%`,
                }}
                className="bg-rose-500 h-full transition-all"
                title="Belum Ditindaklanjuti"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Selesai: {recSelesai}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Diproses: {recProses}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Belum: {recBelum}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agenda Terdekat & Temuan Butuh Perhatian */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda Pengawasan & Penugasan Aktif */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              Penugasan Aktif & Agenda Terdekat
            </h4>
            <button
              onClick={() => onNavigateTo('audit_assignments')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Semua Penugasan
            </button>
          </div>

          {assignmentsList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada surat penugasan aktif. Silakan terbitkan surat tugas baru di modul Penugasan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignmentsList.slice(0, 4).map((a) => (
                <div key={a.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{a.objectName}</span>
                    <p className="text-[11px] text-slate-500">
                      Unit: {a.unitName} · Ketua: {a.teamLeader}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                      No: {a.letterNumber}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md shrink-0">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Temuan Yang Membutuhkan Perhatian Kepala SPI */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Temuan Kritis & Overdue Rekomendasi
            </h4>
            <button
              onClick={() => onNavigateTo('findings')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Kelola Temuan
            </button>
          </div>

          {filteredFindings.filter((f) => f.riskLevel === 'Tinggi' || f.riskLevel === 'Kritis').length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ada temuan kategori kritis yang belum selesai.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFindings
                .filter((f) => f.riskLevel === 'Tinggi' || f.riskLevel === 'Kritis')
                .slice(0, 4)
                .map((f) => (
                  <div key={f.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 line-clamp-1">{f.title}</span>
                      <p className="text-[11px] text-slate-500">
                        {f.unitName} · {f.category}
                      </p>
                      {f.potentialLoss > 0 && (
                        <p className="text-[10px] text-rose-700 font-bold tabular-nums">
                          Potensi Kerugian: Rp {f.potentialLoss.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-md shrink-0">
                      {f.riskLevel}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      {/* MANUAL BOOK MODAL (INTERAKTIF & CETAK) */}
      <RiskRegisterManualBookModal
        isOpen={isManualBookOpen}
        onClose={() => setIsManualBookOpen(false)}
      />
    </div>
  );
};
