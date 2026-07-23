import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Mail, Phone, Lock, Save, Edit2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ EmployeeName: '', PhoneNumber: '', Email: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      setEditForm({
        EmployeeName: data.EmployeeName || '',
        PhoneNumber: data.PhoneNumber || '',
        Email: data.Email || ''
      });
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const updated = await api.updateProfile(editForm);
      setProfile(updated);
      setEditMode(false);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };


  if (loading) return <div className="flex-1 flex items-center justify-center p-8"><RefreshCw className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-8 text-rose-500 flex items-center space-x-2"><AlertCircle className="w-5 h-5"/><span>{error}</span></div>;
  if (!profile) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#070b13]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <User className="w-6 h-6 text-blue-500" />
            <span>Officer Profile</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage your contact details and security settings.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          
          {/* Details */}
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-200">Personal Details</h3>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded bg-blue-500/10 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <button onClick={handleSaveProfile} disabled={savingProfile} className="flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded bg-emerald-500/10 transition-colors disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Identity Fields (Locked) */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/60">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Rank</label>
                  <div className="mt-1 flex items-center space-x-2 bg-slate-900/50 border border-slate-800/80 rounded px-3 py-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">{profile.RankName}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Login ID</label>
                  <div className="mt-1 flex items-center space-x-2 bg-slate-900/50 border border-slate-800/80 rounded px-3 py-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">{profile.LoginID}</span>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Full Name</label>
                {editMode ? (
                  <input type="text" value={editForm.EmployeeName} onChange={e => setEditForm({...editForm, EmployeeName: e.target.value})} className="mt-1 w-full bg-[#111726] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                ) : (
                  <div className="mt-1 text-sm text-slate-200 px-3 py-2">{profile.EmployeeName}</div>
                )}
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Phone Number</label>
                {editMode ? (
                  <input type="text" value={editForm.PhoneNumber} onChange={e => setEditForm({...editForm, PhoneNumber: e.target.value})} className="mt-1 w-full bg-[#111726] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                ) : (
                  <div className="mt-1 flex items-center space-x-2 px-3 py-2 text-sm text-slate-200">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{profile.PhoneNumber || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Email Address</label>
                {editMode ? (
                  <input type="email" value={editForm.Email} onChange={e => setEditForm({...editForm, Email: e.target.value})} className="mt-1 w-full bg-[#111726] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                ) : (
                  <div className="mt-1 flex items-center space-x-2 px-3 py-2 text-sm text-slate-200">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{profile.Email || 'Not set'}</span>
                  </div>
                )}
              </div>
              
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
