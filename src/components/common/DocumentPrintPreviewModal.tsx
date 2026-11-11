import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Award,
  ChevronDown,
  ChevronUp,
  Settings,
  MapPin,
  Check,
  FileText,
  Download,
  FileCode,
  Sliders,
  Shield,
  Building,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { OfficialSignatory, DocumentSignatureConfig } from '../../types/audit';
import { INITIAL_OFFICIALS } from '../../data/initialData';
import { SignatoryManagerModal } from './SignatoryManagerModal';
import { useAppBranding } from '../../context/AppBrandingContext';

interface DocumentPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentSubtitle?: string;
  documentNumber?: string;
  initialSignatory1Role?: string;
  initialSignatory2Role?: string;
  defaultShowSignatory2?: boolean;
  defaultShowSignatory3?: boolean;
  children: (config: DocumentSignatureConfig) => React.ReactNode;
}

export const DocumentPrintPreviewModal: React.FC<DocumentPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentSubtitle,
  documentNumber,
  initialSignatory1Role = 'Kepala Satuan Pengawasan Intern',
  initialSignatory2Role = 'Direktur Perumda Air Minum Tirta Saiyo',
  defaultShowSignatory2 = false,
  defaultShowSignatory3 = false,
  children,
}) => {
  const { branding } = useAppBranding();
  const [officials, setOfficials] = useState<OfficialSignatory[]>(INITIAL_OFFICIALS);
  const [isSignatoryManagerOpen, setIsSignatoryManagerOpen] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Mode kop surat: 'manual' (ruang kosong untuk kertas fisik) atau 'digital' (cetak kop logo & identitas kantor baru)
  const [kopMode, setKopMode] = useState<'manual' | 'digital'>('manual');
  // Ukuran ruang kosong kop surat standar (dalam centimeter)
  const [kopSpacingCm, setKopSpacingCm] = useState<number>(3.5);

  // Signatory states: 1. Nama, 2. NIP, 3. Jabatan
  const [location, setLocation] = useState('Lubuk Sikaping');
  const [signDate, setSignDate] = useState(() => {
    const d = new Date();
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  });

  // Penandatangan 1
  const [sig1Id, setSig1Id] = useState('');
  const [sig1Name, setSig1Name] = useState('Hendra Saputra, S.E., M.M., CRMP');
  const [sig1Nip, setSig1Nip] = useState('19780415 200501 1 004');
  const [sig1Position, setSig1Position] = useState('Kepala Satuan Pengawasan Intern (SPI)');
  const [sig1RoleLabel, setSig1RoleLabel] = useState('');

  // Penandatangan 2 (Optional)
  const [showSig2, setShowSig2] = useState(defaultShowSignatory2);
  const [sig2Id, setSig2Id] = useState('');
  const [sig2Name, setSig2Name] = useState('H. Ahmad Zaki, S.T., M.M.');
  const [sig2Nip, setSig2Nip] = useState('19740612 199803 1 002');
  const [sig2Position, setSig2Position] = useState('Direktur Perumda Air Minum Tirta Saiyo');
  const [sig2RoleLabel, setSig2RoleLabel] = useState('Mengetahui / Menyetujui:');

  // Penandatangan 3 (Optional)
  const [showSig3, setShowSig3] = useState(defaultShowSignatory3);
  const [sig3Id, setSig3Id] = useState('');
  const [sig3Name, setSig3Name] = useState('Dewi Anggraini, S.E.');
  const [sig3Nip, setSig3Nip] = useState('19890518 201402 2 003');
  const [sig3Position, setSig3Position] = useState('Ketua Tim Pemeriksa SPI');
  const [sig3RoleLabel, setSig3RoleLabel] = useState('Pemeriksa / Ketua Tim:');

  // Fetch officials from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'signatories'), (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OfficialSignatory));
        data.sort((a, b) => (a.order || 99) - (b.order || 99));
        setOfficials(data);

        // Pre-select matching initial role if not set
        if (!sig1Id) {
          const match1 = data.find((o) =>
            o.position.toLowerCase().includes(initialSignatory1Role.toLowerCase())
          );
          if (match1) {
            setSig1Id(match1.id);
            setSig1Name(match1.name);
            setSig1Nip(match1.nip);
            setSig1Position(match1.position);
          }
        }

        if (!sig2Id) {
          const match2 = data.find((o) =>
            o.position.toLowerCase().includes(initialSignatory2Role.toLowerCase())
          );
          if (match2) {
            setSig2Id(match2.id);
            setSig2Name(match2.name);
            setSig2Nip(match2.nip);
            setSig2Position(match2.position);
          }
        }
      }
    });

    return () => unsub();
  }, [initialSignatory1Role, initialSignatory2Role]);

  if (!isOpen) return null;

  // Handle selection from dropdown
  const handleSelectSig1 = (id: string) => {
    setSig1Id(id);
    const sel = officials.find((o) => o.id === id);
    if (sel) {
      setSig1Name(sel.name);
      setSig1Nip(sel.nip);
      setSig1Position(sel.position);
    }
  };

  const handleSelectSig2 = (id: string) => {
    setSig2Id(id);
    const sel = officials.find((o) => o.id === id);
    if (sel) {
      setSig2Name(sel.name);
      setSig2Nip(sel.nip);
      setSig2Position(sel.position);
    }
  };

  const currentConfig: DocumentSignatureConfig = {
    location,
    date: signDate,
    signatory1: {
      id: sig1Id || 'custom-1',
      name: sig1Name,
      nip: sig1Nip,
      position: sig1Position,
    },
    signatory2: showSig2
      ? {
          id: sig2Id || 'custom-2',
          name: sig2Name,
          nip: sig2Nip,
          position: sig2Position,
        }
      : undefined,
    signatory3: showSig3
      ? {
          id: sig3Id || 'custom-3',
          name: sig3Name,
          nip: sig3Nip,
          position: sig3Position,
        }
      : undefined,
    showSignatory2: showSig2,
    showSignatory3: showSig3,
    signatory1RoleLabel: sig1RoleLabel,
    signatory2RoleLabel: sig2RoleLabel,
    signatory3RoleLabel: sig3RoleLabel,
  };

  // CETAK DOKUMEN (Print Isolation Iframe)
  const handlePrint = () => {
    const element = document.getElementById('printable-document-content');
    if (!element) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Capture styling
    const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    const clone = element.cloneNode(true) as HTMLElement;
    const noPrints = clone.querySelectorAll('.no-print');
    noPrints.forEach((el) => el.remove());

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${documentTitle} - ${documentNumber || 'SPI Tirta Saiyo'}</title>
          ${styleNodes}
          <style>
            @page {
              size: A4 portrait;
              margin: 1.5cm 2cm 2cm 2cm;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 10.5pt;
              line-height: 1.45;
            }
            .no-print {
              display: none !important;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
              margin-top: 8px;
              margin-bottom: 8px;
            }
            th, td {
              padding: 6px 8px !important;
            }
            /* Default borders for data tables */
            table:not(.borderless):not(.table-borderless) th,
            table:not(.borderless):not(.table-borderless) td {
              border: 1px solid #64748b !important;
            }
            /* Borderless tables for metadata & signature layouts */
            table.borderless, table.borderless th, table.borderless td,
            .table-borderless, .table-borderless th, .table-borderless td {
              border: none !important;
              background: transparent !important;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: bold;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .text-justify {
              text-align: justify !important;
              text-justify: inter-word !important;
            }
            .page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div style="padding: 0 4px;">
            ${clone.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 400);
  };

  // EXPORT KE MICROSOFT WORD (.doc)
  const handleExportWord = () => {
    const element = document.getElementById('printable-document-content');
    if (!element) return;

    const clone = element.cloneNode(true) as HTMLElement;
    const noPrints = clone.querySelectorAll('.no-print');
    noPrints.forEach((el) => el.remove());

    const filename = `${documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.doc`;

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${documentTitle}</title>
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 54pt 54pt 54pt 54pt;
            mso-header-margin: 36pt;
            mso-footer-margin: 36pt;
            mso-paper-source: 0;
          }
          div.WordSection1 { page: WordSection1; }
          body {
            font-family: Calibri, Arial, "Segoe UI", sans-serif;
            font-size: 11pt;
            color: #0f172a;
            line-height: 1.45;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 8pt 0;
          }
          table:not(.borderless):not(.table-borderless) th,
          table:not(.borderless):not(.table-borderless) td {
            border: 1pt solid #475569;
            padding: 5pt 7pt;
            font-size: 10pt;
            text-align: left;
          }
          table.borderless, table.borderless th, table.borderless td,
          .table-borderless, .table-borderless th, .table-borderless td {
            border: none;
            padding: 3pt 5pt;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-justify { text-align: justify; text-justify: inter-word; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .underline { text-decoration: underline; }
          .page-break { page-break-after: always; mso-special-character: line-break; }
          .avoid-break { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          ${clone.innerHTML}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice('Dokumen Word (.doc) berhasil diunduh. Anda dapat langsung membuka dan menyisipkan kop resmi di Word.');
    setTimeout(() => setExportNotice(null), 5000);
  };

  // EXPORT KE FILE HTML STANDALONE
  const handleExportHtml = () => {
    const element = document.getElementById('printable-document-content');
    if (!element) return;

    const clone = element.cloneNode(true) as HTMLElement;
    const noPrints = clone.querySelectorAll('.no-print');
    noPrints.forEach((el) => el.remove());

    const filename = `${documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.html`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${documentTitle}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 800px; margin: 30px auto; padding: 20px; color: #1e293b; line-height: 1.5; font-size: 13px; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th, td { border: 1px solid #94a3b8; padding: 6px 10px; font-size: 12px; }
          th { background: #f8fafc; font-weight: bold; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .underline { text-decoration: underline; }
        </style>
      </head>
      <body>
        ${clone.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice('File Dokumen HTML berhasil diunduh.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-5xl max-h-[96vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Top Header Toolbar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold truncate">
                Tinjauan & Cetak Dokumen: {documentTitle}
              </h3>
              {documentNumber && (
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  Nomor: {documentNumber}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Pengaturan Penandatangan & Spasi Kop */}
            <button
              type="button"
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isConfigExpanded
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Pilih Penandatangan (Fitur Jabatan)</span>
              <span className="sm:hidden">Jabatan</span>
              {isConfigExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* TOMBOL CETAK / SIMPAN PDF */}
            <button
              type="button"
              onClick={handlePrint}
              title="Cetak dokumen atau simpan sebagai PDF"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            {/* TOMBOL EXPORT DOKUMEN (WORD / HTML) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 border border-teal-600 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-300" />
                <span>Export Dokumen</span>
                <ChevronDown className="w-3 h-3 text-teal-300" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-in fade-in duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Format Dokumen
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportWord();
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-emerald-50 flex items-center gap-2 text-slate-700 font-semibold cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-bold text-slate-900">Microsoft Word (.doc)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Edit & sisipkan kop resmi di Word</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportHtml();
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-emerald-50 flex items-center gap-2 text-slate-700 font-semibold cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-900">Arsip Web (.html)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Format HTML mandiri</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK NOTICE */}
        {exportNotice && (
          <div className="bg-emerald-600 text-white text-xs px-5 py-2 flex items-center justify-between no-print animate-in fade-in duration-200">
            <span className="font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {exportNotice}
            </span>
            <button
              type="button"
              onClick={() => setExportNotice(null)}
              className="text-emerald-100 hover:text-white text-xs underline font-semibold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* FITUR JABATAN & SELEKSI PENANDATANGAN CONFIGURATION DRAWER */}
        {isConfigExpanded && (
          <div className="bg-emerald-50/90 border-b border-emerald-200 p-4 sm:p-5 text-xs space-y-4 shrink-0 no-print max-h-72 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-700 text-white rounded">
                  Fitur Jabatan
                </span>
                <span className="font-bold text-emerald-950 text-xs sm:text-sm">
                  Pilih Pejabat Penandatangan untuk Dokumen Ini
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* PILIHAN MODE KOP SURAT */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Sliders className="w-3 h-3 text-emerald-700" />
                  <span className="text-[10px] font-bold text-slate-700">Kop Surat:</span>
                  <select
                    value={kopMode}
                    onChange={(e) => setKopMode(e.target.value as 'manual' | 'digital')}
                    className="text-[10px] font-bold text-emerald-900 bg-emerald-50 rounded border border-emerald-300 px-1 py-0.5"
                  >
                    <option value="manual">Manual (Kertas Berkop)</option>
                    <option value="digital">Digital (Logo & Nama Kantor)</option>
                  </select>

                  {kopMode === 'manual' && (
                    <select
                      value={kopSpacingCm}
                      onChange={(e) => setKopSpacingCm(parseFloat(e.target.value))}
                      className="text-[10px] font-bold text-emerald-900 bg-emerald-50 rounded border border-emerald-300 px-1 py-0.5"
                      title="Tinggi ruang kosong kop kertas"
                    >
                      <option value={2.5}>2.5 cm (Ramping)</option>
                      <option value={3.0}>3.0 cm (Sedang)</option>
                      <option value={3.5}>3.5 cm (Standar)</option>
                      <option value={4.0}>4.0 cm (Lebar)</option>
                      <option value={4.5}>4.5 cm (Ekstra)</option>
                    </select>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSignatoryManagerOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline self-start sm:self-auto cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>+ Kelola / Tambah Master Jabatan</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tempat & Tanggal */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  Tempat & Tanggal Dokumen
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Tempat Penetapan</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-medium"
                      placeholder="Lubuk Sikaping"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Tanggal Surat</label>
                    <input
                      type="text"
                      value={signDate}
                      onChange={(e) => setSignDate(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-medium"
                      placeholder="9 November 2026"
                    />
                  </div>
                </div>
              </div>

              {/* PENANDATANGAN 1 (Utama) */}
              <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <Award className="w-3 h-3 text-emerald-700" />
                    Penandatangan 1 (Pembuat / Utama)
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">
                    Pilih Dari Fitur Jabatan:
                  </label>
                  <select
                    value={sig1Id}
                    onChange={(e) => handleSelectSig1(e.target.value)}
                    className="w-full px-2 py-1 bg-emerald-50/60 border border-emerald-300 rounded text-xs font-bold text-slate-800"
                  >
                    <option value="">-- Pilih Jabatan / Pejabat --</option>
                    {officials.map((ofc) => (
                      <option key={ofc.id} value={ofc.id}>
                        {ofc.position} - {ofc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-500 block">1. Nama:</label>
                    <input
                      type="text"
                      value={sig1Name}
                      onChange={(e) => setSig1Name(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">2. NIP:</label>
                    <input
                      type="text"
                      value={sig1Nip}
                      onChange={(e) => setSig1Nip(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">3. Jabatan:</label>
                    <input
                      type="text"
                      value={sig1Position}
                      onChange={(e) => setSig1Position(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* PENANDATANGAN 2 (Mengetahui / Direktur) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <Award className="w-3 h-3 text-slate-500" />
                    Penandatangan 2 (Mengetahui)
                  </span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSig2}
                      onChange={(e) => setShowSig2(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] font-semibold text-slate-600">Aktifkan</span>
                  </label>
                </div>

                {showSig2 ? (
                  <>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Pilih Dari Fitur Jabatan:
                      </label>
                      <select
                        value={sig2Id}
                        onChange={(e) => handleSelectSig2(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800"
                      >
                        <option value="">-- Pilih Jabatan / Pejabat --</option>
                        {officials.map((ofc) => (
                          <option key={ofc.id} value={ofc.id}>
                            {ofc.position} - {ofc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                      <div>
                        <label className="text-[10px] text-slate-500 block">1. Nama:</label>
                        <input
                          type="text"
                          value={sig2Name}
                          onChange={(e) => setSig2Name(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">2. NIP:</label>
                        <input
                          type="text"
                          value={sig2Nip}
                          onChange={(e) => setSig2Nip(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">3. Jabatan:</label>
                        <input
                          type="text"
                          value={sig2Position}
                          onChange={(e) => setSig2Position(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400 italic pt-1">
                    Penandatangan kedua tidak ditampilkan pada dokumen ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE OFFICIAL SHEET VIEWER */}
        <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-slate-100/70">
          <div
            id="printable-document-content"
            className="max-w-4xl mx-auto bg-white p-8 sm:p-14 shadow-lg border border-slate-200 rounded-xl print:m-0 print:p-0 print:border-none print:shadow-none text-slate-900 font-serif leading-relaxed text-xs"
          >
            {/* KOP SURAT RESMI: MODE DIGITAL ATAU MANUAL */}
            {kopMode === 'digital' ? (
              <div className="w-full pb-3 mb-6 border-b-2 border-slate-900 border-double">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1">
                    {branding.logoType === 'image' && branding.logoUrl ? (
                      <img
                        src={branding.logoUrl}
                        alt={branding.appName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: branding.logoThemeColor || branding.accentColor || '#059669' }}
                      >
                        <Shield className="w-9 h-9 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center font-serif">
                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-700">
                      Pemerintah Kabupaten Pasaman
                    </h3>
                    <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-wider">
                      {branding.institutionName || 'Perumda Air Minum Tirta Saiyo'}
                    </h1>
                    <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-widest">
                      Satuan Pengawasan Intern (SPI)
                    </h2>
                    <p className="text-[10px] text-slate-600 font-sans mt-0.5">
                      {branding.address || branding.officeAddress || 'Jl. Jenderal Sudirman No. 45, Lubuk Sikaping, Kabupaten Pasaman'}
                      {(branding.phone || branding.officePhone) ? ` • Telp: ${branding.phone || branding.officePhone}` : ''}
                      {(branding.email || branding.officeEmail) ? ` • Email: ${branding.email || branding.officeEmail}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* RUANG KOSONG KOP SURAT STANDAR (Dikosongkan untuk kertas berkop resmi fisik) */
              <div
                style={{ height: `${kopSpacingCm}cm` }}
                className="w-full relative transition-all mb-4 select-none"
              >
                <div className="w-full h-full border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-[10px] no-print bg-slate-50/70 p-2 text-center">
                  <span className="font-bold text-slate-600 uppercase tracking-wider">
                    Area Dikosongkan untuk Kop Surat Manual (Standar {kopSpacingCm} cm)
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    Kop surat otomatis dihilangkan. Bagian ini disediakan bersih untuk cetak di kertas berkop atau disisipkan kop resmi manual.
                  </span>
                </div>
              </div>
            )}

            {/* Document Header Title */}
            <div className="text-center my-4 font-sans">
              <h2 className="text-sm font-bold uppercase underline tracking-wider text-slate-950">
                {documentTitle}
              </h2>
              {documentSubtitle && (
                <p className="text-xs font-medium text-slate-600 mt-0.5">{documentSubtitle}</p>
              )}
              {documentNumber && (
                <p className="text-xs font-bold mt-1 font-mono text-slate-800">Nomor: {documentNumber}</p>
              )}
            </div>

            {/* Main Document Body (Rendered via Children) */}
            <div className="my-6 space-y-4">
              {children(currentConfig)}
            </div>

            {/* SIGNATURE BLOCK (Automatically Formatted According to Selected Officials) */}
            <div className="mt-12 pt-6 font-sans">
              {showSig2 ? (
                // Dual Signature Layout (Left: Mengetahui / Right: Pembuat)
                <div className="grid grid-cols-2 gap-8 text-xs">
                  {/* Left Signature (Mengetahui / Menyetujui) */}
                  <div className="text-center space-y-16">
                    <div>
                      <p className="text-slate-500 text-[11px] mb-0.5">{sig2RoleLabel || 'Mengetahui / Menyetujui:'}</p>
                      <p className="font-bold uppercase text-slate-900">
                        {sig2Position}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold underline text-slate-900 uppercase">
                        {sig2Name}
                      </p>
                      <p className="text-[11px] text-slate-600 font-mono">
                        {sig2Nip ? `NIP. ${sig2Nip}` : 'NIP. -'}
                      </p>
                    </div>
                  </div>

                  {/* Right Signature (Pembuat / Pelapor) */}
                  <div className="text-center space-y-16">
                    <div>
                      <p className="text-slate-500 text-[11px] mb-0.5">
                        {location}, {signDate}
                      </p>
                      <p className="font-bold uppercase text-slate-900">
                        {sig1Position}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold underline text-slate-900 uppercase">
                        {sig1Name}
                      </p>
                      <p className="text-[11px] text-slate-600 font-mono">
                        {sig1Nip ? `NIP. ${sig1Nip}` : 'NIP. -'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Single Signature Layout (Right Aligned)
                <div className="flex justify-end text-xs">
                  <div className="text-center w-72 space-y-16">
                    <div>
                      <p className="text-slate-500 text-[11px] mb-0.5">
                        {location}, {signDate}
                      </p>
                      <p className="font-bold uppercase text-slate-900">
                        {sig1Position}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold underline text-slate-900 uppercase">
                        {sig1Name}
                      </p>
                      <p className="text-[11px] text-slate-600 font-mono">
                        {sig1Nip ? `NIP. ${sig1Nip}` : 'NIP. -'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signatory Master Manager Modal */}
      <SignatoryManagerModal
        isOpen={isSignatoryManagerOpen}
        onClose={() => setIsSignatoryManagerOpen(false)}
        onSelectSignatory={(sel) => {
          handleSelectSig1(sel.id);
        }}
      />
    </div>
  );
};
