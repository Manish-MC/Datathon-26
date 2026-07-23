import React, { useState, useEffect } from 'react';
import { api, API_BASE_URL } from '../api/client';
import { CheckSquare, CheckCircle, Loader2, FileText, Film, FileAudio, File, MapPin, User, UserX, UserCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VerifyEvidence() {
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingEvidence();
      setPendingItems(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending evidence');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (evidenceId) => {
    setVerifyingId(evidenceId);
    try {
      await api.verifyEvidence(evidenceId);
      // Optimistic update
      setPendingItems(items => items.filter(i => i.EvidenceID !== evidenceId));
      setMessage('Evidence verified successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(`Error verifying evidence: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
            <CheckSquare className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-white">Verify Evidence</h1>
            <p className="text-sm text-slate-400">Review and verify evidence uploaded within your station.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-lg mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg mb-6 flex items-start">
            <CheckCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p>{message}</p>
          </div>
        )}

        {pendingItems.length === 0 ? (
          <div className="bg-[#111726] border border-slate-800 rounded-xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
            <h2 className="text-xl text-slate-200 font-light mb-2">All Caught Up!</h2>
            <p className="text-slate-500 text-sm">There is no pending evidence requiring verification at your station right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingItems.map(ev => {
              const isImage = ev.FileType.startsWith('image/');
              const isVideo = ev.FileType.startsWith('video/');
              const isAudio = ev.FileType.startsWith('audio/');
              
              return (
                <div key={ev.EvidenceID} className="bg-[#111726] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
                  {isImage ? (
                    <div className="h-48 bg-slate-900 border-b border-slate-800 relative group cursor-pointer" onClick={() => navigate(`/case/${ev.CaseMasterID}`)}>
                      <img src={`${API_BASE_URL}${ev.FileURL}`} alt="Evidence" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded">IMAGE</div>
                    </div>
                  ) : (
                    <div className="h-48 bg-slate-900/50 border-b border-slate-800 flex items-center justify-center flex-col text-slate-500 cursor-pointer" onClick={() => navigate(`/case/${ev.CaseMasterID}`)}>
                      {isVideo ? <Film className="w-12 h-12 mb-2 text-indigo-400" /> : 
                       isAudio ? <FileAudio className="w-12 h-12 mb-2 text-rose-400" /> : 
                       <File className="w-12 h-12 mb-2 text-blue-400" />}
                      <span className="text-xs font-medium uppercase">{ev.FileType.split('/')[1] || 'Document'} FILE</span>
                    </div>
                  )}
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-slate-200 line-clamp-1" title={ev.OriginalFileName}>{ev.OriginalFileName}</h3>
                        <p className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={() => navigate(`/case/${ev.CaseMasterID}`)}>
                          View Case #{ev.CaseMasterID}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0 bg-slate-800 px-2 py-1 rounded-md">
                        {(ev.FileSizeBytes / (1024*1024)).toFixed(2)} MB
                      </span>
                    </div>
                    
                    {ev.Description && <p className="text-xs text-slate-400 mb-4 line-clamp-2">{ev.Description}</p>}
                    
                    <div className="mt-auto pt-4 border-t border-slate-800/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Uploaded By</span>
                        <span className="text-xs text-slate-300 font-medium">{ev.uploader_name} ({ev.uploader_rank})</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Date</span>
                        <span className="text-xs text-slate-400">{new Date(ev.UploadedAt).toLocaleString()}</span>
                      </div>
                      
                      {(ev.LocationLat || ev.LocationText) && (
                        <div className="flex items-start">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 mr-1.5 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-400">
                            {ev.LocationText || `${ev.LocationLat}, ${ev.LocationLng}`}
                          </span>
                        </div>
                      )}

                      {ev.links && ev.links.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {ev.links.map(link => (
                            <span key={link.EvidenceLinkID} className="bg-slate-800/80 text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-700 flex items-center">
                              {link.PersonType === 'suspect' ? <UserX className="w-3 h-3 text-rose-400 mr-1" /> :
                               link.PersonType === 'victim' ? <UserCheck className="w-3 h-3 text-emerald-400 mr-1" /> :
                               <User className="w-3 h-3 text-slate-400 mr-1" />}
                              {link.PersonType === 'unlisted' ? 'Unlisted' : link.PersonType}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-3">
                        <button 
                          onClick={() => handleVerify(ev.EvidenceID)}
                          disabled={verifyingId === ev.EvidenceID}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          {verifyingId === ev.EvidenceID ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          <span>{verifyingId === ev.EvidenceID ? 'Verifying...' : 'Verify Evidence'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
