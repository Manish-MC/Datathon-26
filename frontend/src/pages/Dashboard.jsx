import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity, MapPin, AlertTriangle, Filter, Database, Users, AlertCircle, Search, 
  ArrowUpRight, ArrowDownRight, FileText, Bell, PlusCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import NewFIRModal from '../components/NewFIRModal';

const PIE_COLORS = ['#1B2A4A', '#D4AF37', '#10b981', '#f43f5e', '#6366f1'];

export default function Dashboard({ health, forcedStationId }) {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');

  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [topOffenders, setTopOffenders] = useState([]);
  const [drilldown, setDrilldown] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [stationId, setStationId] = useState(forcedStationId || '');
  const [categoryId, setCategoryId] = useState('');
  const [days, setDays] = useState(30);
  
  const [isFIRModalOpen, setIsFIRModalOpen] = useState(false);

  const isStationLimited = !hasPermission('monitor_stations') || forcedStationId;
  const canSeeAnomalies = hasPermission('anomaly_detection');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [statsData, offendersData, drilldownData, hotspotsData] = await Promise.all([
          api.getDashboardStats(days),
          api.getDashboardTopOffenders(),
          api.getDashboardDrilldown(),
          api.getAnalyticsHotspots()
        ]);
        setStats(statsData);
        setTopOffenders(offendersData);
        setDrilldown(drilldownData);
        setHotspots(hotspotsData);

        if (canSeeAnomalies) {
          const anomaliesData = await api.getStatewideAnomalies();
          setAnomalies(anomaliesData?.anomalies || []);
        }

        if (searchQuery) {
          const searchData = isStationLimited ? 
            await api.getStationRecords(searchQuery) : 
            await api.searchCases(searchQuery);
          setCases(searchData);
        } else {
          const casesData = isStationLimited ? 
            await api.getStationRecords() :
            await api.getCases({
              station_id: stationId,
              category_id: categoryId
            });
          setCases(casesData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [stationId, categoryId, searchQuery, days, isStationLimited, canSeeAnomalies]);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setIsFIRModalOpen(true)} className="bg-sys-primary hover:bg-sys-primary-hover text-sys-surface text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <PlusCircle className="w-4 h-4" />
          <span>Register FIR</span>
        </button>
        {hasPermission("broadcast_urgent_alert") && (
          <button onClick={() => navigate('/alerts')} className="bg-sys-surface border border-sys-border hover:bg-sys-surface-hover text-sys-text-main text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Create Alert</span>
          </button>
        )}
        <button onClick={() => alert("Report generation triggered.")} className="bg-sys-surface border border-sys-border hover:bg-sys-surface-hover text-sys-text-main text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <FileText className="w-4 h-4 text-sys-primary" />
          <span>Generate Report</span>
        </button>
      </div>

      <NewFIRModal isOpen={isFIRModalOpen} onClose={() => setIsFIRModalOpen(false)} onSuccess={() => window.location.reload()} />

      {/* Introduction & Objective Banner */}
      <div className="bg-gradient-to-r from-sys-primary/10 via-sys-primary/5 to-transparent p-6 rounded-xl border border-sys-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-sys-text-main">Decision-Support Intelligence Dashboard</h2>
          <p className="text-sm text-sys-text-muted mt-1 max-w-2xl">
            This platform aggregates records from CCTNS and detects repeating crimewave patterns. Alerts are explainable.
          </p>
        </div>
        <div className="flex space-x-2">
          {!isStationLimited && (
            <select value={stationId} onChange={(e) => setStationId(e.target.value)} className="bg-sys-surface border border-sys-border-strong text-sys-text-main text-xs rounded-lg px-3 py-2">
              <option value="">All Stations</option>
              <option value="1">Koramangala</option>
              <option value="2">Indiranagar</option>
              <option value="3">HSR Layout</option>
              <option value="4">Whitefield</option>
              <option value="5">Cubbon Park</option>
              <option value="6">Jayanagar</option>
            </select>
          )}

          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="bg-sys-surface border border-sys-border-strong text-sys-text-main text-xs rounded-lg px-3 py-2">
            <option value="">All Categories</option>
            <option value="1">FIR</option>
            <option value="2">UDR</option>
            <option value="3">PAR</option>
            <option value="4">Zero FIR</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="text-sm font-medium underline">Retry</button>
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-sys-surface border border-sys-border p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-sys-text-muted block">Total Integrated Cases</span>
            <span className="text-2xl font-bold text-sys-text-main mt-1 block">{stats ? stats.total_cases : "..."}</span>
          </div>
          <div className="bg-sys-primary/10 p-3 rounded-lg border border-sys-primary/20">
            <Database className="w-5 h-5 text-sys-primary" />
          </div>
        </div>

        <div className="bg-sys-surface border border-sys-border p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-sys-text-muted block">Active Hotspot Zones</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">3</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-sys-surface border border-sys-border p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-sys-text-muted block">System Warnings</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">2</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="bg-sys-surface border border-sys-border p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-sys-text-muted block">Identified Suspects</span>
            <span className="text-2xl font-bold text-sys-primary mt-1 block">{health ? health.db_stats.accused_records : "..."}</span>
          </div>
          <div className="bg-sys-primary/10 p-3 rounded-lg border border-sys-primary/20">
            <Users className="w-5 h-5 text-sys-primary" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-sys-surface border border-sys-border rounded-xl p-5 h-64 flex flex-col shadow-sm">
            <h3 className="text-sm font-bold text-sys-text-main mb-4">Crime by Category</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.by_category} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2}>
                    {stats.by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-sys-surface border border-sys-border rounded-xl p-5 h-64 flex flex-col shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-sys-text-main">Crime Trend</h3>
              <div className="flex space-x-1 bg-sys-surface-hover p-1 rounded-md border border-sys-border">
                <button onClick={() => setDays(7)} className={`text-xs px-2 py-1 rounded ${days === 7 ? 'bg-sys-surface text-sys-primary shadow-sm' : 'text-sys-text-muted hover:text-sys-text-main'}`}>7 Days</button>
                <button onClick={() => setDays(30)} className={`text-xs px-2 py-1 rounded ${days === 30 ? 'bg-sys-surface text-sys-primary shadow-sm' : 'text-sys-text-muted hover:text-sys-text-main'}`}>30 Days</button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.time_series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
                  <Line type="monotone" dataKey="count" stroke="#1B2A4A" strokeWidth={3} dot={{ r: 3, fill: '#1B2A4A', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Row: Mini Map, Drilldown, Repeat Offenders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mini Hotspot Map - Exec Only */}
        {!isStationLimited && (
          <div className="bg-sys-surface border border-sys-border rounded-xl flex flex-col shadow-sm overflow-hidden h-72 relative">
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/50 to-transparent z-[400] flex justify-between items-center pointer-events-none">
              <h3 className="text-sm font-bold text-white shadow-sm">Mini Hotspot Map</h3>
            </div>
            <div className="flex-1 min-h-0 relative z-0 bg-sys-surface">
              <MapContainer center={[12.9716, 77.5946]} zoom={11} className="w-full h-full" zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                {hotspots.map((hs, idx) => (
                   <CircleMarker key={`hotspot-${idx}`} center={[hs.latitude, hs.longitude]} radius={hs.case_count * 3} fillColor="#ef4444" color="#ef4444" weight={1} opacity={0.3} fillOpacity={0.4} />
                ))}
              </MapContainer>
            </div>
            <div className="p-3 border-t border-sys-border bg-sys-surface flex justify-center z-10">
              <button onClick={() => navigate('/map')} className="text-xs font-semibold text-sys-primary hover:text-sys-primary-hover transition-colors flex items-center">
                View Full Map <ArrowUpRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Drilldown / Category Breakdown */}
        <div className={`bg-sys-surface border border-sys-border rounded-xl p-5 shadow-sm overflow-hidden flex flex-col h-72 ${isStationLimited ? 'lg:col-span-3' : ''}`}>
          <h3 className="text-sm font-bold text-sys-text-main mb-3">{isStationLimited ? "Category Breakdown" : "District/Station Drilldown"}</h3>
          <div className="overflow-y-auto flex-1 pr-2 space-y-2">
            {drilldown.length === 0 ? (
              <p className="text-xs text-sys-text-muted mt-4">No data available.</p>
            ) : drilldown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-sys-surface-hover rounded-lg transition-colors border border-transparent hover:border-sys-border">
                <span className="text-xs font-medium text-sys-text-main">{item.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-sys-text-main">{item.case_count}</span>
                  {item.trend === 'up' ? <ArrowUpRight className="w-3 h-3 text-rose-500" /> : <ArrowDownRight className="w-3 h-3 text-emerald-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Repeat Offenders - Exec Only */}
        {!isStationLimited && (
          <div className="bg-sys-surface border border-sys-border rounded-xl p-5 shadow-sm overflow-hidden flex flex-col h-72">
            <h3 className="text-sm font-bold text-sys-text-main mb-3">Top Repeat Offenders</h3>
            <div className="overflow-y-auto flex-1 pr-2 space-y-2">
              {topOffenders.length === 0 ? (
                <p className="text-xs text-sys-text-muted mt-4">No data available.</p>
              ) : topOffenders.map((offender, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border-b border-sys-border last:border-0">
                  <span className="text-xs font-medium text-sys-text-main">{offender.name}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-sys-text-muted">{offender.case_count} cases</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      offender.risk_tier === 'High' ? 'bg-rose-100 text-rose-700' :
                      offender.risk_tier === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{offender.risk_tier}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Two-Column Layout (Incidents + Anomalies) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Case List Column (2/3 width) */}
        <div className="lg:col-span-2 bg-sys-surface border border-sys-border rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 border-b border-sys-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-sys-primary" />
              <h3 className="font-bold text-sys-text-main">
                {searchQuery ? `Search Results for "${searchQuery}"` : "Recent Incident Logs"}
              </h3>
            </div>
          </div>

          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-sys-border bg-sys-surface-hover/50 text-sys-text-muted text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Crime No</th>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5">Incident Details</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sys-border">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-sys-text-muted">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-5 h-5 rounded-full border-2 border-sys-primary border-t-transparent animate-spin"></div>
                          <span>Loading cases...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-rose-500">Failed to load data.</td>
                    </tr>
                  ) : cases.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12">
                        <div className="text-center max-w-md mx-auto">
                          <Search className="w-10 h-10 text-sys-text-muted/30 mx-auto mb-3" />
                          <p className="text-sys-text-main font-bold text-sm mb-1">No Records Available</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cases.map(c => (
                      <tr key={c.CaseMasterID} className="hover:bg-sys-surface-hover group cursor-pointer transition-colors" onClick={() => navigate(`/case/${c.CaseMasterID}`)}>
                        <td className="py-3 px-5">
                          <div className="font-medium text-sys-text-main group-hover:text-sys-primary transition-colors">{c.CrimeNo}</div>
                        </td>
                        <td className="py-3 px-5 text-sys-text-muted text-xs whitespace-nowrap">
                          {new Date(c.CrimeRegisteredDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-5 max-w-sm">
                          <div className="text-xs text-sys-text-muted line-clamp-1">{c.BriefFacts}</div>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button className="text-xs bg-sys-surface group-hover:bg-sys-primary group-hover:text-sys-text-inverse text-sys-text-main px-3 py-1.5 rounded-md border border-sys-border transition">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Anomaly Alerts (1/3 width, conditional) */}
        {canSeeAnomalies && (
          <div className="space-y-6">
            <div className="bg-sys-surface border border-amber-200 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none"></div>
              <div className="flex items-center space-x-2 border-b border-sys-border pb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sys-text-main">Anomaly Alerts</h3>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {anomalies.length === 0 ? (
                   <p className="text-xs text-sys-text-muted">No anomalies detected.</p>
                ) : (
                  anomalies.map((anomaly, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{anomaly.type}</span>
                      </div>
                      <p className="text-xs text-sys-text-main leading-relaxed">
                        <strong className="text-amber-900">{anomaly.location}</strong>: {anomaly.reason}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
