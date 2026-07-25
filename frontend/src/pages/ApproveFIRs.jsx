import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Loader2, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { api } from '../api/client';

export default function ApproveFIRs() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    loadPendingFIRs();
  }, []);

  const loadPendingFIRs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStationPendingApprovalCases();
      setCases(data);
    } catch (err) {
      console.error("Failed to load pending FIRs", err);
      setError("Failed to load FIRs pending approval.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (caseId, e) => {
    e.stopPropagation();
    setApprovingId(caseId);
    try {
      await api.approveCase(caseId);
      // Remove approved case from list
      setCases(cases.filter(c => c.CaseMasterID !== caseId));
    } catch (err) {
      console.error("Failed to approve FIR", err);
      alert("Failed to approve FIR: " + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div className="bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent p-6 rounded-xl border border-sys-primary/20">
        <h2 className="text-xl font-bold text-sys-text-main flex items-center space-x-2">
          <CheckSquare className="w-5 h-5 text-sys-primary" />
          <span>Approve FIRs</span>
        </h2>
        <p className="text-sm text-sys-text-muted mt-1">
          Review and approve newly filed First Information Reports (FIRs) from your station.
        </p>
      </div>

      <div className="bg-sys-surface border border-sys-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-sys-border">
          <h3 className="font-bold text-sys-text-main">Pending Approval</h3>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-sys-border text-sys-text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Crime No</th>
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 px-4">Incident Details</th>
                  <th className="pb-3 pl-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-sys-text-muted">
                      <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span>Loading pending FIRs...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-rose-400 flex flex-col items-center justify-center">
                      <AlertTriangle className="w-8 h-8 mb-2" />
                      {error}
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center">
                      <div className="bg-sys-surface border border-sys-border rounded-xl p-8 max-w-md mx-auto">
                        <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                        <p className="text-sys-text-main font-bold text-lg mb-1">All Caught Up</p>
                        <p className="text-sys-text-muted text-sm">No FIRs are currently pending approval at your station.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cases.map(c => (
                    <tr 
                      key={c.CaseMasterID} 
                      className="hover:bg-sys-surface-hover/50 group cursor-pointer transition-colors"
                      onClick={() => navigate(`/case/${c.CaseMasterID}`)}
                    >
                      <td className="py-4 pr-4">
                        <div className="font-medium text-sys-text-main group-hover:text-sys-primary transition-colors">{c.CrimeNo}</div>
                      </td>
                      <td className="py-4 px-4 text-sys-text-muted whitespace-nowrap">
                        {new Date(c.CrimeRegisteredDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 max-w-sm">
                        <div className="text-xs text-sys-text-muted line-clamp-2">{c.BriefFacts}</div>
                      </td>
                      <td className="py-4 pl-4">
                        <div className="flex space-x-2">
                          <button 
                            className="text-xs bg-sys-surface-hover hover:bg-slate-700 text-sys-text-muted px-3 py-1.5 rounded border border-sys-border-strong transition"
                          >
                            View
                          </button>
                          <button 
                            onClick={(e) => handleApprove(c.CaseMasterID, e)}
                            disabled={approvingId === c.CaseMasterID}
                            className="text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-3 py-1.5 rounded border border-emerald-500/30 transition flex items-center space-x-1 disabled:opacity-50"
                          >
                            {approvingId === c.CaseMasterID ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            <span>Approve</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
