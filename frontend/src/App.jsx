import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Activity, MapPin, AlertTriangle, Search, Layers, Briefcase,
  Database, Calendar, RefreshCcw, Loader2, Plus, CheckCircle, Bell, User, Camera, FileText, CheckSquare, Users, Settings, LogOut, Share2, ArrowLeft, Menu, X, Server, ArrowUpRight, Shield
} from 'lucide-react';
import AppLogo from './components/AppLogo';
import NewFIRModal from './components/NewFIRModal';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import DepartmentCommand from './pages/DepartmentCommand';
import MapPage from './pages/MapPage';
import Alerts from './pages/Alerts';
import CaseSimilarity from './pages/CaseSimilarity';
import SubmitEvidence from './pages/SubmitEvidence';
import VerifyEvidence from './pages/VerifyEvidence';
import StationTeam from './pages/StationTeam';
import ApproveFIRs from './pages/ApproveFIRs';
import DistrictCommand from './pages/DistrictCommand';
import CommandCenter from './pages/CommandCenter';
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
    <div className="flex h-screen bg-sys-bg text-sys-text-main font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-sys-bg border-r border-sys-border flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-sys-border flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-1 rounded-lg">
              <AppLogo size={32} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-sys-text-main">KSP-INTEL</h1>
              <p className="text-[10px] text-sys-primary font-medium">DECISION SUPPORT LAYER</p>
            </div>
          </div>
          
          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {user?.role === 'admin' ? (
              <button onClick={() => navigate('/admin')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/admin' ? 'bg-rose-600/15 border-l-2 border-rose-500 text-rose-400 font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                <Shield className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            ) : (
              <>


                {hasPermission('upload_evidence') && (
                  <button onClick={() => navigate('/evidence/submit')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive('/evidence/submit') ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                    <Camera className="w-4 h-4" />
                    <span>Submit Evidence</span>
                  </button>
                )}
                
                {hasPermission('verify_evidence') && (
                  <button onClick={() => navigate('/evidence/verify')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive('/evidence/verify') ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
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

                {hasPermission('approve_fir') && (
                  <button onClick={() => navigate('/approve-firs')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive('/approve-firs') ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                    <CheckSquare className="w-4 h-4" />
                    <span>Approve FIRs</span>
                  </button>
                )}

                {(hasPermission('manage_station_diary') || hasPermission('manage_station_staff')) && (
                  <button onClick={() => navigate('/station/team')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive('/station/team') ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                    <Users className="w-4 h-4" />
                    <span>Station Team</span>
                  </button>
                )}

                {hasPermission('view_station_dashboard') && (
                  <button onClick={() => navigate('/station-dashboard')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/station-dashboard' ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                    <Activity className="w-4 h-4" />
                    <span>Station Dashboard</span>
                  </button>
                )}

                {hasPermission('order_investigation') && (
                  <button onClick={() => navigate('/district-command')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/district-command' ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                    <Shield className="w-4 h-4" />
                    <span>District Command</span>
                  </button>
                )}

                {hasPermission('department_dashboard') && (
                  <button onClick={() => navigate('/department-command')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/department-command' ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                    <Briefcase className="w-4 h-4" />
                    <span>Department Command</span>
                  </button>
                )}
                
                {hasPermission('state_wide_access') && (
                  <button onClick={() => navigate('/command-center')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/command-center' ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                    <Activity className="w-4 h-4" />
                    <span>Command Center</span>
                  </button>
                )}

                <button onClick={() => navigate('/')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/' ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                  <Activity className="w-4 h-4" />
                  <span>Executive Dashboard</span>
                </button>
                <button onClick={() => navigate('/map')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/map' ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                  <MapPin className="w-4 h-4" />
                  <span>Spatial Analysis Map</span>
                </button>
                <button onClick={() => navigate('/similarity')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${location.pathname === '/similarity' ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                  <Layers className="w-4 h-4" />
                  <span>Case Similarity Match</span>
                </button>
                {(hasPermission("approve_alert_action") || hasPermission("dismiss_alert")) && (
                  <button onClick={() => navigate('/alerts')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${location.pathname === '/alerts' ? 'bg-sys-primary/15 border-l-2 border-sys-primary text-sys-primary font-medium' : 'text-sys-text-muted hover:bg-sys-surface-hover/50 hover:text-sys-text-main border-l-2 border-transparent'}`}>
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`w-4 h-4 transition-colors ${location.pathname === '/alerts' ? 'text-sys-primary' : 'group-hover:text-amber-400'}`} />
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
        <div className="p-4 border-t border-sys-border">
          <div className="bg-sys-surface rounded-lg p-3 border border-sys-border/80">
            <div className="flex items-center space-x-2.5 mb-1.5">
              <Database className="w-4 h-4 text-sys-text-muted" />
              <span className="text-xs font-semibold text-sys-text-muted">SQLite Database Status</span>
            </div>
            {loading ? (
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[11px] text-sys-text-muted">Checking...</span>
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
                <div className="text-[10px] text-sys-text-muted leading-tight">
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
        <header className="h-16 border-b border-sys-border bg-sys-bg flex items-center justify-between px-8 shrink-0">
          <form onSubmit={handleSearch} className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sys-text-muted" />
            <input 
              type="text" 
              placeholder="Search by Case No, Suspect, or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-sys-surface border border-sys-border rounded-lg py-1.5 pl-10 pr-4 text-sm text-sys-text-main placeholder-slate-500 focus:outline-none focus:border-sys-primary/80 transition-all"
            />
          </form>

          <div className="flex items-center space-x-4">
            
            {/* Notifications */}
            {user?.role !== 'admin' && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-sys-text-muted hover:text-sys-text-main transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-sys-text-inverse text-[10px] font-bold flex items-center justify-center rounded-full border border-[#0a0f1d]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-sys-surface border border-sys-border-strong rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col max-h-[28rem]">
                    <div className="p-3 border-b border-sys-border-strong flex justify-between items-center bg-sys-bg">
                      <h3 className="font-semibold text-sys-text-main text-sm">Notifications</h3>
                      <button onClick={handleMarkAllAsRead} className="text-[10px] text-sys-primary hover:text-blue-300">Mark all as read</button>
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
                                else if (n.Type === 'new_fir' || n.Type === 'urgent_case_alert') navigate(`/case/${n.RelatedID}`);
                              }
                            }}
                            className={`p-3 border-b border-sys-border/50 cursor-pointer hover:bg-sys-surface-hover/50 transition-colors ${n.IsUrgent ? 'border-l-4 border-l-rose-500 bg-rose-900/10' : (!n.IsRead ? 'bg-blue-900/10' : '')}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`font-medium text-xs ${n.IsUrgent ? 'text-rose-400' : 'text-sys-text-main'} flex items-center`}>
                                {n.IsUrgent && <span className="bg-rose-500 text-sys-text-inverse text-[9px] px-1.5 py-0.5 rounded-sm mr-2 font-bold tracking-wider">URGENT</span>}
                                {n.Type === 'urgent_case_alert' && !n.IsUrgent && <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" />}
                                <span>{n.Title}</span>
                              </span>
                              {!n.IsRead && <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${n.IsUrgent ? 'bg-rose-500' : 'bg-blue-500'}`}></span>}
                            </div>
                            <p className="text-[11px] text-sys-text-muted line-clamp-2">{n.Message}</p>
                            <p className="text-[9px] text-sys-text-muted mt-2">{new Date(n.CreatedAt).toLocaleString()}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-sys-text-muted text-xs">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => navigate('/profile')}
              className="bg-sys-surface hover:bg-sys-surface-hover px-3 py-1.5 rounded-full border border-sys-border flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-sys-border-strong bg-blue-900">
                {profile?.PhotoURL ? (
                  <img src={`${API_BASE_URL}${profile.PhotoURL}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-sys-primary" />
                )}
              </div>
              <span className="text-xs text-sys-text-muted pr-2">Logged in as: {user?.login_id} — {user?.role === 'admin' ? 'Admin' : user?.rank}</span>
            </button>
            
            <button
              onClick={logout}
              className="text-sys-text-muted hover:text-sys-text-main text-xs px-2 py-1 transition-colors"
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
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-sys-primary hover:bg-sys-primary-hover text-sys-text-inverse text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ml-4 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>File New FIR</span>
            </button>
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
              <Route path="/station-dashboard" element={<Dashboard health={health} forcedStationId={user?.unit_id} />} />
              <Route path="/case/:id" element={<CaseDetail />} />
              <Route path="/department-command" element={<DepartmentCommand />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/similarity" element={<CaseSimilarity />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/evidence/submit" element={<SubmitEvidence />} />
              <Route path="/evidence/verify" element={<VerifyEvidence />} />
              <Route path="/station/team" element={<StationTeam />} />
              <Route path="/approve-firs" element={<ApproveFIRs />} />
              <Route path="/district-command" element={<DistrictCommand />} />
              <Route path="/command-center" element={<CommandCenter />} />
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
    return <div className="min-h-screen bg-sys-bg flex items-center justify-center text-sys-text-muted"><Loader2 className="w-8 h-8 animate-spin" /></div>;
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
