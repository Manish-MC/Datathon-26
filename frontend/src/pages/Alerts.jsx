import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, X, RefreshCw, Loader2, Link2, Sparkles, MapPin } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts();
      setAlerts(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load alerts", err);
      setError("Failed to load alerts from backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAlerts = async () => {
    try {
      setRefreshing(true);
      await api.refreshAlerts();
      await fetchAlerts();
    } catch (err) {
      console.error("Failed to generate new alerts", err);
      alert("Failed to refresh alerts.");
    } finally {
      setRefreshing(false);
    }
  };

  const updateStatus = async (alertId, newStatus) => {
    try {
      await api.updateAlertStatus(alertId, { Status: newStatus, ReviewedBy: 'Current User' });
      // update local state to avoid full refetch
      setAlerts(alerts.map(a => a.AlertID === alertId ? { ...a, Status: newStatus, ReviewedBy: 'Current User' } : a));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update alert status.");
    }
  };

  if (loading && alerts.length === 0) {
    return <div className="p-8 text-sys-text-muted flex items-center space-x-2"><Loader2 className="w-5 h-5 animate-spin" /><span>Loading alerts...</span></div>;
  }

  const openAlerts = alerts.filter(a => a.Status === 'open');
  const pastAlerts = alerts.filter(a => a.Status !== 'open');

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-sys-text-main mb-2 flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <span>Decision Support Alerts</span>
          </h1>
          <p className="text-sys-text-muted">AI-driven actionable insights requiring human review.</p>
          <div className="mt-3 inline-flex items-center space-x-2 text-amber-500/80 bg-amber-500/5 px-3 py-1.5 rounded border border-amber-500/10">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">AI-generated decision-support only, human review required</span>
          </div>
        </div>
        
        <button 
          onClick={handleRefreshAlerts}
          disabled={refreshing}
          className="bg-sys-surface hover:bg-sys-surface-hover border border-sys-border-strong text-sys-text-main text-sm font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Analyzing Data...' : 'Run Analytics Engine'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Open Alerts Section */}
        <section>
          <h2 className="text-lg font-bold text-sys-text-main mb-4 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Needs Review ({openAlerts.length})</span>
          </h2>
          
          {openAlerts.length === 0 ? (
            <div className="bg-sys-surface border border-sys-border rounded-xl p-8 text-center">
              <Check className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
              <p className="text-sys-text-muted">No open alerts. You're all caught up!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {openAlerts.map(alert => <AlertCard key={alert.AlertID} alert={alert} onAction={updateStatus} navigate={navigate} hasPermission={hasPermission} />)}
            </div>
          )}
        </section>

        {/* Reviewed/Dismissed Section */}
        {pastAlerts.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-sys-text-muted mb-4 flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Resolved ({pastAlerts.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 opacity-75">
              {pastAlerts.map(alert => <AlertCard key={alert.AlertID} alert={alert} onAction={updateStatus} navigate={navigate} hasPermission={hasPermission} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AlertCard({ alert, onAction, navigate, hasPermission }) {
  let relatedIds = [];
  try {
    relatedIds = JSON.parse(alert.RelatedCaseIDs);
  } catch (e) {}

  const isCluster = alert.AlertType === 'similar_cluster';
  
  return (
    <div className={`bg-sys-surface border ${alert.Status === 'open' ? (isCluster ? 'border-indigo-500/50' : 'border-rose-500/50') : 'border-sys-border'} rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 group transition-colors`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${alert.Status === 'open' ? (isCluster ? 'bg-indigo-500' : 'bg-rose-500') : 'bg-slate-600'}`}></div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-2">
          {isCluster ? (
            <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-bold ${alert.Status === 'open' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-sys-surface-hover text-sys-text-muted'}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>SIMILARITY CLUSTER</span>
            </span>
          ) : (
            <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-bold ${alert.Status === 'open' ? 'bg-rose-500/20 text-rose-400' : 'bg-sys-surface-hover text-sys-text-muted'}`}>
              <MapPin className="w-3.5 h-3.5" />
              <span>HOTSPOT SPIKE</span>
            </span>
          )}
          <span className="text-xs text-sys-text-muted">{new Date(alert.CreatedAt).toLocaleString()}</span>
        </div>
        
        <p className={`text-base font-medium mb-4 ${alert.Status === 'open' ? 'text-sys-text-main' : 'text-sys-text-muted'}`}>
          {alert.Reason}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-sys-text-muted mr-2">Linked Cases:</span>
          {relatedIds.map(id => (
            <button 
              key={id}
              onClick={() => navigate(`/case/${id}`)}
              className="bg-blue-600/10 hover:bg-blue-600/20 text-sys-primary border border-sys-primary/20 px-2 py-0.5 rounded text-xs transition-colors flex items-center space-x-1"
            >
              <Link2 className="w-3 h-3" />
              <span>ID: {id}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-sys-border pt-4 md:pt-0 md:pl-6 shrink-0 min-w-[200px]">
        {alert.Status === 'open' ? (
          <>
            {hasPermission("approve_alert_action") && (
              <button 
                onClick={() => onAction(alert.AlertID, 'reviewed')}
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Mark Reviewed</span>
              </button>
            )}
            {hasPermission("dismiss_alert") && (
              <button 
                onClick={() => onAction(alert.AlertID, 'dismissed')}
                className="w-full bg-sys-surface-hover hover:bg-slate-700 text-sys-text-muted font-medium py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Dismiss</span>
              </button>
            )}
          </>
        ) : (
          <div className="text-right w-full">
            <div className="text-xs text-sys-text-muted uppercase tracking-wider font-semibold mb-1">Status</div>
            <div className={`font-bold ${alert.Status === 'reviewed' ? 'text-emerald-500' : 'text-sys-text-muted'}`}>
              {alert.Status.toUpperCase()}
            </div>
            <div className="text-xs text-sys-text-muted mt-2">By: {alert.ReviewedBy}</div>
          </div>
        )}
      </div>
    </div>
  );
}
