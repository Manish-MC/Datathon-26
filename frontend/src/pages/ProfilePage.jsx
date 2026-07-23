import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Mail, Phone, Lock, Save, Edit2, CheckCircle2, AlertCircle, RefreshCw, Camera } from 'lucide-react';
import { API_BASE_URL } from '../api/client';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ EmployeeName: '', PhoneNumber: '', Email: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const [passwordForm, setPasswordForm] = useState({ new_password: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingPhoto(true);
      setUploadError(null);
      const updated = await api.uploadPhoto(file);
      setProfile(updated);
    } catch (err) {
      setUploadError(err.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setChangingPassword(true);
      setPasswordMsg('');
      setPasswordErr('');
      await api.changePassword(passwordForm);
      setPasswordMsg("Password changed successfully!");
      setPasswordForm({ new_password: '' });
    } catch (err) {
      setPasswordErr(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };


  if (loading) return <div className="flex-1 flex items-center justify-center p-8"><RefreshCw className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-8 text-rose-500 flex items-center space-x-2"><AlertCircle className="w-5 h-5"/><span>{error}</span></div>;
  if (!profile) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#070b13]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        {/* Header & Avatar */}
        <div className="flex items-center space-x-6">
          <div className="relative group">
            {profile.PhotoURL ? (
              <img src={`${API_BASE_URL}${profile.PhotoURL}`} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-slate-800" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-900/50 border-4 border-slate-800 flex items-center justify-center text-3xl font-bold text-blue-400">
                {profile.EmployeeName?.charAt(0) || 'U'}
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Officer Profile</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">Manage your contact details and security settings.</p>
            {uploadError && <p className="text-xs text-rose-500 mt-2 flex items-center space-x-1"><AlertCircle className="w-3 h-3"/><span>{uploadError}</span></p>}
          </div>
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

          {/* Security */}
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-6 shadow-xl mt-8">
            <h3 className="text-lg font-semibold text-slate-200 mb-6">Security</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">New Password</label>
                <input type="password" required value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} className="mt-1 w-full bg-[#111726] border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <button type="submit" disabled={changingPassword} className="flex items-center space-x-2 text-sm text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition-colors disabled:opacity-50">
                  <Lock className="w-4 h-4" />
                  <span>{changingPassword ? 'Updating...' : 'Change Password'}</span>
                </button>
              </div>
              {passwordMsg && <p className="text-sm text-emerald-400 mt-2 flex items-center space-x-1"><CheckCircle2 className="w-4 h-4"/><span>{passwordMsg}</span></p>}
              {passwordErr && <p className="text-sm text-rose-500 mt-2 flex items-center space-x-1"><AlertCircle className="w-4 h-4"/><span>{passwordErr}</span></p>}
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
