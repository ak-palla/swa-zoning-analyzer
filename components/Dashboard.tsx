import React, { useMemo } from 'react';
import { LotConfig, LotType, StreetWidth, TransitZone, ZoningParams } from '../types.ts';
import { ZONING_DB } from '../constants.ts';
import Visualizer from './Visualizer.tsx';
import FloorPlanView from './FloorPlanView.tsx';

interface DashboardProps {
  config: LotConfig;
  activeZoning: ZoningParams;
  bonusZoning: ZoningParams | null;
  onUpdate: (updates: Partial<LotConfig>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ config, activeZoning, bonusZoning, onUpdate }) => {
  const lotArea = config.width * config.depth;
  const isCorner = config.lotType === LotType.CORNER;
  const dbEntry = ZONING_DB[config.zoneKey] || { desc: 'Unknown', uses: 'N/A', base: activeZoning };

  const calculations = useMemo(() => {
    const maxCovPct = isCorner ? (activeZoning.cov_c || 0.8) : activeZoning.cov;
    const zfa = Math.floor(lotArea * activeZoning.far);
    const units = Math.floor(zfa / 680);
    
    let parkReq = 0;
    const parkRate = config.isBonus ? activeZoning.p_out : activeZoning.p_std;
    parkReq = Math.ceil(units * parkRate);
    if (parkReq < activeZoning.p_waived_limit) parkReq = 0; 
    
    if (config.transitZone === TransitZone.INNER) parkReq = 0;

    const storiesAllowedByHeight = Math.floor(activeZoning.h / config.floorHeight);
    
    const rearFt = isCorner ? 0 : 30;
    const frontY = activeZoning.fy;
    const buildD_max = Math.max(0, config.depth - rearFt - frontY);
    const buildD_cov = (lotArea * maxCovPct) / config.width;
    const finalBuildD_ft = Math.min(buildD_max, buildD_cov);
    
    return {
        zfa,
        units,
        parkReq,
        storiesAllowedByHeight,
        maxCovPct,
        finalBuildD_ft,
        sideYardRequired: (config.zoneKey.startsWith("R1") || config.zoneKey.startsWith("R2") || config.zoneKey.startsWith("R3") || config.zoneKey.startsWith("R4"))
    };
  }, [lotArea, activeZoning, config, isCorner]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label="MAX FAR"
          baseValue={activeZoning.far.toFixed(2)}
          bonusValue={bonusZoning ? bonusZoning.far.toFixed(2) : null}
          sub="FLOOR AREA RATIO"
        />
        <MetricCard
          label="BASE HEIGHT"
          baseValue={`${activeZoning.b_min || 0} - ${activeZoning.b_max} ft`}
          bonusValue={bonusZoning ? `${bonusZoning.b_min || 0} - ${bonusZoning.b_max} ft` : null}
          sub="STREET WALL RANGE"
        />
        <MetricCard
          label="MAX HEIGHT"
          baseValue={`${activeZoning.h} ft`}
          bonusValue={bonusZoning ? `${bonusZoning.h} ft` : null}
          sub="BUILDING HEIGHT"
        />
      </div>

      <div className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-gray-400">📐</span>
          <h3 className="text-[0.75rem] font-black uppercase tracking-widest text-[#2c3e50]">BULK & ENVELOPE REGULATIONS</h3>
        </div>
        <div className="overflow-x-auto border border-gray-100 rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[0.65rem] tracking-wider">Parameter</th>
                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[0.65rem] tracking-wider">Requirement</th>
                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[0.65rem] tracking-wider">Notes / Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <TableRow param="Permitted Use Groups" req={config.isOverlay ? "Use Groups 1-6" : dbEntry.uses} note={config.isOverlay ? "Mixed-Use: Retail, Service, Res & Comm Facility" : "Residential & Community Facility"} />
              <TableRow param="Street Wall / Frontage" req={activeZoning.wall} note={activeZoning.fy > 0 ? "Setback Required" : "Street Line"} />
              <TableRow param="Front Yard (Min)" req={activeZoning.fy > 0 ? `${activeZoning.fy} ft` : "None"} note="Required for Contextual Districts" />
              <TableRow param="Max Lot Coverage" req={`${Math.round(calculations.maxCovPct * 100)}%`} note={isCorner ? "Corner Lot Standard" : "Interior Lot Standard"} highlight={true} />
              <TableRow param="Rear Yard" req={isCorner ? "None" : "30 ft"} note={isCorner ? "Corner Lot Exemption" : "Required for Interior Lots"} />
              <TableRow param="Side Yards" req={calculations.sideYardRequired ? "Required" : "N/A"} note="Varies by lot width and usage" />
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-gray-400">🚌</span>
          <h3 className="text-[0.75rem] font-black uppercase tracking-widest text-[#2c3e50]">PARKING & AMENITIES</h3>
        </div>
        <div className="overflow-x-auto border border-gray-100 rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[0.65rem] tracking-wider">Zone</th>
                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[0.65rem] tracking-wider">Requirement</th>
                <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase text-[0.65rem] tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <TableRow param="Inner Transit Zone" req={`${Math.round(activeZoning.p_in * 100)}%`} note="No Parking Required" />
              <TableRow param="Outer Transit Zone" req={`${Math.round(activeZoning.p_out * 100)}%`} note="Reduced Requirement" />
              <TableRow param="Beyond Transit Zone" req={`${Math.round(activeZoning.p_std * 100)}%`} note="Standard Requirement" />
              <TableRow param="Bicycle Parking" req={activeZoning.bike} note="Required Indoor Spaces" />
              <TableRow param="Recreation Space" req={activeZoning.rec} note="Indoor/Outdoor Amenity %" />
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-12 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[#0088bb]">⚡</span>
          <h3 className="text-[0.8rem] font-black uppercase tracking-widest text-[#0088bb]">Massing Potential</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-100 p-8 rounded-xl shadow-sm space-y-6">
            <h4 className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-4">Development Summary</h4>
            <ResultRow label="Total ZFA" value={`${calculations.zfa.toLocaleString()} sf`} sub="Handbook Max" />
            <ResultRow label="Est. Dwellings" value={`${calculations.units} Units`} sub="680 sf/unit avg" />
            <ResultRow label="Max Stories" value={`${calculations.storiesAllowedByHeight} Floors`} sub={`@ ${config.floorHeight}' Height`} color="#0088bb" />
            <ResultRow label="Req. Parking" value={calculations.parkReq === 0 ? "Waived (0)" : `${calculations.parkReq} Spaces`} sub={config.isBonus ? "Bonus Waiver" : config.transitZone} color="#f39c12" />
          </div>
          <Visualizer config={config} activeZoning={activeZoning} calculations={calculations} />
        </div>
      </div>

      <div className="pt-12 border-t border-gray-200 space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-gray-400">📐</span>
          <h3 className="text-[0.8rem] font-black uppercase tracking-widest text-[#2c3e50]">Floor Plan Proposal</h3>
        </div>
        <FloorPlanView config={config} calculations={calculations} onUpdate={onUpdate} />
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; baseValue: string; bonusValue: string | null; sub: string }> = ({ label, baseValue, bonusValue, sub }) => (
  <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white">
    <div className="px-5 pt-5 pb-1">
      <div className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">{label}</div>
    </div>
    <div className="grid grid-cols-2 items-end">
      <div className="px-5 pt-1 pb-3">
        <div className="text-[0.55rem] font-bold uppercase tracking-widest text-gray-300 mb-1">Base</div>
        <div className="text-2xl font-black text-[#2c3e50] tracking-tighter whitespace-nowrap">{baseValue}</div>
      </div>
      <div className={`px-5 pt-1 pb-3 border-l-[4px] ${bonusValue ? 'border-l-[#27ae60] bg-[#f4faf8]' : 'border-l-gray-200 bg-gray-50'}`}>
        <div className={`text-[0.55rem] font-bold uppercase tracking-widest mb-1 ${bonusValue ? 'text-[#27ae60]' : 'text-gray-300'}`}>MIH / UAP</div>
        <div className={`text-2xl font-black tracking-tighter whitespace-nowrap ${bonusValue ? 'text-[#27ae60]' : 'text-gray-300'}`}>{bonusValue || '—'}</div>
      </div>
    </div>
    <div className="px-5 pb-4">
      <div className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">{sub}</div>
    </div>
  </div>
);

const TableRow: React.FC<{ param: string; req: string; note: string; highlight?: boolean }> = ({ param, req, note, highlight }) => (
  <tr className={highlight ? "bg-green-50/30" : ""}>
    <td className={`px-6 py-4 font-bold text-[#2c3e50] text-[0.85rem] ${highlight ? 'text-[#27ae60]' : ''}`}>{param}</td>
    <td className="px-6 py-4 text-[#2d3436] text-[0.85rem] font-medium">{req}</td>
    <td className="px-6 py-4 text-gray-400 text-[0.75rem] font-medium italic">{note}</td>
  </tr>
);

const ResultRow: React.FC<{ label: string; value: string; sub: string; color?: string }> = ({ label, value, sub, color = '#2c3e50' }) => (
  <div className="flex justify-between items-start border-b border-gray-50 pb-4 last:border-0 last:pb-0">
    <div className="text-[0.7rem] font-black text-gray-400 uppercase tracking-tighter">{label}</div>
    <div className="text-right">
      <div className="text-xl font-black tracking-tighter" style={{ color }}>{value}</div>
      <div className="text-[0.55rem] text-gray-400 font-black uppercase tracking-widest leading-none mt-1">{sub}</div>
    </div>
  </div>
);

export default Dashboard;