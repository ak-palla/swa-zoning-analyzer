import React, { useState, useMemo } from 'react';
import { ZONING_DB } from './constants.ts';
import { LotConfig, LotType, StreetWidth, TransitZone, ZoningParams, UnitType, FloorConfig, DormerMode } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import SiteInfoOverlay from './components/SiteInfoOverlay.tsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [lotGeometry, setLotGeometry] = useState<any>(null);
  const [selectedBbl, setSelectedBbl] = useState<string | undefined>();

  const initialFloorConfigs: FloorConfig[] = Array.from({ length: 25 }, (_, i) => ({
    floorNumber: i + 1,
    unitMix: [UnitType.ONE_BR, UnitType.ONE_BR] 
  }));

  const [config, setConfig] = useState<LotConfig>({
    zoneKey: 'R6', 
    width: 50,     
    depth: 100,    
    lotType: LotType.INTERIOR,
    streetWidth: StreetWidth.WIDE,
    transitZone: TransitZone.INNER, 
    floorHeight: 10,
    isBonus: false,
    isOverlay: false,
    dormerMode: DormerMode.NONE,
    streetName: 'Main Street',
    selectedFloor: 1,
    floorConfigs: initialFloorConfigs,
  });

  const activeZoning = useMemo((): ZoningParams => {
    const dbEntry = ZONING_DB[config.zoneKey] || ZONING_DB["R6"];
    let result = { ...dbEntry.base };

    if (config.streetWidth === StreetWidth.WIDE) {
        if (result.far_wide) result.far = result.far_wide;
        if (result.h_wide) result.h = result.h_wide;
        if (result.b_max_wide) result.b_max = result.b_max_wide;
    }

    return result;
  }, [config.zoneKey, config.streetWidth]);

  const bonusZoning = useMemo((): ZoningParams | null => {
    const dbEntry = ZONING_DB[config.zoneKey] || ZONING_DB["R6"];
    if (!dbEntry.bonus) return null;
    let result = { ...dbEntry.base };

    if (config.streetWidth === StreetWidth.WIDE) {
        if (result.far_wide) result.far = result.far_wide;
        if (result.h_wide) result.h = result.h_wide;
        if (result.b_max_wide) result.b_max = result.b_max_wide;
    }

    result = { ...result, ...dbEntry.bonus };
    return result;
  }, [config.zoneKey, config.streetWidth]);

  const handleUpdate = (updates: Partial<LotConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSearch = async (address: string) => {
    if (!address.trim()) return;
    
    setIsSearching(true);
    try {
      const geoResponse = await fetch(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(address)}`);
      const geoData = await geoResponse.json();
      
      if (!geoData.features || geoData.features.length === 0) {
        throw new Error("Address not found.");
      }

      const feature = geoData.features[0];
      const props = feature.properties;
      const bbl = props.pad_bbl || props.bbl || props.addendum?.pad?.bbl;

      if (!bbl || typeof bbl !== 'string') {
        throw new Error("This location does not have a valid Tax Lot (BBL) associated with it.");
      }

      setSelectedBbl(bbl);

      const boroCode = bbl.substring(0, 1);
      const boroName = ["", "Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"][parseInt(boroCode)] || "Unknown";

      const sql = `SELECT *, ST_AsGeoJSON(the_geom) as geometry FROM mappluto WHERE bbl = '${bbl}'`;
      const plutoResponse = await fetch(`https://planninglabs.carto.com/api/v2/sql?q=${encodeURIComponent(sql)}`);
      const plutoData = await plutoResponse.json();

      if (!plutoData.rows || plutoData.rows.length === 0) {
        throw new Error("Detailed property data (PLUTO) is currently unavailable for this BBL.");
      }

      const row = plutoData.rows[0];

      if (row.geometry) {
        setLotGeometry(JSON.parse(row.geometry));
      }

      const reportData = {
        "ADDRESS": (props.label || props.name || "Unknown Address").toUpperCase(),
        "BLOCK": row.block || "N/A",
        "LOT": row.lot || "N/A",
        "COMMUNITY BOARD": row.cd ? `${boroName.toUpperCase()} COMMUNITY DISTRICT ${row.cd % 100}` : "N/A",
        "ZONING DISTRICT": (row.zonedist1 || "N/A") + (row.zonedist2 ? `, ${row.zonedist2}` : ""),
        "SPECIAL ZONING DISTRICT": row.spdist1 || "N/A",
        "ZONING MAP": row.zonemap || "N/A",
        "ZONING LOT AREA": row.lotarea ? `${Math.round(row.lotarea).toLocaleString()} SF` : "N/A",
        "USE GROUP": row.zonedist1?.startsWith('R') ? "II" : "Varies",
        "OCCUPANCY GROUP": row.bldgclass?.startsWith('D') ? "R-2" : "Varies",
        "CONSTRUCTION CLASSIFICATION": row.bldgclass || "IB (Estimated)",
        "MULTIPLE DWELLING CLASSIFICATION": "HAEA",
        "BUILDING CODE": "2022 NYC BUILDING CODE",
        "ENERGY CODE": "2020 NYC ENERGY CONSERVATION CODE",
        "ENVIRONMENTAL OER": row.e_designation ? "YES" : "N/A",
        "TRANSIT AUTHORITY MTA": "N/A",
        "MIH DESIGNATED AREA": "CHECK ZOLA MAP",
        "QUALIFYING AFFORDABLE HOUSING": "N/A",
        "LANDMARK": row.landmk ? "YES" : "N/A",
        "TRANSIT ZONE": "INNER TRANSIT ZONE", 
        "PRIMARY STRUCTURAL SYSTEM": "CAST IN PLACE CONCRETE",
        "STRUCTURAL OCCUPANCY RISK": "II",
        "SEISMIC DESIGN CATEGORY": "B",
        "STORM WATER POLLUTION PLAN": (row.lotarea && row.lotarea > 20000) ? "REQUIRED" : "N/A",
        "WASTE MANAGEMENT PLAN": "N/A"
      };

      setSiteInfo(reportData);

      if (row.lotfront && row.lotdepth) {
        handleUpdate({
          width: Math.round(row.lotfront),
          depth: Math.round(row.lotdepth),
          streetName: props.name || props.label?.split(',')[0] || "Target Site"
        });
      }

    } catch (error: any) {
      console.error("Site Analysis Error:", error);
      alert(error.message || "Failed to retrieve site data. Please ensure the address is correct.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('dashboard-container');
    if (!element) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f4f7f6'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SWA-Zoning-Report-${config.zoneKey}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#f4f7f6] relative">
      <Sidebar 
        config={config} 
        onUpdate={handleUpdate} 
        onPrint={handleDownloadPDF} 
        isExporting={isExporting} 
        lotGeometry={lotGeometry}
        bbl={selectedBbl}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-12 main-content relative" id="dashboard-container">
        <div className="no-print absolute top-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-1 flex items-center gap-2">
            <span className="pl-3 text-gray-400">{isSearching ? '⏳' : '🔍'}</span>
            <input 
              type="text" 
              disabled={isSearching}
              placeholder="Search Address (e.g. 651 Myrtle Ave)"
              className="flex-1 p-2.5 outline-none text-sm font-medium text-gray-700 bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value);
              }}
            />
            <button 
              onClick={(e) => {
                const input = (e.currentTarget.previousSibling as HTMLInputElement);
                handleSearch(input.value);
              }}
              disabled={isSearching}
              className={`bg-[#0088bb] text-white px-4 py-2 rounded text-xs font-black uppercase tracking-wider hover:bg-[#0077aa] transition-colors ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSearching ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {siteInfo && <SiteInfoOverlay data={siteInfo} onClose={() => setSiteInfo(null)} />}

        <Dashboard config={config} activeZoning={activeZoning} bonusZoning={bonusZoning} onUpdate={handleUpdate} />
        <footer className="mt-12 pt-8 text-center text-[0.6rem] font-bold text-gray-300 border-t border-gray-100 uppercase tracking-widest">
          DESIGNED BY ASKAR & GD | NYC ZONING RESEARCH ENGINE (ZOLA SOURCE)
        </footer>
      </main>
    </div>
  );
};

export default App;