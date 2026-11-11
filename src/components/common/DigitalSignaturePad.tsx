import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Upload,
  QrCode,
  RotateCcw,
  Check,
  Trash2,
  ShieldCheck,
  Eye,
  FileCheck,
} from 'lucide-react';

interface DigitalSignaturePadProps {
  initialSignatureUrl?: string;
  officialName: string;
  officialNip: string;
  officialPosition: string;
  onSave: (signatureDataUrl: string, type: 'canvas' | 'upload' | 'qr', token: string) => void;
  onRemove?: () => void;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  initialSignatureUrl,
  officialName,
  officialNip,
  officialPosition,
  onSave,
  onRemove,
}) => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'upload' | 'qr'>('canvas');
  const [penColor, setPenColor] = useState<string>('#1e3a8a'); // Biru kedinasan
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialSignatureUrl);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [qrToken, setQrToken] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    setPreviewUrl(initialSignatureUrl);
  }, [initialSignatureUrl]);

  // Generate unique verification token
  useEffect(() => {
    const raw = `${officialNip || officialName}-${Date.now()}`;
    const token = 'SPI-DS-' + Math.abs(hashCode(raw)).toString(16).toUpperCase().padStart(8, '0');
    setQrToken(token);
  }, [officialName, officialNip]);

  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  // Canvas drawing handlers
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSaveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert('Silakan goreskan tanda tangan pada canvas terlebih dahulu.');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
    onSave(dataUrl, 'canvas', qrToken);
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar tanda tangan (PNG / JPG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file tanda tangan maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);
      onSave(dataUrl, 'upload', qrToken);
    };
    reader.readAsDataURL(file);
  };

  // QR Verification generator
  const generateQrBadge = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Header strip
    ctx.fillStyle = '#065f46';
    ctx.fillRect(4, 4, canvas.width - 8, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('VERIFIKASI TANDA TANGAN DIGITAL', 12, 20);

    // QR Simulated pattern box
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 36, 68, 68);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('QR-VERIFY', 18, 52);
    ctx.font = '8px monospace';
    ctx.fillText('SPI-SMART', 18, 68);
    ctx.fillText(qrToken.slice(0, 8), 18, 84);

    // Text Details
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px sans-serif';
    const cleanName = officialName.length > 25 ? officialName.slice(0, 24) + '...' : officialName;
    ctx.fillText(cleanName, 92, 50);

    ctx.fillStyle = '#475569';
    ctx.font = '9px sans-serif';
    ctx.fillText(`NIP. ${officialNip || '-'}`, 92, 65);

    ctx.fillStyle = '#065f46';
    ctx.font = 'italic 8px sans-serif';
    const cleanPos = officialPosition.length > 30 ? officialPosition.slice(0, 29) + '...' : officialPosition;
    ctx.fillText(cleanPos, 92, 80);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`TOKEN: ${qrToken}`, 92, 96);

    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
    onSave(dataUrl, 'qr', qrToken);
  };

  return (
    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Tanda Tangan Digital Pejabat (TTD)</span>
        </span>

        {previewUrl && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" /> TTD Aktif
          </span>
        )}
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('canvas')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all cursor-pointer ${
            activeTab === 'canvas'
              ? 'bg-white text-emerald-950 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-3.5 h-3.5 text-emerald-700" />
          <span>Gores / Gambar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-emerald-950 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-emerald-700" />
          <span>Unggah File</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-white text-emerald-950 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-700" />
          <span>Stempel Digital</span>
        </button>
      </div>

      {/* Tab 1: Canvas Drawing Pad */}
      {activeTab === 'canvas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Warna Tinta:</span>
              <button
                type="button"
                onClick={() => setPenColor('#1e3a8a')}
                className={`w-5 h-5 rounded-full bg-blue-900 ring-2 ${
                  penColor === '#1e3a8a' ? 'ring-emerald-500 scale-110' : 'ring-transparent'
                }`}
                title="Biru Kedinasan"
              />
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`w-5 h-5 rounded-full bg-slate-900 ring-2 ${
                  penColor === '#0f172a' ? 'ring-emerald-500 scale-110' : 'ring-transparent'
                }`}
                title="Hitam Resmi"
              />
              <button
                type="button"
                onClick={() => setPenColor('#065f46')}
                className={`w-5 h-5 rounded-full bg-emerald-800 ring-2 ${
                  penColor === '#065f46' ? 'ring-emerald-500 scale-110' : 'ring-transparent'
                }`}
                title="Hijau SPI"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Tebal:</span>
              <select
                value={penWidth}
                onChange={(e) => setPenWidth(parseFloat(e.target.value))}
                className="text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5"
              >
                <option value={1.8}>Tipis</option>
                <option value={2.5}>Sedang</option>
                <option value={3.5}>Tebal</option>
              </select>
            </div>
          </div>

          {/* Interactive HTML5 Canvas */}
          <div className="relative border-2 border-dashed border-emerald-400/80 rounded-xl bg-white overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={500}
              height={160}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              className="w-full h-40 touch-none cursor-crosshair block"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                Sentuh layar atau tahan klik mouse di sini untuk membuat tanda tangan...
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bersihkan Pad</span>
            </button>

            <button
              type="button"
              onClick={handleSaveCanvas}
              disabled={!hasDrawn}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Goresan TTD</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Upload Image File */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <label className="block border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-white cursor-pointer transition-colors group">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Klik untuk unggah file gambar tanda tangan
              </p>
              <p className="text-[11px] text-slate-500">
                Disarankan format PNG transparan atau JPG bersih (Maksimal 2 MB)
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Tab 3: Generated Digital QR Seal */}
      {activeTab === 'qr' && (
        <div className="space-y-3 text-center bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Stempel Digital Verifikasi Keabsahan Naskah Dinas
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Otomatis menghasilkan stempel tanda tangan tersertifikasi SPI SMART lengkap dengan nama, NIP, jabatan, dan kode token unik.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-emerald-900 font-bold inline-block">
            Token Verifikasi: {qrToken}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={generateQrBadge}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Terapkan Stempel Digital Resmi Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Active Preview */}
      {previewUrl && (
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="h-16 w-32 border border-slate-200 rounded-md bg-slate-50/50 flex items-center justify-center p-1 overflow-hidden">
              <img
                src={previewUrl}
                alt={`TTD ${officialName}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-900">{officialName}</p>
              <p className="text-[11px] text-slate-500">{officialPosition}</p>
              <p className="text-[10px] text-emerald-700 font-medium">Tanda tangan siap digunakan pada cetak dokumen</p>
            </div>
          </div>

          {onRemove && (
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(undefined);
                onRemove();
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Hapus Tanda Tangan Digital"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
