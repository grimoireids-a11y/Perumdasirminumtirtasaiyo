export type UserRole =
  | 'KEPALA_SPI'
  | 'AUDITOR'
  | 'DIREKTUR'
  | 'DEWAN_PENGAWAS'
  | 'AUDITEE'
  | 'ADMIN_SISTEM';

export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  password?: string;
  displayName: string;
  role: UserRole;
  unitId?: string;
  unitName?: string;
  nip?: string;
  phone?: string;
  isActive: boolean;
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export type UnitCategory = 'PIMPINAN' | 'PENGAWASAN' | 'BIDANG' | 'UNIT_PELAYANAN';

export interface Unit {
  id: string;
  name: string;
  code: string;
  category: UnitCategory;
  headName?: string;
  location?: string;
  isActive: boolean;
}

export type RiskLevel = 'Sangat Rendah' | 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi' | 'Ekstrem';
export type ControlEffectiveness = 'Efektif' | 'Sebagian Efektif' | 'Tidak Efektif';
export type RiskTreatmentOption = 'Mengurangi (Reduce)' | 'Menghindari (Avoid)' | 'Memindahkan (Transfer)' | 'Menerima (Accept)';
export type RiskCause5M = 'MAN (SDM)' | 'MONEY (Keuangan)' | 'MATERIAL (Bahan)' | 'MACHINE (Peralatan & Bangunan)' | 'METHODE (Kebijakan & SOP)';
export type RiskDimension = 'Dimensi Waktu' | 'Dimensi Kualitas' | 'Dimensi Keselamatan/Keamanan';
export type RiskImpactArea = 'Beban Keuangan (Finansial)' | 'Penurunan Reputasi' | 'Penundaan Layanan (SOP)' | 'Dampak K3 / Keselamatan' | 'Dampak Lingkungan' | 'Tuntutan Hukum';

export interface RiskRegister {
  id: string;
  code: string;
  year: number;
  unitId: string;
  unitName: string;
  objective?: string;           // Sasaran/Tujuan unit kerja (Kaidah BPKP)
  businessProcess: string;
  category: string;             // 8 Kategori Risiko BPKP
  dimension?: RiskDimension;    // 3 Dimensi BPKP (Waktu, Kualitas, Keselamatan/Keamanan)
  causeCategory5M?: RiskCause5M;// Akar Masalah 5M (MAN, MONEY, MATERIAL, MACHINE, METHODE)
  cause: string;
  event: string;                // Peristiwa Risiko (Kaidah BPKP: penghambat tujuan, bukan penyebab/dampak)
  impactArea?: RiskImpactArea;  // Area Dampak BPKP
  impactDesc: string;
  existingControl: string;
  likelihood: number;           // 1 - 5 (Kriteria Frekuensi/Persentase BPKP)
  impact: number;               // 1 - 5 (Kriteria Kerugian/Penundaan Layanan BPKP)
  inherentScore: number;        // likelihood * impact (1 - 25)
  inherentLevel: RiskLevel;
  controlEffectiveness: ControlEffectiveness;
  residualLikelihood: number;
  residualImpact: number;
  residualScore: number;
  residualLevel: RiskLevel;
  treatmentOption?: RiskTreatmentOption; // Mengurangi / Menghindari / Memindahkan / Menerima
  mitigationPlan: string;
  pic: string;
  targetDate: string;
  status: 'Identifikasi' | 'Mitigasi' | 'Selesai';
  // Peran Evaluasi SPI (Slide 3 & 12 Dokumen BPKP: Evaluasi atas Proses Manajemen Risiko)
  spiReviewStatus?: 'Diusulkan Auditee' | 'Sesuai Kaidah' | 'Perlu Perbaikan Kaidah';
  spiReviewNotes?: string;
  spiEvaluatedBy?: string;
  spiEvaluatedAt?: string;
  createdBy: string;
  createdAt?: string;
}

export interface PKPT {
  id: string;
  year: number;
  title: string;
  unitId: string;
  unitName: string;
  businessProcess: string;
  riskScore: number;
  priorityScore: number;
  priorityRank?: string;
  auditType: string;
  objective: string;
  scope: string;
  estimatedDays: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  status: 'Rencana' | 'Berlangsung' | 'Selesai';
  approvalStatus: 'Draft' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
  approvedAt?: string;
  manualOverrideReason?: string;
}

export interface SPIProgram {
  id: string;
  year: number;
  activityName: string;
  target: string;
  schedule: string;
  pic: string;
  budget: number;
  kpi: string;
  realization: string;
  status: 'Belum Dimulai' | 'Dalam Proses' | 'Terealisasi';
}

export interface AuditAssignment {
  id: string;
  letterNumber: string;
  letterDate: string;
  basis: string;
  objectName: string;
  unitId: string;
  unitName: string;
  auditType: string;
  supervisor: string;
  teamLeader: string;
  teamMembers: string;
  objective: string;
  scope: string;
  startDate: string;
  endDate: string;
  status: 'Diterbitkan' | 'Berlangsung' | 'Selesai';
}

export interface AuditProgramStep {
  id: string;
  assignmentId: string;
  stepNumber: number;
  testObjective: string;
  testRisk: string;
  testControl: string;
  procedure: string;
  requiredDocs: string;
  testMethod: string;
  sampleSize: string;
  auditor: string;
  workPaperRef: string;
  status: 'Belum Dilaksanakan' | 'Sedang Berjalan' | 'Selesai';
}

export type KKAStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Approved';

export interface WorkPaper {
  id: string;
  assignmentId: string;
  assignmentTitle?: string;
  kkaNumber: string;
  title: string;
  auditProgramRef?: string;
  objective: string;
  auditBasis: string;
  procedure: string;
  testedData: string;
  sampleSize: string;
  testResult: string;
  evidenceRef: string;
  analysis: string;
  conclusion: string;
  crossRefs: string;
  preparer: string;
  reviewer?: string;
  status: KKAStatus;
  isLocked: boolean;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type FindingRiskLevel = 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
export type FindingStatus = 'Draft' | 'Disetujui' | 'Tindak Lanjut' | 'Selesai';

export interface Finding {
  id: string;
  findingNumber: string;
  year: number;
  assignmentId: string;
  assignmentTitle?: string;
  unitId: string;
  unitName: string;
  title: string;
  category: string;
  riskLevel: FindingRiskLevel;
  condition: string;
  criteria: string;
  cause: string;
  consequence: string;
  potentialLoss: number;
  auditorAnalysis: string;
  auditeeResponse?: string;
  status: FindingStatus;
  createdAt: string;
}

export type RecommendationStatus =
  | 'Belum Ditindaklanjuti'
  | 'Dalam Proses'
  | 'Menunggu Verifikasi'
  | 'Selesai'
  | 'Tidak Dapat Ditindaklanjuti';

export interface Recommendation {
  id: string;
  findingId: string;
  findingNumber?: string;
  findingTitle?: string;
  unitId?: string;
  unitName?: string;
  recNumber: string;
  description: string;
  pic: string;
  targetDate: string;
  successIndicator: string;
  status: RecommendationStatus;
}

export interface FollowUp {
  id: string;
  recommendationId: string;
  unitId: string;
  responseNotes: string;
  evidenceFileName?: string;
  evidenceFileUrl?: string;
  submittedBy: string;
  submittedAt: string;
  verificationNotes?: string;
  verifier?: string;
  verifiedAt?: string;
  status: 'Diajukan' | 'Disetujui' | 'Ditolak';
}

export interface Investigation {
  id: string;
  caseNumber: string;
  title: string;
  source: string;
  receiptDate: string;
  unitId: string;
  unitName: string;
  suspectedModus: string;
  estimatedLoss: number;
  riskLevel: 'Sedang' | 'Tinggi' | 'Kritis';
  chronology: string;
  initialAnalysis: string;
  decision: string;
  status: 'Registrasi' | 'Penelaahan' | 'Audit Investigatif' | 'Laporan Akhir' | 'Selesai';
  isConfidential: boolean;
  leadInvestigator: string;
  createdAt: string;
}

export interface Regulation {
  id: string;
  title: string;
  regNumber: string;
  year: number;
  category: 'UU/PP/Permen' | 'Perdir' | 'SOP' | 'SK Direksi' | 'Standar Audit' | 'Perjanjian/Kontrak';
  about: string;
  riskArticles: string;
  recommendation: string;
  status: 'Berlaku' | 'Dalam Review' | 'Dicabut';
}

export interface OfficialSignatory {
  id: string;
  name: string;      // 1. Nama
  nip: string;       // 2. NIP
  position: string;  // 3. Jabatan
  department?: string;
  order?: number;
  isActive?: boolean;
}

export interface DocumentSignatureConfig {
  location: string;
  date: string;
  signatory1: OfficialSignatory;
  signatory2?: OfficialSignatory;
  signatory3?: OfficialSignatory;
  showSignatory2?: boolean;
  showSignatory3?: boolean;
  signatory1RoleLabel?: string;
  signatory2RoleLabel?: string;
  signatory3RoleLabel?: string;
}

export type AuditOpinion =
  | 'Sangat Baik (Tanpa Catatan)'
  | 'Efektif (Dengan Catatan Minor)'
  | 'Cukup Efektif (Perlu Perbaikan Signifikan)'
  | 'Kurang Efektif (Kelemahan Kritis)'
  | 'Tidak Efektif (Gagal Sistem)';

export type AuditReportStatus =
  | 'Draft'
  | 'Review Pengendali Teknis'
  | 'Persetujuan Kepala SPI'
  | 'Final / Diterbitkan ke Direktur';

export interface AuditReport {
  id: string;
  reportNumber: string;
  reportDate: string;
  assignmentId: string;
  assignmentNumber?: string;
  auditTitle: string;
  unitId: string;
  unitName: string;
  auditPeriod: string;
  auditType: string;
  supervisor: string;
  teamLeader: string;
  teamMembers: string;

  executiveSummary: string;
  backgroundAndBasis: string;
  auditScope: string;
  generalOverview: string;
  internalControlEvaluation: string;
  keyFindingsSummary: string;
  auditOpinion: AuditOpinion;
  overallConclusion: string;
  strategicRecommendations: string;
  managementCommitment: string;

  status: AuditReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type BPKPKinerjaAspect = 'KEUANGAN' | 'PELAYANAN' | 'OPERASIONAL' | 'SDM';

export type BPKPKategoriKinerja =
  | 'SEHAT - BAIK SEKALI'
  | 'SEHAT - BAIK'
  | 'SEHAT - CUKUP'
  | 'KURANG SEHAT'
  | 'SAKIT';

export type SPIPMaturityLevel =
  | 'Level 1 - Rintisan'
  | 'Level 2 - Berkembang'
  | 'Level 3 - Terdefinisi'
  | 'Level 4 - Terkelola & Terukur'
  | 'Level 5 - Optimum';

export interface BPKPIndicatorAssessment {
  id: string;
  aspect: BPKPKinerjaAspect;
  code: string;
  name: string;
  formulaDesc: string;
  weight: number;
  targetValue: number;
  actualValue: number;
  unitMeasurement: string;
  score: number; // 1 to 5
  weightedScore: number;
  evidenceRef: string;
  notes: string;
  spiVerificationNotes?: string;
}

export interface SPIPElementAssessment {
  id: string;
  elementNumber: number; // 1 to 5
  elementName: string; // Lingkungan Pengendalian, Penilaian Risiko, Kegiatan Pengendalian, Informasi & Komunikasi, Pemantauan
  subElementCode: string;
  subElementName: string;
  bpkpCriteria: string;
  selfRating: number; // 1 to 5
  evidenceRef: string;
  improvementPlan: string;
  spiReviewRating?: number;
  spiVerificationNotes?: string;
}

export interface BPKPSelfAssessment {
  id: string;
  year: number;
  assessmentTitle: string;
  assessmentDate: string;
  evaluatorName: string;
  evaluatorRole: string;
  status: 'Draft' | 'Verifikasi SPI' | 'Disetujui Direktur' | 'Final BPKP';
  // Kinerja BPKP Metrics
  kinerjaScore: number; // 1.00 - 5.00
  kinerjaCategory: BPKPKategoriKinerja;
  aspectScores: {
    keuangan: number;
    pelayanan: number;
    operasional: number;
    sdm: number;
  };
  indicators: BPKPIndicatorAssessment[];
  // SPIP Maturity Metrics
  spipMaturityScore: number; // 1.00 - 5.00
  spipMaturityLevel: SPIPMaturityLevel;
  spipElements: SPIPElementAssessment[];
  // AI Diagnostic & Recommendations
  aiExecutiveSummary?: string;
  aiStrategicRecommendations?: string;
  // Verification & Approval
  verifiedBy?: string;
  verifiedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}


