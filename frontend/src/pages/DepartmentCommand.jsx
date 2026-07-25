import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Briefcase, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DepartmentCommand() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [kpis, setKpis] = useState(null);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(user?.department_id || 1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [kpiData, flagsData, deptsData] = await Promise.all([
          api.getDepartmentKPIs(selectedDeptId),
          api.getDepartmentFlags(selectedDeptId),
          user?.department_id ? Promise.resolve([]) : api.getDepartments()
        ]);
        
        setKpis(kpiData);
        setFlags(flagsData);
        if (deptsData && deptsData.length > 0) {
            setDepartments(deptsData);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to load department command data", err);
        setError("Failed to load department dashboards.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedDeptId, user?.department_id]);

  const handleUpdateFlagStatus = async (flagId, newStatus) => {
    try {
      await api.updateDepartmentFlagStatus(flagId, newStatus);
      // Update local state
      setFlags(flags.map(f => f.FlagID === flagId ? { ...f, Status: newStatus } : f));
    } catch (err) {
      console.error("Failed to update flag status", err);
      alert("Failed to update flag status.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center bg-sys-bg">
        <div className="text-sys-text-muted flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Loading Department Command...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-sys-bg">
        <div className="bg-rose-500/10 text-rose-400 p-4 rounded border border-rose-500/20">
          {error}
        </div>
      </div>
    );
  }

  if (!kpis) return (
      <div className="flex-1 p-8 flex justify-center items-center bg-sys-bg">
        <div className="text-sys-text-muted flex items-center space-x-2">
            <span>No KPI data found.</span>
        </div>
      </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-sys-bg p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-sys-text-main flex items-center space-x-2">
              <Briefcase className="w-6 h-6 text-indigo-400" />
              <span>Department Command</span>
            </h1>
            <p className="text-sm text-sys-text-muted mt-1">
              Statewide insights and collaboration flags for your department.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {!user?.department_id && departments.length > 0 && (
              <select 
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                className="bg-sys-surface border border-sys-border-strong text-sys-text-main text-sm rounded-lg px-3 py-2"
              >
                {departments.map(d => (
                  <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName} Department</option>
                ))}
              </select>
            )}
            <div className="bg-sys-surface-hover/50 px-4 py-2 rounded-lg border border-sys-border-strong text-sm">
              <span className="text-sys-text-muted">Scope:</span> <span className="text-indigo-400 font-bold ml-1">STATEWIDE</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-sys-bg p-4 rounded-xl border border-sys-border shadow-sm flex flex-col justify-between hover:border-sys-border-strong transition-colors">
            <div className="text-sys-text-muted text-sm font-medium mb-2">Total Assigned Cases</div>
            <div className="text-3xl font-bold text-sys-text-main">{kpis.total_cases}</div>
            <div className="mt-2 text-xs text-sys-text-muted">All districts combined</div>
          </div>
          
          <div className="bg-sys-bg p-4 rounded-xl border border-sys-border shadow-sm flex flex-col justify-between hover:border-sys-border-strong transition-colors">
            <div className="text-sys-text-muted text-sm font-medium mb-2">90-Day Trend</div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-bold ${kpis.trend_90_days_pct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {kpis.trend_90_days_pct > 0 ? '+' : ''}{kpis.trend_90_days_pct}%
              </span>
            </div>
            <div className="mt-2 text-xs text-sys-text-muted">Case volume vs previous 90 days</div>
          </div>
          
          <div className="bg-sys-bg p-4 rounded-xl border border-sys-border shadow-sm flex flex-col justify-between md:col-span-2 hover:border-sys-border-strong transition-colors">
            <div className="text-sys-text-muted text-sm font-medium mb-2">Status Breakdown</div>
            <div className="flex h-12 w-full mt-2 rounded overflow-hidden shadow-inner">
              {kpis.status_breakdown.map((sb, idx) => {
                const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-slate-500'];
                const width = `${(sb.count / kpis.total_cases) * 100}%`;
                return (
                  <div key={idx} style={{width}} className={`${colors[idx % colors.length]} h-full flex items-center justify-center`} title={`${sb.status_name}: ${sb.count}`}>
                    {sb.count > 0 && <span className="text-sys-text-inverse text-xs font-bold px-1 truncate">{sb.count}</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex mt-3 space-x-4 text-xs text-sys-text-muted">
              {kpis.status_breakdown.map((sb, idx) => (
                <div key={idx} className="flex items-center space-x-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-slate-500'][idx % 4]}`}></div>
                  <span>{sb.status_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* District Risk Ratings (Statewide for this dept) */}
          <div className="lg:col-span-2 bg-sys-bg border border-sys-border rounded-xl overflow-hidden flex flex-col shadow-lg shadow-black/20">
            <div className="p-4 border-b border-sys-border bg-sys-surface flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-sys-text-main">Top High-Risk Districts</h2>
            </div>
            <div className="p-4 flex-1">
              {kpis.district_risk_ratings && kpis.district_risk_ratings.length > 0 ? (
                <div className="space-y-4">
                  {kpis.district_risk_ratings.slice(0, 5).map((dr, idx) => (
                    <div key={idx} className="bg-sys-surface-hover p-3.5 rounded-lg border border-sys-border-strong/50 flex items-center justify-between transition-colors">
                      <div>
                        <div className="font-semibold text-sys-text-main text-lg">{dr.district_name}</div>
                        <div className="text-xs text-sys-text-muted flex space-x-4 mt-1.5">
                          <span className="flex items-center"><span className="w-1 h-1 rounded-full bg-slate-500 mr-1.5"></span>Trend: <strong className="ml-1 text-sys-text-muted">{dr.breakdown.case_volume_trend}%</strong></span>
                          <span className="flex items-center"><span className="w-1 h-1 rounded-full bg-slate-500 mr-1.5"></span>Hotspots: <strong className="ml-1 text-sys-text-muted">{dr.breakdown.hotspot_density}%</strong></span>
                          <span className="flex items-center"><span className="w-1 h-1 rounded-full bg-slate-500 mr-1.5"></span>Severity: <strong className="ml-1 text-sys-text-muted">{dr.breakdown.severity_mix}%</strong></span>
                        </div>
                      </div>
                      <div className="bg-rose-500/10 px-4 py-2 rounded text-rose-400 text-xl font-bold border border-rose-500/20">
                        {dr.risk_index.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sys-text-muted text-sm p-4 bg-sys-surface-hover rounded border border-sys-border border-dashed text-center">
                  No risk data available for this department.
                </div>
              )}
            </div>
          </div>

          {/* Cross-Department Flags */}
          <div className="bg-sys-bg border border-sys-border rounded-xl overflow-hidden flex flex-col shadow-lg shadow-black/20">
            <div className="p-4 border-b border-sys-border bg-sys-surface flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-sys-text-main">Incoming Flags</h2>
              </div>
              {flags.filter(f => f.Status === 'open').length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 font-medium">
                  {flags.filter(f => f.Status === 'open').length} Open
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[450px] p-4 space-y-3">
              {flags.length === 0 ? (
                <div className="text-center text-sys-text-muted text-sm py-8 bg-sys-surface-hover rounded border border-sys-border border-dashed">
                  No incoming flags for your department.
                </div>
              ) : (
                flags.map(flag => (
                  <div key={flag.FlagID} className={`p-4 rounded-xl border ${flag.Status === 'open' ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-900/20' : 'bg-sys-surface-hover border-sys-border'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-sys-text-muted tracking-wider">FROM {flag.FromDepartmentName.toUpperCase()}</span>
                        <div className="text-base font-bold text-indigo-300 mt-0.5 cursor-pointer hover:text-indigo-200 transition-colors" onClick={() => navigate(`/case/${flag.CaseMasterID}`)}>
                          {flag.CrimeNo}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                        flag.Status === 'open' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        flag.Status === 'acknowledged' ? 'bg-blue-500/10 text-sys-primary border-sys-primary/30' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {flag.Status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-sys-text-muted bg-sys-bg/60 p-3 rounded-lg border border-sys-border/80 mb-3 leading-relaxed shadow-inner">
                      "{flag.Note}"
                    </p>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-sys-border/60">
                      <div className="text-[11px] text-sys-text-muted flex items-center">
                        <span className="truncate max-w-[120px]">By {flag.FlaggedByEmployeeName}</span>
                        <span className="mx-1">•</span>
                        <span className="text-slate-600">{flag.FlaggedByRank}</span>
                      </div>
                      
                      {flag.Status === 'open' && (
                        <button 
                          onClick={() => handleUpdateFlagStatus(flag.FlagID, 'acknowledged')}
                          className="text-xs bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse px-3 py-1.5 rounded transition-colors font-medium shadow-sm shadow-blue-900/50"
                        >
                          Acknowledge
                        </button>
                      )}
                      {flag.Status === 'acknowledged' && (
                        <button 
                          onClick={() => handleUpdateFlagStatus(flag.FlagID, 'resolved')}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-sys-text-inverse px-3 py-1.5 rounded transition-colors flex items-center space-x-1.5 font-medium shadow-sm shadow-emerald-900/50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
