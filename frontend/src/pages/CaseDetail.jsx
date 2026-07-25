import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, AlertCircle, FileText, Calendar, Sparkles, Loader2, RefreshCw, SearchX, AlertTriangle, UserX, UserCheck, Film, FileAudio, File, CheckCircle, X, Shield, Send } from 'lucide-react';
import { api, API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [summary, setSummary] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [similarCases, setSimilarCases] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [similarError, setSimilarError] = useState(null);

  const [activeAlerts, setActiveAlerts] = useState([]);
  
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertReason, setAlertReason] = useState('');
  const [isAlerting, setIsAlerting] = useState(false);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [districtInspectors, setDistrictInspectors] = useState([]);
  const [orderData, setOrderData] = useState({ targetInspectorId: 'all', directiveNote: '' });
  const [isOrdering, setIsOrdering] = useState(false);

  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [flagData, setFlagData] = useState({ toDepartmentId: '', note: '' });
  const [isFlagging, setIsFlagging] = useState(false);

  useEffect(() => {
    if (hasPermission('order_investigation')) {
      api.getDistrictInspectors().then(setDistrictInspectors).catch(() => {});
    }
    if (hasPermission('inter_department_collaboration')) {
      api.getDepartments().then(setDepartments).catch(() => {});
    }
  }, [hasPermission]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getCaseById(id);
        setCaseData(data);

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

  const getTimeline = () => {
    const events = [];
    if (caseData.CrimeRegisteredDate) events.push({ date: caseData.CrimeRegisteredDate, title: 'Case Registered', type: 'creation' });
    if (caseData.evidence) caseData.evidence.forEach(ev => events.push({ date: ev.UploadedAt, title: `Evidence Added: ${ev.OriginalFileName}`, type: 'evidence' }));
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <div className="text-sys-text-muted">Loading case details...</div>
      </div>
    );
  }

  if (error || !caseData) {
    const isNotFound = !caseData || (error && (error.toLowerCase().includes('not found') || error.includes('404')));
    return (
      <div className="flex-1 overflow-y-auto p-8 flex flex-col">
        <button
          onClick={() => navigate('/')}
          className="text-sys-text-muted hover:text-sys-text-inverse flex items-center space-x-2 mb-8 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-sys-surface border border-sys-border rounded-xl p-12 text-center max-w-md w-full">
            <div className="bg-sys-surface-hover w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
              <SearchX className="w-8 h-8 text-sys-text-muted" />
            </div>
            <h2 className="text-xl font-bold text-sys-text-main mb-2">
              {isNotFound ? 'Case Not Found' : 'Failed to Load Case'}
            </h2>
            <p className="text-sys-text-muted text-sm mb-6">
              {isNotFound
                ? `No record exists for case ID: ${id}. It may have been removed or the ID is incorrect.`
                : (error || 'An unexpected error occurred while loading this case.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse text-sm font-medium rounded-lg transition-colors"
              >
                Search Cases
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 bg-sys-surface-hover hover:bg-slate-700 text-sys-text-muted text-sm font-medium rounded-lg transition-colors"
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
    <div className="flex-1 overflow-y-auto">
      <div className="p-8 pb-0">
        <button onClick={() => navigate(-1)} className="text-sys-text-muted hover:text-sys-text-inverse flex items-center space-x-2 mb-2 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> <span>Back to Dashboard</span>
        </button>

        <div className="bg-sys-surface border border-sys-border rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-sys-text-main">{caseData.CrimeNo}</h1>
              <span className="bg-blue-500/10 text-sys-primary border border-sys-primary/25 px-2.5 py-1 rounded text-xs font-semibold">
                Category ID: {caseData.CaseCategoryID}
              </span>
            </div>
            <p className="text-sm text-sys-text-muted">Registered: {new Date(caseData.CrimeRegisteredDate).toLocaleString()}</p>
          </div>
          <div className="flex space-x-4 items-center">
            {hasPermission('broadcast_urgent_alert') && (
              <button 
                onClick={() => {
                  setAlertReason("Immediate inspection required on Case " + caseData.CrimeNo);
                  setIsAlertModalOpen(true);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-sys-text-inverse text-sm rounded flex items-center space-x-1.5 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Alert Station Team</span>
              </button>
            )}
            
            {hasPermission('order_investigation') && (
              <button 
                onClick={() => setIsOrderModalOpen(true)}
                className="px-3 py-1.5 bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse text-sm rounded flex items-center space-x-1.5 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Order Investigation</span>
              </button>
            )}
            
            {hasPermission('inter_department_collaboration') && (
              <button 
                onClick={() => setIsFlagModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-sys-text-inverse text-sm rounded flex items-center space-x-1.5 transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Flag to Dept</span>
              </button>
            )}
            <div className="bg-sys-surface-hover p-3 rounded-lg border border-sys-border text-right">
              <div className="text-xs text-sys-text-muted mb-1">Status</div>
              <div className="text-emerald-400 font-bold">{caseData.status?.CaseStatusName || `Status ID: ${caseData.CaseStatusID}`}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-sys-border mb-6 sticky top-0 z-20 bg-sys-bg px-2 md:px-8 overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'text-sys-primary border-b-2 border-blue-400' : 'text-sys-text-muted hover:text-sys-text-main'}`}>Overview</button>
        <button onClick={() => setActiveTab('parties')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'parties' ? 'text-sys-primary border-b-2 border-blue-400' : 'text-sys-text-muted hover:text-sys-text-main'}`}>Involved Parties</button>
        <button onClick={() => setActiveTab('timeline')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'timeline' ? 'text-sys-primary border-b-2 border-blue-400' : 'text-sys-text-muted hover:text-sys-text-main'}`}>Timeline</button>
        <button onClick={() => setActiveTab('evidence')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-2 ${activeTab === 'evidence' ? 'text-sys-primary border-b-2 border-blue-400' : 'text-sys-text-muted hover:text-sys-text-main'}`}>
          <span>Evidence</span>
          {caseData.evidence?.length > 0 && <span className="bg-blue-500/20 text-sys-primary py-0.5 px-2 rounded-full text-[10px]">{caseData.evidence.length}</span>}
        </button>
        <button onClick={() => setActiveTab('similar')} className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'similar' ? 'text-sys-primary border-b-2 border-blue-400' : 'text-sys-text-muted hover:text-sys-text-main'}`}>Similar Cases</button>
      </div>

      <div className="p-8 pt-0">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {activeAlerts.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-sys-text-main mb-1">Flagged for Review</h4>
                    <p className="text-xs text-sys-text-muted mb-2">This case is part of {activeAlerts.length} active intelligence alert(s).</p>
                    <div className="space-y-2 mt-2">
                      {activeAlerts.map(a => (
                        <div key={a.AlertID} className="text-xs bg-amber-500/10 text-sys-text-main p-2 rounded border border-amber-500/20 flex justify-between items-center">
                          <span>{a.Reason}</span>
                          <button onClick={() => navigate('/alerts')} className="ml-3 shrink-0 text-amber-600 hover:text-amber-500 underline font-medium">View Alert</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-sys-surface border border-sys-primary/30 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-sys-primary flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Case Summary</span>
                  </h3>
                  {summary && <span className="text-xs text-sys-text-muted">Generated {new Date(summary.GeneratedAt).toLocaleString()}</span>}
                </div>
                {!summary && !isGeneratingSummary && (
                  <div className="text-center py-4">
                    <p className="text-sys-text-muted text-sm mb-4">Generate an extractive AI summary to quickly understand the key facts of this case.</p>
                    <button onClick={handleGenerateSummary} className="bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 mx-auto transition-colors">
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Summary</span>
                    </button>
                  </div>
                )}
                {isGeneratingSummary && <div className="text-center py-6 flex flex-col items-center justify-center space-y-3"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /><p className="text-sys-primary/80 text-sm font-medium animate-pulse">Analyzing facts & generating summary...</p></div>}
                {summary && !isGeneratingSummary && (
                  <div className="space-y-3">
                    <div className="bg-sys-bg/50 p-4 rounded-lg border border-sys-border/50 relative group">
                      <p className="text-sys-text-main text-sm leading-relaxed italic">"{summary.SummaryText}"</p>
                    </div>
                    <div className="flex items-center justify-between mt-4 border-t border-sys-border/60 pt-3">
                      <button onClick={handleRegenerateSummary} className="flex items-center space-x-1.5 text-xs text-sys-primary hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-sys-primary-hover/20 px-3 py-1.5 rounded-lg border border-sys-primary/20">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Regenerate Summary</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-sys-surface border border-sys-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-sys-text-main mb-4 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-sys-primary" />
                  <span>Brief Facts</span>
                </h3>
                <p className="text-sys-text-muted text-sm leading-relaxed whitespace-pre-wrap">
                  {caseData.BriefFacts}
                </p>
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              <div className="bg-sys-surface border border-sys-border rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-sys-text-main mb-2 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>Location Data</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-sys-text-muted">Police Station ID</div>
                    <div className="text-sm font-medium text-sys-text-main">{caseData.PoliceStationID}</div>
                  </div>
                  <div>
                    <div className="text-xs text-sys-text-muted">Coordinates</div>
                    <div className="text-sm font-medium text-sys-text-main">{caseData.latitude}, {caseData.longitude}</div>
                  </div>
                  <div className="h-32 bg-sys-surface border border-sys-border rounded flex items-center justify-center text-xs text-sys-text-muted">
                    Map integration pending...
                  </div>
                </div>
              </div>

              <div className="bg-sys-surface border border-sys-border rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-sys-text-main mb-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Incident Timeline</span>
                </h3>
                <div className="space-y-3">
                  <div className="border-l-2 border-sys-border-strong pl-3 py-1 relative">
                    <div className="absolute w-2 h-2 rounded-full bg-slate-500 -left-[5px] top-2"></div>
                    <div className="text-xs text-sys-text-muted">From Date</div>
                    <div className="text-sm font-medium text-sys-text-main">{new Date(caseData.IncidentFromDate).toLocaleString()}</div>
                  </div>
                  {caseData.IncidentToDate && (
                    <div className="border-l-2 border-sys-border-strong pl-3 py-1 relative">
                      <div className="absolute w-2 h-2 rounded-full bg-slate-500 -left-[5px] top-2"></div>
                      <div className="text-xs text-sys-text-muted">To Date</div>
                      <div className="text-sm font-medium text-sys-text-main">{new Date(caseData.IncidentToDate).toLocaleString()}</div>
                    </div>
                  )}
                  <div className="border-l-2 border-sys-primary pl-3 py-1 relative">
                    <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[5px] top-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    <div className="text-xs text-sys-primary">Registered Date</div>
                    <div className="text-sm font-medium text-sys-text-main">{new Date(caseData.CrimeRegisteredDate).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-4xl">
            <h2 className="text-xl text-sys-text-inverse font-light mb-6 flex items-center">
              <Calendar className="w-5 h-5 text-blue-500 mr-2" />
              Case Timeline
            </h2>
            <div className="relative border-l border-sys-border ml-3 space-y-8 pb-8">
              {getTimeline().map((evt, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className={`absolute -left-2 top-1.5 w-4 h-4 rounded-full border-2 border-[#0a0f1d] ${evt.type === 'creation' ? 'bg-emerald-500' : evt.type === 'evidence' ? 'bg-blue-500' : 'bg-slate-500'}`}></div>
                  <div className="bg-sys-surface border border-sys-border p-4 rounded-xl shadow-sm">
                    <p className="text-xs text-sys-primary mb-1">{new Date(evt.date).toLocaleString()}</p>
                    <p className="text-sm text-sys-text-main">{evt.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="max-w-5xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-sys-text-inverse font-light flex items-center">
                <FileText className="w-5 h-5 text-blue-500 mr-2" />
                Evidence Logs
              </h2>
              {hasPermission('upload_evidence') && (
                <button onClick={() => navigate('/evidence/submit')} className="px-4 py-2 bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse text-sm font-medium rounded-lg transition-colors">Add Evidence</button>
              )}
            </div>

            {(!caseData.evidence || caseData.evidence.length === 0) ? (
              <div className="bg-sys-surface border border-sys-border rounded-xl p-8 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-sys-text-muted font-medium mb-1">No Evidence Logged</h3>
                <p className="text-sys-text-muted text-sm">There is no evidence uploaded for this case yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseData.evidence.map(ev => {
                  const isImage = ev.FileType.startsWith('image/');
                  const isVideo = ev.FileType.startsWith('video/');
                  const isAudio = ev.FileType.startsWith('audio/');
                  
                  return (
                    <div key={ev.EvidenceID} className="bg-sys-surface border border-sys-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                      {isImage ? (
                        <div className="h-40 bg-sys-surface border-b border-sys-border overflow-hidden relative group">
                          <img src={`${API_BASE_URL}${ev.FileURL}`} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-sys-text-inverse text-[10px] px-2 py-1 rounded">IMAGE</div>
                        </div>
                      ) : (
                        <div className="h-40 bg-sys-surface-hover border-b border-sys-border flex items-center justify-center flex-col text-sys-text-muted">
                          {isVideo ? <Film className="w-12 h-12 mb-2 text-indigo-400" /> : 
                           isAudio ? <FileAudio className="w-12 h-12 mb-2 text-rose-400" /> : 
                           <File className="w-12 h-12 mb-2 text-sys-primary" />}
                          <span className="text-xs font-medium uppercase">{ev.FileType.split('/')[1] || 'Document'} FILE</span>
                        </div>
                      )}
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-medium text-sys-text-main truncate pr-2" title={ev.OriginalFileName}>{ev.OriginalFileName}</h3>
                          <span className="text-xs text-sys-text-muted shrink-0">{(ev.FileSizeBytes / (1024*1024)).toFixed(2)} MB</span>
                        </div>
                        
                        {ev.Description && <p className="text-xs text-sys-text-muted mb-4 line-clamp-2">{ev.Description}</p>}
                        
                        <div className="mt-auto pt-4 border-t border-sys-border/50 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-sys-text-muted uppercase tracking-wider">Uploaded By</span>
                            <span className="text-xs text-sys-text-muted">{ev.uploader_name} ({ev.uploader_rank})</span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2 border-t border-sys-border/50 pt-2">
                            <span className="text-[10px] text-sys-text-muted uppercase tracking-wider">Verification</span>
                            {ev.VerificationStatus === 'verified' ? (
                              <span className="text-[10px] text-emerald-700 font-medium flex items-center bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified by {ev.VerifiedByEmployeeID} — {ev.VerifiedByRankName}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-700 font-medium flex items-center bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending Verification
                              </span>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-[10px] text-sys-text-muted uppercase tracking-wider">Date</span>
                            <span className="text-xs text-sys-primary">{new Date(ev.UploadedAt).toLocaleDateString()}</span>
                          </div>
                          
                          {(ev.LocationLat || ev.LocationText) && (
                            <div className="flex items-start mt-2">
                              <MapPin className="w-3.5 h-3.5 text-rose-400 mr-1.5 shrink-0 mt-0.5" />
                              <span className="text-xs text-sys-text-muted">
                                {ev.LocationText || `${ev.LocationLat}, ${ev.LocationLng}`}
                              </span>
                            </div>
                          )}

                          {ev.links && ev.links.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {ev.links.map(link => (
                                <span key={link.EvidenceLinkID} className="bg-sys-surface-hover text-sys-text-muted text-[10px] px-2 py-0.5 rounded-full border border-sys-border-strong flex items-center">
                                  {link.PersonType === 'suspect' ? <UserX className="w-3 h-3 text-rose-400 mr-1" /> :
                                   link.PersonType === 'victim' ? <UserCheck className="w-3 h-3 text-emerald-400 mr-1" /> :
                                   <User className="w-3 h-3 text-sys-text-muted mr-1" />}
                                  {link.PersonType === 'unlisted' ? 'Unlisted' : link.PersonType}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'similar' && (
          <div className="max-w-4xl">
            <div className="bg-sys-surface border border-sys-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-sys-text-main flex items-center space-x-2">
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
                <div className="text-center py-8 text-sys-text-muted text-sm flex flex-col items-center">
                  <div className="bg-sys-surface border border-sys-border rounded-lg p-6 max-w-sm">
                    No similar cases found based on available incident facts.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {similarCases.map(sc => (
                    <div
                      key={sc.CaseMasterID}
                      onClick={() => navigate(`/case/${sc.CaseMasterID}`)}
                      className="bg-sys-bg/50 p-4 rounded-lg border border-sys-border/50 hover:border-indigo-500/50 hover:bg-sys-surface-hover/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-indigo-400 font-bold group-hover:text-indigo-300 transition-colors">{sc.CrimeNo}</span>
                          <span className="bg-sys-surface-hover text-sys-text-muted text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">Cat: {sc.CaseCategoryID}</span>
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
                        <div className="text-2xl font-bold text-sys-text-main">
                          {Math.round(sc.score * 100)}%
                        </div>
                        <div className="text-[10px] text-sys-text-muted uppercase tracking-widest font-semibold">Match Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'parties' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-sys-surface border border-sys-border rounded-xl p-6">
              <h3 className="text-sm font-bold text-sys-text-main mb-4 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Involved Persons</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Complainants */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-sys-text-muted uppercase tracking-wider mb-2">Complainants</h4>
                  {caseData.complainants.length > 0 ? caseData.complainants.map(c => (
                    <div key={c.ComplainantID} className="bg-sys-surface p-3 rounded border border-sys-border flex items-center space-x-3">
                      <div className="bg-sys-surface-hover p-2 rounded-full"><User className="w-4 h-4 text-sys-text-muted" /></div>
                      <div>
                        <div className="text-sm font-medium text-sys-text-main">{c.ComplainantName}</div>
                        <div className="text-xs text-sys-text-muted">Age: {c.AgeYear || 'Unknown'} | Gender ID: {c.GenderID}</div>
                      </div>
                    </div>
                  )) : <div className="text-xs text-sys-text-muted italic">None recorded</div>}
                </div>

                {/* Victims */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-sys-text-muted uppercase tracking-wider mb-2">Victims</h4>
                  {caseData.victims.length > 0 ? caseData.victims.map(v => (
                    <div key={v.VictimMasterID} className="bg-sys-surface p-3 rounded border border-sys-border flex items-center space-x-3">
                      <div className="bg-sys-surface-hover p-2 rounded-full"><User className="w-4 h-4 text-sys-text-muted" /></div>
                      <div>
                        <div className="text-sm font-medium text-sys-text-main">{v.VictimName}</div>
                        <div className="text-xs text-sys-text-muted">Age: {v.AgeYear || 'Unknown'} | Gender ID: {v.GenderID}</div>
                      </div>
                    </div>
                  )) : <div className="text-xs text-sys-text-muted italic">None recorded</div>}
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
                  ) : <div className="text-xs text-sys-text-muted italic">None recorded</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-sys-surface border border-rose-500/30 rounded-xl shadow-2xl w-full max-w-md flex flex-col mx-4">
            <div className="flex items-center justify-between p-5 border-b border-sys-border shrink-0">
              <div className="flex items-center space-x-2 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg font-semibold text-sys-text-main">Broadcast Urgent Alert</h2>
              </div>
              <button onClick={() => setIsAlertModalOpen(false)} className="p-2 text-sys-text-muted hover:text-sys-text-main transition-colors rounded-lg hover:bg-sys-surface-hover">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-sys-text-muted mb-4">This will immediately notify all lower-ranking officers at your station with an urgent inspection alert.</p>
              <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Reason for Alert</label>
              <input
                type="text"
                value={alertReason}
                onChange={(e) => setAlertReason(e.target.value)}
                placeholder="Briefly state the reason..."
                className="w-full bg-sys-bg border border-sys-border-strong rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-rose-500 transition-colors"
                autoFocus
              />
            </div>
            <div className="p-5 border-t border-sys-border flex justify-end space-x-3 bg-sys-bg rounded-b-xl">
              <button 
                onClick={() => setIsAlertModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-sys-text-muted hover:text-sys-text-main hover:bg-sys-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!alertReason.trim() || isAlerting}
                onClick={async () => {
                  setIsAlerting(true);
                  try {
                    await api.broadcastUrgentAlert(caseData.CaseMasterID, alertReason);
                    alert("Urgent alert sent to station team.");
                    setIsAlertModalOpen(false);
                  } catch (e) {
                    alert("Failed to send alert: " + e.message);
                  } finally {
                    setIsAlerting(false);
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-500 text-sys-text-inverse transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isAlerting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{isAlerting ? 'Sending...' : 'Broadcast Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-sys-surface border border-sys-primary/30 rounded-xl shadow-2xl w-full max-w-md flex flex-col mx-4">
            <div className="flex items-center justify-between p-5 border-b border-sys-border shrink-0">
              <div className="flex items-center space-x-2 text-blue-500">
                <Shield className="w-5 h-5" />
                <h2 className="text-lg font-semibold text-sys-text-main">Order Investigation</h2>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)} className="p-2 text-sys-text-muted hover:text-sys-text-main transition-colors rounded-lg hover:bg-sys-surface-hover">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Assign To</label>
                <select
                  value={orderData.targetInspectorId}
                  onChange={(e) => setOrderData({...orderData, targetInspectorId: e.target.value})}
                  className="w-full bg-sys-bg border border-sys-border-strong rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors"
                >
                  <option value="all">Notify ALL Inspectors in District</option>
                  {districtInspectors.map(insp => (
                    <option key={insp.EmployeeID} value={insp.EmployeeID}>
                      {insp.EmployeeName} ({insp.LoginID})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Directive Note (Optional)</label>
                <textarea
                  value={orderData.directiveNote}
                  onChange={(e) => setOrderData({...orderData, directiveNote: e.target.value})}
                  placeholder="Specific instructions..."
                  rows={3}
                  className="w-full bg-sys-bg border border-sys-border-strong rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-sys-border flex justify-end space-x-3 bg-sys-bg rounded-b-xl">
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-sys-text-muted hover:text-sys-text-main hover:bg-sys-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={isOrdering}
                onClick={async () => {
                  setIsOrdering(true);
                  try {
                    const payload = {
                      TargetInspectorEmployeeID: orderData.targetInspectorId === 'all' ? null : parseInt(orderData.targetInspectorId),
                      NotifyAllInspectors: orderData.targetInspectorId === 'all',
                      DirectiveNote: orderData.directiveNote.trim() || null
                    };
                    await api.orderInvestigation(caseData.CaseMasterID, payload);
                    alert("Investigation order issued successfully.");
                    setIsOrderModalOpen(false);
                    setOrderData({ targetInspectorId: 'all', directiveNote: '' });
                  } catch (e) {
                    alert("Failed to issue order: " + e.message);
                  } finally {
                    setIsOrdering(false);
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isOrdering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isOrdering ? 'Sending...' : 'Issue Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isFlagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-sys-surface border border-indigo-500/30 rounded-xl shadow-2xl w-full max-w-md flex flex-col mx-4">
            <div className="flex items-center justify-between p-5 border-b border-sys-border shrink-0">
              <div className="flex items-center space-x-2 text-indigo-500">
                <AlertCircle className="w-5 h-5" />
                <h2 className="text-lg font-semibold text-sys-text-main">Flag to Department</h2>
              </div>
              <button onClick={() => setIsFlagModalOpen(false)} className="p-2 text-sys-text-muted hover:text-sys-text-main transition-colors rounded-lg hover:bg-sys-surface-hover">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Target Department</label>
                <select
                  value={flagData.toDepartmentId}
                  onChange={(e) => setFlagData({...flagData, toDepartmentId: e.target.value})}
                  className="w-full bg-sys-bg border border-sys-border-strong rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select a department...</option>
                  {departments.map(dept => (
                    <option key={dept.DepartmentID} value={dept.DepartmentID}>
                      {dept.DepartmentName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Note</label>
                <textarea
                  value={flagData.note}
                  onChange={(e) => setFlagData({...flagData, note: e.target.value})}
                  placeholder="Reason for flagging this case..."
                  rows={3}
                  className="w-full bg-sys-surface border border-sys-border-strong rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-sys-border flex justify-end space-x-3 bg-sys-bg rounded-b-xl">
              <button 
                onClick={() => setIsFlagModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-sys-text-muted hover:text-sys-text-main hover:bg-sys-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={isFlagging || !flagData.toDepartmentId || !flagData.note.trim()}
                onClick={async () => {
                  setIsFlagging(true);
                  try {
                    await api.flagCaseToDepartment(caseData.CaseMasterID, parseInt(flagData.toDepartmentId), flagData.note.trim());
                    alert("Case flagged successfully.");
                    setIsFlagModalOpen(false);
                    setFlagData({ toDepartmentId: '', note: '' });
                  } catch (e) {
                    alert("Failed to flag case: " + e.message);
                  } finally {
                    setIsFlagging(false);
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-sys-text-inverse transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isFlagging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isFlagging ? 'Flagging...' : 'Flag Case'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
