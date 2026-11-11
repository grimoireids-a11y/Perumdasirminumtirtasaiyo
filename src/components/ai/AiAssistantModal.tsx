import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, Copy, Check, ShieldAlert, FileText } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledContext?: {
    action?: 'formulate_5c' | 'suggest_mitigation' | 'fraud_red_flags';
    title?: string;
    unitName?: string;
    facts?: string;
    procedure?: string;
    event?: string;
    cause?: string;
    impactDesc?: string;
    inherentScore?: number;
    inherentLevel?: string;
    existingControl?: string;
    suspectedModus?: string;
    chronology?: string;
  };
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  prefilledContext,
}) => {
  const [activeMode, setActiveMode] = useState<'formulate_5c' | 'suggest_mitigation' | 'fraud_red_flags' | 'free_prompt'>(
    prefilledContext?.action || 'formulate_5c'
  );
  const [promptInput, setPromptInput] = useState('');
  const [responseOutput, setResponseOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync context when opened or changed
  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (prefilledContext?.action) {
        setActiveMode(prefilledContext.action);
      }
      if (prefilledContext?.facts) {
        setPromptInput(prefilledContext.facts);
      } else if (prefilledContext?.event) {
        setPromptInput(prefilledContext.event);
      } else if (prefilledContext?.suspectedModus) {
        setPromptInput(prefilledContext.suspectedModus);
      } else if (prefilledContext?.title) {
        setPromptInput(`Analisis objek: ${prefilledContext.title} (${prefilledContext.unitName || 'Unit BUMD'})`);
      }
    }
  }, [isOpen, prefilledContext]);

  if (!isOpen) return null;

  const quickTemplates = [
    {
      label: 'Temuan Piutang Rekening Air Macet',
      mode: 'formulate_5c' as const,
      text: 'Ditemukan saldo piutang rekening air pelanggan non-aktif menumpuk selama > 12 bulan sebesar Rp 145.000.000 pada Cabang Lubuk Sikaping tanpa ada upaya penagihan aktif, pemutusan sambungan fisik, atau usulan penghapusbukuan piutang sesuai Perbup.',
    },
    {
      label: 'Mitigasi Tingkat Kehilangan Air (NRW > 35%)',
      mode: 'suggest_mitigation' as const,
      text: 'Tingkat kehilangan air fisik dan komersial (Non-Revenue Water) mencapai 38,4%, melebihi ambang batas toleransi BPKP (20%), akibat kebocoran pipa transmisi tua dan water meter pelanggan yang rusak/tidak tera.',
    },
    {
      label: 'Indikasi Fraud Kasir Pembayaran Rekening',
      mode: 'fraud_red_flags' as const,
      text: 'Penerimaan pembayaran kasir loket tidak segera disetorkan ke rekening bank pada hari yang sama (lapping cash), selisih rekapitulasi harian kasir fisik dengan sistem billing mencapai Rp 28.500.000.',
    },
    {
      label: 'Konsultasi Pengawasan BPKP & SPIP',
      mode: 'free_prompt' as const,
      text: 'Bagaimana langkah prioritas SPI Perumda Air Minum Tirta Saiyo dalam mendongkrak skor maturitas SPIP dari level Berkembang (2) menuju level Terdefinisi (3)?',
    },
  ];

  const handleApplyTemplate = (tmpl: typeof quickTemplates[0]) => {
    setActiveMode(tmpl.mode);
    setPromptInput(tmpl.text);
    setErrorMsg('');
  };

  const handleExecute = async () => {
    setLoading(true);
    setErrorMsg('');
    setResponseOutput('');

    try {
      const payload: Record<string, any> = { ...prefilledContext };

      if (activeMode === 'free_prompt') {
        payload.customPrompt = promptInput || 'Berikan panduan pengawasan intern BUMD Air Minum berbasis risiko.';
      } else if (activeMode === 'formulate_5c') {
        payload.facts = promptInput || payload.facts || 'Pengujian fisik kas dan catatan pembukuan piutang rekening air.';
      } else if (activeMode === 'suggest_mitigation') {
        payload.event = promptInput || payload.event || 'Tingkat kehilangan air (NRW) melebihi batas toleransi teknis.';
      } else if (activeMode === 'fraud_red_flags') {
        payload.suspectedModus = promptInput || payload.suspectedModus || 'Perbedaan pencatatan meter fisik dengan rekening cetak.';
      }

      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: activeMode, payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses permintaan analisis AI.');
      }

      setResponseOutput(data.text);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0d3824] to-[#105234] text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/30 ring-1 ring-emerald-400/40">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Asisten Analisis AI SPI
                <span className="text-[10px] font-medium bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                Pemberi rekomendasi metodologi & mitigasi risiko BUMD Air Minum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveMode('formulate_5c')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeMode === 'formulate_5c'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formulasi Temuan 5C</span>
          </button>
          <button
            onClick={() => setActiveMode('suggest_mitigation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeMode === 'suggest_mitigation'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rencana Mitigasi Risiko</span>
          </button>
          <button
            onClick={() => setActiveMode('fraud_red_flags')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeMode === 'fraud_red_flags'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Red Flags & Investigasi</span>
          </button>
          <button
            onClick={() => setActiveMode('free_prompt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeMode === 'free_prompt'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Tanya Bebas GCG/SPIP</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {/* Quick Scenario Templates */}
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Studi Kasus Pengawasan BUMD Pasaman Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 rounded-md transition-colors text-slate-700 text-left"
                >
                  ⚡ {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {activeMode === 'formulate_5c'
                ? 'Catatan Fakta Pemeriksaan KKA / Uraian Temuan Awal:'
                : activeMode === 'suggest_mitigation'
                ? 'Uraian Peristiwa Risiko & Pengendalian yang Ada:'
                : activeMode === 'fraud_red_flags'
                ? 'Uraian Dugaan Modus / Indikasi Masalah Lapangan:'
                : 'Pertanyaan atau Masalah Pengawasan yang Ingin Dikonsultasikan:'}
            </label>
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Ketik catatan audit atau konteks di sini, lalu klik 'Analisis dengan AI'..."
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExecute}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Analisis dengan AI</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* AI Result Box */}
          {responseOutput && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Hasil Rekomendasi & Analisis AI:
                </span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Hasil</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap max-h-72 overflow-y-auto">
                {responseOutput}
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Asistensi AI bertujuan memperkuat telaah auditor internal. Keputusan final dan persetujuan tetap wewenang mandiri Kepala SPI & Auditor penanggung jawab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
