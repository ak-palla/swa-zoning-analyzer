import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

interface MapPanelProps {
  geometry: any; // GeoJSON geometry from Carto
  bbl?: string;
}

// Internal component to handle map sizing, zooming, and manual controls
const MapController: React.FC<{ positions: L.LatLngExpression[]; bbl?: string }> = ({ positions, bbl }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const timers = [100, 300, 800, 1500].map(ms => 
      setTimeout(() => map.invalidateSize(), ms)
    );
    return () => timers.forEach(t => clearTimeout(t));
  }, [map]);

  const handleZoomToLot = useCallback(() => {
    if (positions.length > 0) {
      try {
        const bounds = L.latLngBounds(positions as L.LatLngTuple[]);
        map.fitBounds(bounds, { 
          padding: [40, 40], 
          maxZoom: 18,
          animate: true,
          duration: 0.8
        });
      } catch (err) {
        console.error("Leaflet fitBounds error:", err);
      }
    }
  }, [positions, map]);

  useEffect(() => {
    handleZoomToLot();
  }, [handleZoomToLot]);

  // Construct ZOLA Deep Link using the planninglabs structure
  const zolaUrl = useMemo(() => {
    if (!bbl || bbl.length !== 10) return "https://zola.planninglabs.nyc/";
    
    // BBL Parsing (B-BBBBB-LLLL)
    const boro = bbl.substring(0, 1);
    const block = parseInt(bbl.substring(1, 6), 10);
    const lot = parseInt(bbl.substring(6, 10), 10);
    
    return `https://zola.planninglabs.nyc/l/lot/${boro}/${block}/${lot}?search=true`;
  }, [bbl]);

  return (
    <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
      {positions.length > 0 && (
        <>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleZoomToLot();
            }}
            className="bg-white/95 border border-slate-300 p-2 rounded shadow-md hover:bg-white transition-colors group flex items-center justify-center"
            title="Recenter on Lot"
          >
            <span className="text-lg group-hover:scale-110 block transition-transform">🎯</span>
          </button>
          
          <a 
            href={zolaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/95 border border-slate-300 p-2 rounded shadow-md hover:bg-white transition-colors group flex items-center justify-center"
            title="View full lot details on NYC ZOLA"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-lg group-hover:scale-110 block transition-transform">🌐</span>
          </a>
        </>
      )}
    </div>
  );
};

const MapPanel: React.FC<MapPanelProps> = ({ geometry, bbl }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const positions = useMemo(() => {
    if (!geometry) return [];
    try {
      const polygonData = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
      if (!polygonData || !polygonData.type || !polygonData.coordinates) return [];

      if (polygonData.type === 'Polygon') {
        return (polygonData.coordinates[0] as number[][]).map((coord) => [coord[1], coord[0]]) as L.LatLngExpression[];
      } else if (polygonData.type === 'MultiPolygon') {
        return (polygonData.coordinates[0][0] as number[][]).map((coord) => [coord[1], coord[0]]) as L.LatLngExpression[];
      }
    } catch (e) {
      console.error("Map Geometry parsing failed:", e);
    }
    return [];
  }, [geometry]);

  const zolaLink = useMemo(() => {
    if (!bbl || bbl.length !== 10) return "https://zola.planninglabs.nyc/";
    const boro = bbl.substring(0, 1);
    const block = parseInt(bbl.substring(1, 6), 10);
    const lot = parseInt(bbl.substring(6, 10), 10);
    return `https://zola.planninglabs.nyc/l/lot/${boro}/${block}/${lot}?search=true`;
  }, [bbl]);

  if (!mounted) return <div className="h-[380px] w-full bg-slate-200 animate-pulse rounded border border-gray-300" />;

  return (
    <div className="h-[380px] w-full rounded border border-gray-300 shadow-inner relative z-0 overflow-hidden bg-slate-200">
      <MapContainer 
        center={[40.7128, -74.0060]} 
        zoom={13} 
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
        style={{ height: '100%', width: '100%', background: '#e2e8f0' }}
        zoomControl={false} // We add it manually to control position
      >
        <ZoomControl position="topleft" />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <TileLayer
          url="https://maps.nyc.gov/xyz/1.0.0/zoning_districts/{z}/{x}/{y}.png"
          opacity={0.3}
          attribution={`<a href="${zolaLink}" target="_blank" rel="noopener noreferrer">ZOLA Info</a>`}
        />

        {positions.length > 0 && (
          <>
            <Polygon 
              positions={positions} 
              pathOptions={{ 
                color: '#0088bb', 
                fillColor: '#0088bb', 
                fillOpacity: 0.55, 
                weight: 4,
                lineJoin: 'round'
              }} 
            />
            <MapController positions={positions} bbl={bbl} />
          </>
        )}
      </MapContainer>
      
      <div className="absolute bottom-2 right-2 bg-white/95 px-2 py-1 text-[9px] font-black text-slate-500 rounded border border-slate-200 z-[400] uppercase tracking-tighter shadow-sm flex items-center gap-1 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        GIS VIEW
      </div>

      {!geometry && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-[2px] z-[400] p-6 text-center">
           <div className="mb-3 text-3xl drop-shadow-sm grayscale opacity-60">📍</div>
           <span className="text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.25em] leading-relaxed">
             Awaiting Property Data...<br/>
             <span className="text-[0.55rem] font-bold text-slate-400 normal-case tracking-normal">Enter an address to sync GIS</span>
           </span>
        </div>
      )}

      {geometry && positions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[500]">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-2"></div>
            <span className="text-[0.6rem] font-black text-blue-500 uppercase tracking-widest">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPanel;