import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Search, ArrowRight, Map, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function CaseSimilarity() {
  const [caseId, setCaseId] = useState('');
  const [activeTab, setActiveTab] = useState('match'); // 'match' or 'compare'
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  // District Comparison State
  const [rangeDistricts, setRangeDistricts] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasPermission('compare_districts')) {
      api.getRangeDistricts()
        .then(data => {
          setRangeDistricts(data);
          // By default select all districts
          setSelectedDistricts(data.map(d => d.DistrictID));
        })
        .catch(err => console.error("Failed to fetch range districts:", err));
    }
  }, [hasPermission]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (caseId.trim()) {
      navigate(`/case/${caseId}`);
    }
  };

  const handleCompare = async () => {
    if (selectedDistricts.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDistrictComparison(selectedDistricts);
      setComparisonData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  const toggleDistrict = (id) => {
    if (selectedDistricts.includes(id)) {
      setSelectedDistricts(selectedDistricts.filter(d => d !== id));
    } else {
      setSelectedDistricts([...selectedDistricts, id]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-sys-bg min-h-full">
      <div className="max-w-6xl mx-auto">
        
        {hasPermission('compare_districts') && (
          <div className="flex items-center space-x-1 bg-sys-surface p-1 rounded-lg w-max mb-8 border border-sys-border">
            <button
              onClick={() => setActiveTab('match')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'match' ? 'bg-sys-surface-hover text-sys-primary shadow' : 'text-sys-text-muted hover:text-sys-text-main'
              }`}
            >
              Single Case Match
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'compare' ? 'bg-sys-surface-hover text-sys-primary shadow' : 'text-sys-text-muted hover:text-sys-text-main'
              }`}
            >
              District Comparison
            </button>
          </div>
        )}

        {activeTab === 'match' ? (
          <div className="bg-sys-bg border border-sys-border rounded-xl p-12 text-center shadow-xl relative overflow-hidden mt-12 max-w-4xl mx-auto">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full flex justify-center items-center opacity-5 pointer-events-none">
              <Layers className="w-96 h-96 text-blue-500" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-blue-600/10 p-4 rounded-full border border-sys-primary/30 mb-6">
                <Layers className="w-10 h-10 text-sys-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-sys-text-main mb-4 tracking-tight">Case Similarity Match</h2>
              
              <p className="text-sys-text-muted mb-8 max-w-lg leading-relaxed">
                Discover patterns and linkages between cases. To view similarity clusters, please navigate to a specific case from the Executive Dashboard or enter a Case ID below.
              </p>

              <form onSubmit={handleSearch} className="w-full max-w-md relative flex items-center">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sys-text-muted" />
                  <input
                    type="text"
                    placeholder="Enter Case ID (e.g. 1)"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    className="w-full bg-sys-surface border border-sys-border-strong rounded-l-lg py-3 pl-10 pr-4 text-sm text-sys-text-main placeholder-slate-500 focus:outline-none focus:border-sys-primary/80 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!caseId.trim()}
                  className="bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse px-5 py-3 rounded-r-lg font-medium text-sm transition-colors border border-blue-600 hover:border-sys-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-sys-bg border border-sys-border rounded-xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-sys-text-main mb-4">Multi-District Comparison</h2>
              <div className="flex flex-wrap gap-3 mb-6">
                {rangeDistricts.map(d => (
                  <button
                    key={d.DistrictID}
                    onClick={() => toggleDistrict(d.DistrictID)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      selectedDistricts.includes(d.DistrictID)
                        ? 'bg-blue-600/20 border-sys-primary/50 text-sys-primary font-medium'
                        : 'bg-sys-surface border-sys-border-strong text-sys-text-muted hover:border-slate-500'
                    }`}
                  >
                    {d.DistrictName}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCompare}
                disabled={selectedDistricts.length === 0 || loading}
                className="bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                <span>Compare Selected Districts</span>
              </button>
              
              {error && (
                <div className="mt-4 text-sm text-rose-400 bg-rose-500/10 p-3 rounded border border-rose-500/20">
                  {error}
                </div>
              )}
            </div>

            {comparisonData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-sys-bg border border-sys-border rounded-xl shadow-xl overflow-hidden">
                  <div className="p-5 border-b border-sys-border bg-sys-surface">
                    <h3 className="font-semibold text-sys-text-main">Comparison Metrics</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-sys-surface text-sys-text-muted border-b border-sys-border">
                        <tr>
                          <th className="p-4 font-medium">District</th>
                          <th className="p-4 font-medium">Total Cases</th>
                          <th className="p-4 font-medium">90-Day Trend</th>
                          <th className="p-4 font-medium">Active Hotspots</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sys-border">
                        {comparisonData.districts.map(d => (
                          <tr key={d.DistrictID} className="hover:bg-sys-surface-hover transition-colors">
                            <td className="p-4 font-medium text-sys-text-main">{d.DistrictName}</td>
                            <td className="p-4 text-sys-text-muted">{d.total_cases}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                d.trend_90_days_pct > 0 ? 'bg-rose-500/20 text-rose-400' : 
                                d.trend_90_days_pct < 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sys-surface-hover text-sys-text-muted'
                              }`}>
                                {d.trend_90_days_pct > 0 ? '+' : ''}{d.trend_90_days_pct}%
                              </span>
                            </td>
                            <td className="p-4 text-amber-400 font-medium">{d.active_hotspots}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-sys-bg border border-sys-border rounded-xl shadow-xl p-5">
                  <div className="flex items-center space-x-2 mb-5">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h3 className="font-semibold text-sys-text-main">Key Insights</h3>
                  </div>
                  <div className="space-y-4">
                    {comparisonData.insights.map((insight, idx) => (
                      <div key={idx} className="bg-sys-surface p-4 rounded-lg border border-sys-border/80">
                        <p className="text-sm text-sys-text-muted leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
