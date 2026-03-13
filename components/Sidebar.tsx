import React from 'react';
import { ZONING_DB } from '../constants.ts';
import { LotConfig, LotType, StreetWidth, DormerMode } from '../types.ts';
import MapPanel from './MapPanel.tsx';

interface SidebarProps {
  config: LotConfig;
  onUpdate: (updates: Partial<LotConfig>) => void;
  onPrint: () => void;
  isExporting?: boolean;
  lotGeometry?: any;
  bbl?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ config, onUpdate, onPrint, isExporting, lotGeometry, bbl }) => {
  return (
    <aside className="no-print w-full md:w-[340px] bg-white border-r border-gray-200 p-8 overflow-y-auto flex flex-col z-10 shadow-lg">
      <div className="mb-6 border-b-2 border-[#2c3e50] pb-4">
        <div className="font-black text-6xl text-[#0088bb] leading-[0.8] tracking-[-4px] uppercase select-none">SWA</div>
        <div className="text-[0.7rem] font-bold text-gray-400 tracking-[2px] uppercase mt-2">Zoning Research</div>
      </div>

      <div className="mb-6">
        <MapPanel geometry={lotGeometry} bbl={bbl} />
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[0.65rem] uppercase font-bold text-[#34495e] tracking-wider">Street Name</label>
          <input 
            type="text"
            placeholder="e.g. Broadway"
            className="w-full p-3 border border-gray-300 rounded focus:border-[#0088bb] outline-none text-sm font-bold"
            value={config.streetName}
            onChange={(e) => onUpdate({ streetName: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[0.65rem] uppercase font-bold text-[#34495e] tracking-wider">1. Zoning District</label>
          <select 
            className="w-full p-3 border border-gray-300 rounded focus:border-[#0088bb] focus:ring-1 focus:ring-[#0088bb] outline-none transition-all text-sm font-bold"
            value={config.zoneKey}
            onChange={(e) => onUpdate({ zoneKey: e.target.value })}
          >
            {Object.keys(ZONING_DB).map(key => (
              <option key={key} value={key}>{key} - {ZONING_DB[key].desc}</option>
            ))}
          </select>
        </div>


        <div className="space-y-1">
          <label className="text-[0.65rem] uppercase font-bold text-[#34495e] tracking-wider">2. Lot Geometry</label>
          <select 
            className="w-full p-3 border border-gray-300 rounded focus:border-[#0088bb] outline-none text-sm"
            value={config.lotType}
            onChange={(e) => onUpdate({ lotType: e.target.value as LotType })}
          >
            <option value={LotType.INTERIOR}>Interior Lot</option>
            <option value={LotType.CORNER}>Corner Lot</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[0.65rem] uppercase font-bold text-[#34495e] tracking-wider">Width (ft)</label>
            <input 
              type="number"
              className="w-full p-3 border border-gray-300 rounded focus:border-[#0088bb] outline-none text-sm font-bold"
              value={config.width}
              onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[0.65rem] uppercase font-bold text-[#34495e] tracking-wider">Depth (ft)</label>
            <input 
              type="number"
              className="w-full p-3 border border-gray-300 rounded focus:border-[#0088bb] outline-none text-sm font-bold"
              value={config.depth}
              onChange={(e) => onUpdate({ depth: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[0.65rem] uppercase font-bold text-[#34495e] tracking-wider">Street Width</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded focus:border-[#0088bb] outline-none text-sm"
              value={config.streetWidth}
              onChange={(e) => onUpdate({ streetWidth: e.target.value as StreetWidth })}
            >
              <option value={StreetWidth.WIDE}>Wide (≥ 75ft)</option>
              <option value={StreetWidth.NARROW}>Narrow (&lt; 75ft)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[0.65rem] uppercase font-bold text-[#34495e] tracking-wider">Floor Ht (ft)</label>
            <input 
              type="number"
              className="w-full p-3 border border-gray-300 rounded focus:border-[#0088bb] outline-none text-sm"
              value={config.floorHeight}
              onChange={(e) => onUpdate({ floorHeight: parseInt(e.target.value) || 10 })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[0.65rem] uppercase font-bold text-[#34495e] tracking-wider">Dormer Control</label>
          <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded border border-gray-200 shadow-inner">
            <button 
              onClick={() => onUpdate({ dormerMode: DormerMode.NONE })}
              className={`p-2 rounded text-[0.6rem] font-black uppercase transition-all ${config.dormerMode === DormerMode.NONE ? 'bg-white shadow text-[#0088bb]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              None
            </button>
            <button 
              onClick={() => onUpdate({ dormerMode: DormerMode.DORMER_40 })}
              className={`p-2 rounded text-[0.6rem] font-black uppercase transition-all ${config.dormerMode === DormerMode.DORMER_40 ? 'bg-white shadow text-[#0088bb]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              40%
            </button>
            <button 
              onClick={() => onUpdate({ dormerMode: DormerMode.DORMER_60 })}
              className={`p-2 rounded text-[0.6rem] font-black uppercase transition-all ${config.dormerMode === DormerMode.DORMER_60 ? 'bg-white shadow text-[#0088bb]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              60'
            </button>
          </div>
        </div>

        <hr className="my-6 border-gray-100" />

        <div className="space-y-3">
          <button 
            onClick={() => onUpdate({ isOverlay: !config.isOverlay })}
            className={`w-full flex items-center justify-between p-3 rounded border transition-all ${config.isOverlay ? 'bg-[#eaf6fc] border-[#0088bb]' : 'bg-gray-50 border-gray-200 hover:bg-[#eaf6fc]'}`}
          >
            <div className="text-left">
              <div className="font-bold text-sm text-[#2d3436]">Commercial Overlay</div>
              <div className="text-[0.6rem] text-[#0088bb] uppercase">Mixed-Use Overlay</div>
            </div>
            <div className={`w-9 h-5 rounded-full relative transition-colors ${config.isOverlay ? 'bg-[#0088bb]' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${config.isOverlay ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </button>
        </div>

        <button 
          onClick={onPrint}
          disabled={isExporting}
          className={`w-full bg-[#2c3e50] text-white p-4 rounded font-bold uppercase tracking-wider text-xs hover:bg-[#0088bb] transition-all flex items-center justify-center gap-2 mt-4 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isExporting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Rendering PDF...
            </span>
          ) : (
            <><span>📄</span> Download Analysis</>
          )}
        </button>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100 text-center">
        <div className="inline-block bg-white border border-gray-200 px-3 py-1.5 rounded-full text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
          DESIGNED BY <span className="text-[#0088bb]">ASKAR & GD</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;