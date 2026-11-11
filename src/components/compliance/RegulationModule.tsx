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
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Download,
  Search,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/firebase';
import { Regulation } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

export const RegulationModule: React.FC = () => {
  const { hasRole } = useAuth();
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<Regulation | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formRegNumber, setFormRegNumber] = useState('');
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formCategory, setFormCategory] = useState<Regulation['category']>('Perdir');
  const [formAbout, setFormAbout] = useState('');
  const [formRiskArticles, setFormRiskArticles] = useState('');
  const [formRecommendation, setFormRecommendation] = useState('');
  const [formStatus, setFormStatus] = useState<Regulation['status']>('Berlaku');

  const canManage = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'regulations'), (snap) => {
      setRegulations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Regulation)));
    });
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingReg(null);
    setFormTitle('Peraturan Direktur tentang Prosedur Pengadaan Barang dan Jasa');
    setFormRegNumber('Perdir No. 04 Tahun 2024');
    setFormYear(new Date().getFullYear());
    setFormCategory('Perdir');
    setFormAbout('Tata cara pemilihan penyedia, batasan kewenangan pengadaan langsung, dan panitia pengadaan.');
    setFormRiskArticles('Pasal 12 ayat (3) mengenai pemecahan paket pekerjaan dan batas nilai pengadaan langsung.');
    setFormRecommendation('SPI menyarankan penambahan klausul pakta integritas anti-gratifikasi dan evaluasi kewajaran harga.');
    setFormStatus('Berlaku');
    setIsModalOpen(true);
  };

  const openEditModal = (r: Regulation) => {
    setEditingReg(r);
    setFormTitle(r.title);
    setFormRegNumber(r.regNumber);
    setFormYear(r.year);
    setFormCategory(r.category);
    setFormAbout(r.about);
    setFormRiskArticles(r.riskArticles);
    setFormRecommendation(r.recommendation);
    setFormStatus(r.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Omit<Regulation, 'id'> = {
      title: formTitle,
      regNumber: formRegNumber,
      year: formYear,
      category: formCategory,
      about: formAbout,
      riskArticles: formRiskArticles,
      recommendation: formRecommendation,
      status: formStatus,
    };

    try {
      if (editingReg) {
        await updateDoc(doc(db, 'regulations', editingReg.id), data);
      } else {
        const id = 'reg-' + Date.now();
        await setDoc(doc(db, 'regulations', id), { id, ...data });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving regulation:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus dokumen peraturan ini dari basis data regulasi?')) return;
    try {
      await deleteDoc(doc(db, 'regulations', id));
    } catch (err) {
      console.error('Error deleting regulation:', err);
    }
  };

  const exportToExcel = () => {
    const dataToExport = regulations.map((r, idx) => ({
      No: idx + 1,
      'Nomor Dokumen': r.regNumber,
      'Judul Peraturan': r.title,
      Tahun: r.year,
      Kategori: r.category,
      Tentang: r.about,
      'Pasal Berisiko': r.riskArticles,
      'Rekomendasi SPI': r.recommendation,
      Status: r.status,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Database Regulasi');
    XLSX.writeFile(wb, `Basis_Data_Regulasi_Tirta_Saiyo.xlsx`);
  };

  const filteredRegs = regulations.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.about.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-700" />
            Basis Data Peraturan & Reviu Kepatuhan Produk Hukum
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inventarisasi regulasi BUMD, Perdir Tirta Saiyo, SOP, standar GIAS 2024, dan telaah pasal berisiko hukum
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
            title="Tinjau dan cetak laporan inventarisasi & kepatuhan produk hukum"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cetak Telaah Regulasi</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Produk Hukum</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari peraturan, pasal, atau SOP..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="ALL">Semua Kategori Produk Hukum</option>
            <option value="UU/PP/Permen">UU / PP / Permendagri</option>
            <option value="Perdir">Peraturan Direktur (Perdir)</option>
            <option value="SOP">Standar Operasional Prosedur (SOP)</option>
            <option value="SK Direksi">Surat Keputusan Direksi</option>
            <option value="Standar Audit">Standar Audit (GIAS / SPIP / ISO)</option>
            <option value="Perjanjian/Kontrak">Perjanjian / Kontrak Kerja Sama</option>
          </select>
        </div>
      </div>

      {/* Regulation Cards */}
      <div className="space-y-3">
        {filteredRegs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            Belum ada produk hukum atau SOP yang didaftarkan.
          </div>
        ) : (
          filteredRegs.map((r) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                    {r.regNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Tahun {r.year}</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 rounded-md">
                    {r.category}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    r.status === 'Berlaku'
                      ? 'bg-emerald-100 text-emerald-800'
                      : r.status === 'Dalam Review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{r.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{r.about}</p>
              </div>

              {/* Reviewer Note & Risk Articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div>
                  <span className="font-bold text-amber-900 block mb-0.5">Pasal / Poin Kritis Berisiko:</span>
                  <p className="text-slate-700">{r.riskArticles || '-'}</p>
                </div>
                <div>
                  <span className="font-bold text-emerald-900 block mb-0.5">Catatan & Rekomendasi SPI:</span>
                  <p className="text-slate-700">{r.recommendation || '-'}</p>
                </div>
              </div>

              {canManage && (
                <div className="flex justify-end gap-1 pt-1">
                  <button
                    onClick={() => openEditModal(r)}
                    className="p-1 text-slate-500 hover:text-emerald-700 rounded-md"
                    title="Edit Regulasi"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1 text-slate-500 hover:text-rose-600 rounded-md"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Regulation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingReg ? 'Ubah Produk Hukum' : 'Tambah Produk Hukum / SOP BUMD'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Peraturan / Dokumen</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Dokumen Peraturan</label>
                  <input
                    type="text"
                    required
                    value={formRegNumber}
                    onChange={(e) => setFormRegNumber(e.target.value)}
                    placeholder="Contoh: Perdir No. 01/2023"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    required
                    value={formYear}
                    onChange={(e) => setFormYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Dokumen</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="UU/PP/Permen">UU / PP / Permendagri</option>
                    <option value="Perdir">Peraturan Direktur (Perdir)</option>
                    <option value="SOP">Standar Operasional Prosedur (SOP)</option>
                    <option value="SK Direksi">Surat Keputusan Direksi</option>
                    <option value="Standar Audit">Standar Audit (GIAS / SPIP / ISO)</option>
                    <option value="Perjanjian/Kontrak">Perjanjian / Kontrak</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Keberlakuan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Berlaku">Berlaku Penuh</option>
                    <option value="Dalam Review">Dalam Reviu / Perubahan</option>
                    <option value="Dicabut">Sudah Dicabut / Diganti</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tentang / Substansi Pengaturan</label>
                <textarea
                  rows={2}
                  required
                  value={formAbout}
                  onChange={(e) => setFormAbout(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pasal / Ayat Kritis Berpotensi Risiko</label>
                <textarea
                  rows={2}
                  value={formRiskArticles}
                  onChange={(e) => setFormRiskArticles(e.target.value)}
                  placeholder="Pasal-pasal yang berpotensi menjadi temuan kepatuhan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rekomendasi / Telaah Kepatuhan SPI</label>
                <textarea
                  rows={2}
                  value={formRecommendation}
                  onChange={(e) => setFormRecommendation(e.target.value)}
                  placeholder="Arahan mitigasi kepatuhan untuk manajemen..."
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
                  Simpan Dokumen Regulasi
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
          documentTitle="LAPORAN TELAAH KEPATUHAN PRODUK HUKUM & REGULASI BUMD"
          documentSubtitle="Perumda Air Minum Tirta Saiyo Kabupaten Pasaman"
          documentNumber={`REG-SPI/PTS/${new Date().getFullYear()}`}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
          defaultShowSignatory2={true}
        >
          {() => (
            <div className="space-y-5 text-xs font-serif leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-3 gap-3 font-sans text-xs">
                <div>
                  <p className="text-slate-500">Total Regulasi & SOP:</p>
                  <p className="font-bold text-slate-900">{regulations.length} Dokumen Hukum</p>
                </div>
                <div>
                  <p className="text-slate-500">Kategori Regulasi:</p>
                  <p className="font-bold text-emerald-800">UU, PP, Perdir, SOP & GIAS 2024</p>
                </div>
                <div>
                  <p className="text-slate-500">Fokus Kepatuhan:</p>
                  <p className="font-bold text-slate-800">Mitigasi Risiko Hukum & Good Corporate Governance</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 font-sans uppercase tracking-wider text-xs border-b border-slate-300 pb-1">
                  Daftar Telaah Produk Hukum & Pasal Berisiko:
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-300 font-sans">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="p-2 border border-slate-300 w-8 text-center">No</th>
                        <th className="p-2 border border-slate-300 w-28">Nomor & Kategori</th>
                        <th className="p-2 border border-slate-300">Judul & Pokok Pengaturan</th>
                        <th className="p-2 border border-slate-300">Klausul / Pasal Berisiko</th>
                        <th className="p-2 border border-slate-300">Rekomendasi SPI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredRegs.map((r, idx) => (
                        <tr key={r.id}>
                          <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-300">
                            <p className="font-bold font-mono text-[10px] text-slate-900">{r.regNumber}</p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 mt-0.5 inline-block">
                              {r.category}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-300">
                            <p className="font-bold text-slate-900">{r.title}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{r.about}</p>
                          </td>
                          <td className="p-2 border border-slate-300 text-rose-800 font-medium">
                            {r.riskArticles || '-'}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-700">
                            {r.recommendation}
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
