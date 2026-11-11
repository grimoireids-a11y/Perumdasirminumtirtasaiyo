import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Search,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { Unit } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';

interface RCSAItem {
  id: string;
  unitId: string;
  unitName: string;
  year: number;
  activityTitle: string;
  identifiedRisk: string;
  existingControl: string;
  controlRating: 'Efektif' | 'Sebagian' | 'Tidak Efektif';
  selfScore: number;
  evidenceRef: string;
  spiReviewNotes?: string;
  spiAuditScore?: number;
  status: 'Diajukan' | 'Direviu SPI' | 'Disetujui';
  submittedBy: string;
  submittedAt: string;
}

export const RCSAModule: React.FC = () => {
  const { userProfile, hasRole } = useAuth();
  const currentYear = new Date().getFullYear();

  const [rcsaList, setRcsaList] = useState<RCSAItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<RCSAItem | null>(null);

  // Form states
  const [formUnitId, setFormUnitId] = useState('');
  const [formActivityTitle, setFormActivityTitle] = useState('');
  const [formIdentifiedRisk, setFormIdentifiedRisk] = useState('');
  const [formExistingControl, setFormExistingControl] = useState('');
  const [formControlRating, setFormControlRating] = useState<'Efektif' | 'Sebagian' | 'Tidak Efektif'>('Efektif');
  const [formSelfScore, setFormSelfScore] = useState<number>(3);
  const [formEvidenceRef, setFormEvidenceRef] = useState('');

  // Review states
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewScore, setReviewScore] = useState<number>(3);
  const [reviewStatus, setReviewStatus] = useState<'Direviu SPI' | 'Disetujui'>('Disetujui');

  const isSpiStaff = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsubRcsa = onSnapshot(collection(db, 'rcsa_assessments'), (snap) => {
      setRcsaList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RCSAItem)));
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });

    return () => {
      unsubRcsa();
      unsubUnits();
    };
  }, []);

  const openSubmitModal = () => {
    setFormUnitId(userProfile?.unitId || units[0]?.id || '');
    setFormActivityTitle('');
    setFormIdentifiedRisk('');
    setFormExistingControl('');
    setFormControlRating('Efektif');
    setFormSelfScore(3);
    setFormEvidenceRef('');
    setIsModalOpen(true);
  };

  const handleSaveRCSA = async (e: React.FormEvent) => {
    e.preventDefault();
    const selUnit = units.find((u) => u.id === formUnitId);
    const unitName = selUnit ? selUnit.name : userProfile?.unitName || 'Unit Tirta Saiyo';

    const id = 'rcsa-' + Date.now();
    const newItem: RCSAItem = {
      id,
      unitId: formUnitId,
      unitName,
      year: currentYear,
      activityTitle: formActivityTitle,
      identifiedRisk: formIdentifiedRisk,
      existingControl: formExistingControl,
      controlRating: formControlRating,
      selfScore: formSelfScore,
      evidenceRef: formEvidenceRef,
      status: 'Diajukan',
      submittedBy: userProfile?.displayName || 'PIC Unit',
      submittedAt: new Date().toISOString().slice(0, 10),
    };

    try {
      await setDoc(doc(db, 'rcsa_assessments', id), newItem);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving RCSA:', err);
    }
  };

  const openReviewModal = (item: RCSAItem) => {
    setActiveItem(item);
    setReviewNotes(item.spiReviewNotes || '');
    setReviewScore(item.spiAuditScore || item.selfScore);
    setReviewStatus(item.status === 'Disetujui' ? 'Disetujui' : 'Direviu SPI');
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    try {
      await updateDoc(doc(db, 'rcsa_assessments', activeItem.id), {
        spiReviewNotes: reviewNotes,
        spiAuditScore: reviewScore,
        status: reviewStatus,
      });
      setIsReviewModalOpen(false);
    } catch (err) {
      console.error('Error reviewing RCSA:', err);
    }
  };

  const filteredRcsa = rcsaList.filter((r) => {
    const matchesSearch =
      r.activityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.identifiedRisk.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-700" />
            Penilaian Sendiri Risiko & Kontrol Unit (RCSA)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengisian berkala efektivitas pengendalian operasional oleh unit kerja dan validasi komparasi audit SPI
          </p>
        </div>

        <button
          onClick={openSubmitModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Isi Lembar RCSA Unit</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari proses, unit, atau risiko RCSA..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* RCSA Cards / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-32">Unit Kerja</th>
                <th className="py-3 px-4">Aktivitas / Proses Yang Dinilai</th>
                <th className="py-3 px-4">Pengendalian Berjalan</th>
                <th className="py-3 px-4 text-center">Skor Unit</th>
                <th className="py-3 px-4 text-center">Skor SPI</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredRcsa.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada pengajuan lembar RCSA dari unit kerja.
                  </td>
                </tr>
              ) : (
                filteredRcsa.map((item) => {
                  const hasGap = item.spiAuditScore && item.spiAuditScore !== item.selfScore;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.unitName}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.activityTitle}</p>
                        <p className="text-[11px] text-slate-500">Risiko: {item.identifiedRisk}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-700 line-clamp-2">{item.existingControl}</p>
                        <span className="text-[10px] text-slate-400">Bukti: {item.evidenceRef || 'Checklist internal'}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold tabular-nums">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono">
                          {item.selfScore}/5
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold tabular-nums">
                        {item.spiAuditScore ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono ${
                              hasGap ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.spiAuditScore}/5 {hasGap && '⚠'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                            item.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Direviu SPI'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isSpiStaff && (
                          <button
                            onClick={() => openReviewModal(item)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                          >
                            Reviu SPI
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Submit RCSA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Penilaian Sendiri Risiko Unit (RCSA)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRCSA} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit Kerja Penilai</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Aktivitas / Proses Kerja yang Dinilai</label>
                <input
                  type="text"
                  required
                  value={formActivityTitle}
                  onChange={(e) => setFormActivityTitle(e.target.value)}
                  placeholder="Contoh: Pemeliharaan pompa intake dan pengolahan air bersih"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Potensi Risiko Utama</label>
                <textarea
                  rows={2}
                  required
                  value={formIdentifiedRisk}
                  onChange={(e) => setFormIdentifiedRisk(e.target.value)}
                  placeholder="Risiko kerusakan mendadak atau kualitas air turun..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pengendalian yang Sudah Dilakukan Unit</label>
                <textarea
                  rows={2}
                  required
                  value={formExistingControl}
                  onChange={(e) => setFormExistingControl(e.target.value)}
                  placeholder="Inspeksi rutin, kartu pemeliharaan, uji lab berkala..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penilaian Kontrol Mandiri</label>
                  <select
                    value={formControlRating}
                    onChange={(e) => setFormControlRating(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Efektif">Efektif Berjalan</option>
                    <option value="Sebagian">Sebagian Efektif</option>
                    <option value="Tidak Efektif">Tidak Efektif</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Skor Keamanan Kontrol (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formSelfScore}
                    onChange={(e) => setFormSelfScore(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dokumen / Bukti Pendukung</label>
                <input
                  type="text"
                  value={formEvidenceRef}
                  onChange={(e) => setFormEvidenceRef(e.target.value)}
                  placeholder="Nomor berita acara, checklist harian, atau foto..."
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
                  Kirimkan Lembar RCSA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Review SPI */}
      {isReviewModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Review & Validasi Pengawasan SPI</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveReview} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p className="font-bold text-slate-900">{activeItem.activityTitle}</p>
                <p className="text-slate-600">Unit: {activeItem.unitName}</p>
                <p className="text-slate-600">Skor Mandiri Unit: {activeItem.selfScore}/5 ({activeItem.controlRating})</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Skor Audit Aktual SPI (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={reviewScore}
                    onChange={(e) => setReviewScore(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Persetujuan</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Disetujui">Disetujui Kepala SPI</option>
                    <option value="Direviu SPI">Perlu Klarifikasi Tambahan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Evaluasi / Rekomendasi SPI</label>
                <textarea
                  rows={3}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Berikan catatan temuan atau perbedaan penilaian..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Simpan Hasil Reviu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
