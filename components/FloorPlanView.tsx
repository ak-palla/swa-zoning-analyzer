import React, { useMemo, useState } from 'react';
import { LotConfig, UnitType, FloorConfig, LotType } from '../types.ts';

interface FloorPlanViewProps {
  config: LotConfig;
  calculations: any;
  onUpdate: (updates: Partial<LotConfig>) => void;
}

const UNIT_THEMES: Record<UnitType, { color: string; bg: string }> = {
  [UnitType.STUDIO]: { color: '#0088bb', bg: 'rgba(0, 136, 187, 0.1)' },
  [UnitType.ONE_BR]: { color: '#27ae60', bg: 'rgba(39, 174, 96, 0.1)' },
  [UnitType.TWO_BR]: { color: '#f39c12', bg: 'rgba(243, 156, 18, 0.1)' },
  [UnitType.THREE_BR]: { color: '#8e44ad', bg: 'rgba(142, 68, 173, 0.1)' },
};

const FloorPlanView: React.FC<FloorPlanViewProps> = ({ config, calculations, onUpdate }) => {
  const [showAreaLabels, setShowAreaLabels] = useState(true);
  
  const [unitAreas, setUnitAreas] = useState<Record<UnitType, number>>({
    [UnitType.STUDIO]: 400,
    [UnitType.ONE_BR]: 575,
    [UnitType.TWO_BR]: 775,
    [UnitType.THREE_BR]: 950,
  });

  const [unitWidths, setUnitWidths] = useState<Record<UnitType, number>>({
    [UnitType.STUDIO]: 15,
    [UnitType.ONE_BR]: 20,
    [UnitType.TWO_BR]: 25,
    [UnitType.THREE_BR]: 30,
  });

  const currentFloorConfig = config.floorConfigs.find(f => f.floorNumber === config.selectedFloor) || config.floorConfigs[0];
  const { width, depth, streetName, selectedFloor, lotType } = config;
  const isCorner = lotType === LotType.CORNER;
  const buildDepth = calculations.finalBuildD_ft || depth;
  const buildWidth = width;
  const grossArea = buildWidth * buildDepth;
  const coreW_ft = 10;
  const coreD_ft = 22; 
  const coreArea = coreW_ft * coreD_ft; 
  const corridorWidthFt = 5;
  const isHorizontalCorridor = !isCorner;
  const corridorArea = isHorizontalCorridor ? buildWidth * corridorWidthFt : buildDepth * corridorWidthFt;
  const mechanicalDeduction = grossArea * 0.03; 
  const recreationDeduction = grossArea * 0.02; 
  const netHabitableArea = Math.max(0, grossArea - coreArea - corridorArea - mechanicalDeduction - recreationDeduction);
  const maxStories = Math.floor(calculations.storiesAllowedByHeight) || 1;

  const handleAdjustCount = (type: UnitType, delta: number) => {
    let newMix = [...currentFloorConfig.unitMix];
    if (delta > 0) {
      newMix.push(type);
    } else {
      const idx = newMix.lastIndexOf(type);
      if (idx > -1) newMix.splice(idx, 1);
    }
    const newConfigs = config.floorConfigs.map(f => 
      f.floorNumber === config.selectedFloor ? { ...f, unitMix: newMix } : f
    );
    onUpdate({ floorConfigs: newConfigs });
  };

  const handleAreaChange = (type: UnitType, value: string) => {
    const val = parseInt(value) || 0;
    setUnitAreas(prev => ({ ...prev, [type]: val }));
  };

  const handleWidthChange = (type: UnitType, value: string) => {
    const val = parseInt(value) || 0;
    setUnitWidths(prev => ({ ...prev, [type]: val }));
  };

  const unitCounts = useMemo(() => {
    return Object.values(UnitType).reduce((acc, type) => {
      acc[type] = currentFloorConfig.unitMix.filter(t => t === type).length;
      return acc;
    }, {} as Record<UnitType, number>);
  }, [currentFloorConfig.unitMix]);

  const totalAllocatedArea = currentFloorConfig.unitMix.reduce((sum, type) => sum + unitAreas[type], 0);
  const areaDifference = netHabitableArea - totalAllocatedArea;
  const isOverCapacity = areaDifference < 0;

  const svgW = 750;
  const svgH = 750; 
  const padding = 70; 
  const maxDim = Math.max(buildWidth, buildDepth);
  const scale = (svgW - padding * 2) / maxDim;
  const bW = buildWidth * scale;
  const bD = buildDepth * scale;
  const cW = coreW_ft * scale;
  const cD = coreD_ft * scale;
  const hSize = corridorWidthFt * scale;
  const buildingX = (svgW - bW) / 2;
  const buildingY = (svgH - bD) / 2;
  const unitsToRender = currentFloorConfig.unitMix;

  const renderedUnits = useMemo(() => {
    let cursorFront = 0;
    let cursorBack = 0;
    let cursorSide = 0;
    let cursorInterior = 0;
    return unitsToRender.map((type, idx) => {
      let uX, uY, unitW, unitH;
      const specW = unitWidths[type] * scale;
      if (isHorizontalCorridor) {
        const isFrontZone = idx % 2 === 0;
        unitW = specW;
        unitH = (bD - hSize) / 2;
        if (isFrontZone) {
          uX = cursorFront;
          uY = bD - unitH;
          cursorFront += unitW;
        } else {
          uX = cursorBack;
          uY = 0;
          cursorBack += unitW;
        }
      } else {
        const isSideZone = idx % 2 === 0;
        unitW = (bW - hSize) / 2;
        unitH = specW;
        if (isSideZone) {
          uX = 0;
          uY = cursorSide;
          cursorSide += unitH;
        } else {
          uX = (bW + hSize) / 2;
          uY = cursorInterior;
          cursorInterior += unitH;
        }
      }
      return { type, uX, uY, unitW, unitH };
    });
  }, [unitsToRender, unitWidths, isHorizontalCorridor, bW, bD, hSize, scale]);

  const getAutoFontSize = (uW: number, uH: number, text: string) => {
    const charCount = text.length || 1;
    const widthConstraint = (uW * 0.9) / (charCount * 0.55);
    const heightConstraint = uH * 0.3;
    return Math.max(9, Math.min(widthConstraint, heightConstraint, 24));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col md:flex-row">
      <div className="flex-1 p-6 border-r border-gray-100 bg-[#f8fafc]">
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <h4 className="text-[0.7rem] font-black text-gray-400 uppercase tracking-widest">
                Level {selectedFloor} Plan
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-[0.6rem] font-bold text-gray-400 uppercase">Level:</label>
                <select 
                  value={selectedFloor}
                  onChange={(e) => onUpdate({ selectedFloor: parseInt(e.target.value) })}
                  className="bg-white border border-gray-200 rounded px-2 py-1 text-[0.65rem] font-black outline-none cursor-pointer hover:border-[#0088bb] shadow-sm"
                >
                  {Array.from({ length: maxStories }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Story {i + 1}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showAreaLabels}
                  onChange={(e) => setShowAreaLabels(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#0088bb] focus:ring-[#0088bb]"
                />
                <span className="text-[0.6rem] font-black text-gray-400 uppercase">Labels</span>
              </label>
            </div>
            <div className="flex gap-2 items-center p-2.5 bg-green-50 border border-green-200 rounded-lg shadow-sm">
              {Object.values(UnitType).map(type => (
                <div key={type} className="flex flex-col gap-1.5 border-r border-green-100 last:border-0 pr-3 last:pr-0">
                  <span className="text-[0.65rem] font-black text-green-600 uppercase text-center">{type}</span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.5rem] font-bold text-gray-400 uppercase">Area</span>
                      <input 
                        type="number"
                        value={unitAreas[type]}
                        onChange={(e) => handleAreaChange(type, e.target.value)}
                        className="w-16 md:w-20 p-1.5 text-[0.7rem] font-black border border-green-100 rounded focus:border-[#27ae60] outline-none text-center bg-white shadow-sm"
                        placeholder="SF"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.5rem] font-bold text-gray-400 uppercase">Width</span>
                      <input 
                        type="number"
                        value={unitWidths[type]}
                        onChange={(e) => handleWidthChange(type, e.target.value)}
                        className="w-16 md:w-20 p-1.5 text-[0.7rem] font-black border border-green-100 rounded focus:border-[#27ae60] outline-none text-center bg-white shadow-sm"
                        placeholder="FT"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.values(UnitType).map(type => (
              <div key={type} className="flex items-center bg-white border border-gray-200 rounded px-2 py-1 shadow-sm">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: UNIT_THEMES[type].color }}></div>
                <span className="text-[0.6rem] font-black mr-2 text-gray-400 uppercase">{type}</span>
                <button 
                  onClick={() => handleAdjustCount(type, -1)}
                  className="w-5 h-5 flex items-center justify-center bg-gray-50 hover:bg-gray-200 rounded text-[0.7rem] font-black transition-colors"
                >-</button>
                <span className="mx-2 text-[0.7rem] font-black w-3 text-center">{unitCounts[type]}</span>
                <button 
                  onClick={() => handleAdjustCount(type, 1)}
                  className="w-5 h-5 flex items-center justify-center bg-[#0088bb] text-white hover:bg-[#0077aa] rounded text-[0.7rem] font-black transition-colors"
                >+</button>
              </div>
            ))}
          </div>
        </div>
        <div className="relative bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 min-h-[720px] shadow-inner overflow-hidden">
          {isOverCapacity && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#e74c3c] text-white text-[0.65rem] font-black uppercase px-4 py-1.5 rounded-full z-10 shadow-xl animate-pulse ring-4 ring-red-100">
              ⚠️ AREA OVERLOAD
            </div>
          )}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-[720px]">
            <line x1={buildingX} y1={buildingY + bD + 35} x2={buildingX + bW} y2={buildingY + bD + 35} stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="10,5" />
            <text x={svgW/2} y={buildingY + bD + 60} textAnchor="middle" className="text-[20px] font-black fill-[#64748b] uppercase tracking-[0.4em]">{streetName}</text>
            {isCorner && (
               <>
                 <line x1={buildingX - 35} y1={buildingY} x2={buildingX - 35} y2={buildingY + bD} stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="10,5" />
                 <text x={buildingX - 55} y={buildingY + bD/2} textAnchor="middle" transform={`rotate(-90, ${buildingX - 55}, ${buildingY + bD/2})`} className="text-[14px] font-black fill-[#64748b] uppercase tracking-[0.4em]">Side Street</text>
               </>
            )}
            <g transform={`translate(${buildingX}, ${buildingY})`}>
                <rect width={bW} height={bD} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
                {isHorizontalCorridor ? (
                  <rect x="0" y={(bD - hSize) / 2} width={bW} height={hSize} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.5" />
                ) : (
                  <rect x={(bW - hSize) / 2} y="0" width={hSize} height={bD} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.5" />
                )}
                {renderedUnits.length > 0 && (
                  <g>
                    {renderedUnits.map((unit, idx) => {
                      const theme = UNIT_THEMES[unit.type];
                      const labelText = `${unit.type} | ${unitAreas[unit.type]} SF`;
                      const autoFontSize = getAutoFontSize(unit.unitW, unit.unitH, labelText);
                      return (
                        <g key={idx}>
                          <rect 
                            x={unit.uX} 
                            y={unit.uY} 
                            width={unit.unitW} 
                            height={unit.unitH} 
                            fill={theme.bg} 
                            stroke={theme.color} 
                            strokeWidth="2.5" 
                            strokeOpacity="0.8" 
                          />
                          {showAreaLabels && (
                            <text 
                              x={unit.uX + unit.unitW / 2} 
                              y={unit.uY + unit.unitH / 2} 
                              textAnchor="middle" 
                              alignmentBaseline="central"
                              fill={theme.color} 
                              fontSize={autoFontSize} 
                              fontWeight="900" 
                              className="uppercase pointer-events-none drop-shadow-sm font-sans"
                            >
                              {labelText}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}
                <rect x={(bW - cW) / 2} y={(bD - cD) / 2} width={cW} height={cD} fill="#1e293b" rx="2" stroke="#0f172a" strokeWidth="2.5" />
                <text 
                  x={bW/2} 
                  y={bD/2} 
                  textAnchor="middle" 
                  alignmentBaseline="central"
                  fill="white" 
                  fontSize={Math.min(cW * 0.25, 20)} 
                  fontWeight="900" 
                  className="tracking-widest"
                >
                  CORE
                </text>
            </g>
          </svg>
        </div>
      </div>
      <div className="w-full md:w-[340px] p-6 bg-white border-l border-gray-100 flex flex-col">
        <h4 className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-6">Yield Summary</h4>
        <div className="space-y-5 flex-1">
          <Metric label="Gross Area" value={`${Math.round(grossArea).toLocaleString()} SF`} />
          <Metric label="Zoning Core" value={`- ${coreArea} SF`} color="#e74c3c" sub="10' x 22' Fixed Core" />
          <Metric label="Public Circulation" value={`- ${Math.round(corridorArea)} SF`} color="#e74c3c" sub={isHorizontalCorridor ? 'Main Corridor' : 'Entry/Side Lobby'} />
          <Metric label="Deductions" value={`- ${Math.round(mechanicalDeduction + recreationDeduction)} SF`} color="#e74c3c" sub="5% Standard Buffer" />
          <div className="pt-5 border-t border-gray-100 mt-2">
            <Metric label="Net Efficiency" value={`${Math.round(netHabitableArea).toLocaleString()} SF`} bold />
            <Metric label="Design Layout" value={`${Math.round(totalAllocatedArea).toLocaleString()} SF`} sub={`${currentFloorConfig.unitMix.length} Units Modeled`} color={isOverCapacity ? '#e74c3c' : '#27ae60'} />
          </div>
          <div className={`p-4 rounded-lg border-2 mt-4 transition-all ${isOverCapacity ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-green-50 border-green-200 shadow-sm'}`}>
            <div className={`text-[0.6rem] font-black uppercase tracking-widest mb-0.5 ${isOverCapacity ? 'text-red-600' : 'text-green-600'}`}>
              {isOverCapacity ? 'Layout Violation' : 'Net Margin'}
            </div>
            <div className="text-xl font-black text-slate-800 tracking-tighter">
              {Math.abs(Math.round(areaDifference)).toLocaleString()} SF
              <span className="text-[0.55rem] font-black uppercase ml-1.5 text-slate-400">
                {isOverCapacity ? 'Over' : 'Available'}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div className="text-[0.6rem] font-black text-slate-400 uppercase mb-1">Floor Plan Efficiency</div>
          <div className="text-3xl font-black text-slate-800 tracking-tighter">
            {Math.round((netHabitableArea / grossArea) * 100)}%
          </div>
          <div className="text-[0.55rem] text-slate-400 font-bold uppercase mt-1">ZFA-to-Gross Percentage</div>
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; color?: string; bold?: boolean; sub?: string }> = ({ label, value, color = '#334155', bold, sub }) => (
  <div className="flex justify-between items-start">
    <div className="text-[0.65rem] font-black text-slate-400 uppercase tracking-tighter">{label}</div>
    <div className="text-right">
      <div className={`${bold ? 'text-lg font-black' : 'text-[0.85rem] font-black'}`} style={{ color }}>{value}</div>
      {sub && <div className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{sub}</div>}
    </div>
  </div>
);

export default FloorPlanView;