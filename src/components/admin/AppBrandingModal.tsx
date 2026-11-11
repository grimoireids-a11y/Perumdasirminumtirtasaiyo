import React from 'react';
import { X } from 'lucide-react';
import { AppBrandingModule } from './AppBrandingModule';

interface AppBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppBrandingModal: React.FC<AppBrandingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-100 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-[#0a2f1c] text-white px-6 py-4 flex items-center justify-between border-b border-emerald-900/40 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Ganti Logo, Nama Aplikasi & Nama Kantor
            </h3>
            <p className="text-[11px] text-emerald-300">
              Otorisasi Khusus Kepala Satuan Pengawasan Intern (SPI)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <AppBrandingModule />
        </div>
      </div>
    </div>
  );
};
