import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../api/client';
import { MapPin } from 'lucide-react';

// Fix for default Leaflet marker icons not loading in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  
  const [cases, setCases] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState('standard');
  const [regionalHeatmap, setRegionalHeatmap] = useState([]);
  const [riskRatings, setRiskRatings] = useState(null);
  
  const canViewRegional = hasPermission('regional_heatmap');
  const canViewRiskRatings = hasPermission('district_risk_rating');

  // Bengaluru center
  const center = [12.9716, 77.5946];
  const zoom = 12;

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      try {
        const [casesData, hotspotsData] = await Promise.all([
          api.getMapCases(),
          api.getAnalyticsHotspots()
        ]);
        setCases(casesData);
        setHotspots(hotspotsData);
        
        if (canViewRegional && user?.zone_id) {
          const heatData = await api.getRegionalHeatmap(user.zone_id);
          setRegionalHeatmap(heatData);
        }
        
        if (canViewRiskRatings && user?.zone_id) {
          const riskData = await api.getDistrictRiskRatings(user.zone_id);
          setRiskRatings(riskData);
        }
        
        setError(null);
      } catch (err) {
        console.error("Failed to load map data", err);
        setError("Failed to load spatial data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, [canViewRegional, canViewRiskRatings, user?.zone_id]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-sys-bg">
      <div className="p-6 border-b border-sys-border flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-sys-text-main flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-sys-primary" />
            <span>Spatial Analysis Map</span>
          </h2>
          <p className="text-sm text-sys-text-muted mt-1">
            Visualizing case clusters and active hotspot grids.
          </p>
          {canViewRegional && (
            <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => setViewMode('standard')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'standard' ? 'bg-sys-primary text-sys-text-inverse shadow-lg shadow-blue-900/50' : 'bg-sys-surface-hover text-sys-text-muted hover:bg-slate-700'}`}
                >Standard View</button>
                <button 
                  onClick={() => setViewMode('regional')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'regional' ? 'bg-indigo-600 text-sys-text-inverse shadow-lg shadow-indigo-900/50' : 'bg-sys-surface-hover text-sys-text-muted hover:bg-slate-700'}`}
                >Regional View</button>
            </div>
          )}
        </div>
        {loading && (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-sm text-sys-text-muted">Loading spatial data...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-400 p-3 flex items-center justify-between text-sm z-10 relative">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="font-medium underline">Retry</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative z-0">
          <MapContainer center={center} zoom={zoom} className="w-full h-full bg-sys-bg">
            {/* Dark themed map tile layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {viewMode === 'standard' ? (
              <>
                {/* Render Hotspots as Circles */}

          {hotspots.map((hotspot, idx) => (
            <CircleMarker
              key={`hotspot-${idx}`}
              center={[hotspot.latitude, hotspot.longitude]}
              pathOptions={{
                color: 'red',
                fillColor: '#ef4444',
                fillOpacity: 0.3,
                weight: 1
              }}
              // Size based on case count
              radius={20 + (hotspot.case_count * 5)}
            >
              <Popup>
                <div className="text-slate-800 font-semibold text-center">
                  <div className="text-rose-600 font-bold mb-1">HOTSPOT ZONE</div>
                  <div className="text-sm">{hotspot.case_count} incident(s) detected</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Render Individual Cases as standard Markers */}
          {cases.map((c) => (
            <Marker 
              key={c.CaseMasterID} 
              position={[c.latitude, c.longitude]}
            >
              <Popup>
                <div className="min-w-[150px]">
                  <div className="font-bold text-slate-800">{c.CrimeNo}</div>
                  <div className="text-xs text-sys-text-muted mt-1">
                    Major Head ID: {c.CrimeMajorHeadID}<br/>
                    Registered: {new Date(c.CrimeRegisteredDate).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => navigate(`/case/${c.CaseMasterID}`)}
                    className="mt-3 w-full bg-sys-primary hover:bg-blue-700 text-sys-text-inverse text-xs font-semibold py-1.5 rounded transition-colors"
                  >
                    View Case Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
              </>
            ) : (
              <>
                {/* Render Regional Heatmap */}
                {regionalHeatmap.map((rh, idx) => (
                    <CircleMarker
                        key={`rh-${idx}`}
                        center={[rh.lat, rh.lng]}
                        pathOptions={{
                            color: '#818cf8',
                            fillColor: `rgba(79, 70, 229, ${Math.max(0.3, rh.intensity)})`,
                            fillOpacity: Math.max(0.4, rh.intensity),
                            weight: 2
                        }}
                        radius={30 + (rh.intensity * 40)}
                    >
                        <Popup>
                            <div className="text-slate-800 font-semibold text-center min-w-[120px]">
                                <div className="text-indigo-600 font-bold mb-1 border-b border-indigo-100 pb-1">{rh.district_name.toUpperCase()}</div>
                                <div className="text-sm mt-1">{rh.case_count} Cases Total</div>
                                <div className="text-xs text-sys-text-muted mt-1">Intensity: {(rh.intensity * 100).toFixed(1)}%</div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
              </>
            )}
          </MapContainer>
        </div>
        
        {/* District Risk Ratings Panel */}
        {canViewRiskRatings && viewMode === 'regional' && riskRatings && (
            <div className="w-80 bg-sys-bg border-l border-sys-border flex flex-col shadow-xl z-10">
                <div className="p-4 border-b border-sys-border bg-sys-surface">
                    <h3 className="font-bold text-sys-text-main flex items-center justify-between">
                      <span>District Risk Ratings</span>
                      <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">IGP</span>
                    </h3>
                    <p className="text-xs text-sys-text-muted mt-1 leading-relaxed">Statistical composite index based on trend, active hotspots, and crime severity.</p>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                    {riskRatings.ratings.map((r, i) => (
                        <div key={i} className="bg-sys-surface-hover/50 rounded-lg p-3 border border-sys-border-strong/50 hover:border-slate-600/80 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <div className="font-semibold text-sys-text-main">{r.district_name}</div>
                                <div className="text-base font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">{r.risk_index.toFixed(1)}</div>
                            </div>
                            
                            <details className="text-xs text-sys-text-muted cursor-pointer group">
                                <summary className="hover:text-indigo-300 font-medium list-none flex items-center select-none">
                                  <svg className="w-3 h-3 mr-1 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  Factor Breakdown
                                </summary>
                                <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-sys-border-strong/50 py-1">
                                    <div className="flex justify-between items-center">
                                        <span title="40% Weight: Change in case volume over 90 days">Volume Trend (40%)</span>
                                        <span className="text-sys-text-muted font-medium">{r.breakdown.case_volume_trend.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span title="35% Weight: Active hotspot zones relative to cases">Hotspots (35%)</span>
                                        <span className="text-sys-text-muted font-medium">{r.breakdown.hotspot_density.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span title="25% Weight: Proportion of heinous cases">Severity Mix (25%)</span>
                                        <span className="text-sys-text-muted font-medium">{r.breakdown.severity_mix.toFixed(1)}</span>
                                    </div>
                                </div>
                            </details>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
