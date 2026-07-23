import React, { useState } from 'react';
import { ShieldAlert, KeyRound, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [officerLoginId, setOfficerLoginId] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerShowPassword, setOfficerShowPassword] = useState(false);
  const [adminLoginId, setAdminLoginId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const currentLoginId = isAdminMode ? adminLoginId : officerLoginId;
      const currentPassword = isAdminMode ? adminPassword : officerPassword;
      await login(currentLoginId, currentPassword, isAdminMode);
    } catch (err) {
      setError('Invalid login credentials. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-500/30">
            <ShieldAlert className="h-10 w-10 text-blue-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-100">
          KSP Intelligence
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Role-Based Access Control Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-800">
          <div className="flex bg-slate-950 p-1 rounded-lg mb-6 border border-slate-800">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isAdminMode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => setIsAdminMode(false)}
            >
              Officer Login
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isAdminMode ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => setIsAdminMode(true)}
            >
              Admin Login
            </button>
          </div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="loginId" className="block text-sm font-medium text-slate-300">
                {isAdminMode ? "Admin ID" : "Officer Login ID"}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="loginId"
                  name="loginId"
                  type="text"
                  required
                  autoComplete="username"
                  value={isAdminMode ? adminLoginId : officerLoginId}
                  onChange={(e) => isAdminMode ? setAdminLoginId(e.target.value) : setOfficerLoginId(e.target.value)}
                  className="bg-slate-950 block w-full pl-10 sm:text-sm border-slate-700 rounded-md text-slate-200 focus:ring-blue-500 focus:border-blue-500 py-3 border"
                  placeholder={isAdminMode ? "Admin ID" : "Officer Login ID"}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={(isAdminMode ? adminShowPassword : officerShowPassword) ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={isAdminMode ? adminPassword : officerPassword}
                  onChange={(e) => isAdminMode ? setAdminPassword(e.target.value) : setOfficerPassword(e.target.value)}
                  className="bg-slate-950 block w-full pl-10 pr-10 sm:text-sm border-slate-700 rounded-md text-slate-200 focus:ring-blue-500 focus:border-blue-500 py-3 border"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => isAdminMode ? setAdminShowPassword(!adminShowPassword) : setOfficerShowPassword(!officerShowPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {(isAdminMode ? adminShowPassword : officerShowPassword) ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-900/50">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isAdminMode ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
