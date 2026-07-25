import React, { useState } from 'react';
import { X, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function NewFIRModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    CrimeNo: '',
    CaseCategoryID: 1, // Defaulting to an existing category
    PoliceStationID: 1,
    IncidentFromDate: new Date().toISOString().slice(0, 16),
    latitude: 12.9716, // Default Bangalore Lat
    longitude: 77.5946, // Default Bangalore Lon
    BriefFacts: '',
    BroadcastReason: '',
  });

  const { hasPermission } = useAuth();
  const [sendUrgentAlert, setSendUrgentAlert] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.CrimeNo) newErrors.CrimeNo = 'Crime No is required';
    if (!formData.CaseCategoryID) newErrors.CaseCategoryID = 'Category is required';
    if (!formData.PoliceStationID) newErrors.PoliceStationID = 'Police Station is required';
    if (!formData.IncidentFromDate) newErrors.IncidentFromDate = 'Date is required';
    if (!formData.latitude || isNaN(formData.latitude)) newErrors.latitude = 'Valid latitude is required';
    if (!formData.longitude || isNaN(formData.longitude)) newErrors.longitude = 'Valid longitude is required';
    if (!formData.BriefFacts) newErrors.BriefFacts = 'Brief Facts is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'CaseCategoryID' || name === 'PoliceStationID') {
      finalValue = parseInt(value, 10);
    } else if (name === 'latitude' || name === 'longitude') {
      finalValue = parseFloat(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError('');

    try {
      // Date formatting for backend: YYYY-MM-DD HH:mm:SS
      const dateObj = new Date(formData.IncidentFromDate);
      const formattedDate = dateObj.toISOString();

      const payload = {
        ...formData,
        IncidentFromDate: formattedDate,
        BroadcastOnCreate: sendUrgentAlert
      };

      const result = await api.createCase(payload);
      onSuccess(result); // Pass the result back to App.jsx to handle toasts
      onClose();
      // Reset form
      setFormData({
        CrimeNo: '',
        CaseCategoryID: 1,
        PoliceStationID: 1,
        IncidentFromDate: new Date().toISOString().slice(0, 16),
        latitude: 12.9716,
        longitude: 77.5946,
        BriefFacts: '',
        BroadcastReason: '',
      });
      setSendUrgentAlert(false);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit FIR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-sys-surface border border-sys-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sys-border shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-sys-text-main">File New FIR</h2>
            <p className="text-sm text-sys-text-muted mt-1">Submit a new incident for real-time analysis</p>
          </div>
          <button onClick={onClose} className="p-2 text-sys-text-muted hover:text-sys-text-main transition-colors rounded-lg hover:bg-sys-surface-hover">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {submitError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start space-x-3 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">{submitError}</div>
            </div>
          )}

          {!hasPermission('register_fir') ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-sys-surface-hover rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-medium text-sys-text-main mb-2">Permission Denied</h3>
              <p className="text-sys-text-muted text-sm max-w-sm">
                You do not have the required permissions to file a new FIR. Only officers of rank Sub-Inspector and above can register new cases.
              </p>
            </div>
          ) : (
          <form id="new-fir-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
              {/* Crime No */}
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Crime Number *</label>
                <input
                  type="text"
                  name="CrimeNo"
                  value={formData.CrimeNo}
                  onChange={handleChange}
                  placeholder="e.g. CR-2026-1042"
                  className={`w-full bg-sys-surface border ${errors.CrimeNo ? 'border-rose-500' : 'border-sys-border-strong'} rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors`}
                />
                {errors.CrimeNo && <p className="text-rose-400 text-xs mt-1">{errors.CrimeNo}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Incident Date & Time *</label>
                <input
                  type="datetime-local"
                  name="IncidentFromDate"
                  value={formData.IncidentFromDate}
                  onChange={handleChange}
                  className={`w-full bg-sys-surface border ${errors.IncidentFromDate ? 'border-rose-500' : 'border-sys-border-strong'} rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors [color-scheme:dark]`}
                />
                {errors.IncidentFromDate && <p className="text-rose-400 text-xs mt-1">{errors.IncidentFromDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Case Category *</label>
                <select
                  name="CaseCategoryID"
                  value={formData.CaseCategoryID}
                  onChange={handleChange}
                  className="w-full bg-sys-surface border border-sys-border-strong rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors"
                >
                  <option value={1}>Theft / Burglary</option>
                  <option value={2}>Assault / Violent Crime</option>
                  <option value={3}>Financial Fraud</option>
                  <option value={4}>Cyber Crime</option>
                  <option value={5}>Narcotics</option>
                  <option value={10}>Property Dispute</option>
                </select>
                {errors.CaseCategoryID && <p className="text-rose-400 text-xs mt-1">{errors.CaseCategoryID}</p>}
              </div>

              {/* Station */}
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Police Station *</label>
                <select
                  name="PoliceStationID"
                  value={formData.PoliceStationID}
                  onChange={handleChange}
                  className="w-full bg-sys-surface border border-sys-border-strong rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors"
                >
                  <option value={1}>Koramangala PS</option>
                  <option value={2}>Indiranagar PS</option>
                  <option value={3}>Whitefield PS</option>
                  <option value={4}>Electronic City PS</option>
                  <option value={5}>Jayanagar PS</option>
                  <option value={6}>Madiwala PS</option>
                </select>
                {errors.PoliceStationID && <p className="text-rose-400 text-xs mt-1">{errors.PoliceStationID}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Latitude *</label>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className={`w-full bg-sys-surface border ${errors.latitude ? 'border-rose-500' : 'border-sys-border-strong'} rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors`}
                />
                {errors.latitude && <p className="text-rose-400 text-xs mt-1">{errors.latitude}</p>}
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Longitude *</label>
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className={`w-full bg-sys-surface border ${errors.longitude ? 'border-rose-500' : 'border-sys-border-strong'} rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors`}
                />
                {errors.longitude && <p className="text-rose-400 text-xs mt-1">{errors.longitude}</p>}
              </div>
            </div>

            {/* Brief Facts */}
            <div>
              <label className="block text-sm font-medium text-sys-text-muted mb-1.5">Brief Facts *</label>
              <textarea
                name="BriefFacts"
                value={formData.BriefFacts}
                onChange={handleChange}
                rows={5}
                placeholder="Describe the incident in detail..."
                className={`w-full bg-sys-surface border ${errors.BriefFacts ? 'border-rose-500' : 'border-sys-border-strong'} rounded-lg px-4 py-3 text-sys-text-main focus:outline-none focus:border-sys-primary transition-colors resize-none`}
              />
              {errors.BriefFacts && <p className="text-rose-400 text-xs mt-1">{errors.BriefFacts}</p>}
            </div>

            {hasPermission('broadcast_urgent_alert') && (
              <div className="flex flex-col space-y-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="urgentAlertCheckbox"
                    checked={sendUrgentAlert}
                    onChange={(e) => setSendUrgentAlert(e.target.checked)}
                    className="w-4 h-4 rounded border-rose-500 text-rose-500 focus:ring-rose-500 bg-sys-surface"
                  />
                  <label htmlFor="urgentAlertCheckbox" className="text-sm font-medium text-rose-400 cursor-pointer">
                    Broadcast urgent inspection alert to station officers on submit
                  </label>
                </div>
                {sendUrgentAlert && (
                  <div className="pl-7">
                    <input
                      type="text"
                      name="BroadcastReason"
                      value={formData.BroadcastReason}
                      onChange={handleChange}
                      placeholder="Short reason for the alert..."
                      className="w-full bg-sys-surface border border-rose-500/50 rounded-lg px-4 py-2 text-sys-text-main focus:outline-none focus:border-rose-500 transition-colors text-sm"
                    />
                  </div>
                )}
              </div>
            )}

          </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-sys-border flex justify-end space-x-4 shrink-0 bg-sys-bg rounded-b-xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-sys-text-muted hover:text-sys-text-main hover:bg-sys-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="new-fir-form"
            disabled={loading || !hasPermission('register_fir')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{loading ? 'Submitting...' : 'Submit Case'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
