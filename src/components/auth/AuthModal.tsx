import React, { useState } from 'react';
import { X, User, Lock, Mail, Shield, Check, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    user, 
    loginUser, 
    logoutUser, 
    loginAsAdmin, 
    isAdmin 
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginUser(email || 'member@freetvradio.live', name || email.split('@')[0] || 'Entertainment Fan');
  };

  const handleQuickAdmin = () => {
    loginAsAdmin('admin123');
    setIsAuthModalOpen(false);
  };

  const handleQuickUser = () => {
    loginUser('viewer@freetvradio.live', 'Rahul Sharma');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {user.role !== 'guest' ? (
          /* User Profile View */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white">{user.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                <Shield className="w-3 h-3" />
                <span>{isAdmin ? 'Administrator' : 'Standard Member'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800 text-left text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950">
                <span className="text-slate-500">Saved Favorites</span>
                <p className="text-base font-bold text-white mt-0.5 tabular-nums">{user.favorites.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950">
                <span className="text-slate-500">Recently Played</span>
                <p className="text-base font-bold text-white mt-0.5 tabular-nums">{user.recentIds.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  logoutUser();
                  setIsAuthModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Register Form */
          <div>
            <div className="text-center mb-6">
              <h3 className="font-display text-2xl font-bold text-white">
                {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Save your favorite channels and sync your live stream watchlist.
              </p>
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="mb-5 p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Instant Demo Access:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleQuickUser}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-left truncate cursor-pointer transition-colors"
                >
                  👤 Sign in as Viewer
                </button>
                <button
                  type="button"
                  onClick={handleQuickAdmin}
                  className="py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-left truncate cursor-pointer transition-colors border border-amber-500/30"
                >
                  🛡️ Admin Access
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {mode === 'register' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-2"
              >
                {mode === 'signin' ? 'Sign In' : 'Create Free Account'}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-slate-400">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-amber-400 font-semibold hover:underline cursor-pointer"
                  >
                    Register free
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-amber-400 font-semibold hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
