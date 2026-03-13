
import React from 'react';

interface SiteInfoOverlayProps {
  data: Record<string, string>;
  onClose: () => void;
}

const SiteInfoOverlay: React.FC<SiteInfoOverlayProps> = ({ data, onClose }) => {
  return (
    <div className="fixed top-8 right-8 z-[50] w-[450px] max-h-[calc(100vh-80px)] overflow-y-auto bg-white border-2 border-gray-400 shadow-2xl no-print animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-red-500 hover:text-white rounded-full transition-all text-xs font-bold"
      >
        ✕
      </button>

      {/* Header */}
      <div className="bg-[#e0e0e0] p-3 border-b border-gray-400">
        <h2 className="text-[0.9rem] font-black text-gray-800 uppercase tracking-wider">
          Site Information
        </h2>
      </div>

      {/* Information Table */}
      <div className="p-0">
        <table className="w-full text-[0.65rem] border-collapse">
          <tbody>
            {Object.entries(data).map(([key, value]) => (
              <tr key={key} className="border-b border-gray-300 last:border-0 hover:bg-gray-50">
                <td className="p-2.5 font-bold text-gray-600 uppercase w-1/2 border-r border-gray-300 bg-gray-50/50">
                  {key}
                </td>
                <td className="p-2.5 text-gray-800 font-medium">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Branding */}
      <div className="p-2 bg-gray-100 border-t border-gray-300 text-center">
        <div className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">
          Source: NYC ZOLA / DoB Records
        </div>
      </div>
    </div>
  );
};

export default SiteInfoOverlay;
