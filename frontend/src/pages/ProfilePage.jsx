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
    <div className="flex-1 overflow-y-auto p-8 bg-sys-bg">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        {/* Header & Avatar */}
        <div className="flex items-center space-x-6">
          <div className="relative group">
            {profile.PhotoURL ? (
              <img src={`${API_BASE_URL}${profile.PhotoURL}`} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-sys-border" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-900/50 border-4 border-sys-border flex items-center justify-center text-3xl font-bold text-sys-primary">
                {profile.EmployeeName?.charAt(0) || 'U'}
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="w-6 h-6 text-sys-text-inverse" />
              <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-sys-text-main flex items-center space-x-2">
              <span>Officer Profile</span>
            </h2>
            <p className="text-sm text-sys-text-muted mt-1">Manage your contact details and security settings.</p>
            {uploadError && <p className="text-xs text-rose-500 mt-2 flex items-center space-x-1"><AlertCircle className="w-3 h-3"/><span>{uploadError}</span></p>}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          
          {/* Details */}
          <div className="bg-sys-bg border border-sys-border rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-sys-text-main">Personal Details</h3>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="flex items-center space-x-1.5 text-xs text-sys-primary hover:text-blue-300 px-3 py-1.5 rounded bg-blue-500/10 transition-colors">
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
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-sys-border/60">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-sys-text-muted">Rank</label>
                  <div className="mt-1 flex items-center space-x-2 bg-sys-surface border border-sys-border/80 rounded px-3 py-2">
                    <Shield className="w-4 h-4 text-sys-text-muted" />
                    <span className="text-sm text-sys-text-muted">{profile.RankName}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-sys-text-muted">Login ID</label>
                  <div className="mt-1 flex items-center space-x-2 bg-sys-surface border border-sys-border/80 rounded px-3 py-2">
                    <Lock className="w-4 h-4 text-sys-text-muted" />
                    <span className="text-sm text-sys-text-muted">{profile.LoginID}</span>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-sys-text-muted">Full Name</label>
                {editMode ? (
                  <input type="text" value={editForm.EmployeeName} onChange={e => setEditForm({...editForm, EmployeeName: e.target.value})} className="mt-1 w-full bg-sys-surface border border-sys-border-strong rounded px-3 py-2 text-sm text-sys-text-main focus:outline-none focus:border-sys-primary" />
                ) : (
                  <div className="mt-1 text-sm text-sys-text-main px-3 py-2">{profile.EmployeeName}</div>
                )}
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-sys-text-muted">Phone Number</label>
                {editMode ? (
                  <input type="text" value={editForm.PhoneNumber} onChange={e => setEditForm({...editForm, PhoneNumber: e.target.value})} className="mt-1 w-full bg-sys-surface border border-sys-border-strong rounded px-3 py-2 text-sm text-sys-text-main focus:outline-none focus:border-sys-primary" />
                ) : (
                  <div className="mt-1 flex items-center space-x-2 px-3 py-2 text-sm text-sys-text-main">
                    <Phone className="w-4 h-4 text-sys-text-muted" />
                    <span>{profile.PhoneNumber || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-sys-text-muted">Email Address</label>
                {editMode ? (
                  <input type="email" value={editForm.Email} onChange={e => setEditForm({...editForm, Email: e.target.value})} className="mt-1 w-full bg-sys-surface border border-sys-border-strong rounded px-3 py-2 text-sm text-sys-text-main focus:outline-none focus:border-sys-primary" />
                ) : (
                  <div className="mt-1 flex items-center space-x-2 px-3 py-2 text-sm text-sys-text-main">
                    <Mail className="w-4 h-4 text-sys-text-muted" />
                    <span>{profile.Email || 'Not set'}</span>
                  </div>
                )}
              </div>
              
            </div>
          </div>

          {/* Security */}
          <div className="bg-sys-bg border border-sys-border rounded-xl p-6 shadow-xl mt-8">
            <h3 className="text-lg font-semibold text-sys-text-main mb-6">Security</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-sys-text-muted">New Password</label>
                <input type="password" required value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} className="mt-1 w-full bg-sys-surface border border-sys-border-strong rounded px-3 py-2 text-sm text-sys-text-main focus:outline-none focus:border-sys-primary" />
              </div>
              <div>
                <button type="submit" disabled={changingPassword} className="flex items-center space-x-2 text-sm text-sys-text-inverse bg-sys-primary hover:bg-sys-primary-hover px-4 py-2 rounded transition-colors disabled:opacity-50">
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
