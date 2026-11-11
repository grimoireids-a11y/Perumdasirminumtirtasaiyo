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
  FileCheck2,
  Plus,
  Printer,
  Calendar,
  Building,
  Users,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  Edit2,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { AuditAssignment, Unit } from '../../types/audit';
import { useAuth } from '../../context/AuthContext';
import { AUDIT_TYPES } from '../../data/initialData';
import { DocumentPrintPreviewModal } from '../common/DocumentPrintPreviewModal';

interface AuditAssignmentModuleProps {
  onNavigateToLha?: (assignmentId: string) => void;
  onNavigateToPka?: (assignmentId: string) => void;
  onNavigateToKka?: (assignmentId: string) => void;
  onNavigateToFindings?: (assignmentId: string) => void;
  initialPrefillFromPkpt?: any;
}

export const AuditAssignmentModule: React.FC<AuditAssignmentModuleProps> = ({
  onNavigateToLha,
  onNavigateToPka,
  onNavigateToKka,
  onNavigateToFindings,
  initialPrefillFromPkpt,
}) => {
  const { userProfile, hasRole } = useAuth();
  const currentYear = new Date().getFullYear();

  const [assignments, setAssignments] = useState<AuditAssignment[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AuditAssignment | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<AuditAssignment | null>(null);

  // Form states
  const [formLetterNumber, setFormLetterNumber] = useState('');
  const [formLetterDate, setFormLetterDate] = useState(new Date().toISOString().slice(0, 10));
  const [formBasis, setFormBasis] = useState('Program Kerja Pengawasan Tahunan (PKPT) Tahun Anggaran ' + currentYear);
  const [formObjectName, setFormObjectName] = useState('');
  const [formUnitId, setFormUnitId] = useState('');
  const [formAuditType, setFormAuditType] = useState('Audit Operasional');
  const [formSupervisor, setFormSupervisor] = useState('Kepala Satuan Pengawasan Intern');
  const [formTeamLeader, setFormTeamLeader] = useState('Auditor Muda SPI');
  const [formTeamMembers, setFormTeamMembers] = useState('Auditor Pertama SPI, Staf Pengawas');
  const [formObjective, setFormObjective] = useState('');
  const [formScope, setFormScope] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<'Diterbitkan' | 'Berlangsung' | 'Selesai'>('Diterbitkan');

  const canManage = hasRole(['KEPALA_SPI', 'AUDITOR', 'ADMIN_SISTEM']);

  useEffect(() => {
    const unsubAssignments = onSnapshot(collection(db, 'audit_assignments'), (snap) => {
      setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditAssignment)));
    });

    const unsubUnits = onSnapshot(collection(db, 'units'), (snap) => {
      setUnits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit)));
    });

    return () => {
      unsubAssignments();
      unsubUnits();
    };
  }, []);

  // Handle prefill from PKPT when navigated from PKPT module
  useEffect(() => {
    if (initialPrefillFromPkpt) {
      const seq = assignments.length + 1;
      setFormLetterNumber(`090/SPI-PTS/${String(seq).padStart(3, '0')}/${currentYear}`);
      setFormLetterDate(new Date().toISOString().slice(0, 10));
      setFormBasis(`Program Kerja Pengawasan Tahunan (PKPT) SPI Tahun ${initialPrefillFromPkpt.year || currentYear}`);
      setFormObjectName(initialPrefillFromPkpt.title || 'Pemeriksaan Operasional dan Kepatuhan');
      setFormUnitId(initialPrefillFromPkpt.unitId || (units[0]?.id || ''));
      setFormAuditType(initialPrefillFromPkpt.auditType || 'Audit Operasional');
      setFormSupervisor('Kepala Satuan Pengawasan Intern');
      setFormTeamLeader(userProfile?.displayName || 'Ketua Tim Auditor SPI');
      setFormTeamMembers('Anggota Tim SPI');
      setFormObjective(initialPrefillFromPkpt.objective || 'Memberikan assurance independen atas efektivitas tata kelola dan kepatuhan unit.');
      setFormScope(initialPrefillFromPkpt.scope || initialPrefillFromPkpt.businessProcess || 'Pengujian prosedur dan dokumen kepatuhan operasional.');
      setFormStartDate(new Date().toISOString().slice(0, 10));
      setFormEndDate(new Date(Date.now() + (initialPrefillFromPkpt.estimatedDays || 14) * 86400000).toISOString().slice(0, 10));
      setFormStatus('Diterbitkan');
      setIsModalOpen(true);
    }
  }, [initialPrefillFromPkpt, assignments.length, currentYear, units, userProfile?.displayName]);

  const openAddModal = () => {
    setEditingAssignment(null);
    const seq = assignments.length + 1;
    setFormLetterNumber(`090/SPI-PTS/${String(seq).padStart(3, '0')}/${currentYear}`);
    setFormLetterDate(new Date().toISOString().slice(0, 10));
    setFormBasis(`Program Kerja Pengawasan Tahunan (PKPT) SPI Tahun ${currentYear}`);
    setFormObjectName('Pemeriksaan Operasional dan Kepatuhan Distribusi Air Minum');
    setFormUnitId(units[0]?.id || '');
    setFormAuditType('Audit Operasional');
    setFormSupervisor('Kepala Satuan Pengawasan Intern');
    setFormTeamLeader(userProfile?.displayName || 'Ketua Tim Auditor');
    setFormTeamMembers('Anggota Tim SPI');
    setFormObjective('Memberikan assurance independen atas keandalan pengelolaan operasional unit.');
    setFormScope('Pengujian pencatatan fisik, kas opname, dan kepatuhan SOP pelayanan.');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    setFormStatus('Diterbitkan');
    setIsModalOpen(true);
  };

  const openEditModal = (a: AuditAssignment) => {
    setEditingAssignment(a);
    setFormLetterNumber(a.letterNumber || '');
    setFormLetterDate(a.letterDate || new Date().toISOString().slice(0, 10));
    setFormBasis(a.basis || '');
    setFormObjectName(a.objectName || '');
    setFormUnitId(a.unitId || '');
    setFormAuditType(a.auditType || 'Audit Operasional');
    setFormSupervisor(a.supervisor || 'Kepala Satuan Pengawasan Intern');
    setFormTeamLeader(a.teamLeader || '');
    setFormTeamMembers(a.teamMembers || '');
    setFormObjective(a.objective || '');
    setFormScope(a.scope || '');
    setFormStartDate(a.startDate || '');
    setFormEndDate(a.endDate || '');
    setFormStatus(a.status || 'Diterbitkan');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selUnit = units.find((u) => u.id === formUnitId);
    const unitName = selUnit ? selUnit.name : 'Unit Pelayanan Tirta Saiyo';

    const id = editingAssignment ? editingAssignment.id : 'assign-' + Date.now();
    const data: AuditAssignment = {
      id,
      letterNumber: formLetterNumber,
      letterDate: formLetterDate,
      basis: formBasis,
      objectName: formObjectName,
      unitId: formUnitId,
      unitName,
      auditType: formAuditType,
      supervisor: formSupervisor,
      teamLeader: formTeamLeader,
      teamMembers: formTeamMembers,
      objective: formObjective,
      scope: formScope,
      startDate: formStartDate,
      endDate: formEndDate,
      status: formStatus,
    };

    try {
      await setDoc(doc(db, 'audit_assignments', id), data, { merge: true });
      setIsModalOpen(false);
      setEditingAssignment(null);
    } catch (err) {
      console.error('Error saving assignment:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus surat penugasan ini?')) return;
    try {
      await deleteDoc(doc(db, 'audit_assignments', id));
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  };

  const openPrintModal = (a: AuditAssignment) => {
    setActiveAssignment(a);
    setIsPrintModalOpen(true);
  };

  const printDocument = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            Surat Penugasan & Tim Pemeriksa SPI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penerbitan surat tugas resmi, penetapan susunan tim audit, dasar penugasan, dan jadwal pelaksanaan
          </p>
        </div>

        {canManage && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Terbitkan Surat Tugas Baru</span>
          </button>
        )}
      </div>

      {/* Assignment List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            Belum ada surat tugas yang diterbitkan. Klik tombol "Terbitkan Surat Tugas Baru" untuk memulai penugasan.
          </div>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-600 transition-all space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {a.letterNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      a.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : a.status === 'Berlangsung'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {a.objectName}
                </h3>

                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  <p className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{a.unitName}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Ketua Tim: {a.teamLeader}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {a.startDate} s.d. {a.endDate}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-medium">{a.auditType}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {onNavigateToPka && (
                    <button
                      onClick={() => onNavigateToPka(a.id)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      title="Buka Program Kerja Audit (PKA)"
                    >
                      PKA
                    </button>
                  )}
                  {onNavigateToKka && (
                    <button
                      onClick={() => onNavigateToKka(a.id)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      title="Buka Kertas Kerja Audit (KKA)"
                    >
                      KKA
                    </button>
                  )}
                  {onNavigateToFindings && (
                    <button
                      onClick={() => onNavigateToFindings(a.id)}
                      className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors"
                      title="Buka Temuan 5C Penugasan Ini"
                    >
                      Temuan 5C
                    </button>
                  )}
                  {onNavigateToLha && (
                    <button
                      onClick={() => onNavigateToLha(a.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300 transition-colors cursor-pointer"
                      title="Susun Laporan Hasil Audit (LHA) dengan asistensi AI untuk penugasan ini"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Susun LHA</span>
                    </button>
                  )}
                  <button
                    onClick={() => openPrintModal(a)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    title="Cetak Surat Tugas"
                  >
                    <Eye className="w-3 h-3 text-emerald-700" />
                    <span>Cetak SPT</span>
                  </button>
                  {canManage && (
                    <>
                      <button
                        onClick={() => openEditModal(a)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-md transition-colors"
                        title="Edit Surat Perintah Tugas (SPT)"
                      >
                        <Edit2 className="w-3 h-3 text-slate-600" />
                        <span>Edit SPT</span>
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
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

      {/* Modal Add / Edit Assignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingAssignment ? 'Edit Surat Perintah Tugas (SPT)' : 'Penerbitan Surat Tugas Pengawasan SPI'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Surat Tugas</label>
                  <input
                    type="text"
                    required
                    value={formLetterNumber}
                    onChange={(e) => setFormLetterNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    required
                    value={formLetterDate}
                    onChange={(e) => setFormLetterDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dasar Penugasan</label>
                <input
                  type="text"
                  required
                  value={formBasis}
                  onChange={(e) => setFormBasis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kegiatan / Objek Pemeriksaan</label>
                <input
                  type="text"
                  required
                  value={formObjectName}
                  onChange={(e) => setFormObjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Kerja Yang Diperiksa (Auditee)</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Audit</label>
                  <select
                    value={formAuditType}
                    onChange={(e) => setFormAuditType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {AUDIT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-900 block">Susunan Tim Pemeriksa SPI</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Pengendali Mutu / Penanggung Jawab</label>
                    <input
                      type="text"
                      value={formSupervisor}
                      onChange={(e) => setFormSupervisor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Ketua Tim Pemeriksa</label>
                    <input
                      type="text"
                      required
                      value={formTeamLeader}
                      onChange={(e) => setFormTeamLeader(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Anggota Tim Pemeriksa</label>
                  <input
                    type="text"
                    value={formTeamMembers}
                    onChange={(e) => setFormTeamMembers(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai Audit</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai Audit</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tujuan & Ruang Lingkup</label>
                <textarea
                  rows={2}
                  required
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  placeholder="Uraian sasaran dan pengujian spesifik..."
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
                  {editingAssignment ? 'Simpan Perubahan SPT' : 'Terbitkan Surat Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Modal with Fitur Jabatan */}
      {isPrintModalOpen && activeAssignment && (
        <DocumentPrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          documentTitle="SURAT PERINTAH TUGAS PEMERIKSAAN"
          documentSubtitle="Satuan Pengawasan Intern (SPI)"
          documentNumber={activeAssignment.letterNumber}
          initialSignatory1Role="Kepala Satuan Pengawasan Intern"
          initialSignatory2Role="Direktur Perumda Air Minum Tirta Saiyo"
        >
          {() => (
            <div className="space-y-4 text-xs text-justify font-serif">
              <p>
                <strong>Dasar Penugasan:</strong> {activeAssignment.basis}
              </p>

              <p className="font-bold text-center uppercase tracking-wider font-sans pt-2">
                MEMERINTAHKAN:
              </p>

              <div className="space-y-1.5 pl-4">
                <p>
                  <span className="font-bold font-sans">Kepada:</span>
                </p>
                <p>1. Pengendali Mutu: <strong>{activeAssignment.supervisor}</strong></p>
                <p>2. Ketua Tim Pemeriksa: <strong>{activeAssignment.teamLeader}</strong></p>
                <p>3. Anggota Tim Pemeriksa: <strong>{activeAssignment.teamMembers}</strong></p>
              </div>

              <div className="space-y-1.5 pl-4 pt-2">
                <p>
                  <span className="font-bold font-sans">Untuk:</span>
                </p>
                <p>
                  1. Melaksanakan <strong>{activeAssignment.auditType}</strong> pada <strong>{activeAssignment.unitName}</strong> Kabupaten Pasaman.
                </p>
                <p>
                  2. <strong>Ruang lingkup dan tujuan pemeriksaan:</strong> {activeAssignment.objective}
                </p>
                <p>
                  3. <strong>Ruang lingkup pengujian:</strong> {activeAssignment.scope}
                </p>
                <p>
                  4. <strong>Waktu pelaksanaan:</strong> Dimulai tanggal <strong>{activeAssignment.startDate}</strong> sampai dengan <strong>{activeAssignment.endDate}</strong>.
                </p>
                <p>
                  5. Melaporkan hasil pengawasan dalam bentuk Kertas Kerja Pemeriksaan (KKA) dan Laporan Hasil Audit (LHA) kepada Kepala Satuan Pengawasan Intern.
                </p>
                <p>
                  6. Melaksanakan tugas dengan penuh tanggung jawab, independen, dan mematuhi Kode Etik serta Standar Audit Intern (GIAS 2024).
                </p>
              </div>
            </div>
          )}
        </DocumentPrintPreviewModal>
      )}
    </div>
  );
};
