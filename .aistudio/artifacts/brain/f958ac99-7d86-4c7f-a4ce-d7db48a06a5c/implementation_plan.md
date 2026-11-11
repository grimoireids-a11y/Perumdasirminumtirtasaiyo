# SPI SMART - Perumda Air Minum Tirta Saiyo Kabupaten Pasaman

Sistem Informasi Pengawasan Intern Berbasis Risiko (Risk-Based Internal Audit) terintegrasi secara *full-stack* untuk Satuan Pengawasan Intern (SPI) Perumda Air Minum Tirta Saiyo Kabupaten Pasaman, memfasilitasi peran SPI sebagai *assurance provider* dan *strategic advisor* bagi Direksi dan Dewan Pengawas dari tahap perencanaan, pelaksanaan, pelaporan, hingga pemantauan tindak lanjut rekomendasi.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan klarifikasi yang telah dikonfirmasi:
> - **Inisialisasi Data**: Sistem akan dimulai dengan database bersih tanpa data simulasi awal (*clean database*), namun menyediakan formulir master data yang siap pakai untuk menginput unit dan proses bisnis Tirta Saiyo.
> - **Autentikasi & Akun Pengguna**: Menggunakan form login Email & Password murni dengan validasi RBAC ketat di backend/Firestore security rules (tanpa *quick role-switcher* pintas). Akun awal Administrator/Kepala SPI dapat didaftarkan pertama kali sebagai root administrator.
> - **Cakupan Implementasi**: Seluruh alur pengawasan internal diimplementasikan secara end-to-end (Risk Universe, Risk Register 5x5, RCSA, PKPT & Program Non-Audit, Surat Tugas, Entry/Exit Meeting, PKA, KKA, Evidence Vault, Temuan 5C, Tindak Lanjut, Investigasi Rahasia, Review Regulasi, Export PDF/Excel, dan Analisis AI Gemini).

---

### 1. Overview & Core Concept

- **Apa yang Dibangun**: Aplikasi web enterprise komprehensif bernama **SPI SMART Tirta Saiyo** yang mendigitalkan seluruh siklus pengawasan intern BUMD Air Minum sesuai standar GIAS 2024 (Global Internal Audit Standards), SPIP, dan ISO 31000:2018.
- **Pengguna Sasaran & Persona**:
  1. **Kepala SPI / Super Admin**: Memimpin pengawasan, menetapkan PKPT, menerbitkan surat tugas, menyetujui KKA dan LHA, memantau register risiko korporat.
  2. **Auditor / Anggota SPI**: Menyusun program audit, mengisi KKA, mengunggah bukti kerja, merumuskan calon temuan (5C).
  3. **Direktur**: Menerima laporan eksekutif, memantau *risk heat map*, meninjau progres tindak lanjut temuan, memberikan arahan manajemen.
  4. **Dewan Pengawas**: Memantau independensi pengawasan, capaian PKPT, dan mitigasi risiko strategis.
  5. **Unit Kerja / Auditee**: Menanggapi temuan, mengisi RCSA unit, mengunggah bukti tindak lanjut (*action plan*).
  6. **Administrator Sistem**: Mengelola otorisasi akun, master data struktur BUMD, dan backup data.
- **Nilai Tambah Utama**:
  - Transformasi dari audit konvensional ke *Risk-Based Internal Audit* (RBIA) otomatis.
  - Dokumentasi berjenjang yang aman (*audit trail*, *chain of custody*, penguncian KKA setelah approval).
  - Monitoring tindak lanjut real-time dengan verifikasi berlapis oleh auditor SPI.
  - Asistensi AI (Gemini 3.8 Flash) untuk merapikan rumusan temuan 5C dan rekomendasi mitigasi tanpa automasi putusan hukum.

---

### 2. User Experience & Visual Design

#### A. Identitas Visual & Tema
- **Warna Utama**: Deep Forest Green (`#0d3824` / `#064e3b`) melambangkan integritas pengawasan dan air bersih pegunungan Pasaman.
- **Warna Sekunder**: Emerald Green (`#059669` / `#10b981`) untuk status aktif dan aksen tindakan.
- **Warna Pendukung & Aksen**: Emas/Warm Amber (`#d97706` / `#f59e0b`) untuk peringatan risiko tinggi dan sertifikasi, Crisp White (`#ffffff`), Slate Neutrals (`#f8fafc`, `#e2e8f0`, `#1e293b`).
- **Simbol & Logo**: Identitas **SPI SMART** dengan emblem perisai perlindungan tata kelola (*governance shield*) dan lambang air.
- **Tipografi**: Display font *Plus Jakarta Sans* untuk judul dan navigasi profesional; body *Plus Jakarta Sans*; metrik numerik dan kode referensi menggunakan *tabular-nums* / *monospace* (`font-mono tabular-nums`).

#### B. Tata Letak (Layout) & Navigasi
- **Struktur Layar**: Sidebar terpadu sebelah kiri (260px) dengan pengelompokan modul yang rapi:
  1. *Pusat Komando*: Dashboard Utama & Ringkasan Eksekutif
  2. *Perencanaan Risiko*: Risk Universe, Risk Register 5x5, RCSA Unit, Penyusunan PKPT, Program Non-Audit
  3. *Pelaksanaan Pengawasan*: Penugasan & Surat Tugas, Entry Meeting, Audit Program (PKA), Kertas Kerja Audit (KKA), Sampling & Evidence Vault, Exit Meeting
  4. *Temuan & Tindak Lanjut*: Database Temuan 5C, Rekomendasi SPI, Monitoring & Verifikasi Tindak Lanjut
  5. *Investigasi Khusus*: Registrasi Kasus Khusus / Fraud, Chain of Custody, Log Investigasi Rahasia
  6. *Kepatuhan & Regulasi*: Database Regulasi BUMD & SOP, Lembar Review Produk Hukum
  7. *Pengaturan & Master Data*: Struktur Unit & Wilayah Pasaman, Manajemen Pengguna & Hak Akses
- **Header Atas**: Identitas instansi *Perumda Air Minum Tirta Saiyo Kabupaten Pasaman*, identitas pengguna aktif, tanggal sistem, dan tombol aksi cepat/keluar.

#### C. Alur Pengguna Utama
```
[Login Email & Sandi] 
       │
       ├──► [Dashboard SPI: 15 Kartu Metrik, Heatmap Risiko 5x5, Tren Temuan]
       │
       ├──► [Modul Risiko: Input Risk Register ──► Hitung Inherent & Residual ──► Scoring PKPT]
       │
       ├──► [Pelaksanaan: Surat Tugas ──► Entry Meeting ──► PKA ──► KKA ──► Approval Kepala SPI (Terkunci)]
       │
       ├──► [Hasil Audit: Matriks Temuan 5C ──► Rekomendasi ──► Terbit LHA ──► PDF Export]
       │
       └──► [Tindak Lanjut: Auditee Upload Bukti ──► Auditor Verifikasi ──► Status Selesai]
```

---

### 3. Key Product Decisions & Trade-Offs

1. **Autentikasi & Penyimpanan Data (Firebase Firestore & Firebase Auth)**:
   - *Pilihan*: Menggunakan Firebase Auth untuk otentikasi email/password resmi dan Firestore untuk database dokumen hierarkis.
   - *Alasan*: Menjamin seluruh data KKA, register risiko, dan berkas audit tersimpan persisten di cloud dengan dukungan keamanan aturan (*security rules*), query filter cepat per unit, dan pencatatan audit trail yang permanen.
2. **Kepatuhan Metodologi 5C (Condition, Criteria, Cause, Consequence, Corrective Action)**:
   - *Pilihan*: Memisahkan setiap elemen 5C sebagai field terstruktur pada database temuan, bukan teks bebas tunggal.
   - *Alasan*: Memungkinkan auditor dan manajemen menganalisis akar masalah (*root cause*), menghitung total potensi kerugian finansial yang tervalidasi, serta mengidentifikasi temuan berulang (*recurring findings*).
3. **Pemisahan Modul Investigasi Rahasia (Confidential Cases)**:
   - *Pilihan*: Modul Investigasi memiliki pembatasan akses khusus (*whitelisted investigators* & Kepala SPI saja).
   - *Alasan*: Melindungi asas praduga tak bersalah, menjaga kerahasiaan pelapor/whistleblower, dan mematuhi standar kerahasiaan audit investigatif.
4. **Integrasi AI Gemini Sebagai Asisten Riset (Bukan Pengambil Keputusan)**:
   - *Pilihan*: Menggunakan `gemini-3.8-flash` via endpoint server untuk membantu formulasi rekomendasi, analisis red flags, dan perumusan klausul 5C.
   - *Alasan*: AI bertindak sebagai *copilot* metodologis; keputusan akhir dan persetujuan tetap 100% berada di tangan Auditor dan Kepala SPI.

---

### 4. Technical Architecture & Data Strategy

#### A. Arsitektur Komponen & Aliran Data
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 19 + TypeScript)                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │   Auth & RBAC Guard      │  │         UI Modules (Tailwind CSS)        │ │
│  │  - Email/Password Form   │  │  - Dashboard & Analytics (Chart.js/SVG)  │ │
│  │  - Role-based Protected  │  │  - Risk Register & 5x5 Heatmap Matrix    │ │
│  │    Route Navigation      │  │  - PKPT & RBIA Scoring Engine            │ │
│  └────────────┬─────────────┘  │  - Audit Program & KKA Multi-Tier Review │ │
│               │                │  - 5C Findings & Action Plan Tracker     │ │
│               │                │  - Fraud Investigation & Legal Review    │ │
│               │                └────────────────────┬─────────────────────┘ │
└───────────────┼─────────────────────────────────────┼───────────────────────┘
                │                                     │
                ▼                                     ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│        Firebase Auth & Firestore      │ │      Express Server Proxy         │
│  - Users & Roles (users/{id})         │ │  - POST /api/gemini/analyze       │
│  - Risk Registers (risks/{id})        │ │  - Server-side @google/genai      │
│  - PKPT Plans (pkpt/{id})             │ │    using gemini-3.8-flash         │
│  - Audit Engagements & KKA            │ │  - Secure API Key Environment     │
│  - Findings & Recommendations         │ └───────────────────────────────────┘
│  - Investigation Cases & Regulations  │
└───────────────────────────────────────┘
```

#### B. Struktur Entitas Data Utama (Firestore Collections)
1. `users`: `{ uid, email, displayName, role, unitId, isActive, phone, createdAt }`
2. `units`: `{ id, name, category: 'Direksi' | 'Bidang' | 'Unit Pelayanan', code, headName, isBranch }`
   - *Unit Pelayanan mencakup 12 unit Pasaman*: Lubuk Sikaping, Tigo Nagari, Malampah, Simpati, Kumpulan, Bonjol, Petok, Panti, Cubadak, Sontang, Rao, Duo Koto.
3. `risk_registers`: `{ id, code, year, unitId, businessProcess, category, cause, event, impactDesc, existingControl, likelihood, impact, inherentScore, inherentLevel, controlEffectiveness, residualScore, residualLevel, mitigationPlan, pic, targetDate, status }`
4. `pkpt`: `{ id, year, title, unitId, businessProcess, riskScore, auditType, objective, scope, estimatedDays, auditors: string[], quarter, status, approvalStatus, approvedBy, approvedAt, manualOverrideReason }`
5. `audit_assignments`: `{ id, assignmentNumber, date, basis, auditTeam: [], objectName, unitId, startDate, endDate, status, letterUrl }`
6. `audit_programs`: `{ id, assignmentId, stepNumber, testObjective, testRisk, testControl, procedure, requiredDocs, testMethod, sampleSize, auditor, workPaperRef, status }`
7. `work_papers` (KKA): `{ id, assignmentId, kkaNumber, title, objective, procedure, testedData, findingsAnalysis, conclusion, crossRefs, preparer, reviewer, status: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved', locked: boolean, createdAt, reviewedAt }`
8. `findings`: `{ id, findingNumber, year, assignmentId, unitId, title, category, riskLevel: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis', condition, criteria, cause, consequence, potentialLossAmount, auditorAnalysis, auditeeResponse, status: 'Draft' | 'Final' | 'FollowUp' | 'Closed' }`
9. `recommendations`: `{ id, findingId, recNumber, description, pic, targetDate, successIndicator, status: 'Belum' | 'Proses' | 'Verifikasi' | 'Selesai' | 'Ditolak', actionPlans: [] }`
10. `follow_ups`: `{ id, recommendationId, unitId, submittedBy, responseText, evidenceUrl, evidenceName, submittedAt, verificationNotes, verifier, verifiedAt, status }`
11. `investigations`: `{ id, caseNumber, title, source, receiptDate, chronology, unitId, suspectedModus, estimatedLoss, riskLevel, status, isConfidential: true, authorizedUsers: [], logs: [] }`
12. `regulations`: `{ id, title, regNumber, year, category, about, relevantArticles, status, reviewNotes }`

---

### 5. Verification & Testing Plan

1. **Autentikasi & RBAC**:
   - Uji pembuatan akun pertama sebagai Kepala SPI.
   - Uji pembatasan hak akses: Auditee hanya melihat unit kerjanya sendiri; Auditor tidak bisa menghapus KKA yang disetujui; Direktur & Dewas hanya melihat laporan eksekutif & temuan.
2. **Kalkulator Risiko 5x5**:
   - Uji otomatisasi perkalian Likelihood $\times$ Impact (1-25) dan kategorisasi (Rendah: 1-4, Sedang: 5-9, Tinggi: 10-16, Ekstrem: 17-25).
   - Uji penayangan matriks *Risk Heat Map* secara interaktif.
3. **Siklus Pemeriksaan**:
   - Buat penugasan $\to$ susun PKA $\to$ isi KKA $\to$ proses review berjenjang $\to$ kunci dokumen setelah *approved*.
4. **Matriks Temuan 5C & Monitoring Tindak Lanjut**:
   - Catat temuan $\to$ buat rekomendasi $\to$ simulasi auditee upload tindak lanjut $\to$ verifikasi SPI $\to$ penutupan status (*closed*).
5. **Ekspor & Integrasi AI**:
   - Uji cetak/ekspor lembar laporan hasil audit dalam format PDF/tampilan cetak bersih.
   - Uji endpoint AI Gemini untuk asistensi perumusan rekomendasi dan red flags.
