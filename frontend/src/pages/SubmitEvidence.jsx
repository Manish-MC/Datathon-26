import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, MapPin, X, Loader2, CheckCircle, FileText, Search, Camera } from 'lucide-react';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/heic',
  'video/mp4', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/x-m4a',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export default function SubmitEvidence() {
  const navigate = useNavigate();
  const [caseSearch, setCaseSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  
  const [file, setFile] = useState(null);
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [locationText, setLocationText] = useState('');
  
  const [selectedAccused, setSelectedAccused] = useState([]);
  const [selectedVictims, setSelectedVictims] = useState([]);
  const [unlistedNote, setUnlistedNote] = useState('');
  const [description, setDescription] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (caseSearch.trim().length >= 3) {
      const delaySearch = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await api.searchCases(caseSearch);
          setSearchResults(results);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults([]);
    }
  }, [caseSearch]);

  const handleSelectCase = async (c) => {
    setSelectedCase(c);
    setCaseSearch('');
    setSearchResults([]);
    
    // Fetch full case details to get suspects and victims
    try {
      const detail = await api.getCaseById(c.CaseMasterID);
      setCaseDetails(detail);
      setSelectedAccused([]);
      setSelectedVictims([]);
    } catch(err) {
      setError("Failed to load case details.");
    }
  };

  const handleFileChange = (e) => {
    setError('');
    const selected = e.target.files[0];
    if (!selected) return;
    
    if (!ALLOWED_MIME_TYPES.includes(selected.type)) {
      setError("Invalid file type. Please upload images, videos, audio, or document files.");
      return;
    }
    
    if (selected.size > 25 * 1024 * 1024) {
      setError("File size exceeds 25MB limit.");
      return;
    }
    
    setFile(selected);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLat(position.coords.latitude);
        setLocationLng(position.coords.longitude);
      },
      () => {
        setError('Unable to retrieve your location');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedCase) {
      setError('Please select a case'); return;
    }
    if (!file) {
      setError('Please select a file to upload'); return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('CaseMasterID', selectedCase.CaseMasterID);
      formData.append('file', file);
      
      if (locationLat) formData.append('LocationLat', locationLat);
      if (locationLng) formData.append('LocationLng', locationLng);
      if (locationText) formData.append('LocationText', locationText);
      if (description) formData.append('Description', description);
      
      if (selectedAccused.length > 0) formData.append('AccusedIDs', selectedAccused.join(','));
      if (selectedVictims.length > 0) formData.append('VictimIDs', selectedVictims.join(','));
      if (unlistedNote) formData.append('UnlistedPersonNote', unlistedNote);
      
      await api.uploadEvidence(formData);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to upload evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-light text-sys-text-inverse mb-4">Evidence Uploaded</h2>
        <p className="text-sys-text-muted mb-8 text-lg">Your evidence has been securely attached to Case {selectedCase?.CrimeNo}.</p>
        <button 
          onClick={() => navigate(`/case/${selectedCase?.CaseMasterID}`)}
          className="px-6 py-3 bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          View Case Details
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-sys-text-main flex items-center">
          <Camera className="w-6 h-6 text-blue-500 mr-3" />
          Submit Evidence
        </h1>
        <p className="text-sys-text-muted text-sm mt-1">Upload files, photos, or documents and attach them to a registered case.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl mb-6 flex items-start space-x-3">
          <X className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Case Selection */}
        <div className="bg-sys-surface border border-sys-border rounded-xl p-5 shadow-lg">
          <h2 className="text-sm font-medium text-sys-text-muted mb-4 uppercase tracking-wider">1. Select Case</h2>
          
          {!selectedCase ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-sys-text-muted" />
              </div>
              <input
                type="text"
                placeholder="Search by Crime No, Victim, or Accused..."
                className="w-full bg-sys-bg border border-sys-border-strong rounded-lg pl-10 pr-4 py-3 text-sm text-sys-text-main placeholder:text-sys-text-muted focus:border-sys-primary focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-sys-bg border border-sys-border-strong rounded-lg shadow-2xl max-h-60 overflow-auto">
                  {searchResults.map(c => (
                    <button
                      key={c.CaseMasterID}
                      type="button"
                      onClick={() => handleSelectCase(c)}
                      className="w-full text-left px-4 py-3 border-b border-sys-border/50 hover:bg-sys-surface-hover transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sys-text-main font-medium text-sm">{c.CrimeNo}</div>
                        <div className="text-sys-text-muted text-xs truncate max-w-sm">{c.BriefFacts}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-sys-bg border border-sys-primary/30 p-4 rounded-lg">
              <div>
                <p className="text-sys-primary text-sm font-semibold">{selectedCase.CrimeNo}</p>
                <p className="text-sys-text-muted text-xs mt-1">Registered: {new Date(selectedCase.CrimeRegisteredDate).toLocaleDateString()}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedCase(null)}
                className="text-sys-text-muted hover:text-sys-text-main p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Evidence File */}
        <div className="bg-sys-surface border border-sys-border rounded-xl p-5 shadow-lg opacity-100 transition-opacity" style={{ opacity: selectedCase ? 1 : 0.5, pointerEvents: selectedCase ? 'auto' : 'none' }}>
          <h2 className="text-sm font-medium text-sys-text-muted mb-4 uppercase tracking-wider">2. Evidence File</h2>
          
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-sys-border-strong border-dashed rounded-lg cursor-pointer bg-sys-bg hover:bg-sys-surface-hover transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 text-sys-text-muted mb-3" />
                <p className="mb-2 text-sm text-sys-text-muted">
                  <span className="font-semibold text-sys-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-sys-text-muted">IMG, VID, AUD, PDF, DOC (MAX. 25MB)</p>
              </div>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.heic,.mp4,.mov,.mp3,.wav,.m4a,.pdf,.doc,.docx" />
            </label>
          </div>
          
          {file && (
            <div className="mt-4 flex items-center bg-sys-surface-hover p-3 rounded-lg border border-sys-border-strong">
              <FileText className="w-6 h-6 text-sys-primary mr-3" />
              <div className="flex-1">
                <p className="text-sm text-sys-text-main truncate">{file.name}</p>
                <p className="text-xs text-sys-text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={() => setFile(null)} className="text-rose-400 p-2 hover:bg-rose-500/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="mt-4">
            <label className="block text-xs font-medium text-sys-text-muted mb-2">Description / Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-sys-bg border border-sys-border-strong rounded-lg p-3 text-sm text-sys-text-main placeholder:text-sys-text-muted focus:border-sys-primary focus:ring-1 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="Provide context about this evidence..."
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-sys-surface border border-sys-border rounded-xl p-5 shadow-lg" style={{ opacity: selectedCase ? 1 : 0.5, pointerEvents: selectedCase ? 'auto' : 'none' }}>
          <h2 className="text-sm font-medium text-sys-text-muted mb-4 uppercase tracking-wider">3. Location details</h2>
          
          <div className="space-y-4">
            <button 
              type="button" 
              onClick={getLocation}
              className="flex items-center space-x-2 text-sm bg-blue-600/20 hover:bg-blue-600/30 text-sys-primary border border-sys-primary/30 px-4 py-2.5 rounded-lg transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Use Current GPS Location</span>
            </button>
            
            {(locationLat || locationLng) && (
              <div className="text-xs text-emerald-400 flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> GPS Coordinates Captured ({locationLat}, {locationLng})
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-sys-text-muted mb-2">Manual Location (Optional fallback)</label>
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="e.g. Near the main gate, 3rd floor..."
                className="w-full bg-sys-bg border border-sys-border-strong rounded-lg px-4 py-2.5 text-sm text-sys-text-main placeholder:text-sys-text-muted focus:border-sys-primary outline-none"
              />
            </div>
          </div>
        </div>
        
        {/* Linked Persons */}
        <div className="bg-sys-surface border border-sys-border rounded-xl p-5 shadow-lg" style={{ opacity: selectedCase ? 1 : 0.5, pointerEvents: selectedCase ? 'auto' : 'none' }}>
          <h2 className="text-sm font-medium text-sys-text-muted mb-4 uppercase tracking-wider">4. Linked Persons</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-sys-text-muted mb-2">Select Suspects/Accused</label>
              <select
                multiple
                value={selectedAccused}
                onChange={(e) => setSelectedAccused(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full bg-sys-surface border border-sys-border-strong rounded-lg p-3 text-sm text-sys-text-main focus:border-sys-primary outline-none h-24"
              >
                {caseDetails?.accused?.map(a => (
                  <option key={a.AccusedMasterID} value={a.AccusedMasterID}>{a.AccusedName}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-sys-text-muted mb-2">Select Victims</label>
              <select
                multiple
                value={selectedVictims}
                onChange={(e) => setSelectedVictims(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full bg-sys-surface border border-sys-border-strong rounded-lg p-3 text-sm text-sys-text-main focus:border-sys-primary outline-none h-24"
              >
                {caseDetails?.victims?.map(v => (
                  <option key={v.VictimMasterID} value={v.VictimMasterID}>{v.VictimName}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-xs font-medium text-sys-text-muted mb-2">Unlisted Person Note</label>
            <input
              type="text"
              value={unlistedNote}
              onChange={(e) => setUnlistedNote(e.target.value)}
              placeholder="If the evidence is linked to someone not listed above, describe them here..."
              className="w-full bg-sys-surface border border-sys-border-strong rounded-lg px-4 py-2.5 text-sm text-sys-text-main placeholder:text-sys-text-muted focus:border-sys-primary outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedCase || !file || isSubmitting}
          className="w-full bg-sys-primary hover:bg-sys-primary-hover disabled:bg-sys-surface-hover disabled:text-sys-text-muted text-sys-text-inverse rounded-lg py-4 font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:shadow-none flex items-center justify-center"
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading...</>
          ) : (
            'Submit Evidence'
          )}
        </button>
      </form>
    </div>
  );
}
