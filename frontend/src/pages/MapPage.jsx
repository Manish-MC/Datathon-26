import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [cases, setCases] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError(null);
      } catch (err) {
        console.error("Failed to load map data", err);
        setError("Failed to load spatial data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#070b13]">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <span>Spatial Analysis Map</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Visualizing case clusters and active hotspot grids.
          </p>
        </div>
        {loading && (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-sm text-slate-400">Loading spatial data...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-400 p-3 flex items-center justify-between text-sm z-10 relative">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="font-medium underline">Retry</button>
        </div>
      )}

      <div className="flex-1 relative z-0">
        <MapContainer center={center} zoom={zoom} className="w-full h-full bg-[#0a0f1d]">
          {/* Dark themed map tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
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
                  <div className="text-xs text-slate-500 mt-1">
                    Major Head ID: {c.CrimeMajorHeadID}<br/>
                    Registered: {new Date(c.CrimeRegisteredDate).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => navigate(`/case/${c.CaseMasterID}`)}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 rounded transition-colors"
                  >
                    View Case Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
