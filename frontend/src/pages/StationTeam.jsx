import React, { useState, useEffect } from 'react';
import { api, API_BASE_URL } from '../api/client';
import { Users, User, Loader2, AlertCircle } from 'lucide-react';

export default function StationTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data = await api.getStationTeam();
      setTeam(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch station team');
    } finally {
      setLoading(false);
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
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-white">Station Team</h1>
            <p className="text-sm text-slate-400">Directory of all active officers assigned to your police station.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-lg mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map(officer => (
            <div key={officer.EmployeeID} className="bg-[#111726] border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center shadow-lg transition-transform hover:-translate-y-1">
              <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden mb-4 flex items-center justify-center">
                {officer.PhotoURL ? (
                  <img src={`${API_BASE_URL}${officer.PhotoURL}`} alt={officer.EmployeeName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-1">{officer.EmployeeName}</h3>
              <p className="text-xs text-blue-400 mb-2">{officer.RankName}</p>
              <div className="mt-auto pt-4 w-full border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">Login ID</span>
                <span className="text-slate-300 bg-slate-900 px-2 py-1 rounded font-mono">{officer.LoginID}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
