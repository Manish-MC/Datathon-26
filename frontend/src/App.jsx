import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Shield, Activity, MapPin, AlertTriangle, Search, Layers, 
  Database, Calendar, RefreshCcw, Loader2, Plus, CheckCircle, Bell, User, Camera, FileText, CheckSquare, Users
} from 'lucide-react';
import NewFIRModal from './components/NewFIRModal';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import MapPage from './pages/MapPage';
import Alerts from './pages/Alerts';
import CaseSimilarity from './pages/CaseSimilarity';
import SubmitEvidence from './pages/SubmitEvidence';
import VerifyEvidence from './pages/VerifyEvidence';
import StationTeam from './pages/StationTeam';
import { api, API_BASE_URL } from './api/client';
import { usePolling } from './hooks/usePolling';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';

const fetchHealth = () => api.getHealth();
const fetchOpenAlerts = () => api.getAlerts("open");

function Layout({ health, loading, error }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [resetting, setResetting] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const isActive = (path) => location.pathname === path;

  const { data: openAlerts, mutate: mutateAlerts } = usePolling("alerts_open", fetchOpenAlerts, 30000);
  const openAlertCount = openAlerts ? openAlerts.length : 0;

  const { data: notifications, mutate: mutateNotifications } = usePolling("notifications", () => api.getNotifications(), 20000);
  const unreadCount = notifications ? notifications.filter(n => !n.IsRead).length : 0;
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: pendingEvidence } = usePolling("pending_evidence", () => hasPermission('verify_evidence') ? api.getPendingEvidence() : null, 30000);
  const pendingEvidenceCount = pendingEvidence ? pendingEvidence.length : 0;

  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (user?.role !== 'admin') {
      api.getProfile().then(setProfile).catch(() => {});
    }
  }, [user]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { title, message, type }

  const handleMarkAsRead = async (id) => {
    try {
      await api.markAsRead(id);
      mutateNotifications();
    } catch(err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      mutateNotifications();
    } catch(err) {}
  };

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleFIRSuccess = (result) => {
    // result contains { case, new_alerts }
    if (result.new_alerts && result.new_alerts.length > 0) {
      showToast('Alert Triggered', `New case generated ${result.new_alerts.length} alert(s) (Cluster/Hotspot)`, 'warning');
      // Trigger a manual re-fetch of alerts so the badge updates immediately
      mutateAlerts();
    } else {
      showToast('Case Filed', `FIR ${result.case.CrimeNo} was submitted successfully.`, 'success');
    }
    
    // In a real app we'd also want to mutate the dashboard case list here. 
    // For this demo, a quick window dispatch or letting polling pick it up works.
  };


  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?q=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate(`/`);
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm("WARNING: This will wipe the database, re-seed all initial data, and delete all AI summaries and alerts. Are you sure you want to reset the demo environment?")) {
      setResetting(true);
      try {
        await api.resetDemo();
        window.location.href = '/'; // hard reload to clear all states
      } catch (err) {
        alert("Failed to reset demo: " + err.message);
        setResetting(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#070b13] text-slate-100 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-blue-600/10 p-2 rounded-lg border border-blue-500/30">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-slate-200">KSP-INTEL</h1>
              <p className="text-[10px] text-blue-400 font-medium">DECISION SUPPORT LAYER</p>
            </div>
          </div>
          
          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {user?.role === 'admin' ? (
              <button onClick={() => navigate('/admin')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/admin' ? 'bg-rose-600/15 border-l-2 border-rose-500 text-rose-400 font-medium' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-2 border-transparent'}`}>
                <Shield className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            ) : (
              <>


                {hasPermission('upload_evidence') && (
                  <button onClick={() => navigate('/evidence/submit')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive('/evidence/submit') ? 'bg-blue-600/15 border-l-2 border-blue-500 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-2 border-transparent'}`}>
                    <Camera className="w-4 h-4" />
                    <span>Submit Evidence</span>
                  </button>
                )}
                
                {hasPermission('verify_evidence') && (
                  <button onClick={() => navigate('/evidence/verify')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive('/evidence/verify') ? 'bg-blue-600/15 border-l-2 border-blue-500 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-2 border-transparent'}`}>
                    <div className="flex items-center space-x-3">
                      <CheckSquare className="w-4 h-4" />
                      <span>Verify Evidence</span>
                    </div>
                    {pendingEvidenceCount > 0 && (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {pendingEvidenceCount}
                      </span>
                    )}
                  </button>
                )}

                {hasPermission('manage_station_diary') && (
                  <button onClick={() => navigate('/station/team')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive('/station/team') ? 'bg-blue-600/15 border-l-2 border-blue-500 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-2 border-transparent'}`}>
                    <Users className="w-4 h-4" />
                    <span>Station Team</span>
                  </button>
                )}

                <button onClick={() => navigate('/')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/' ? 'bg-blue-600/15 border-l-2 border-blue-500 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-2 border-transparent'}`}>
                  <Activity className="w-4 h-4" />
                  <span>Executive Dashboard</span>
                </button>
                <button onClick={() => navigate('/map')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/map' ? 'bg-blue-600/15 border-l-2 border-blue-500 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-2 border-transparent'}`}>
                  <MapPin className="w-4 h-4" />
                  <span>Spatial Analysis Map</span>
                </button>
                <button onClick={() => navigate('/similarity')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/similarity' ? 'bg-blue-600/15 border-l-2 border-blue-500 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-2 border-transparent'}`}>
                  <Layers className="w-4 h-4" />
                  <span>Case Similarity Match</span>
                </button>
                {(hasPermission("approve_alert_action") || hasPermission("dismiss_alert")) && (
                  <button onClick={() => navigate('/alerts')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${location.pathname === '/alerts' ? 'bg-blue-600/15 border-l-2 border-blue-500 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-2 border-transparent'}`}>
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`w-4 h-4 transition-colors ${location.pathname === '/alerts' ? 'text-blue-400' : 'group-hover:text-amber-400'}`} />
                      <span>Explainable Alerts</span>
                    </div>
                    {openAlertCount > 0 && (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {openAlertCount}
                      </span>
                    )}
                  </button>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Footer Settings / Build status */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/80">
            <div className="flex items-center space-x-2.5 mb-1.5">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">SQLite Database Status</span>
            </div>
            {loading ? (
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[11px] text-slate-400">Checking...</span>
              </div>
            ) : error ? (
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-[11px] text-rose-400 font-medium">Offline</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] text-emerald-400 font-medium">Connected</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Seeded {health?.db_stats?.cases || 0} synthetic cases across {health?.db_stats?.units_police_stations || 0} units.
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleResetDemo}
            disabled={resetting}
            className="w-full mt-3 flex items-center justify-center space-x-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
            <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header Search & System Connectivity */}
        <header className="h-16 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between px-8 shrink-0">
          <form onSubmit={handleSearch} className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Case No, Suspect, or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111726] border border-slate-800 rounded-lg py-1.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-all"
            />
          </form>

          <div className="flex items-center space-x-4">
            
            {/* Notifications */}
            {user?.role !== 'admin' && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#0a0f1d]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#111726] border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col max-h-[28rem]">
                    <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-[#0a0f1d]">
                      <h3 className="font-semibold text-slate-200 text-sm">Notifications</h3>
                      <button onClick={handleMarkAllAsRead} className="text-[10px] text-blue-400 hover:text-blue-300">Mark all as read</button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifications && notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.NotificationID} 
                            onClick={() => {
                              if (!n.IsRead) handleMarkAsRead(n.NotificationID);
                              if (n.RelatedID) {
                                setShowNotifications(false);
                                if (n.Type === 'alert') navigate('/alerts');
                                else if (n.Type === 'new_fir') navigate(`/case/${n.RelatedID}`);
                              }
                            }}
                            className={`p-3 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-colors ${!n.IsRead ? 'bg-blue-900/10' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-xs text-slate-200">{n.Title}</span>
                              {!n.IsRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></span>}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2">{n.Message}</p>
                            <p className="text-[9px] text-slate-500 mt-2">{new Date(n.CreatedAt).toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-xs">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => navigate('/profile')}
              className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-800 flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-slate-700 bg-blue-900">
                {profile?.PhotoURL ? (
                  <img src={`${API_BASE_URL}${profile.PhotoURL}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-blue-400" />
                )}
              </div>
              <span className="text-xs text-slate-300 pr-2">Logged in as: {user?.login_id} — {user?.role === 'admin' ? 'Admin' : user?.rank}</span>
            </button>
            
            <button
              onClick={logout}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 transition-colors"
            >
              Logout
            </button>
            
            {/* Status Pill */}
            {!error && health?.status === "healthy" ? (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-medium flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>API ONLINE</span>
              </span>
            ) : (
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-1 rounded-full font-medium flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>API OFFLINE</span>
              </span>
            )}
            
            {hasPermission("register_fir") && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ml-4 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              >
                <Plus className="w-4 h-4" />
                <span>File New FIR</span>
              </button>
            )}
          </div>
        </header>

        {/* Inner Content Grid - Routed */}
        <Routes>
          {user?.role === 'admin' ? (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Dashboard health={health} />} />
              <Route path="/case/:id" element={<CaseDetail />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/similarity" element={<CaseSimilarity />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/evidence/submit" element={<SubmitEvidence />} />
              <Route path="/evidence/verify" element={<VerifyEvidence />} />
              <Route path="/station/team" element={<StationTeam />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>

      <NewFIRModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleFIRSuccess} 
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-2xl border flex items-start space-x-3 max-w-sm z-50 animate-in slide-in-from-bottom-5 fade-in duration-300
          ${toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}
        `}>
          {toast.type === 'warning' ? <Bell className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
          <div>
            <h4 className="font-semibold text-sm">{toast.title}</h4>
            <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}

function AppContent() {
  const { data: health, loading: healthLoading, error: rawError } = usePolling("health", fetchHealth, 30000);
  const error = rawError ? "Backend offline or unreachable" : null;
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Layout health={health} loading={healthLoading} error={error} />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
