import React from 'react';
import { LotConfig, LotType, StreetWidth, ZoningParams } from '../types.ts';
import Visualizer3D from './Visualizer3D.tsx';

interface VisualizerProps {
  config: LotConfig;
  activeZoning: ZoningParams;
  calculations: {
    maxCovPct: number;
    zfa: number;
    units: number;
  };
}

const Visualizer: React.FC<VisualizerProps> = ({ config, activeZoning, calculations }) => {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#2c3e50] rounded-lg overflow-hidden relative h-[350px] border border-gray-800 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 left-4 text-[0.65rem] font-bold text-white/70 uppercase tracking-widest z-10">Section (Zoning Envelope)</div>
          <SectionSVG config={config} activeZoning={activeZoning} />
          <div className="absolute bottom-4 w-full text-center text-[0.55rem] text-white/50 italic">Habitable space must be within Max Height.</div>
        </div>

        <div className="bg-[#2c3e50] rounded-lg overflow-hidden relative h-[350px] border border-gray-800 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 left-4 text-[0.65rem] font-bold text-white/70 uppercase tracking-widest z-10">2D Plan (Footprint)</div>
          <PlanSVG config={config} activeZoning={activeZoning} calculations={calculations} />
        </div>
      </div>

      <div className="bg-[#2c3e50] rounded-lg overflow-hidden relative h-[450px] border border-gray-800 flex flex-col shadow-inner">
        <div className="absolute top-4 left-4 text-[0.65rem] font-bold text-white/70 uppercase tracking-widest z-10 pointer-events-none">
          Interactive 3D Massing (Property + Volume)
        </div>
        <Visualizer3D config={config} activeZoning={activeZoning} calculations={calculations} />
        <div className="absolute bottom-4 left-4 text-[0.6rem] text-white/30 uppercase tracking-tighter pointer-events-none">
          SWA ARCHITECTURAL VISUALIZATION ENGINE V1.0
        </div>
      </div>
    </div>
  );
};

const SectionSVG: React.FC<{ config: LotConfig; activeZoning: ZoningParams }> = ({ config, activeZoning }) => {
  const safeMin = Number(activeZoning.b_min) || 0;
  const safeMax = Number(activeZoning.b_max) || 30;
  const safeH = Number(activeZoning.h) || 300;
  const isWide = config.streetWidth === StreetWidth.WIDE;

  const groundY = 320;
  const startX = 60;
  
  let scale = 2.0;
  if (safeH > 100) scale = 1.5;
  if (safeH > 200) scale = 0.8;
  if (safeH > 300) scale = 0.6;

  const pMin = safeMin * scale;
  const pBase = safeMax * scale;
  const pTotal = safeH * scale;
  const pSetback = (isWide ? 10 : 15) * scale;
  const bldgW = 140;

  const pathD = `M ${startX} ${groundY} L ${startX} ${groundY - pBase} L ${startX + pSetback} ${groundY - pBase} L ${startX + pSetback} ${groundY - pTotal} L ${startX + bldgW} ${groundY - pTotal} L ${startX + bldgW} ${groundY} Z`;

  return (
    <svg viewBox="0 0 300 400" className="w-full h-full max-h-[300px]">
      <path d={pathD} fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
      {safeMin > 0 && (
        <>
          <line x1={startX - 10} y1={groundY - pMin} x2={startX + bldgW + 10} y2={groundY - pMin} stroke="#f39c12" strokeDasharray="4" />
          <text x="5" y={groundY - pMin - 2} fill="#f39c12" fontSize="9" fontWeight="bold">Min Base: {safeMin}'</text>
        </>
      )}
      {config.isOverlay && (
        <>
          <rect x={startX} y={groundY - 15 * scale} width={bldgW} height={15 * scale} fill="#0088bb" opacity="0.6" stroke="#0088bb" />
          <text x={startX + 10} y={groundY - (15 * scale / 2) + 4} fill="white" fontSize="10" fontWeight="bold">COMMERCIAL</text>
        </>
      )}
      <rect 
        x={startX + pSetback + 35} 
        y={groundY - pTotal - (15 * scale)} 
        width={30 * scale} 
        height={15 * scale} 
        fill="rgba(255,255,255,0.1)" 
        stroke="rgba(255,255,255,0.5)" 
        strokeDasharray="2" 
      />
      <text x={startX + pSetback + 20} y={groundY - pTotal - (15 * scale) - 5} fill="rgba(255,255,255,0.7)" fontSize="9">Mech. Bulkhead</text>
      <line x1="0" y1={groundY} x2="300" y2={groundY} stroke="white" />
      <text x="10" y={groundY + 20} fill="#bdc3c7" fontSize="11">Street Line</text>
      <text x="5" y={groundY - pBase - 2} fill="white" fontSize="11">Max Base: {safeMax}'</text>
      <text x={startX + bldgW + 10} y={groundY - pTotal + 5} fill="#2ecc71" fontSize="11" fontWeight="bold">Max: {safeH}'</text>
    </svg>
  );
};

const PlanSVG: React.FC<{ config: LotConfig; activeZoning: ZoningParams; calculations: any }> = ({ config, activeZoning, calculations }) => {
  const { width, depth } = config;
  const isCorner = config.lotType === LotType.CORNER;
  const maxCov = calculations.maxCovPct;
  const wallReq = activeZoning.wall;
  const frontY = activeZoning.fy;

  const availSize = 240;
  const maxDim = Math.max(width, depth);
  const scale = availSize / maxDim;
  
  const drawW = width * scale;
  const drawD = depth * scale;
  const offsetX = (300 - drawW) / 2;
  const offsetY = (300 - drawD) / 2;

  const rearFt = isCorner ? 0 : 30;
  const rearPx = rearFt * scale;
  const frontPx = frontY * scale;
  
  let buildD = drawD - rearPx - frontPx;
  let buildD_cov = (drawW * drawD * maxCov) / drawW;
  let finalBuildD = Math.min(buildD, buildD_cov);
  if (finalBuildD < 0) finalBuildD = 0;

  const frontPct = parseFloat(wallReq) || 0;
  const reqW = drawW * (frontPct / 100);

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
      <rect x={offsetX} y={offsetY} width={drawW} height={drawD} fill="none" stroke="white" strokeWidth="2" />
      <rect 
        x={offsetX} 
        y={offsetY + drawD - frontPx - finalBuildD} 
        width={drawW} 
        height={finalBuildD} 
        fill="rgba(0, 136, 187, 0.5)" 
        stroke="#0088bb" 
      />
      {frontPx > 0 && (
        <rect x={offsetX} y={offsetY + drawD - frontPx} width={drawW} height={frontPx} fill="rgba(46, 204, 113, 0.3)" />
      )}
      {frontPct > 0 && (
        <line x1={offsetX} y1={offsetY + drawD} x2={offsetX + reqW} y2={offsetY + drawD} stroke="#f1c40f" strokeWidth="4" />
      )}
      <text x="150" y="290" fill="#bdc3c7" textAnchor="middle" fontSize="11">Front (Street)</text>
      {!isCorner && <text x="150" y={offsetY + 15} fill="#e74c3c" textAnchor="middle" fontSize="11">Rear Yard 30'</text>}
      <text x="150" y={offsetY - 5} fill="white" textAnchor="middle" fontSize="11">{width}'</text>
      <text x={offsetX - 15} y="150" fill="white" textAnchor="middle" transform={`rotate(-90, ${offsetX - 15}, 150)`} fontSize="11">{depth}'</text>
      <text x={offsetX + drawW/2} y={offsetY + drawD - frontPx - finalBuildD/2} fill="white" textAnchor="middle" fontSize="10" fontWeight="bold">
        {Math.round(finalBuildD / scale)}' Depth
      </text>
    </svg>
  );
};

export default Visualizer;