import React, { useState, useEffect } from 'react';
import { Bot, ShieldAlert, Network, Clock, Search, ExternalLink, Activity } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const CommandCenter = () => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('copilot');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Copilot State
  const [query, setQuery] = useState('');
  const [copilotHistory, setCopilotHistory] = useState([]);
  
  // Anomaly State
  const [anomalies, setAnomalies] = useState([]);
  
  // Network Graph State
  const [networkData, setNetworkData] = useState({ nodes: [], edges: [] });
  const [networkSearch, setNetworkSearch] = useState('');
  
  // Timeline State
  const [timelineEvents, setTimelineEvents] = useState([]);

  useEffect(() => {
    if (activeTab === 'anomalies' && anomalies.length === 0) fetchAnomalies();
    if (activeTab === 'network' && networkData.nodes.length === 0) fetchNetworkGraph();
    if (activeTab === 'timeline' && timelineEvents.length === 0) fetchTimeline();
  }, [activeTab]);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await api.getStatewideAnomalies();
      setAnomalies(res.anomalies);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworkGraph = async (caseId = '') => {
    try {
      setLoading(true);
      const res = await api.getNetworkGraph(caseId);
      // Basic circular layout for the nodes
      const radius = 250;
      const center = { x: 400, y: 300 };
      const nodes = res.nodes.map((n, i) => {
        const angle = (i / res.nodes.length) * 2 * Math.PI;
        return {
          ...n,
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle)
        };
      });
      setNetworkData({ nodes, edges: res.edges });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.getDecisionTimeline();
      setTimelineEvents(res.events);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopilotSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userQuery = query;
    setQuery('');
    setCopilotHistory(prev => [...prev, { type: 'user', text: userQuery }]);
    
    try {
      setLoading(true);
      const res = await api.queryCopilot(userQuery);
      setCopilotHistory(prev => [...prev, { 
        type: 'bot', 
        text: res.text, 
        endpoint: res.endpoint_used 
      }]);
    } catch (err) {
      setCopilotHistory(prev => [...prev, { type: 'error', text: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  if (!userData?.permissions?.includes('state_wide_access')) {
    return <div className="p-8 text-center text-gray-500">Not authorized for Command Center</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-sys-surface rounded-xl p-6 shadow-sm border border-sys-border text-sys-text-inverse flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-400" />
            Executive Command Center
          </h1>
          <p className="text-sys-text-muted mt-1">Statewide Intelligence and Oversight Dashboard</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'copilot' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bot className="h-4 w-4" /> AI Copilot
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'anomalies' ? 'bg-white shadow text-red-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShieldAlert className="h-4 w-4" /> Anomaly Detection
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'network' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Network className="h-4 w-4" /> Criminal Network
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'timeline' ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="h-4 w-4" /> Decision Timeline
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Copilot Tab */}
      {activeTab === 'copilot' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-800">Statewide Intelligence Assistant</h2>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            {copilotHistory.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <Bot className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>Ask me about district comparisons, case trends, open alerts, or department KPIs.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button onClick={() => setQuery('Which district has the highest crime?')} className="bg-white border rounded-full px-3 py-1 text-sm hover:bg-gray-100">"Which district has the highest crime?"</button>
                  <button onClick={() => setQuery('Show me the 90 day trend')} className="bg-white border rounded-full px-3 py-1 text-sm hover:bg-gray-100">"Show me the 90 day trend"</button>
                  <button onClick={() => setQuery('Any open alerts?')} className="bg-white border rounded-full px-3 py-1 text-sm hover:bg-gray-100">"Any open alerts?"</button>
                </div>
              </div>
            ) : (
              copilotHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.type === 'user' ? 'bg-indigo-600 text-sys-text-inverse' : 
                    msg.type === 'error' ? 'bg-red-100 text-red-800' : 
                    'bg-white border text-gray-800 shadow-sm'
                  }`}>
                    <p>{msg.text}</p>
                    {msg.endpoint && (
                      <div className="mt-2 text-xs text-gray-400 border-t pt-1 font-mono">
                        Source: {msg.endpoint}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-lg p-3 shadow-sm text-gray-500 animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-white">
            <form onSubmit={handleCopilotSubmit} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about statewide intelligence..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="bg-indigo-600 text-sys-text-inverse px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Z-Score Volume Anomalies</h2>
            <button onClick={fetchAnomalies} className="text-sm text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md font-medium">Refresh</button>
          </div>
          
          {loading ? (
            <div className="animate-pulse bg-white p-6 rounded-xl border flex flex-col gap-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : anomalies.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
              <ShieldAlert className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No statistically significant anomalies detected across districts.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {anomalies.map((a, i) => (
                <div key={i} className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{a.district_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{a.reason}</p>
                    </div>
                    <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                      Z: {a.z_score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Network Graph Tab */}
      {activeTab === 'network' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-600" />
              Criminal Network Linkages
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Case ID (optional)"
                className="border rounded-md px-2 py-1 text-sm w-32"
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
              />
              <button 
                onClick={() => fetchNetworkGraph(networkSearch)}
                className="bg-white border px-3 py-1 rounded-md text-sm hover:bg-gray-50"
              >
                Render
              </button>
            </div>
          </div>
          
          <div className="p-0 relative h-[600px] bg-slate-50 overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium">Building graph...</div>
            ) : networkData.nodes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">No network data found.</div>
            ) : (
              <svg width="100%" height="100%" viewBox="0 0 800 600" className="w-full h-full">
                {/* Edges */}
                {networkData.edges.map((e, i) => {
                  const source = networkData.nodes.find(n => n.id === e.source);
                  const target = networkData.nodes.find(n => n.id === e.target);
                  if (!source || !target) return null;
                  return (
                    <g key={`edge-${i}`}>
                      <line
                        x1={source.x} y1={source.y}
                        x2={target.x} y2={target.y}
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                      />
                      <text
                        x={(source.x + target.x) / 2}
                        y={(source.y + target.y) / 2 - 5}
                        fontSize="10"
                        fill="#64748b"
                        textAnchor="middle"
                      >
                        {e.label}
                      </text>
                    </g>
                  );
                })}
                
                {/* Nodes */}
                {networkData.nodes.map((n) => {
                  const isCase = n.type === 'Case';
                  const isAccused = n.type === 'Accused';
                  return (
                    <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                      <circle
                        r={isCase ? 15 : 12}
                        fill={isCase ? '#ef4444' : isAccused ? '#f97316' : '#3b82f6'}
                        stroke="#fff"
                        strokeWidth="2"
                        className="cursor-pointer hover:stroke-gray-300"
                        title={n.label}
                      />
                      <text
                        y={22}
                        fontSize="10"
                        fontWeight="600"
                        fill="#334155"
                        textAnchor="middle"
                      >
                        {n.label.substring(0, 15)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div className="p-3 border-t bg-white text-xs text-gray-500 flex gap-4">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Cases</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Accused</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Victim</span>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Executive Decision Timeline
            </h2>
            <button onClick={fetchTimeline} className="text-sm text-emerald-600 hover:text-emerald-900 font-medium">Refresh</button>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="space-y-6">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-2 h-full bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : timelineEvents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No recent executive actions found.</div>
            ) : (
              <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                {timelineEvents.map((event, i) => (
                  <div key={i} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                      event.type === 'Investigation' ? 'bg-blue-500' :
                      event.type === 'DepartmentFlag' ? 'bg-orange-500' :
                      event.type === 'AlertReview' ? 'bg-purple-500' : 'bg-red-500'
                    }`}></div>
                    
                    <div className="text-sm text-gray-500 mb-1 flex justify-between items-center">
                      <time>{format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}</time>
                      <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">{event.type}</span>
                    </div>
                    <div className="bg-white border rounded-lg p-3 shadow-sm">
                      <p className="text-gray-800 font-medium">{event.summary}</p>
                      <div className="mt-2 text-xs text-gray-500 flex justify-between">
                        <span>By: {event.actor}</span>
                        {event.related_case_id && <span>Case ID: {event.related_case_id}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandCenter;
