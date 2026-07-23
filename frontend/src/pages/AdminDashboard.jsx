import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Users, UserPlus, Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';

const RANKS = [
  "Police Constable",
  "Head Constable",
  "Assistant Sub-Inspector",
  "Sub-Inspector",
  "Inspector / SHO",
  "DySP / ACP",
  "SP / DCP",
  "IGP",
  "ADGP",
  "DGP"
];

const AdminDashboard = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    RankName: RANKS[0],
    NumericID: '',
    BatchYear: '',
    FullName: '',
    PhoneNumber: '',
    Email: '',
    Password: ''
  });
  
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const data = await api.getOfficers();
      setOfficers(data);
    } catch (err) {
      console.error("Failed to fetch officers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);
    
    try {
      const res = await api.createOfficer(formData);
      setSubmitSuccess(`Officer created successfully! Login ID: ${res.LoginID}`);
      fetchOfficers();
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess('');
        setFormData({
          RankName: RANKS[0],
          NumericID: '',
          BatchYear: '',
          FullName: '',
          PhoneNumber: '',
          Email: '',
          Password: ''
        });
      }, 3000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create officer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deactivateOfficer = async (id) => {
    if (window.confirm("Are you sure you want to deactivate this officer?")) {
      try {
        await api.deactivateOfficer(id);
        fetchOfficers();
      } catch (err) {
        alert("Failed to deactivate: " + err.message);
      }
    }
  };

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-500" />
            System Administration
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage officer accounts and system access</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium shadow-[0_0_15px_rgba(225,29,72,0.3)]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New Officer</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50">
          <Users className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-medium text-slate-200">Registered Officers</h3>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-medium">Rank</th>
                  <th className="px-6 py-3 font-medium">Login ID</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Contact</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {officers.map((officer) => (
                  <tr key={officer.EmployeeID} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap">{officer.RankName}</td>
                    <td className="px-6 py-3 whitespace-nowrap font-medium text-blue-400">{officer.LoginID}</td>
                    <td className="px-6 py-3 whitespace-nowrap">{officer.FullName}</td>
                    <td className="px-6 py-3 text-xs">
                      <div>{officer.PhoneNumber || '-'}</div>
                      <div className="text-slate-500">{officer.Email || '-'}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {officer.Active ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">Active</span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      {officer.Active && (
                        <button 
                          onClick={() => deactivateOfficer(officer.EmployeeID)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-medium"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {officers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No officers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-rose-500" />
                Create New Officer
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6">
              {submitSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex gap-2 items-center text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">{submitSuccess}</span>
                </div>
              )}
              {submitError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
                  {submitError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Rank</label>
                  <select 
                    value={formData.RankName}
                    onChange={(e) => setFormData({...formData, RankName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
                    required
                  >
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Numeric ID</label>
                  <input 
                    type="text" 
                    value={formData.NumericID}
                    onChange={(e) => setFormData({...formData, NumericID: e.target.value})}
                    placeholder="e.g. 11023"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Batch Year</label>
                  <input 
                    type="text" 
                    value={formData.BatchYear}
                    onChange={(e) => setFormData({...formData, BatchYear: e.target.value})}
                    placeholder="e.g. 2018"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.FullName}
                    onChange={(e) => setFormData({...formData, FullName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.PhoneNumber}
                    onChange={(e) => setFormData({...formData, PhoneNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.Email}
                    onChange={(e) => setFormData({...formData, Email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Initial Password</label>
                  <input 
                    type="password" 
                    value={formData.Password}
                    onChange={(e) => setFormData({...formData, Password: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
