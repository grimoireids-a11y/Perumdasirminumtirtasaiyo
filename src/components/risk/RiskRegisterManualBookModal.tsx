import React, { useState } from 'react';
import {
  BookOpen,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Layers,
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  Download,
  Info,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';
import {
  BPKP_RISK_CATEGORIES,
  BPKP_LIKELIHOOD_LEVELS,
  BPKP_IMPACT_LEVELS,
  BPKP_CASE_STUDIES,
} from '../../data/bpkpStandards';

interface RiskRegisterManualBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskRegisterManualBookModal: React.FC<RiskRegisterManualBookModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<string>('bab1');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  if (!isOpen) return null;

  const sections = [
    { id: 'bab1', title: 'Bab I: Konsep Dasar Manajemen Risiko & Peran 3 Lini' },
    { id: 'bab2', title: 'Bab II: Kaidah Emas Perumusan Risiko (Golden Rules BPKP)' },
    { id: 'bab3', title: 'Bab III: 8 Kategori Risiko BPKP Perumda Air Minum' },
    { id: 'bab4', title: 'Bab IV: Analisis Akar Masalah 5M & 3 Dimensi Sasaran' },
    { id: 'bab5', title: 'Bab V: Skala Kriteria Matriks 5×5 (Kemungkinan & Dampak)' },
    { id: 'bab6', title: 'Bab VI: Tingkat Selera Risiko & Matriks 5×5 BPKP' },
    { id: 'bab7', title: 'Bab VII: Rencana Perlakuan Risiko (Reduce/Avoid/Transfer/Accept)' },
    { id: 'bab8', title: 'Bab VIII: Panduan Langkah Demi Langkah Pengisian Form di Aplikasi' },
    { id: 'bab9', title: 'Bab IX: Studi Kasus Nyata Perumda Tirta Saiyo (Slide 13-16)' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#0a2f1c] via-[#0d3824] to-[#072114] text-white px-6 py-4 flex items-center justify-between border-b border-emerald-950/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-emerald-800 text-emerald-200 rounded">
                    Pedoman Resmi BPKP & ISO 31000
                  </span>
                  <span className="text-[11px] text-emerald-300 font-mono">Ver. 2026</span>
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight mt-0.5">
                  Buku Manual Pengisian Register Risiko Korporat (Matriks 5×5)
                </h2>
                <p className="text-[11px] text-emerald-300/80">
                  Perumda Air Minum Tirta Saiyo Kabupaten Pasaman
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
                title="Buka pratinjau cetak / ekspor ke PDF dokumen manual book"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak / Unduh PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Tutup Buku Panduan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Layout: Sidebar Bookmarks + Content */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-50">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-slate-100/90 border-r border-slate-200 p-3 overflow-y-auto space-y-1 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Daftar Isi Manual Book:
              </span>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    activeSection === sec.id
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{sec.title}</span>
                  {activeSection === sec.id && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}

              <div className="pt-4 border-t border-slate-200 mt-4 px-2 space-y-2">
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 leading-tight">
                  <span className="font-bold block mb-0.5">💡 Tips Penting:</span>
                  Auditee hanya bertanggung jawab mengidentifikasi risiko unit kerja masing-masing. Evaluasi independen dilakukan oleh SPI.
                </div>
              </div>
            </div>

            {/* Document Content View */}
            <div className="flex-1 p-5 md:p-8 overflow-y-auto bg-white custom-scrollbar space-y-6 text-slate-800 text-xs leading-relaxed">
              {/* BAB 1 */}
              {activeSection === 'bab1' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Bab I
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Konsep Dasar Manajemen Risiko & Tiga Lini Pertahanan (Three Lines Model)
                    </h3>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                    <h4 className="font-bold text-emerald-950 text-xs">
                      1. Definisi Risiko Berdasarkan ISO 31000 & Pedoman BPKP:
                    </h4>
                    <p className="italic text-emerald-900">
                      "Risk is the effect of uncertainty on objectives" (Pengaruh ketidakpastian terhadap pencapaian sasaran).
                    </p>
                    <p className="text-slate-700">
                      Risiko di Perumda Air Minum Tirta Saiyo Kabupaten Pasaman didefinisikan sebagai peristiwa potensial di masa mendatang yang apabila terjadi akan menghambat, menunda, atau menggagalkan pencapaian sasaran strategis maupun operasional perusahaan.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">
                      2. Peran Tiga Lini Pertahanan (Three Lines of Defense):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-blue-800 bg-blue-100 rounded block w-fit mb-1.5">
                          Lini Pertama (1st Line)
                        </span>
                        <strong className="block text-slate-900">Unit Kerja / Auditee</strong>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Pemilik risiko (*Risk Owner*). Bertanggung jawab mengidentifikasi, mengukur, dan melaksanakan pengendalian harian atas risiko di unit kerjanya (Cabang, Bagian Teknik, Keuangan, dsb.).
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 rounded block w-fit mb-1.5">
                          Lini Kedua (2nd Line)
                        </span>
                        <strong className="block text-slate-900">Direksi & Manajer Risiko</strong>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Fasilitator dan pengawas kebijakan manajemen risiko. Memantau profil risiko korporat agregat dan menetapkan selera risiko (*risk appetite*).
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded block w-fit mb-1.5">
                          Lini Ketiga (3rd Line)
                        </span>
                        <strong className="block text-slate-900">Satuan Pengawasan Intern (SPI)</strong>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Evaluator independen. Menguji efektivitas tata kelola risiko, mengevaluasi ketepatan kaidah register risiko yang diisi auditee, dan melaksanakan audit berbasis risiko (*Risk-Based Internal Audit*).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BAB 2 */}
              {activeSection === 'bab2' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Bab II
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Kaidah Emas Perumusan Risiko (Golden Rules BPKP Slide 13–16)
                    </h3>
                  </div>

                  <p className="text-slate-700">
                    Berdasarkan paparan evaluasi BPKP, kesalahan paling umum pada BUMD air minum adalah mencampuradukkan antara <strong>Tujuan</strong>, <strong>Peristiwa Risiko</strong>, <strong>Penyebab</strong>, dan <strong>Dampak</strong>.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-slate-200 rounded-lg">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Elemen</th>
                          <th className="p-2.5">Pengertian Standar BPKP</th>
                          <th className="p-2.5">Ciri Khas Perumusan</th>
                          <th className="p-2.5">Contoh Perumusan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        <tr>
                          <td className="p-2.5 font-bold text-blue-700">1. Sasaran / Tujuan</td>
                          <td className="p-2.5">Apa yang ingin dicapai oleh unit kerja dalam Renbis / RKA.</td>
                          <td className="p-2.5">Kalimat positif capaian target kinerja.</td>
                          <td className="p-2.5 font-medium">"Menjamin kontinuitas suplai air bersih 24 jam kepada pelanggan"</td>
                        </tr>
                        <tr className="bg-rose-50/40">
                          <td className="p-2.5 font-bold text-rose-700">2. Peristiwa Risiko</td>
                          <td className="p-2.5">Peristiwa potensial yang dapat menghambat/menggagalkan sasaran.</td>
                          <td className="p-2.5">Diawali kata: "Terjadinya...", "Ketidakmampuan...", "Kegagalan..."</td>
                          <td className="p-2.5 font-bold text-rose-900">"Terjadinya gangguan suplai air bersih & pemadaman aliran air pada jam sibuk"</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-amber-700">3. Akar Masalah (5M)</td>
                          <td className="p-2.5">Faktor riil mengapa peristiwa risiko tersebut dapat terjadi.</td>
                          <td className="p-2.5">Berakar pada Man, Money, Material, Machine, atau Methode.</td>
                          <td className="p-2.5 font-medium">"Pompa distribusi intake rusak mendadak (Machine) dan listrik PLN padam tanpa genset otomatis (Machine)"</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-purple-700">4. Dampak (Impact)</td>
                          <td className="p-2.5">Kerugian nyata yang diderita jika risiko terjadi.</td>
                          <td className="p-2.5">Kerugian rupiah, keluhan pelanggan, atau teguran hukum.</td>
                          <td className="p-2.5 font-medium">"Keluhan pelanggan meningkat drastis, penurunan pendapatan air, dan penurunan citra BUMD"</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="font-bold text-amber-950 block mb-1">
                      ⚠️ Larangan Penting dalam Perumusan BPKP:
                    </span>
                    <ul className="list-disc list-inside text-amber-900 text-[11px] space-y-1">
                      <li><strong>Jangan menulis dampak sebagai risiko:</strong> "Pelanggan komplain" bukanlah risiko, melainkan dampak dari air mati!</li>
                      <li><strong>Jangan menulis ketiadaan anggaran sebagai risiko:</strong> "Kurangnya anggaran" adalah penyebab (Money), bukan peristiwa risiko!</li>
                      <li><strong>Jangan merumuskan mitigasi yang tidak menyentuh akar masalah:</strong> Melakukan survey kepuasan pelanggan tidak memperbaiki pompa yang rusak!</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* BAB 3 */}
              {activeSection === 'bab3' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Bab III
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Taksonomi 8 Kategori Risiko BPKP Resmi (Slide 5)
                    </h3>
                  </div>

                  <p className="text-slate-700">
                    Setiap risiko yang diinput oleh unit kerja wajib diklasifikasikan ke dalam salah satu dari 8 kategori risiko resmi BPKP untuk BUMD Air Minum:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {BPKP_RISK_CATEGORIES.map((cat) => (
                      <div key={cat.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold text-[10px] flex items-center justify-center">
                            {cat.id}
                          </span>
                          <strong className="text-slate-900">{cat.name}</strong>
                        </div>
                        <p className="text-slate-700 text-[11px]">{cat.definition}</p>
                        <div className="p-2 bg-white rounded border border-slate-200 text-[10.5px] text-slate-600 italic">
                          <strong>Contoh di Tirta Saiyo:</strong> {cat.example}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BAB 4 */}
              {activeSection === 'bab4' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Bab IV
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Analisis Akar Masalah dengan Kerangka 5M & 3 Dimensi Sasaran
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">
                      1. Kerangka Akar Masalah 5M (Root Cause Framework):
                    </h4>
                    <p className="text-slate-700">
                      Dalam formulir register risiko, Auditee wajib memilih salah satu kategori 5M agar rencana perlakuan tepat sasaran:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="text-emerald-900 block font-bold">1. MAN (Sumber Daya Manusia)</strong>
                        <p className="text-[10.5px] text-slate-600 mt-0.5">
                          Kurangnya jumlah personil teknisi pipa, kekurangpahaman SOP pembacaan meter, atau kelalaian pengawasan shift jaga.
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="text-emerald-900 block font-bold">2. MONEY (Keuangan & Anggaran)</strong>
                        <p className="text-[10.5px] text-slate-600 mt-0.5">
                          Ketidakcukupan likuiditas kas operasional, keterlambatan pencairan dana talangan pemda, atau tingginya tunggakan piutang.
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="text-emerald-900 block font-bold">3. MATERIAL (Bahan Baku & Kimia)</strong>
                        <p className="text-[10.5px] text-slate-600 mt-0.5">
                          Kualitas bahan kimia koagulan (tawas/PAC) kurang optimal, stok pipa PVC/HDPE kosong, atau spesifikasi valve tidak presisi.
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="text-emerald-900 block font-bold">4. MACHINE (Peralatan & Instalasi)</strong>
                        <p className="text-[10.5px] text-slate-600 mt-0.5">
                          Pompa submersible sudah berumur & aus, ketiadaan genset otomatis saat listrik padam, atau bak sedimentasi bocor.
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2 md:col-span-1">
                        <strong className="text-emerald-900 block font-bold">5. METHODE (Kebijakan & SOP)</strong>
                        <p className="text-[10.5px] text-slate-600 mt-0.5">
                          Belum adanya SOP flushing pipa berkala, ketiadaan jadwal kalibrasi water meter pelanggan, atau SOP penagihan kadaluarsa.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">
                      2. Tiga Dimensi Sasaran Kinerja (Slide 8):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                        <strong className="text-blue-900 block">1. Dimensi Waktu</strong>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Terkait ketepatan waktu penyelesaian tugas, durasi pemadaman air, kecepatan respon perbaikan pipa bocor (&lt; 24 jam).
                        </p>
                      </div>
                      <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200">
                        <strong className="text-teal-900 block">2. Dimensi Kualitas</strong>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Terkait standar mutu air minum (Permenkes 2/2023: kekeruhan &lt; 3 NTU, pH 6.5–8.5, ketiadaan E.coli), serta akurasi pencatatan meter.
                        </p>
                      </div>
                      <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200">
                        <strong className="text-rose-900 block">3. Dimensi Keselamatan / K3</strong>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Terkait keamanan petugas lapangan pada galian pipa dalam, penanganan gas klorin berbahaya, dan keselamatan instalasi listrik.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BAB 5 */}
              {activeSection === 'bab5' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Bab V
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Standar Kriteria Penilaian Kemungkinan (Likelihood) & Dampak (Impact)
                    </h3>
                  </div>

                  {/* Likelihood Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      Tabel Skala Kemungkinan (Likelihood: Nilai 1 s.d. 5) - BPKP Slide 9
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border border-slate-200 rounded-lg">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                          <tr>
                            <th className="p-2 text-center w-12">Level</th>
                            <th className="p-2">Kategori</th>
                            <th className="p-2">Frekuensi Kejadian</th>
                            <th className="p-2 text-center">Persentase</th>
                            <th className="p-2">Toleransi Historis</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {BPKP_LIKELIHOOD_LEVELS.map((item) => (
                            <tr key={item.level} className="hover:bg-slate-50">
                              <td className="p-2 text-center font-bold text-emerald-900">{item.level}</td>
                              <td className="p-2 font-semibold text-slate-900">{item.name}</td>
                              <td className="p-2 text-slate-700">{item.frequency}</td>
                              <td className="p-2 text-center font-mono font-bold text-slate-800">{item.percentage}</td>
                              <td className="p-2 text-slate-600">{item.tolerance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Impact Table */}
                  <div className="space-y-2 pt-3">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                      Tabel Skala Dampak (Impact: Nilai 1 s.d. 5) - BPKP Slide 9
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border border-slate-200 rounded-lg">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10.5px]">
                          <tr>
                            <th className="p-2 text-center w-12">Level</th>
                            <th className="p-2">Tingkat Dampak</th>
                            <th className="p-2">Beban Finansial (% Anggaran)</th>
                            <th className="p-2">Penundaan SOP</th>
                            <th className="p-2">Reputasi & Keluhan</th>
                            <th className="p-2">Dampak K3 & Lingkungan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[10.5px]">
                          {BPKP_IMPACT_LEVELS.map((item) => (
                            <tr key={item.level} className="hover:bg-slate-50">
                              <td className="p-2 text-center font-bold text-rose-900">{item.level}</td>
                              <td className="p-2 font-semibold text-slate-900">{item.name}</td>
                              <td className="p-2 text-slate-800 font-mono">{item.financial}</td>
                              <td className="p-2 text-slate-700">{item.delay}</td>
                              <td className="p-2 text-slate-700">{item.reputation}</td>
                              <td className="p-2 text-slate-600">{item.k3} · {item.env}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* BAB 6 */}
              {activeSection === 'bab6' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Bab VI
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Tingkat Selera Risiko & Matriks 5×5 BPKP (Slide 9 & 11)
                    </h3>
                  </div>

                  <p className="text-slate-700">
                    Skor besaran risiko dihitung dengan rumus: <strong>Skor = Nilai Kemungkinan (1–5) × Nilai Dampak (1–5)</strong>. Hasil perkalian menghasilkan skala nilai 1 sampai dengan 25 yang dikelompokkan ke dalam 5 tingkatan selera risiko:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-center">
                    <div className="p-3 rounded-xl bg-rose-600 text-white space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">Level 5</span>
                      <strong className="text-xs block">Sangat Tinggi / Ekstrem</strong>
                      <span className="text-sm font-black block">20 – 25</span>
                      <p className="text-[9.5px] opacity-90">Penanganan darurat langsung Direksi</p>
                    </div>

                    <div className="p-3 rounded-xl bg-orange-500 text-white space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">Level 4</span>
                      <strong className="text-xs block">Tinggi</strong>
                      <span className="text-sm font-black block">12 – 16</span>
                      <p className="text-[9.5px] opacity-90">Mitigasi aktif & pemantauan bulanan</p>
                    </div>

                    <div className="p-3 rounded-xl bg-yellow-400 text-slate-900 space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">Level 3</span>
                      <strong className="text-xs block">Sedang</strong>
                      <span className="text-sm font-black block">5 – 10</span>
                      <p className="text-[9.5px] opacity-85">Pengendalian triwulanan sesuai SOP</p>
                    </div>

                    <div className="p-3 rounded-xl bg-lime-500 text-slate-900 space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">Level 2</span>
                      <strong className="text-xs block">Rendah</strong>
                      <span className="text-sm font-black block">3 – 4</span>
                      <p className="text-[9.5px] opacity-85">Pemantauan berkala unit kerja</p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500 text-white space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">Level 1</span>
                      <strong className="text-xs block">Sangat Rendah</strong>
                      <span className="text-sm font-black block">1 – 2</span>
                      <p className="text-[9.5px] opacity-90">Risiko diterima (Risk Acceptance)</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                    <strong className="text-xs text-slate-900 block">
                      Perbedaan Risiko Inheren (Inherent Risk) vs Risiko Residual (Residual Risk):
                    </strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-900 block mb-1">A. Risiko Inheren:</span>
                        Tingkat risiko alamiah sebelum memperhitungkan efektivitas sistem pengendalian intern yang ada.
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-bold text-emerald-900 block mb-1">B. Risiko Residual:</span>
                        Sisa risiko yang masih ada setelah pengendalian intern berjalan. Skor inilah yang dimasukkan ke Peta Risiko 5×5 korporat.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BAB 7 */}
              {activeSection === 'bab7' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Bab VII
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Rencana Perlakuan Risiko (Risk Treatment Options) - BPKP Slide 11
                    </h3>
                  </div>

                  <p className="text-slate-700">
                    Sesuai kaidah BPKP, unit kerja wajib memilih salah satu dari 4 opsi strategi perlakuan risiko:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded">
                          Opsi 1
                        </span>
                        <strong className="text-slate-900">Mengurangi (Reduce / Mitigate)</strong>
                      </div>
                      <p className="text-slate-700 text-[11px]">
                        Tindakan aktif untuk menurunkan kemungkinan terjadinya risiko atau memperkecil dampak kerugiannya.
                      </p>
                      <p className="text-slate-500 text-[10.5px] italic">
                        Contoh: Memasang valve proteksi tekanan air, preventive maintenance pompa, atau pelatihan billing kasir.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-rose-800 bg-rose-100 rounded">
                          Opsi 2
                        </span>
                        <strong className="text-slate-900">Menghindari (Avoid)</strong>
                      </div>
                      <p className="text-slate-700 text-[11px]">
                        Menghentikan atau tidak memulai aktivitas yang memicu risiko tinggi yang berada di luar kapasitas toleransi BUMD.
                      </p>
                      <p className="text-slate-500 text-[10.5px] italic">
                        Contoh: Membatalkan pemasangan pipa di tebing curam rawan longsor aktif dan mengalihkan trase pipa ke jalur jalan kabupaten.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-blue-800 bg-blue-100 rounded">
                          Opsi 3
                        </span>
                        <strong className="text-slate-900">Memindahkan / Membagi (Transfer / Share)</strong>
                      </div>
                      <p className="text-slate-700 text-[11px]">
                        Mengalihkan sebagian atau seluruh konsekuensi finansial risiko kepada pihak ketiga yang kompeten.
                      </p>
                      <p className="text-slate-500 text-[10.5px] italic">
                        Contoh: Mengasuransikan aset gedung intake dan instalasi pompa transmisi terhadap bencana alam gempa bumi / banjir bandang.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 rounded">
                          Opsi 4
                        </span>
                        <strong className="text-slate-900">Menerima (Accept)</strong>
                      </div>
                      <p className="text-slate-700 text-[11px]">
                        Tidak mengambil tindakan aktif tambahan karena tingkat risiko sudah berada di dalam toleransi selera risiko rendah (skor 1–2).
                      </p>
                      <p className="text-slate-500 text-[10.5px] italic">
                        Contoh: Fluktuasi harga ATK kantor minor yang dapat ditolerir dalam anggaran belanja rutin.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BAB 8 */}
              {activeSection === 'bab8' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Bab VIII
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Panduan Langkah Demi Langkah Pengisian Form di Aplikasi SPI SMART
                    </h3>
                  </div>

                  <p className="text-slate-700">
                    Berikut adalah tahapan teknis yang harus diikuti oleh petugas unit kerja (Auditee) saat menginput risiko ke dalam aplikasi:
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-xs">Login ke Akun Unit Kerja</strong>
                        <p className="text-[11px] text-slate-600">
                          Masuk menggunakan akun unit masing-masing (misal: Cabang Lubuk Sikaping, Bagian Hubungan Langganan, dll.). Nama unit akan terkunci otomatis sesuai otorisasi login.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-xs">Pilih Menu "Register Risiko Korporat (5x5)"</strong>
                        <p className="text-[11px] text-slate-600">
                          Klik tombol hijau <strong>"+ Tambah Risiko Unit"</strong> di pojok kanan atas tabel.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-xs">Isi Sasaran Unit Kerja & Peristiwa Risiko</strong>
                        <p className="text-[11px] text-slate-600">
                          Tuliskan <strong>Sasaran / Tujuan</strong> unit kerja (target positif) dan rumuskan <strong>Peristiwa Risiko</strong> (penghambat tujuan, diawali dengan kata "Terjadinya...").
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        4
                      </span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-xs">Pilih Kategori BPKP, Akar Masalah 5M, & 3 Dimensi</strong>
                        <p className="text-[11px] text-slate-600">
                          Pilih salah satu dari 8 Kategori Risiko BPKP, tentukan akar penyebab 5M (Man/Money/Material/Machine/Methode), dan pilih dimensi sasarannya.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        5
                      </span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-xs">Uraikan Dampak & Pengendalian Eksisting</strong>
                        <p className="text-[11px] text-slate-600">
                          Jelaskan kerugian riil pada operasional/keuangan/layanan pelanggan dan sebutkan SOP atau kendali yang saat ini sudah berjalan di unit kerja.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        6
                      </span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-xs">Skoring Kemungkinan & Dampak (Inheren & Residual)</strong>
                        <p className="text-[11px] text-slate-600">
                          Pilih nilai Kemungkinan (1–5) dan Dampak (1–5). Sistem akan secara otomatis menghitung nilai perkalian skor (1–25) beserta kategori selera risiko BPKP.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        7
                      </span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-xs">Rencana Perlakuan Risiko, PIC, & Target Waktu</strong>
                        <p className="text-[11px] text-slate-600">
                          Pilih opsi strategi perlakuan (Reduce / Avoid / Transfer / Accept), uraikan langkah aksi mitigasi konkret, tentukan pejabat penanggung jawab (PIC), dan batas tanggal penyelesaian.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        8
                      </span>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-xs">Simpan & Tunggu Reviu Independen SPI</strong>
                        <p className="text-[11px] text-slate-600">
                          Klik <strong>"Simpan Register Risiko"</strong>. Status akan tercatat sebagai "Diusulkan Auditee" dan SPI akan melakukan evaluasi kesesuaian kaidah serta memberikan catatan arahan bila perlu perbaikan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BAB 9 */}
              {activeSection === 'bab9' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Bab IX
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Studi Kasus Pembelajaran Nyata Perumda Air Minum (Slide 13–16 BPKP)
                    </h3>
                  </div>

                  <p className="text-slate-700">
                    Pelajari dua studi kasus nyata dari BPKP berikut sebagai panduan perbandingan praktis dalam membedakan perumusan yang salah dan yang benar:
                  </p>

                  <div className="space-y-4">
                    {BPKP_CASE_STUDIES.map((cs, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="font-extrabold text-emerald-900 text-xs border-b border-slate-200 pb-2">
                          {cs.title}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="font-bold text-slate-700 block">Sasaran / Tujuan Unit:</span>
                            <p className="font-semibold text-slate-900">{cs.objective}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700 block">Kaidah Benar Peristiwa Risiko:</span>
                            <p className="font-bold text-emerald-800">{cs.correctRisk}</p>
                          </div>
                        </div>

                        <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-[11px]">
                          <span className="font-bold text-rose-900 block mb-0.5">
                            ❌ Kesalahan Umum yang Sering Terjadi:
                          </span>
                          <p className="text-rose-800">{cs.wrongRiskOrCause}</p>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <span className="font-bold text-slate-700 block">Akar Masalah (5M) yang Sebenarnya:</span>
                          <ul className="list-disc list-inside text-slate-600 pl-1 space-y-0.5">
                            {cs.correctCauses.map((c, cIdx) => (
                              <li key={cIdx}>{c}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px]">
                          <span className="font-bold text-emerald-950 block mb-0.5">
                            ✅ Rencana Perlakuan / Mitigasi yang Tepat:
                          </span>
                          <p className="text-emerald-900">{cs.correctMitigation}</p>
                          {cs.wrongMitigation && (
                            <p className="text-rose-700 text-[10.5px] mt-1 pt-1 border-t border-emerald-200">
                              ⚠️ Catatan: {cs.wrongMitigation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL FOR MANUAL BOOK */}
      <DocumentPrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentTitle="BUKU PANDUAN TEKNIS (MANUAL BOOK) PENGISIAN REGISTER RISIKO KORPORAT (MATRIKS 5×5)"
        documentSubtitle="STANDAR PENGENDALIAN INTERN & MANAJEMEN RISIKO BPKP - PERUMDA AIR MINUM TIRTA SAIYO"
        documentNumber="MANUAL/SPI-MR/2026/01"
        initialSignatory1Role="Kepala Satuan Pengawasan Intern"
        initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
        defaultShowSignatory2={true}
      >
        {() => (
          <div className="space-y-6 text-slate-900 font-sans text-xs leading-relaxed">
            {/* Title Block */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <h2 className="text-base font-black tracking-tight uppercase">
                BUKU MANUAL OPERASIONAL PENGISIAN REGISTER RISIKO KORPORAT (MATRIKS 5×5)
              </h2>
              <p className="text-xs font-bold text-slate-700 uppercase">
                PEDOMAN TEKNIS UNIT KERJA (AUDITEE) & EVALUATOR SATUAN PENGAWASAN INTERN (SPI)
              </p>
              <p className="text-[11px] text-slate-600">
                Mengacu pada Pedoman Evaluasi Manajemen Risiko BPKP RI & Standar ISO 31000
              </p>
            </div>

            {/* BAB 1 Print */}
            <div className="space-y-2">
              <h3 className="font-black text-xs text-slate-900 border-b border-slate-300 pb-1 uppercase">
                BAB I. DEFINISI & PRINSIP TIGA LINI PERTAHANAN (THREE LINES MODEL)
              </h3>
              <p className="text-justify text-[11px]">
                Berdasarkan ISO 31000 dan Pedoman BPKP, risiko didefinisikan sebagai <em>"the effect of uncertainty on objectives"</em> (pengaruh ketidakpastian terhadap pencapaian sasaran perusahaan). Dalam tata kelola Perumda Air Minum Tirta Saiyo Kabupaten Pasaman, pengelolaan risiko menerapkan prinsip Tiga Lini Pertahanan:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-2 text-[11px]">
                <li><strong>Lini Pertama (Auditee / Risk Owner):</strong> Kepala Bagian, Kepala Sub Bagian, dan Kepala Unit Cabang bertanggung jawab penuh mengidentifikasi, mengukur, dan mengendalikan risiko operasional harian di unitnya.</li>
                <li><strong>Lini Kedua (Manajemen & Komite Risiko):</strong> Direksi menetapkan profil selera risiko korporat (*risk appetite*) dan memantau agregasi risiko perusahaan.</li>
                <li><strong>Lini Ketiga (Satuan Pengawasan Intern):</strong> SPI bertindak sebagai penilai independen (*independent assurance*) yang mengevaluasi kecukupan proses manajemen risiko dan melaksanakan audit berbasis risiko.</li>
              </ol>
            </div>

            {/* BAB 2 Print */}
            <div className="space-y-2">
              <h3 className="font-black text-xs text-slate-900 border-b border-slate-300 pb-1 uppercase">
                BAB II. KAIDAH EMAS PERUMUSAN RISIKO BPKP (GOLDEN RULES)
              </h3>
              <p className="text-justify text-[11px]">
                Setiap penyusun register risiko wajib memisahkan secara tegas 4 elemen utama tanpa mencampuradukkannya:
              </p>
              <table className="w-full border-collapse border border-slate-400 text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400">
                    <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                    <th className="border border-slate-300 p-1.5">Elemen</th>
                    <th className="border border-slate-300 p-1.5">Kaidah Perumusan BPKP</th>
                    <th className="border border-slate-300 p-1.5">Contoh Rumusan yang Benar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-1.5 text-center">1</td>
                    <td className="border border-slate-300 p-1.5 font-bold">Sasaran / Tujuan</td>
                    <td className="border border-slate-300 p-1.5">Target positif yang ingin diraih unit kerja.</td>
                    <td className="border border-slate-300 p-1.5">Menjamin kontinuitas suplai air bersih 24 jam pelanggan.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 text-center">2</td>
                    <td className="border border-slate-300 p-1.5 font-bold">Peristiwa Risiko</td>
                    <td className="border border-slate-300 p-1.5">Peristiwa yang menghambat tercapainya sasaran.</td>
                    <td className="border border-slate-300 p-1.5 font-bold">Terjadinya gangguan kontinuitas distribusi air pada jam sibuk.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 text-center">3</td>
                    <td className="border border-slate-300 p-1.5 font-bold">Akar Masalah (5M)</td>
                    <td className="border border-slate-300 p-1.5">Penyebab riil (Man, Money, Material, Machine, Methode).</td>
                    <td className="border border-slate-300 p-1.5">Pompa distribusi intake sering aus & listrik PLN sering padam mendadak (Machine).</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-1.5 text-center">4</td>
                    <td className="border border-slate-300 p-1.5 font-bold">Dampak (Impact)</td>
                    <td className="border border-slate-300 p-1.5">Konsekuensi negatif nyata yang dialami BUMD.</td>
                    <td className="border border-slate-300 p-1.5">Tingginya komplain pelanggan, pendapatan rekening air turun, citra BUMD menurun.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BAB 3 & 4 Print */}
            <div className="space-y-2">
              <h3 className="font-black text-xs text-slate-900 border-b border-slate-300 pb-1 uppercase">
                BAB III. 8 KATEGORI RISIKO RESMI BPKP & KERANGKA AKAR MASALAH 5M
              </h3>
              <p className="text-[11px]">
                <strong>8 Kategori Risiko BPKP:</strong> (1) Risiko Penerimaan, (2) Risiko Belanja, (3) Risiko Pembiayaan, (4) Risiko Strategis, (5) Risiko Fraud / Kecurangan, (6) Risiko Kepatuhan, (7) Risiko Operasional, dan (8) Risiko Reputasi.
              </p>
              <p className="text-[11px]">
                <strong>Kerangka Akar Masalah 5M:</strong> MAN (kompetensi/disiplin SDM), MONEY (anggaran/dana operasional), MATERIAL (kualitas pipa/bahan kimia koagulan), MACHINE (peralatan pompa/genset/reservoir), dan METHODE (SOP/regulasi operasional).
              </p>
            </div>

            {/* BAB 5 & 6 Print */}
            <div className="space-y-2">
              <h3 className="font-black text-xs text-slate-900 border-b border-slate-300 pb-1 uppercase">
                BAB IV. SKALA MATRIKS 5×5 & 5 TINGKAT SELERA RISIKO BPKP
              </h3>
              <p className="text-[11px]">
                Besaran risiko dihitung dengan rumus: <strong>Skor = Kemungkinan (1–5) × Dampak (1–5)</strong>. Nilai dikelompokkan ke dalam 5 tingkatan selera risiko standar BPKP:
              </p>
              <div className="grid grid-cols-5 gap-2 text-center text-[10.5px]">
                <div className="border border-rose-600 bg-rose-50 p-2 rounded">
                  <strong className="text-rose-800 block">Sangat Tinggi</strong>
                  <span className="font-bold">Skor 20–25</span>
                  <p className="text-[9.5px]">Tindakan Direksi</p>
                </div>
                <div className="border border-orange-500 bg-orange-50 p-2 rounded">
                  <strong className="text-orange-800 block">Tinggi</strong>
                  <span className="font-bold">Skor 12–16</span>
                  <p className="text-[9.5px]">Mitigasi Bulanan</p>
                </div>
                <div className="border border-yellow-500 bg-yellow-50 p-2 rounded">
                  <strong className="text-yellow-800 block">Sedang</strong>
                  <span className="font-bold">Skor 5–10</span>
                  <p className="text-[9.5px]">Kontrol Triwulan</p>
                </div>
                <div className="border border-lime-500 bg-lime-50 p-2 rounded">
                  <strong className="text-lime-800 block">Rendah</strong>
                  <span className="font-bold">Skor 3–4</span>
                  <p className="text-[9.5px]">SOP Rutin</p>
                </div>
                <div className="border border-emerald-500 bg-emerald-50 p-2 rounded">
                  <strong className="text-emerald-800 block">Sangat Rendah</strong>
                  <span className="font-bold">Skor 1–2</span>
                  <p className="text-[9.5px]">Risiko Diterima</p>
                </div>
              </div>
            </div>

            {/* BAB 7 & 8 Print */}
            <div className="space-y-2">
              <h3 className="font-black text-xs text-slate-900 border-b border-slate-300 pb-1 uppercase">
                BAB V. 4 OPSI STRATEGI PERLAKUAN RISIKO (RISK TREATMENT)
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-[11px]">
                <li><strong>Mengurangi (Reduce):</strong> Melakukan tindakan preventif menurunkan kemungkinan atau dampak (misal: preventive maintenance pompa berkala, pengadaan genset cadangan).</li>
                <li><strong>Menghindari (Avoid):</strong> Menghentikan atau mengalihkan kegiatan berisiko ekstrem di luar batas toleransi (misal: mengalihkan trase pipa dari lereng bukit rawan longsor).</li>
                <li><strong>Memindahkan / Membagi (Transfer):</strong> Mengalihkan dampak finansial kepada pihak ketiga (misal: asuransi aset instalasi pengolahan air minum).</li>
                <li><strong>Menerima (Accept):</strong> Menerima risiko residual yang sudah bernilai sangat rendah tanpa alokasi biaya tambahan berlebihan.</li>
              </ol>
            </div>

            {/* Verification Note */}
            <div className="p-3 bg-slate-50 border border-slate-300 rounded text-[10.5px] text-justify">
              <strong>Ketentuan Evaluasi SPI:</strong> Seluruh register risiko yang diinput oleh unit kerja (Auditee) akan melalui reviu kesesuaian kaidah oleh Satuan Pengawasan Intern (SPI). Register risiko yang disetujui SPI menjadi acuan resmi dalam penyusunan Program Kerja Pengawasan Tahunan (PKPT) Berbasis Risiko.
            </div>
          </div>
        )}
      </DocumentPrintPreviewModal>
    </>
  );
};
