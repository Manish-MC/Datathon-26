import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, Loader2, Users, FileText, Send, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

export default function DistrictCommand() {
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    caseId: '',
    targetInspectorId: 'all',
    directiveNote: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        const insps = await api.getDistrictInspectors();
        setInspectors(insps);
      } catch (e) {
        console.error("Failed to load inspectors", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.caseId.trim()) return alert("Please provide a valid Case Master ID.");

    setSubmitting(true);
    try {
      const payload = {
        TargetInspectorEmployeeID: formData.targetInspectorId === 'all' ? null : parseInt(formData.targetInspectorId),
        NotifyAllInspectors: formData.targetInspectorId === 'all',
        DirectiveNote: formData.directiveNote.trim() || null
      };

      await api.orderInvestigation(parseInt(formData.caseId), payload);
      alert("Investigation order issued successfully.");
      setFormData({ caseId: '', targetInspectorId: 'all', directiveNote: '' });
    } catch (e) {
      alert("Failed to issue order: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-sys-text-muted" /></div>;
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-blue-500/10 p-3 rounded-xl border border-sys-primary/20">
            <Shield className="w-6 h-6 text-sys-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-sys-text-main">District Command</h1>
            <p className="text-sys-text-muted text-sm mt-1">Issue investigation orders to Inspectors across your district.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-sys-surface rounded-xl border border-sys-border p-6 shadow-xl">
          <div className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-sys-text-muted mb-2 flex items-center space-x-2">
                <Search className="w-4 h-4 text-sys-text-muted" />
                <span>Target Case ID</span>
              </label>
              <input
                type="number"
                value={formData.caseId}
                onChange={(e) => setFormData({...formData, caseId: e.target.value})}
                placeholder="Enter Case Master ID (e.g. 1)"
                className="w-full bg-sys-surface border border-sys-border-strong rounded-lg px-4 py-2.5 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors"
                required
              />
              <p className="text-xs text-sys-text-muted mt-1.5">Specify the numeric Case Master ID for this order.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-sys-text-muted mb-2 flex items-center space-x-2">
                <Users className="w-4 h-4 text-sys-text-muted" />
                <span>Assign To Inspector</span>
              </label>
              <select
                value={formData.targetInspectorId}
                onChange={(e) => setFormData({...formData, targetInspectorId: e.target.value})}
                className="w-full bg-sys-surface border border-sys-border-strong rounded-lg px-4 py-2.5 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors"
              >
                <option value="all">Notify ALL Inspectors in District</option>
                {inspectors.map(insp => (
                  <option key={insp.EmployeeID} value={insp.EmployeeID}>
                    {insp.EmployeeName} ({insp.LoginID})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-sys-text-muted mb-2 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-sys-text-muted" />
                <span>Directive Note (Optional)</span>
              </label>
              <textarea
                value={formData.directiveNote}
                onChange={(e) => setFormData({...formData, directiveNote: e.target.value})}
                placeholder="Specific instructions or context for the investigation..."
                rows={3}
                className="w-full bg-sys-surface border border-sys-border-strong rounded-lg px-4 py-2.5 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors resize-none"
              />
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-sys-border flex justify-end">
            <button
              type="submit"
              disabled={submitting || !formData.caseId}
              className="bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Issuing Order...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Issue Investigation Order</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-400/90">
            <strong>Important:</strong> Issuing an order will send an urgent notification to the selected Inspector(s). A formal `Investigation` record will also be logged in the system.
          </div>
        </div>

      </div>
    </div>
  );
}
