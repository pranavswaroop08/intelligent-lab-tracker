import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, Check } from 'lucide-react';

export default function QRModal({ title, subtitle, token, details = {}, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0b3c68] text-white">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#13b5ea]"></span>
              {title || 'Digital Asset QR Token'}
            </h3>
            <p className="text-xs text-slate-300">{subtitle || 'Scan for live SDS, audit trail & specifications'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Body / Printable Card */}
        <div ref={printRef} className="p-6 flex flex-col items-center text-center">
          <div className="p-4 bg-white rounded-xl shadow-md border border-slate-200 flex flex-col items-center">
            <QRCodeSVG
              value={token || 'https://pes.edu'}
              size={180}
              level="H"
              includeMargin={true}
            />
            <div className="mt-2 text-slate-900 font-mono text-xs font-bold tracking-wider">
              {token}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              PES University Lab Systems
            </div>
          </div>

          {/* Details Pill grid */}
          <div className="w-full mt-6 space-y-2 text-left bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
            {Object.entries(details).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">{val || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Token' : 'Copy Code'}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#13b5ea] hover:bg-[#0da1d2] rounded-md shadow-md transition uppercase tracking-wider"
          >
            <Printer className="w-4 h-4" />
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
