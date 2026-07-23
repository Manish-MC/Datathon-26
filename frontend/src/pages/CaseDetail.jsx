import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, AlertCircle, FileText, Calendar, Sparkles, Loader2, RefreshCw, SearchX } from 'lucide-react';
import { api } from '../api/client';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [similarCases, setSimilarCases] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [similarError, setSimilarError] = useState(null);

  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getCaseById(id);
        setCaseData(data);

        // Fetch open alerts to check if case is part of a cluster/hotspot
        try {
          const openAlerts = await api.getAlerts("open");
          const relatedAlerts = openAlerts.filter(a => {
            try {
              const ids = JSON.parse(a.RelatedCaseIDs);
              return ids.includes(parseInt(id));
            } catch (e) { return false; }
          });
          setActiveAlerts(relatedAlerts);
        } catch (alertErr) {
          console.error("Failed to load alerts", alertErr);
        }

        // Fetch similar cases
        setLoadingSimilar(true);
        setSimilarError(null);
        try {
          const simData = await api.getSimilarCases(id);
          setSimilarCases(simData || []);
        } catch (simErr) {
          console.error("Failed to load similar cases", simErr);
          setSimilarError("Failed to find related cases.");
        } finally {
          setLoadingSimilar(false);
        }
      } catch (err) {
        console.error("Failed to load case details", err);
        // Preserve the specific message from the API (e.g. "Case not found")
        setError(err.message || "Case not found or failed to load");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const data = await api.getSummary(id);
      setSummary(data);
    } catch (err) {
      console.error("Failed to generate summary", err);
      setSummaryError("Failed to generate AI summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleRegenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const data = await api.regenerateSummary(id);
      setSummary(data);
    } catch (err) {
      console.error("Failed to regenerate summary", err);
      setSummaryError("Failed to regenerate AI summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <div className="text-slate-400">Loading case details...</div>
      </div>
    );
  }

  if (error || !caseData) {
    const isNotFound = !caseData || (error && (error.toLowerCase().includes('not found') || error.includes('404')));
    return (
      <div className="flex-1 overflow-y-auto p-8 flex flex-col">
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white flex items-center space-x-2 mb-8 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-12 text-center max-w-md w-full">
            <div className="bg-slate-800/60 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
              <SearchX className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">
              {isNotFound ? 'Case Not Found' : 'Failed to Load Case'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {isNotFound
                ? `No record exists for case ID: ${id}. It may have been removed or the ID is incorrect.`
                : (error || 'An unexpected error occurred while loading this case.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Search Cases
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white flex items-center space-x-2 mb-2 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> <span>Back to Dashboard</span>
      </button>

      {/* Case Header */}
      <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-100">{caseData.CrimeNo}</h1>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded text-xs font-semibold">
              Category ID: {caseData.CaseCategoryID}
            </span>
          </div>
          <p className="text-sm text-slate-400">Registered: {new Date(caseData.CrimeRegisteredDate).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-right">
          <div className="text-xs text-slate-500 mb-1">Status</div>
          <div className="text-emerald-400 font-bold">{caseData.status?.CaseStatusName || `Status ID: ${caseData.CaseStatusID}`}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Alert Banner */}
          {activeAlerts.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-400 mb-1">Flagged for Review</h4>
                <p className="text-xs text-amber-200/80 mb-2">This case is part of {activeAlerts.length} active intelligence alert(s).</p>
                <div className="space-y-2 mt-2">
                  {activeAlerts.map(a => (
                    <div key={a.AlertID} className="text-xs bg-amber-500/10 text-amber-300/90 p-2 rounded border border-amber-500/20 flex justify-between items-center">
                      <span>{a.Reason}</span>
                      <button onClick={() => navigate('/alerts')} className="ml-3 shrink-0 text-amber-400 hover:text-amber-300 underline font-medium">View Alert</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Summary Panel */}
          <div className="bg-[#0f172a] border border-blue-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-blue-400 flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>AI Case Summary</span>
              </h3>
              {summary && (
                <span className="text-xs text-slate-500">
                  Generated {new Date(summary.GeneratedAt).toLocaleString()}
                </span>
              )}
            </div>

            {!summary && !isGeneratingSummary && (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm mb-4">Generate an extractive AI summary to quickly understand the key facts of this case.</p>
                <button
                  onClick={handleGenerateSummary}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 mx-auto transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Summary</span>
                </button>
              </div>
            )}

            {isGeneratingSummary && (
              <div className="text-center py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <p className="text-blue-400/80 text-sm font-medium animate-pulse">Analyzing facts & generating summary...</p>
              </div>
            )}

            {summary && !isGeneratingSummary && (
              <div className="space-y-3">
                <div className="bg-[#090d16]/50 p-4 rounded-lg border border-slate-800/50 relative group">
                  <p className="text-slate-200 text-sm leading-relaxed italic">
                    "{summary.SummaryText}"
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 border-t border-slate-800/60 pt-3">
                  <button
                    onClick={handleRegenerateSummary}
                    className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate Summary</span>
                  </button>
                  <div className="flex items-center space-x-2 text-amber-500/80 bg-amber-500/5 px-3 py-1.5 rounded border border-amber-500/10">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">AI-generated decision-support only, human review required</span>
                  </div>
                </div>
              </div>
            )}

            {summaryError && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center">
                {summaryError}
              </div>
            )}
          </div>

          {/* Similar Cases Panel */}
          <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Similar Cases</span>
              </h3>
            </div>

            {loadingSimilar ? (
              <div className="text-center py-4 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <p className="text-indigo-400/80 text-sm font-medium animate-pulse">Finding related cases...</p>
              </div>
            ) : similarError ? (
              <div className="text-center py-4 text-rose-400 text-sm">{similarError}</div>
            ) : similarCases.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center">
                <div className="bg-[#111726] border border-slate-800 rounded-lg p-6 max-w-sm">
                  No similar cases found based on available incident facts.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {similarCases.map(sc => (
                  <div
                    key={sc.CaseMasterID}
                    onClick={() => navigate(`/case/${sc.CaseMasterID}`)}
                    className="bg-[#090d16]/50 p-4 rounded-lg border border-slate-800/50 hover:border-indigo-500/50 hover:bg-slate-800/40 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-indigo-400 font-bold group-hover:text-indigo-300 transition-colors">{sc.CrimeNo}</span>
                        <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">Cat: {sc.CaseCategoryID}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sc.matched_on.map((tag, i) => (
                          <span key={i} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-bold text-slate-200">
                        {Math.round(sc.score * 100)}%
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Match Score</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Brief Facts</span>
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {caseData.BriefFacts}
            </p>
          </div>

          <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Involved Persons</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Complainants */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Complainants</h4>
                {caseData.complainants.length > 0 ? caseData.complainants.map(c => (
                  <div key={c.ComplainantID} className="bg-slate-900 p-3 rounded border border-slate-800 flex items-center space-x-3">
                    <div className="bg-slate-800 p-2 rounded-full"><User className="w-4 h-4 text-slate-400" /></div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">{c.ComplainantName}</div>
                      <div className="text-xs text-slate-500">Age: {c.AgeYear || 'Unknown'} | Gender ID: {c.GenderID}</div>
                    </div>
                  </div>
                )) : <div className="text-xs text-slate-500 italic">None recorded</div>}
              </div>

              {/* Victims */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Victims</h4>
                {caseData.victims.length > 0 ? caseData.victims.map(v => (
                  <div key={v.VictimMasterID} className="bg-slate-900 p-3 rounded border border-slate-800 flex items-center space-x-3">
                    <div className="bg-slate-800 p-2 rounded-full"><User className="w-4 h-4 text-slate-400" /></div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">{v.VictimName}</div>
                      <div className="text-xs text-slate-500">Age: {v.AgeYear || 'Unknown'} | Gender ID: {v.GenderID}</div>
                    </div>
                  </div>
                )) : <div className="text-xs text-slate-500 italic">None recorded</div>}
              </div>

              {/* Accused */}
              <div className="space-y-2 md:col-span-2 mt-4">
                <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Accused/Suspects</h4>
                {caseData.accused.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {caseData.accused.map(a => (
                      <div key={a.AccusedMasterID} className="bg-rose-500/5 p-3 rounded border border-rose-500/20 flex items-center space-x-3">
                        <div className="bg-rose-500/10 p-2 rounded-full"><User className="w-4 h-4 text-rose-400" /></div>
                        <div>
                          <div className="text-sm font-medium text-rose-200">{a.AccusedName}</div>
                          <div className="text-xs text-rose-400/70">Age: {a.AgeYear || 'Unknown'} | Gender ID: {a.GenderID}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-xs text-slate-500 italic">None recorded</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-6">
          <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>Location Data</span>
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500">Police Station ID</div>
                <div className="text-sm font-medium text-slate-200">{caseData.PoliceStationID}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Coordinates</div>
                <div className="text-sm font-medium text-slate-200">{caseData.latitude}, {caseData.longitude}</div>
              </div>
              <div className="h-32 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-xs text-slate-500">
                Map integration pending...
              </div>
            </div>
          </div>

          <div className="bg-[#0c1222] border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Incident Timeline</span>
            </h3>
            <div className="space-y-3">
              <div className="border-l-2 border-slate-700 pl-3 py-1 relative">
                <div className="absolute w-2 h-2 rounded-full bg-slate-500 -left-[5px] top-2"></div>
                <div className="text-xs text-slate-500">From Date</div>
                <div className="text-sm font-medium text-slate-200">{new Date(caseData.IncidentFromDate).toLocaleString()}</div>
              </div>
              {caseData.IncidentToDate && (
                <div className="border-l-2 border-slate-700 pl-3 py-1 relative">
                  <div className="absolute w-2 h-2 rounded-full bg-slate-500 -left-[5px] top-2"></div>
                  <div className="text-xs text-slate-500">To Date</div>
                  <div className="text-sm font-medium text-slate-200">{new Date(caseData.IncidentToDate).toLocaleString()}</div>
                </div>
              )}
              <div className="border-l-2 border-blue-500 pl-3 py-1 relative">
                <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[5px] top-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                <div className="text-xs text-blue-400">Registered Date</div>
                <div className="text-sm font-medium text-slate-200">{new Date(caseData.CrimeRegisteredDate).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
