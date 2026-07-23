import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity, MapPin, AlertTriangle, Filter, Database, Users, AlertCircle, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ health }) {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');

  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [stationId, setStationId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const isStationLimited = !hasPermission('monitor_stations');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const statsData = await api.getDashboardStats();
        setStats(statsData);

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
  }, [stationId, categoryId, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* Introduction & Objective Banner */}
      <div className="bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent p-6 rounded-xl border border-blue-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Decision-Support Intelligence Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            This platform aggregates records from CCTNS and detects repeating crimewave patterns. Alerts are explainable.
          </p>
        </div>
        <div className="flex space-x-2">
          {!isStationLimited && (
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
            >
              <option value="">All Stations</option>
              <option value="1">Koramangala</option>
              <option value="2">Indiranagar</option>
              <option value="3">HSR Layout</option>
              <option value="4">Whitefield</option>
              <option value="5">Cubbon Park</option>
              <option value="6">Jayanagar</option>
            </select>
          )}

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
          >
            <option value="">All Categories</option>
            <option value="1">FIR</option>
            <option value="2">UDR</option>
            <option value="3">PAR</option>
            <option value="4">Zero FIR</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="text-sm font-medium underline">Retry</button>
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0c1222] border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 block">Total Integrated Cases</span>
            <span className="text-2xl font-bold text-slate-100 mt-1 block">
              {stats ? stats.total_cases : "..."}
            </span>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-[#0c1222] border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 block">Active Hotspot Zones</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">3</span>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
            <MapPin className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-[#0c1222] border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 block">System Warnings</span>
            <span className="text-2xl font-bold text-amber-500 mt-1 block">2</span>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-[#0c1222] border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 block">Identified Suspects</span>
            <span className="text-2xl font-bold text-indigo-400 mt-1 block">
              {health ? health.db_stats.accused_records : "..."}
            </span>
          </div>
          <div className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-5 h-64 flex flex-col">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Cases by Category</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_category}>
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-5 h-64 flex flex-col">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Cases Over Time (Weekly)</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.time_series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Case List Column (2/3 width) */}
        <div className="lg:col-span-2 bg-[#0c1222] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-slate-200">
                {searchQuery ? `Search Results for "${searchQuery}"` : "Recent Incident Logs"}
              </h3>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Crime No</th>
                    <th className="pb-3 px-4">Date</th>
                    <th className="pb-3 px-4">Incident Details</th>
                    <th className="pb-3 pl-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-5 h-5 rounded-full border-2 border-slate-500 border-t-transparent animate-spin"></div>
                          <span>Loading cases...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-rose-400">
                        Failed to load data.
                      </td>
                    </tr>
                  ) : cases.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12">
                        <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-8 text-center max-w-md mx-auto">
                          <Search className="w-12 h-12 text-slate-600/50 mx-auto mb-3" />
                          <p className="text-slate-200 font-bold text-lg mb-1">No Records Available</p>
                          <p className="text-slate-400 text-sm">
                            {searchQuery
                              ? `No records matched "${searchQuery}". Try a different crime number, suspect name, or location.`
                              : "No cases match the selected filters. Try adjusting your station or category filter."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cases.map(c => (
                      <tr key={c.CaseMasterID} className="hover:bg-slate-800/40 group cursor-pointer transition-colors" onClick={() => navigate(`/case/${c.CaseMasterID}`)}>
                        <td className="py-4 pr-4">
                          <div className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{c.CrimeNo}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                          {new Date(c.CrimeRegisteredDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 max-w-sm">
                          <div className="text-xs text-slate-400 line-clamp-2">{c.BriefFacts}</div>
                        </td>
                        <td className="py-4 pl-4">
                          <button className="text-xs bg-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 text-slate-300 px-3 py-1.5 rounded border border-slate-700 transition">
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

        {/* Alert & Hotspot Panel (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-200">Decision-Support Alerts</h3>
            </div>
            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">BURGLARY HOTSPOT</span>
                  <span className="text-[10px] text-slate-500">2 days ago</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  4 residential burglaries detected in <strong className="text-slate-100">Koramangala 4th Block</strong> within 5 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
