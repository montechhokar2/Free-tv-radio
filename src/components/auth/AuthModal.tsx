import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Heart,
  Tv,
  Radio,
  Settings2,
  KeyRound,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccountPermissions } from '../../types';

interface PermissionRowConfig {
  key: keyof AccountPermissions;
  label: string;
  description: string;
  editable: boolean;
  adminOnly?: boolean;
  icon: React.ReactNode;
}

const PERMISSION_ROWS: PermissionRowConfig[] = [
  {
    key: 'canStreamLiveTv',
    label: 'Live TV, Cricket & Open IPTV',
    description: 'Core Free-to-Air TV, Sports & Public IPTV playback.',
    editable: false,
    icon: <Tv className="w-4 h-4 text-sky-400" />,
  },
  {
    key: 'canSaveFavorites',
    label: 'Save Favorites & Watchlist',
    description: 'Bookmark channels & sync recent viewing history.',
    editable: true,
    icon: <Heart className="w-4 h-4 text-amber-400" />,
  },
  {
    key: 'canUseBackgroundAudio',
    label: 'Background Radio & Sleep Timer',
    description: 'Keep radio audio active and schedule auto sleep timers.',
    editable: true,
    icon: <Radio className="w-4 h-4 text-emerald-400" />,
  },
  {
    key: 'canAccessAdult18',
    label: '18+ Adult Vault Access',
    description: 'Allow unlocking the isolated 18+ directory with age gate.',
    editable: true,
    icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
  },
  {
    key: 'canAccessAdminConsole',
    label: 'Admin Console & RBAC',
    description: 'Access telemetry, monetization & permission governance.',
    editable: false,
    adminOnly: true,
    icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
  },
  {
    key: 'canEditCatalog',
    label: 'Catalog CRUD & Playlist Sync',
    description: 'Add, edit, or delete broadcast channels & featured items.',
    editable: false,
    adminOnly: true,
    icon: <Settings2 className="w-4 h-4 text-amber-400" />,
  },
];

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    loginUser,
    logoutUser,
    loginAsAdmin,
    isAdmin,
    accountPermissions,
    updateAccountPermission,
    toggleParentalControl,
    setCurrentTab,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [guestView, setGuestView] = useState<'auth' | 'permissions'>('auth');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [pinDraft, setPinDraft] = useState(user.parentalControl?.pin || '0000');

  if (!isAuthModalOpen) return null;

  const isSignedIn = user.role !== 'guest';
  const isEffectiveAdmin = isAdmin || user.role === 'admin';
  const parentalEnabled = Boolean(user.parentalControl?.enabled);

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

  const handleToggleParental = () => {
    if (parentalEnabled) {
      toggleParentalControl(false);
    } else {
      const cleanPin = pinDraft.trim().slice(0, 8) || '0000';
      toggleParentalControl(true, cleanPin);
    }
  };

  const handleSavePin = () => {
    const cleanPin = pinDraft.trim().slice(0, 8) || '0000';
    setPinDraft(cleanPin);
    toggleParentalControl(true, cleanPin);
  };

  const renderPermissionsPanel = () => (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Account Permissions</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Active capabilities for{' '}
            <span className="text-slate-200 font-semibold">
              {isEffectiveAdmin ? 'Administrator' : isSignedIn ? 'Standard Viewer' : 'Guest Explorer'}
            </span>
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isEffectiveAdmin
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : isSignedIn
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          {isEffectiveAdmin ? 'Admin Role' : isSignedIn ? 'Member Role' : 'Guest Role'}
        </span>
      </div>

      <div className="space-y-2">
        {PERMISSION_ROWS.map(row => {
          const isAllowed = accountPermissions[row.key];
          const canToggle = row.editable || (row.adminOnly && isEffectiveAdmin);
          return (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/90"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 shrink-0">{row.icon}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-white">{row.label}</span>
                    {row.adminOnly && !isEffectiveAdmin && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-semibold uppercase">
                        Admin Only
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{row.description}</p>
                </div>
              </div>

              {canToggle ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAllowed}
                  aria-label={`Toggle ${row.label}`}
                  onClick={() => updateAccountPermission(row.key, !isAllowed)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    isAllowed ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isAllowed ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                    isAllowed
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isAllowed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Allowed</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3 h-3" />
                      <span>Restricted</span>
                    </>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Parental Safety PIN Section */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className={`w-4 h-4 ${parentalEnabled ? 'text-rose-400' : 'text-slate-400'}`} />
            <div>
              <p className="text-xs font-semibold text-white">Parental PIN Protection</p>
              <p className="text-[11px] text-slate-400">
                {parentalEnabled
                  ? `Active (PIN required for restricted & 18+ streams)`
                  : 'Off — enable 4-digit PIN lock for family safety'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleParental}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              parentalEnabled
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {parentalEnabled ? 'Disable PIN' : 'Enable PIN'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pinDraft}
            onChange={e => setPinDraft(e.target.value)}
            placeholder="4-digit PIN (e.g. 0000)"
            className="flex-1 min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleSavePin}
            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shrink-0"
          >
            Save &amp; Lock PIN
          </button>
        </div>
      </div>

      {isEffectiveAdmin && (
        <button
          type="button"
          onClick={() => {
            setCurrentTab('admin');
            setIsAuthModalOpen(false);
          }}
          className="w-full min-h-[44px] py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Shield className="w-4 h-4" />
          <span>Open Admin RBAC &amp; Control Console</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative">
        <button
          onClick={() => setIsAuthModalOpen(false)}
          aria-label="Close account modal"
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {isSignedIn ? (
          /* Signed-In Account & Permissions View */
          <div className="space-y-5">
            <div className="text-center space-y-2.5">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-lg font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">{user.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  <Shield className="w-3 h-3" />
                  <span>{isEffectiveAdmin ? 'Administrator' : 'Standard Member'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-left text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500">Saved Favorites</span>
                  <p className="text-base font-bold text-white mt-0.5 tabular-nums">{user.favorites.length}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500">Recently Played</span>
                  <p className="text-base font-bold text-white mt-0.5 tabular-nums">{user.recentIds.length}</p>
                </div>
              </div>
            </div>

            {renderPermissionsPanel()}

            <div className="pt-1">
              <button
                onClick={() => {
                  logoutUser();
                  setIsAuthModalOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out to Guest Explorer</span>
              </button>
            </div>
          </div>
        ) : (
          /* Guest: Switch between Sign In / Register and Guest Permissions */
          <div className="space-y-5 pr-10">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setGuestView('auth')}
                className={`flex-1 min-h-[40px] py-2 rounded-lg transition-colors cursor-pointer ${
                  guestView === 'auth'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Account Sign In
              </button>
              <button
                type="button"
                onClick={() => setGuestView('permissions')}
                className={`flex-1 min-h-[40px] py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  guestView === 'permissions'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Guest Permissions</span>
              </button>
            </div>

            {guestView === 'permissions' ? (
              <div className="space-y-4">
                {renderPermissionsPanel()}
                <button
                  type="button"
                  onClick={() => setGuestView('auth')}
                  className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sign In for Member or Admin Permissions
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-5">
                  <h3 className="font-display text-2xl font-bold text-white">
                    {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Save favorites, manage account permissions, and sync your watchlist.
                  </p>
                </div>

                {/* Quick Demo Fill Buttons */}
                <div className="mb-5 p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 block">Instant Role Access:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleQuickUser}
                      className="min-h-[44px] py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-left truncate cursor-pointer transition-colors"
                    >
                      👤 Sign in as Viewer
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAdmin}
                      className="min-h-[44px] py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-left truncate cursor-pointer transition-colors border border-amber-500/30"
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
                          className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
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
                        className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
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
                        className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-[44px] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-2"
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
        )}
      </div>
    </div>
  );
};
