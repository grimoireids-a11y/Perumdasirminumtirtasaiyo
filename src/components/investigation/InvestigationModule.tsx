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
  Lock,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  FileText,
  DollarSign,
  Search,
  Eye,
  KeyRound,
  Printer,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { Investigation, Unit } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

interface InvestigationModuleProps {
  onOpenAiAssistantWithContext?: (context: any) => void;
}

export const InvestigationModule: React.FC<InvestigationModuleProps> = ({
  onOpenAiAssistantWithContext,
}) => {
  const { userProfile, hasRole } = useAuth();
  const currentYear = new Date().getFullYear();

  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Investigation | null>(null);
  const [activeCaseForPrint, setActiveCaseForPrint] = useState<Investigation | null>(null);

  // Form states
  const [formCaseNumber, setFormCaseNumber] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSource, setFormSource] = useState('Pengaduan Whistleblowing / Pelanggan');
  const [formReceiptDate, setFormReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [formUnitId, setFormUnitId] = useState('');
  const [formSuspectedModus, setFormSuspectedModus] = useState('');
  const [formEstimatedLoss, setFormEstimatedLoss] = useState<number>(0);
  const [formRiskLevel, setFormRiskLevel] = useState<'Sedang' | 'Tinggi' | 'Kritis'>('Kritis');
  const [formChronology, setFormChronology] = useState('');
  const [formInitialAnalysis, setFormInitialAnalysis] = useState('');
  const [formDecision, setFormDecision] = useState('Dilakukan Audit Investigatif Lengkap');
  const [formStatus, setFormStatus] = useState<
    'Registrasi' | 'Penelaahan' | 'Audit Investigatif' | 'Laporan Akhir' | 'Selesai'
  >('Penelaahan');
  const [formLeadInvestigator, setFormLeadInvestigator] = useState('Kepala SPI & Tim Khusus');

  const canManage = hasRole(['KEPALA_SPI', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsubInvest = onSnapshot(collection(db, 'investigations'), (snap) => {
      setInvestigations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Investigation)));
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });

    return () => {
      unsubInvest();
      unsubUnits();
    };
  }, []);

  const openAddModal = () => {
    setEditingCase(null);
    const count = investigations.length + 1;
    setFormCaseNumber(`INV-CONF-${currentYear}-${String(count).padStart(3, '0')}`);
    setFormTitle('Dugaan Penyimpangan Pembacaan Meter Air dan Pungutan Liar Sambungan Baru');
    setFormSource('Pengaduan Whistleblowing / Pelanggan');
    setFormReceiptDate(new Date().toISOString().slice(0, 10));
    setFormUnitId(units[0]?.id || '');
    setFormSuspectedModus('Manipulasi angka stand meter oleh oknum pembaca meter dan setoran rekening tidak masuk ke sistem kasir.');
    setFormEstimatedLoss(42000000);
    setFormRiskLevel('Kritis');
    setFormChronology('Berdasarkan laporan masyarakat tertanggal awal bulan, ditemukan bukti tanda terima bayar non-resmi pada 15 pelanggan di wilayah unit pelayanan.');
    setFormInitialAnalysis('Terdapat indikasi pelanggaran disiplin berat dan potensi kerugian pendapatan resmi perusahaan.');
    setFormDecision('Penerbitan Surat Perintah Pemeriksaan Khusus (Investigasi Lapangan).');
    setFormStatus('Penelaahan');
    setFormLeadInvestigator(userProfile?.displayName || 'Kepala SPI');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Investigation) => {
    setEditingCase(c);
    setFormCaseNumber(c.caseNumber);
    setFormTitle(c.title);
    setFormSource(c.source);
    setFormReceiptDate(c.receiptDate);
    setFormUnitId(c.unitId);
    setFormSuspectedModus(c.suspectedModus);
    setFormEstimatedLoss(c.estimatedLoss);
    setFormRiskLevel(c.riskLevel);
    setFormChronology(c.chronology);
    setFormInitialAnalysis(c.initialAnalysis);
    setFormDecision(c.decision);
    setFormStatus(c.status);
    setFormLeadInvestigator(c.leadInvestigator);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selUnit = units.find((u) => u.id === formUnitId);
    const unitName = selUnit ? selUnit.name : 'Unit Pasaman';

    const data: Omit<Investigation, 'id'> = {
      caseNumber: formCaseNumber,
      title: formTitle,
      source: formSource,
      receiptDate: formReceiptDate,
      unitId: formUnitId,
      unitName,
      suspectedModus: formSuspectedModus,
      estimatedLoss: formEstimatedLoss,
      riskLevel: formRiskLevel,
      chronology: formChronology,
      initialAnalysis: formInitialAnalysis,
      decision: formDecision,
      status: formStatus,
      isConfidential: true,
      leadInvestigator: formLeadInvestigator,
      createdAt: editingCase?.createdAt || new Date().toISOString(),
    };

    try {
      if (editingCase) {
        await updateDoc(doc(db, 'investigations', editingCase.id), data);
      } else {
        const id = 'inv-' + Date.now();
        await setDoc(doc(db, 'investigations', id), { id, ...data });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving investigation case:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus berkas kasus investigasi rahasia ini? Tindakan ini akan tercatat dalam audit trail.')) return;
    try {
      await deleteDoc(doc(db, 'investigations', id));
    } catch (err) {
      console.error('Error deleting investigation:', err);
    }
  };

  const filteredCases = investigations.filter((c) => {
    return (
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.unitName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-700" />
              Audit Investigatif & Penanganan Indikasi Fraud
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 border border-rose-300 rounded-full flex items-center gap-1">
              <KeyRound className="w-3 h-3" /> Rahasia / Confidential
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan kasus penyimpangan, pengamanan jejak audit (chain of custody), dan identifikasi red flags
          </p>
        </div>

        {canManage && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-800 hover:bg-rose-900 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrasi Kasus Khusus</span>
          </button>
        )}
      </div>

      {/* Security Warning Notice */}
      <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Perhatian Etika & Asas Hukum:</strong> Modul ini hanya dapat diakses oleh personil yang diotorisasi oleh Kepala SPI. AI tidak boleh otomatis menyimpulkan seseorang bersalah melainkan membantu identifikasi red flags.
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor kasus atau unit terkait..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-700"
          />
        </div>
      </div>

      {/* Cases Grid */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            Tidak ada register kasus investigasi khusus yang tercatat.
          </div>
        ) : (
          filteredCases.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-400 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    {c.caseNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{c.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-md">
                    {c.riskLevel}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 rounded-md">
                    {c.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <p>
                    <span className="font-semibold text-slate-900">Unit Terkait:</span> {c.unitName}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Sumber Informasi:</span> {c.source}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Dugaan Modus:</span> {c.suspectedModus}
                  </p>
                  {c.estimatedLoss > 0 && (
                    <p className="font-bold text-rose-700">
                      Indikasi Nilai Kerugian: Rp {c.estimatedLoss.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <p>
                    <span className="font-semibold text-slate-900">Kronologi Ringkas:</span> {c.chronology}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Keputusan / Arahan:</span> {c.decision}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Lead Investigator: <strong className="text-slate-800">{c.leadInvestigator}</strong>
                  </p>
                </div>
              </div>

              {/* Actions & AI Red Flags Trigger */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">Diterima: {c.receiptDate}</span>

                <div className="flex items-center gap-2">
                  {onOpenAiAssistantWithContext && (
                    <button
                      onClick={() =>
                        onOpenAiAssistantWithContext({
                          action: 'fraud_red_flags',
                          unitName: c.unitName,
                          suspectedModus: c.suspectedModus,
                          chronology: c.chronology,
                        })
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      <span>Analisis Red Flags AI</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveCaseForPrint(c);
                      setIsPrintModalOpen(true);
                    }}
                    className="p-1 text-slate-500 hover:text-emerald-700 rounded-md"
                    title="Tinjau & Cetak Berita Acara / Laporan Investigasi"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  {canManage && (
                    <>
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded-md"
                        title="Edit Berkas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-slate-500 hover:text-rose-600 rounded-md"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Investigation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-rose-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                Registrasi Berkas Investigatif Khusus
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Registrasi Kasus</label>
                  <input
                    type="text"
                    required
                    value={formCaseNumber}
                    onChange={(e) => setFormCaseNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Penerimaan Laporan</label>
                  <input
                    type="date"
                    required
                    value={formReceiptDate}
                    onChange={(e) => setFormReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Masalah / Indikasi</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Unit Terkait</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Sumber Pengaduan</label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dugaan Modus Operandi</label>
                <textarea
                  rows={2}
                  required
                  value={formSuspectedModus}
                  onChange={(e) => setFormSuspectedModus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Nilai Kerugian (Rp)</label>
                  <input
                    type="number"
                    value={formEstimatedLoss}
                    onChange={(e) => setFormEstimatedLoss(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-rose-700"
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
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kronologi Kejadian</label>
                <textarea
                  rows={3}
                  required
                  value={formChronology}
                  onChange={(e) => setFormChronology(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Penanganan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Registrasi">Registrasi Laporan</option>
                    <option value="Penelaahan">Penelaahan Awal</option>
                    <option value="Audit Investigatif">Sedang Audit Investigatif</option>
                    <option value="Laporan Akhir">Penyusunan Laporan Akhir</option>
                    <option value="Selesai">Selesai Ditindaklanjuti</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pimpinan Pemeriksa (Investigator)</label>
                  <input
                    type="text"
                    value={formLeadInvestigator}
                    onChange={(e) => setFormLeadInvestigator(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keputusan / Arahan Tindak Lanjut</label>
                <input
                  type="text"
                  value={formDecision}
                  onChange={(e) => setFormDecision(e.target.value)}
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
                  className="px-4 py-2 font-bold text-white bg-rose-800 hover:bg-rose-900 rounded-lg shadow-sm"
                >
                  Simpan Berkas Investigasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Modal with Fitur Jabatan */}
      {isPrintModalOpen && activeCaseForPrint && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="LAPORAN HASIL PENELAAHAN & AUDIT INVESTIGATIF"
          documentSubtitle={`Unit Terkait: ${activeCaseForPrint.unitName} (SIFAT: RAHASIA)`}
          documentNumber={activeCaseForPrint.caseNumber}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-4 text-xs font-serif leading-relaxed">
              <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-200 grid grid-cols-2 gap-3 font-sans text-xs">
                <div>
                  <p><span className="text-slate-500">Judul Masalah:</span> <strong>{activeCaseForPrint.title}</strong></p>
                  <p><span className="text-slate-500">Sumber Informasi:</span> <strong>{activeCaseForPrint.source}</strong></p>
                </div>
                <div>
                  <p><span className="text-slate-500">Klasifikasi Risiko:</span> <strong className="text-rose-700">{activeCaseForPrint.riskLevel}</strong></p>
                  <p>
                    <span className="text-slate-500">Estimasi Kerugian:</span>{' '}
                    <strong className="text-rose-700 font-mono">
                      Rp {activeCaseForPrint.estimatedLoss.toLocaleString('id-ID')}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    1. Dugaan Modus Operandi & Penyimpangan:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-rose-600 whitespace-pre-line">{activeCaseForPrint.suspectedModus}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    2. Kronologi Kejadian:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-rose-600 whitespace-pre-line">{activeCaseForPrint.chronology}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    3. Analisis Awal & Bukti-Bukti Permulaan:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-rose-600 whitespace-pre-line">{activeCaseForPrint.initialAnalysis}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-[11px]">
                    4. Keputusan / Rekomendasi Tindak Lanjut:
                  </h4>
                  <p className="mt-0.5 pl-3 border-l-2 border-rose-600 font-bold text-slate-900">{activeCaseForPrint.decision}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                  <p>
                    <strong>Ketua Tim Pemeriksa Khusus (Lead Investigator):</strong> {activeCaseForPrint.leadInvestigator}
                  </p>
                  <p className="text-slate-500 italic mt-0.5">
                    * Dokumen ini bersifat RAHASIA dan dilindungi undang-undang serta kode etik pengawasan internal BUMD.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DocumentPrintPreviewModal>
      )}
    </div>
  );
};
