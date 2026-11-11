import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  ShieldCheck,
  Search,
  MessageSquare,
  XCircle,
  Printer,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { Recommendation, FollowUp, RecommendationStatus } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

interface FollowUpModuleProps {
  initialFindingId?: string;
}

export const FollowUpModule: React.FC<FollowUpModuleProps> = ({ initialFindingId }) => {
  const { userProfile, hasRole } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialFindingId || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeRec, setActiveRec] = useState<Recommendation | null>(null);

  // Submit action states (Auditee)
  const [responseNotes, setResponseNotes] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');

  // Verify action states (SPI Auditor)
  const [verifyStatus, setVerifyStatus] = useState<RecommendationStatus>('Selesai');
  const [verificationNotes, setVerificationNotes] = useState('');

  const isAuditorOrHead = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsubRecs = onSnapshot(collection(db, 'recommendations'), (snap) => {
      setRecommendations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recommendation)));
    });

    const unsubFollowUps = onSnapshot(collection(db, 'follow_ups'), (snap) => {
      setFollowUps(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FollowUp)));
    });

    return () => {
      unsubRecs();
      unsubFollowUps();
    };
  }, []);

  const openSubmitAction = (r: Recommendation) => {
    setActiveRec(r);
    setResponseNotes('');
    setEvidenceFileName('Surat Bukti Perbaikan Tindak Lanjut Unit');
    setIsSubmitModalOpen(true);
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRec) return;

    const followUpId = 'fu-' + Date.now();
    const newFu: FollowUp = {
      id: followUpId,
      recommendationId: activeRec.id,
      unitId: activeRec.unitId || '',
      responseNotes,
      evidenceFileName,
      submittedBy: userProfile?.displayName || 'Auditee',
      submittedAt: new Date().toISOString(),
      status: 'Diajukan',
    };

    try {
      await setDoc(doc(db, 'follow_ups', followUpId), newFu);
      await updateDoc(doc(db, 'recommendations', activeRec.id), {
        status: 'Menunggu Verifikasi',
      });
      setIsSubmitModalOpen(false);
    } catch (err) {
      console.error('Error submitting follow-up:', err);
    }
  };

  const openVerifyAction = (r: Recommendation) => {
    setActiveRec(r);
    setVerifyStatus('Selesai');
    setVerificationNotes('Bukti tindak lanjut telah diperiksa dan dinyatakan memadai sesuai standar.');
    setIsVerifyModalOpen(true);
  };

  const handleVerifyAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRec) return;

    try {
      await updateDoc(doc(db, 'recommendations', activeRec.id), {
        status: verifyStatus,
      });

      // Find the latest follow-up for this recommendation
      const latestFu = followUps.find((fu) => fu.recommendationId === activeRec.id);
      if (latestFu) {
        await updateDoc(doc(db, 'follow_ups', latestFu.id), {
          status: verifyStatus === 'Selesai' ? 'Disetujui' : 'Ditolak',
          verificationNotes,
          verifier: userProfile?.displayName || 'Auditor SPI',
          verifiedAt: new Date().toISOString(),
        });
      }

      setIsVerifyModalOpen(false);
    } catch (err) {
      console.error('Error verifying follow-up:', err);
    }
  };

  const filteredRecs = recommendations.filter((r) => {
    const matchesSearch =
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.pic && r.pic.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            Pemantauan & Verifikasi Tindak Lanjut Rekomendasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengawasan realisasi perbaikan auditee, pengunggahan bukti aksi, dan verifikasi kepatuhan auditor SPI
          </p>
        </div>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs shrink-0"
          title="Tinjau dan cetak laporan pemantauan tindak lanjut rekomendasi"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-700" />
          <span>Cetak Laporan Pemantauan TLR</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari uraian rekomendasi atau PIC unit..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
          >
            <option value="ALL">Semua Status Tindak Lanjut</option>
            <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi SPI</option>
            <option value="Selesai">Selesai (Tervalidasi)</option>
            <option value="Tidak Dapat Ditindaklanjuti">Tidak Dapat Ditindaklanjuti</option>
          </select>
        </div>
      </div>

      {/* List Recommendations */}
      <div className="space-y-3">
        {filteredRecs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            Belum ada rekomendasi yang tercatat untuk dipantau.
          </div>
        ) : (
          filteredRecs.map((r) => {
            const relatedFu = followUps.filter((fu) => fu.recommendationId === r.id);

            return (
              <div
                key={r.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                      {r.recNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Terkait Temuan: {r.findingNumber || '-'}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md ${
                      r.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : r.status === 'Menunggu Verifikasi'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : r.status === 'Dalam Proses'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="text-xs text-slate-800 space-y-2">
                  <p className="font-medium text-slate-900 leading-relaxed">{r.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                    <span>Penanggung Jawab: <strong className="text-slate-700">{r.pic}</strong></span>
                    <span>Tenggat Target: <strong className="text-slate-700">{r.targetDate}</strong></span>
                    <span>Indikator: <strong className="text-slate-700">{r.successIndicator}</strong></span>
                  </div>
                </div>

                {/* Follow-up trail if any */}
                {relatedFu.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-800 block">Riwayat Tindak Lanjut Unit & Verifikasi:</span>
                    {relatedFu.map((fu) => (
                      <div key={fu.id} className="border-l-2 border-emerald-500 pl-3 py-0.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-900">{fu.submittedBy}</span>
                          <span className="text-slate-400">{fu.submittedAt.slice(0, 10)}</span>
                        </div>
                        <p className="text-slate-700">{fu.responseNotes}</p>
                        {fu.verificationNotes && (
                          <div className="p-2 bg-emerald-100/60 rounded text-[11px] text-emerald-900 mt-1">
                            <span className="font-bold">Verifikasi SPI ({fu.verifier}):</span> {fu.verificationNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  {/* Auditee / Unit action */}
                  <button
                    onClick={() => openSubmitAction(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Upload Bukti Aksi Unit</span>
                  </button>

                  {/* SPI Auditor action */}
                  {isAuditorOrHead && (
                    <button
                      onClick={() => openVerifyAction(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-2xs transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verifikasi SPI</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Upload Bukti Tindak Lanjut (Auditee) */}
      {isSubmitModalOpen && activeRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Pengajuan Bukti Tindak Lanjut Unit Kerja</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitAction} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">{activeRec.recNumber}</span>
                <p className="text-slate-700 line-clamp-2">{activeRec.description}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian Tindakan Perbaikan Yang Dilakukan</label>
                <textarea
                  rows={3}
                  required
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Jelaskan langkah konkret yang telah dieksekusi oleh unit kerja..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Nama Dokumen Bukti Fisik</label>
                <input
                  type="text"
                  required
                  value={evidenceFileName}
                  onChange={(e) => setEvidenceFileName(e.target.value)}
                  placeholder="Contoh: Berita Acara Perbaikan Kebocoran No. 102/BA-TRC/2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Kirimkan untuk Verifikasi SPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Verifikasi SPI (Auditor) */}
      {isVerifyModalOpen && activeRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Verifikasi & Validasi Tindak Lanjut oleh SPI
              </h3>
              <button onClick={() => setIsVerifyModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleVerifyAction} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-900">{activeRec.recNumber}</span>
                <p className="text-slate-700 line-clamp-2">{activeRec.description}</p>
                <p className="text-[11px] text-slate-500 font-medium">PIC: {activeRec.pic}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keputusan Status Verifikasi</label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as RecommendationStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                >
                  <option value="Selesai">Selesai (Bukti Memadai & Disetujui SPI)</option>
                  <option value="Dalam Proses">Dalam Proses (Perlu Perbaikan Tambahan)</option>
                  <option value="Belum Ditindaklanjuti">Tolak Bukti (Tidak Sesuai Rekomendasi)</option>
                  <option value="Tidak Dapat Ditindaklanjuti">Tidak Dapat Ditindaklanjuti</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Evaluasi / Bukti Uji Petik SPI</label>
                <textarea
                  rows={3}
                  required
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Uraian hasil pengujian fisik dan kelayakan bukti yang dilampirkan unit..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan Status Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Modal with Fitur Jabatan */}
      {isPrintModalOpen && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="LAPORAN PEMANTAUAN TINDAK LANJUT REKOMENDASI (TLR)"
          documentSubtitle="Perumda Air Minum Tirta Saiyo Kabupaten Pasaman"
          documentNumber={`TLR/SPI-PTS/${new Date().getFullYear()}`}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-5 text-xs font-serif leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-3 font-sans text-xs">
                <div>
                  <p className="text-slate-500">Total Rekomendasi:</p>
                  <p className="font-bold text-slate-900">{recommendations.length} Rekomendasi</p>
                </div>
                <div>
                  <p className="text-slate-500">Selesai Ditindaklanjuti:</p>
                  <p className="font-bold text-emerald-800">
                    {recommendations.filter((r) => r.status === 'Selesai').length} Rekomendasi
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Tingkat Kepatuhan Perbaikan:</p>
                  <p className="font-bold text-slate-900">
                    {recommendations.length > 0
                      ? `${Math.round(
                          (recommendations.filter((r) => r.status === 'Selesai').length /
                            recommendations.length) *
                            100
                        )}%`
                      : '0%'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-xs border-b border-slate-300 pb-1">
                  Matriks Status Rekomendasi & Hasil Pengujian SPI:
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300 font-sans">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="p-2 border border-slate-300 w-8 text-center">No</th>
                        <th className="p-2 border border-slate-300 w-24">Nomor & Unit</th>
                        <th className="p-2 border border-slate-300">Uraian Rekomendasi SPI</th>
                        <th className="p-2 border border-slate-300 w-28">Target & PIC</th>
                        <th className="p-2 border border-slate-300 w-24 text-center">Status Akhir</th>
                        <th className="p-2 border border-slate-300">Catatan Verifikasi Auditor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredRecs.map((r, idx) => (
                        <tr key={r.id}>
                          <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-300">
                            <p className="font-bold font-mono text-[10px] text-slate-900">{r.recNumber}</p>
                            <p className="text-[10px] text-slate-600 font-sans">{r.unitName}</p>
                          </td>
                          <td className="p-2 border border-slate-300">{r.description}</td>
                          <td className="p-2 border border-slate-300 text-[10px]">
                            <p><strong>PIC:</strong> {r.pic}</p>
                            <p><strong>Target:</strong> {r.targetDate}</p>
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                r.status === 'Selesai'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'Dalam Proses'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-700">
                            {r.successIndicator || 'Bukti verifikasi diverifikasi oleh tim auditor SPI.'}
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
    </div>
  );
};
