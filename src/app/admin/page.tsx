'use client';

import React, { useState, useEffect } from 'react';
import { signIn, signOut, getSession } from 'next-auth/react';
import {
  Film,
  RefreshCw,
  Database,
  Layers,
  CheckCircle,
  AlertCircle,
  Clock,
  LogOut,
  Lock,
  Search,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  LayoutDashboard,
  Globe,
  ChevronLeft,
  ChevronRight,
  Tag,
  Sun,
  Moon,
  Sparkles,
  CheckSquare,
  Square,
  Calendar,
  Download,
  Mail,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

interface SyncStats {
  totalMovies: number;
  totalCategories: number;
  lastSync: string | null;
  latestMovieTitle: string | null;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string>('');
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [stats, setStats] = useState<SyncStats | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncCount, setSyncCount] = useState<number>(50);
  const [pagesToSync, setPagesToSync] = useState<number>(1);
  const [sourceApiUrl, setSourceApiUrl] = useState<string>(
    process.env.NEXT_PUBLIC_WP_API_BASE || 'https://movies4u.kg/wp-json/wp/v2'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [moviePage, setMoviePage] = useState<number>(1);
  const [movieTotalPages, setMovieTotalPages] = useState<number>(1);
  const [totalMoviesCount, setTotalMoviesCount] = useState<number>(0);
  const [isLoadingMovies, setIsLoadingMovies] = useState<boolean>(false);

  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);

  // New Movies Live Discovery from movies4u.kg
  const [newMoviesList, setNewMoviesList] = useState<any[]>([]);
  const [isLoadingNewMovies, setIsLoadingNewMovies] = useState<boolean>(false);
  const [selectedNewMovieSlugs, setSelectedNewMovieSlugs] = useState<string[]>([]);
  const [isInsertingNewMovies, setIsInsertingNewMovies] = useState<boolean>(false);
  const [newMoviesStatus, setNewMoviesStatus] = useState<string>('');
  const [rawPostsInput, setRawPostsInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [isFilteringManual, setIsFilteringManual] = useState<boolean>(false);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'categories' | 'sync' | 'new_movies'>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Load saved theme preference
  useEffect(() => {
    const saved = localStorage.getItem('mm_admin_theme');
    if (saved === 'light') setDarkMode(false);
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('mm_admin_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Proxy external poster URLs through our image proxy to bypass hotlink protection
  const getProxiedPoster = (url: string | undefined) => {
    if (!url || url === '/poster-placeholder.svg') return '';
    if (url.startsWith('/')) return url; // local URLs
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  // Check persisted auth or NextAuth Google session
  // Check persisted auth, 7-day automatic expiry, and password change invalidation
  useEffect(() => {
    getSession().then(async (session) => {
      if (session?.user?.email) {
        setAdminEmail(session.user.email);
        setIsAuthenticated(true);
        loadAllAdminData();
        return;
      }

      const savedEmail = localStorage.getItem('mm_admin_email');
      const savedPass = localStorage.getItem('mm_admin_passcode');
      const savedLoginAt = parseInt(localStorage.getItem('mm_admin_login_at') || '0', 10);
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

      if (savedEmail && savedPass) {
        // 1. Check 7-day automatic session expiry
        if (savedLoginAt && Date.now() - savedLoginAt > SEVEN_DAYS_MS) {
          handleLogout('Your admin session has expired after 7 days. Please sign in again.');
          return;
        }

        // 2. Check if password was changed or session invalidated
        try {
          const res = await fetch('/api/admin/auth/check-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: savedEmail, sessionLoginAt: savedLoginAt }),
          });
          const data = await res.json();
          if (!data.valid) {
            handleLogout(
              data.message || 'Session expired or password was changed. Please sign in again.'
            );
            return;
          }
        } catch (_) {}

        setAdminEmail(savedEmail);
        setPasscode(savedPass);
        setIsAuthenticated(true);
        loadAllAdminData();
      }
    });
  }, []);

  const loadAllAdminData = () => {
    fetchStats();
    fetchMovies(1, '');
    fetchCategories();
    fetchNewMovies();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();
    setLoginError('');
    setLoginSuccessMsg('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          passcode: passcode.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setLoginError('');
        const loginTimestamp = data.session?.loginAt || Date.now();
        localStorage.setItem('mm_admin_email', cleanEmail);
        localStorage.setItem('mm_admin_passcode', passcode.trim());
        localStorage.setItem('mm_admin_login_at', String(loginTimestamp));
        loadAllAdminData();
      } else {
        setLoginError(data.error || 'Access Denied: Invalid credentials or unauthorized account.');
      }
    } catch (err: any) {
      setLoginError(`Login request failed: ${err.message || 'Network error'}`);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setForgotStatus({ type: 'error', message: 'Please enter your registered admin email.' });
      return;
    }
    setIsSendingOtp(true);
    setForgotStatus(null);
    try {
      const res = await fetch('/api/admin/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setForgotStatus({ type: 'success', message: data.message });
      } else {
        setForgotStatus({ type: 'error', message: data.error || 'Failed to send OTP.' });
      }
    } catch (err: any) {
      setForgotStatus({ type: 'error', message: err?.message || 'Network error while sending OTP.' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    const cleanOtp = forgotOtp.trim();

    if (!cleanOtp) {
      setForgotStatus({ type: 'error', message: 'Please enter the 6-digit OTP code.' });
      return;
    }
    if (newPassword.length < 6) {
      setForgotStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotStatus({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    setIsResettingPassword(true);
    setForgotStatus(null);
    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Clear all stored credentials and log out any session
        localStorage.removeItem('mm_admin_email');
        localStorage.removeItem('mm_admin_passcode');
        localStorage.removeItem('mm_admin_login_at');
        setIsAuthenticated(false);

        // Reset forgot modal state and show success on login card
        setShowForgotModal(false);
        setOtpSent(false);
        setForgotOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setAdminEmail(cleanEmail);
        setPasscode('');
        setLoginSuccessMsg(
          '✅ Password reset successfully! All active sessions have been terminated. Please sign in with your new password.'
        );
      } else {
        setForgotStatus({ type: 'error', message: data.error || 'Failed to reset password.' });
      }
    } catch (err: any) {
      setForgotStatus({ type: 'error', message: err?.message || 'Network error while resetting password.' });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const fetchNewMovies = async () => {
    setIsLoadingNewMovies(true);
    setNewMoviesStatus('Scanning movies4u.kg for newly added movies...');
    try {
      const res = await fetch('/api/admin/new-movies');
      if (res.ok) {
        const data = await res.json();
        const incoming = data.newMovies || [];
        setNewMoviesList(incoming);
        if (incoming.length > 0) {
          setNewMoviesStatus(`✨ Found ${incoming.length} new unique movie(s) ready to insert!`);
        } else {
          setNewMoviesStatus('✨ All caught up! Every movie from movies4u.kg is already in your database.');
        }
      } else {
        setNewMoviesStatus('Failed to scan for new movies.');
      }
    } catch (err: any) {
      setNewMoviesStatus(`Error: ${err.message || 'Network error'}`);
    } finally {
      setIsLoadingNewMovies(false);
    }
  };

  const insertNewMovies = async (moviesToInsert: any[]) => {
    if (!moviesToInsert || moviesToInsert.length === 0) return;
    setIsInsertingNewMovies(true);
    setNewMoviesStatus(`⏳ Inserting ${moviesToInsert.length} movie(s) into database with exact date & time...`);

    try {
      const res = await fetch('/api/admin/new-movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movies: moviesToInsert }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const insertedSlugs = new Set(moviesToInsert.map((m) => m.slug));
        // Remove inserted movies from newMoviesList so the section empties out!
        setNewMoviesList((prev) => prev.filter((m) => !insertedSlugs.has(m.slug)));
        setSelectedNewMovieSlugs((prev) => prev.filter((s) => !insertedSlugs.has(s)));
        setNewMoviesStatus(`✅ Successfully inserted ${data.insertedCount} movie(s) into database! Section cleared.`);
        fetchStats();
        fetchMovies(1, '');
      } else {
        setNewMoviesStatus(`❌ Error inserting movies: ${data.error || 'Failed'}`);
      }
    } catch (err: any) {
      setNewMoviesStatus(`❌ Error: ${err.message || 'Network error'}`);
    } finally {
      setIsInsertingNewMovies(false);
    }
  };

  const handleFilterRawPosts = async () => {
    if (!rawPostsInput.trim()) return;
    setIsFilteringManual(true);
    try {
      let parsedPosts: any[] = [];
      try {
        const parsed = JSON.parse(rawPostsInput);
        parsedPosts = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        setNewMoviesStatus('❌ Invalid JSON: Please paste valid WordPress posts JSON array.');
        setIsFilteringManual(false);
        return;
      }

      setNewMoviesStatus(`⏳ Comparing ${parsedPosts.length} posts against your database...`);
      const res = await fetch('/api/admin/new-movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'filter', posts: parsedPosts }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewMoviesList(data.newMovies || []);
        if (data.newMovies?.length > 0) {
          setNewMoviesStatus(
            `✨ Checked ${data.totalChecked} posts: Found ${data.newCount} new unique movie(s) ready to insert! (${data.existingCount} already in DB)`
          );
        } else {
          setNewMoviesStatus(
            `✨ All ${data.totalChecked} posts are already in your database! Section is clean.`
          );
        }
        setShowManualInput(false);
      } else {
        setNewMoviesStatus(`❌ Error filtering posts: ${data.error || 'Failed'}`);
      }
    } catch (err: any) {
      setNewMoviesStatus(`❌ Error: ${err.message || 'Network error'}`);
    } finally {
      setIsFilteringManual(false);
    }
  };

  const handleLogout = async (message?: string) => {
    setIsAuthenticated(false);
    localStorage.removeItem('mm_admin_email');
    localStorage.removeItem('mm_admin_passcode');
    localStorage.removeItem('mm_admin_login_at');
    if (message) {
      setLoginError(message);
    }
    try {
      await signOut({ redirect: false });
    } catch (_) {}
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/sync');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (_) {}
  };

  const fetchMovies = async (page = 1, query = searchQuery) => {
    setIsLoadingMovies(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', '25');
      if (query.trim()) params.set('search', query.trim());

      const res = await fetch(`/api/movies?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMoviesList(data.movies || []);
        setMoviePage(data.currentPage || page);
        setMovieTotalPages(data.totalPages || 1);
        setTotalMoviesCount(data.totalMovies || 0);
      }
    } catch (_) {
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(Array.isArray(data) ? data : []);
      }
    } catch (_) {
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    let totalAddedAll = 0;
    let totalUpdatedAll = 0;
    let totalProcessedAll = 0;

    try {
      const cleanSource = sourceApiUrl.trim().replace(/\/+$/, '');

      for (let page = 1; page <= pagesToSync; page++) {
        setSyncStatus(`[Page ${page}/${pagesToSync}] Fetching ${syncCount} movies from source...`);

        let posts: any[] = [];
        try {
          const fetchRes = await fetch(
            `${cleanSource}/posts?_embed=1&page=${page}&per_page=${syncCount}`,
            {
              headers: {
                Accept: 'application/json, text/plain, */*',
              },
            }
          );
          if (fetchRes.ok) {
            posts = await fetchRes.json();
          }
        } catch (_) {
          // Client fetch blocked or failed; sync route will attempt server fetch
        }

        setSyncStatus(
          `[Page ${page}/${pagesToSync}] Saving ${posts.length > 0 ? posts.length : syncCount} movies into Hostinger MySQL...`
        );

        const syncRes = await fetch('/api/admin/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail,
            'x-admin-passcode': passcode,
          },
          body: JSON.stringify({
            posts: posts.length > 0 ? posts : undefined,
            page,
            perPage: syncCount,
            sourceUrl: cleanSource,
          }),
        });

        const result = await syncRes.json();
        if (syncRes.ok) {
          totalAddedAll += result.added || 0;
          totalUpdatedAll += result.updated || 0;
          totalProcessedAll += result.totalProcessed || (posts.length || syncCount);
          setSyncStatus(
            `Page ${page}/${pagesToSync} done! Total added: ${totalAddedAll}, updated: ${totalUpdatedAll}...`
          );
          fetchStats();
        } else {
          setSyncStatus(`Error on Page ${page}: ${result.error || 'Failed to sync'}`);
          break;
        }
      }

      setSyncStatus(
        `Sync Complete! Successfully processed ${totalProcessedAll} movies: ${totalAddedAll} newly added, ${totalUpdatedAll} updated.`
      );
      fetchStats();
      fetchMovies();
    } catch (err: any) {
      setSyncStatus(`Error: ${err.message || 'Network error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Standalone Clean Admin Login & OTP Reset View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#080B12] flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-sm bg-[#111726] border border-white/10 rounded-2xl p-7 shadow-2xl">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/30 mb-3">
              <Film className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">MOVIE MAN</h1>
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mt-0.5">
              Admin Control Portal
            </p>
            <p className="text-xs text-gray-300 mt-2">
              {showForgotModal
                ? 'Reset your password via 6-digit email OTP'
                : 'Sign in to manage database & movie catalog'}
            </p>
          </div>

          {/* Success Banner */}
          {loginSuccessMsg && !showForgotModal && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-2 text-emerald-300 text-xs leading-relaxed">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
              <span>{loginSuccessMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {loginError && !showForgotModal && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Forgot Modal Status Banner */}
          {showForgotModal && forgotStatus && (
            <div
              className={`mb-4 p-3 rounded-xl flex items-start space-x-2 text-xs leading-relaxed ${
                forgotStatus.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {forgotStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              )}
              <span>{forgotStatus.message}</span>
            </div>
          )}

          {!showForgotModal ? (
            /* Standard Admin Login Form */
            <>
              {/* 1-Click Google Sign In */}
              <button
                type="button"
                onClick={() =>
                  signIn('google', { callbackUrl: '/admin' }, { prompt: 'select_account' })
                }
                style={{ cursor: 'pointer' }}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2.5 px-4 rounded-xl transition shadow text-sm flex items-center justify-center space-x-3 active:scale-[0.99] cursor-pointer hover:shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-white/10 w-full"></div>
                <span className="bg-[#111726] px-3 text-[11px] text-gray-400 font-medium whitespace-nowrap">
                  or credentials
                </span>
                <div className="border-t border-white/10 w-full"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-300 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-[#080B12] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-300">
                      Password / Passcode
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(adminEmail);
                        setForgotStatus(null);
                        setShowForgotModal(true);
                      }}
                      className="text-[11px] text-red-400 hover:text-red-300 transition font-medium hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#080B12] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none transition"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ cursor: 'pointer' }}
                  className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-red-600/20 text-sm flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Dashboard</span>
                </button>
              </form>
            </>
          ) : (
            /* OTP Password Reset Flow */
            <div className="space-y-4">
              {!otpSent ? (
                /* Step 1: Send OTP to Admin Email */
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-300 mb-1">
                      Admin Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full bg-[#080B12] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none transition"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5 leading-normal">
                      We will send a 6-digit verification code to your registered admin email via Gmail SMTP.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    style={{ cursor: isSendingOtp ? 'not-allowed' : 'pointer' }}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-red-600/20 text-sm flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send 6-Digit OTP</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Verify OTP and Set New Password */
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-300">
                        6-Digit OTP Code
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isSendingOtp}
                        className="text-[11px] text-red-400 hover:text-red-300 transition font-medium hover:underline cursor-pointer disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full bg-[#080B12] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2 pl-9 text-sm text-white font-mono tracking-widest placeholder-gray-500 focus:outline-none transition"
                      />
                      <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-300 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#080B12] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none transition"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#080B12] border border-white/15 focus:border-red-500 rounded-xl px-3.5 py-2 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none transition"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    style={{ cursor: isResettingPassword ? 'not-allowed' : 'pointer' }}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-red-600/20 text-sm flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                  >
                    {isResettingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Reset Password</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Back to Login Button */}
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStatus(null);
                }}
                className="w-full text-center text-xs text-gray-400 hover:text-white transition flex items-center justify-center space-x-1.5 pt-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin Dashboard View with Left Sidebar & Mobile Drawer
  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'bg-[#070A11] text-white' : 'bg-[#F1F5F9] text-[#0F172A]'}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* Theme-aware CSS overrides */}
      <style>{`
        /* ---- LIGHT MODE OVERRIDES ---- */
        /* Sidebar */
        [data-theme="light"] aside { background-color: #FFFFFF !important; border-color: #E2E8F0 !important; }
        [data-theme="light"] aside > div:last-child { background-color: #F8FAFC !important; border-color: #E2E8F0 !important; }
        [data-theme="light"] aside nav button { color: #475569; }
        [data-theme="light"] aside nav button:hover { color: #0F172A; background-color: rgba(0,0,0,0.04); }
        /* Header */
        [data-theme="light"] header { background-color: rgba(255,255,255,0.95) !important; border-color: #E2E8F0 !important; }
        [data-theme="light"] header h2 { color: #0F172A !important; }
        [data-theme="light"] header p { color: #64748B !important; }
        /* Cards & panels - target by dark bg classes */
        [data-theme="light"] .bg-\\[\\#0F1524\\] { background-color: #FFFFFF !important; border-color: #E2E8F0 !important; box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important; }
        [data-theme="light"] .bg-\\[\\#0F1524\\] h2 { color: #0F172A !important; }
        [data-theme="light"] .bg-\\[\\#0F1524\\] h3 { color: #0F172A !important; }
        [data-theme="light"] .bg-\\[\\#0F1524\\] p { color: #64748B !important; }
        [data-theme="light"] .bg-\\[\\#0F1524\\] > .flex span { color: #475569; }
        /* Sync panel internals */
        [data-theme="light"] .bg-\\[\\#172034\\] { background-color: #F1F5F9 !important; border-color: #CBD5E1 !important; }
        [data-theme="light"] .bg-\\[\\#172034\\/60\\] { background-color: #F1F5F9 !important; }
        /* Table areas */
        [data-theme="light"] thead { background-color: #F1F5F9 !important; }
        [data-theme="light"] thead th { color: #64748B !important; }
        [data-theme="light"] tbody { background-color: #FFFFFF !important; }
        [data-theme="light"] .bg-\\[\\#0D1322\\] { background-color: #FFFFFF !important; }
        [data-theme="light"] tbody tr { border-color: #F1F5F9 !important; }
        [data-theme="light"] tbody tr:hover { background-color: rgba(0,0,0,0.02) !important; }
        [data-theme="light"] tbody td { color: #334155 !important; }
        [data-theme="light"] tbody td .font-semibold { color: #0F172A !important; }
        /* Inputs & selects */
        [data-theme="light"] input, [data-theme="light"] select { background-color: #F1F5F9 !important; border-color: #CBD5E1 !important; color: #0F172A !important; }
        [data-theme="light"] input::placeholder { color: #94A3B8 !important; }
        [data-theme="light"] option { background-color: #FFFFFF !important; color: #0F172A !important; }
        /* Borders */
        [data-theme="light"] .border-white\\/10 { border-color: #E2E8F0 !important; }
        [data-theme="light"] .border-white\\/5 { border-color: #F1F5F9 !important; }
        /* Text color fixes */
        [data-theme="light"] .text-white { color: #0F172A !important; }
        [data-theme="light"] .text-gray-200 { color: #1E293B !important; }
        [data-theme="light"] .text-gray-300 { color: #475569 !important; }
        [data-theme="light"] .text-gray-400 { color: #64748B !important; }
        [data-theme="light"] .text-gray-500 { color: #94A3B8 !important; }
        /* Preserve accent colors */
        [data-theme="light"] .text-red-400, [data-theme="light"] .text-red-500,
        [data-theme="light"] .text-blue-400, [data-theme="light"] .text-blue-500,
        [data-theme="light"] .text-green-400, [data-theme="light"] .text-green-500,
        [data-theme="light"] .text-yellow-400 { color: inherit; }
        /* Active sidebar nav override */
        [data-theme="light"] aside nav button.bg-red-600 { color: #FFFFFF !important; }
        [data-theme="light"] aside nav button.bg-red-600 span { color: #FFFFFF !important; }
        /* Pagination + badge fixes */
        [data-theme="light"] .bg-white\\/10 { background-color: rgba(0,0,0,0.06) !important; }
        [data-theme="light"] .bg-white\\/5 { background-color: rgba(0,0,0,0.03) !important; }
        [data-theme="light"] .bg-\\[\\#141B2D\\] { background-color: #FFFFFF !important; border-color: #CBD5E1 !important; }
      `}</style>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Left Sidebar Panel (Sticky on Desktop, Slide-in Drawer on Mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 border-r flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0]'}`}
      >
        {/* Sidebar Top: Brand & Nav Links */}
        <div>
          {/* Brand Header */}
          <div className={`p-5 border-b flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-black text-base tracking-tight ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>MOVIE MAN</span>
                  <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                </div>
                <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Control Dashboard</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className={`lg:hidden p-1 rounded-lg ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => {
                setActiveTab('overview');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sync');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'sync'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
              }`}
            >
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
              <span>Database Sync Engine</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('new_movies');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'new_movies'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
              }`}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <div className="flex items-center justify-between w-full">
                <span>New Movies Live</span>
                {newMoviesList.length > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    {newMoviesList.length} New
                  </span>
                ) : (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                    Live
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('movies');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'movies'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
              }`}
            >
              <Film className="w-4 h-4 flex-shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span>All Movies</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-black/5 text-gray-500'}`}>
                  {totalMoviesCount || stats?.totalMovies || '8,000'}
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('categories');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'categories'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
              }`}
            >
              <Layers className="w-4 h-4 flex-shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span>All Categories</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-black/5 text-gray-500'}`}>
                  {categoriesList.length || stats?.totalCategories || '28'}
                </span>
              </div>
            </button>

            <a
              href="/"
              target="_blank"
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'}`}
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span>Live Public Site</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </div>
            </a>
          </nav>

        </div>

        {/* Sidebar Bottom: Admin Profile & Sign Out */}
        <div className={`p-4 border-t ${darkMode ? 'border-white/10 bg-[#0A0F1B]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                {adminEmail.split('@')[0] || 'Admin'}
              </p>
              <p className={`text-[10px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{adminEmail}</p>
            </div>
            <button
              onClick={() => handleLogout()}
              title="Sign Out"
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-6 py-3.5 flex items-center justify-between ${darkMode ? 'bg-[#0D1322]/90 border-white/10' : 'bg-white/92 border-[#E2E8F0]'}`}>
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-xl border ${darkMode ? 'text-gray-300 hover:text-white bg-white/5 border-white/10' : 'text-gray-600 hover:text-gray-900 bg-black/5 border-[#CBD5E1]'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-base font-bold tracking-tight ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'sync' && '1-Click Database Sync'}
                {activeTab === 'new_movies' && '✨ New Movies Live Discovery'}
                {activeTab === 'movies' && 'Movie Catalog Management'}
                {activeTab === 'categories' && 'Categories Management'}
              </h2>
              <p className={`text-[11px] hidden sm:block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Manage your Hostinger MySQL database & content mirrors
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => {
                fetchStats();
                fetchMovies();
              }}
              title="Refresh database metrics"
              className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-xl text-xs transition ${darkMode ? 'bg-[#141B2D] border-white/10 text-gray-300 hover:text-white' : 'bg-white border-[#CBD5E1] text-gray-600 hover:text-[#0F172A] shadow-sm'}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh Stats</span>
            </button>

            {/* Light/Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-2 rounded-xl border transition ${darkMode ? 'bg-[#141B2D] border-white/10 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' : 'bg-white border-[#CBD5E1] text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 shadow-sm'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <a
              href="/"
              target="_blank"
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 border rounded-xl text-xs transition ${darkMode ? 'bg-[#141B2D] border-white/10 text-gray-300 hover:text-white' : 'bg-white border-[#CBD5E1] text-gray-600 hover:text-[#0F172A] shadow-sm'}`}
            >
              <span>Visit Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => handleLogout()}
              className="sm:hidden p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-xl border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Stat Cards (Always visible on Overview, or top banner) */}
          {(activeTab === 'overview' || activeTab === 'sync') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Movies */}
              <div className="bg-[#0F1524] border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Movies in DB</p>
                  <h2 className="text-2xl font-black text-white mt-0.5 truncate">{stats?.totalMovies ?? '8,000'}</h2>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-[#0F1524] border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Categories</p>
                  <h2 className="text-2xl font-black text-white mt-0.5 truncate">{stats?.totalCategories ?? '28'}</h2>
                </div>
              </div>

              {/* Last Synced */}
              <div className="bg-[#0F1524] border border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Sync Activity</p>
                  <h2 className="text-sm font-bold text-gray-200 mt-0.5 truncate">
                    {stats?.lastSync ? new Date(stats.lastSync).toLocaleTimeString() : 'Up to date'}
                  </h2>
                  <p className="text-[10px] text-gray-400 truncate">
                    {stats?.latestMovieTitle || 'Catalog Loaded'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sync Controls Section */}
          {(activeTab === 'overview' || activeTab === 'sync') && (
            <div className="bg-[#0F1524] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold flex items-center space-x-2 text-white">
                    <RefreshCw className="w-5 h-5 text-red-500" />
                    <span>1-Click Database Sync & Seeding Engine</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Fetches movies with posters, screenshots, categories, and direct cloud download mirrors into Hostinger MySQL.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center space-x-1.5 bg-[#172034] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-gray-300">
                    <span className="text-gray-400 text-[11px]">Per Page:</span>
                    <select
                      value={syncCount}
                      onChange={(e) => setSyncCount(Number(e.target.value))}
                      className="bg-transparent font-bold text-gray-200 focus:outline-none cursor-pointer"
                    >
                      <option value={20} className="bg-[#172034]">20 Movies</option>
                      <option value={50} className="bg-[#172034]">50 Movies</option>
                      <option value={100} className="bg-[#172034]">100 Movies</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-[#172034] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-gray-300">
                    <span className="text-gray-400 text-[11px]">Pages:</span>
                    <select
                      value={pagesToSync}
                      onChange={(e) => setPagesToSync(Number(e.target.value))}
                      className="bg-transparent font-bold text-gray-200 focus:outline-none cursor-pointer"
                    >
                      <option value={1} className="bg-[#172034]">1 Page</option>
                      <option value={5} className="bg-[#172034]">5 Pages ({syncCount * 5})</option>
                      <option value={10} className="bg-[#172034]">10 Pages ({syncCount * 10})</option>
                      <option value={20} className="bg-[#172034]">20 Pages ({syncCount * 20})</option>
                      <option value={50} className="bg-[#172034]">50 Pages ({syncCount * 50})</option>
                      <option value={100} className="bg-[#172034]">100 Pages ({syncCount * 100})</option>
                      <option value={160} className="bg-[#172034]">⚡ All 160 Pages (7,900+)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:opacity-50 active:scale-[0.98] text-white font-bold px-5 py-2 rounded-xl transition text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : pagesToSync >= 160 ? '⚡ Sync All 7,900+' : `Sync (${syncCount * pagesToSync} max)`}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
                <span className="text-[11px] text-gray-500 flex-shrink-0">Source API:</span>
                <input
                  type="text"
                  value={sourceApiUrl}
                  onChange={(e) => setSourceApiUrl(e.target.value)}
                  className="w-full bg-[#172034]/60 border border-white/5 rounded-lg px-2.5 py-1 text-[11px] text-gray-400 focus:text-white focus:outline-none focus:border-red-500/50"
                  placeholder="https://movies4u.kg/wp-json/wp/v2"
                />
              </div>

              {syncStatus && (
                <div className="p-3 bg-[#172034] border border-white/10 rounded-xl flex items-center space-x-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-200">{syncStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* New Movies Discovery & Insertion Section */}
          {activeTab === 'new_movies' && (
            <div className="bg-[#0F1524] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              {/* Header & Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                      <span>New Movies Live from Source</span>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                        {newMoviesList.length} Pending
                      </span>
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Live comparison with movies4u.kg. Only un-imported unique movies appear here. Select and click &apos;Insert to DB&apos; to instantly add them with exact publication timestamps.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={fetchNewMovies}
                    disabled={isLoadingNewMovies}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#172034] hover:bg-[#1E2B47] border border-white/10 rounded-xl text-xs font-semibold text-gray-200 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNewMovies ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{isLoadingNewMovies ? 'Scanning...' : 'Scan for New Movies'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualInput((prev) => !prev)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#172034] hover:bg-[#1E2B47] border border-white/10 rounded-xl text-xs font-semibold text-gray-300 transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>{showManualInput ? 'Close JSON Input' : 'Paste / Browser Posts'}</span>
                  </button>

                  {newMoviesList.length > 0 && (
                    <>
                      <button
                        onClick={() => {
                          if (selectedNewMovieSlugs.length === newMoviesList.length) {
                            setSelectedNewMovieSlugs([]);
                          } else {
                            setSelectedNewMovieSlugs(newMoviesList.map((m) => m.slug));
                          }
                        }}
                        className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#172034] hover:bg-[#1E2B47] border border-white/10 rounded-xl text-xs font-semibold text-gray-200 transition"
                      >
                        {selectedNewMovieSlugs.length === newMoviesList.length ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <span>
                          {selectedNewMovieSlugs.length === newMoviesList.length
                            ? 'Deselect All'
                            : `Select All (${newMoviesList.length})`}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          const toInsert = newMoviesList.filter((m) =>
                            selectedNewMovieSlugs.includes(m.slug)
                          );
                          insertNewMovies(toInsert);
                        }}
                        disabled={selectedNewMovieSlugs.length === 0 || isInsertingNewMovies}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Download className={`w-4 h-4 ${isInsertingNewMovies ? 'animate-bounce' : ''}`} />
                        <span>
                          {isInsertingNewMovies
                            ? 'Inserting to Database...'
                            : `📥 Insert Selected (${selectedNewMovieSlugs.length}) to DB`}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Collapsible Manual JSON Import for Cloudflare Protected Environments */}
              {showManualInput && (
                <div className="p-4 bg-[#141C30] border border-blue-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-white">Browser-Assisted Live Posts Sync</h4>
                    </div>
                    <a
                      href="https://movies4u.kg/wp-json/wp/v2/posts?_embed=1&per_page=40&orderby=date&order=desc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-400 hover:text-blue-300 underline flex items-center space-x-1"
                    >
                      <span>Open movies4u.kg Posts in Browser</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    If movies4u.kg shows Cloudflare verification on server, open the link above in your browser (where Cloudflare verifies you), copy the JSON response, and paste it below. It will automatically match against your MySQL DB and show only the new movies!
                  </p>
                  <textarea
                    rows={4}
                    value={rawPostsInput}
                    onChange={(e) => setRawPostsInput(e.target.value)}
                    placeholder="Paste WordPress posts JSON array here: [ { id: ..., title: ..., ... } ]"
                    className="w-full bg-[#0B0F19] border border-white/10 rounded-xl p-3 text-xs text-gray-200 placeholder-gray-500 font-mono focus:outline-none focus:border-blue-500/50"
                  />
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setRawPostsInput('')}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleFilterRawPosts}
                      disabled={!rawPostsInput.trim() || isFilteringManual}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {isFilteringManual ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>⚡ Compare & Find New Movies</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {newMoviesStatus && (
                <div className="p-3 bg-[#172034] border border-white/10 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-gray-200">{newMoviesStatus}</span>
                  </div>
                  {isInsertingNewMovies && (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin flex-shrink-0" />
                  )}
                </div>
              )}

              {/* Content / Movies Grid or Empty State */}
              {isLoadingNewMovies ? (
                <div className="py-16 text-center text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
                  <p className="text-sm font-semibold text-white">Comparing movies4u.kg with your MySQL database...</p>
                  <p className="text-xs text-gray-500 mt-1">Filtering out any movies you already have</p>
                </div>
              ) : newMoviesList.length === 0 ? (
                <div className="py-16 text-center bg-[#111726] border border-white/5 rounded-2xl p-8">
                  <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">All Caught Up! Section is Empty</h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    Every unique movie from movies4u.kg is already in your database. When new movies are added on movies4u.kg, they will automatically appear here for 1-click insertion.
                  </p>
                  <button
                    onClick={fetchNewMovies}
                    className="mt-5 inline-flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-200 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    <span>Check Again</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {newMoviesList.map((movie) => {
                    const isSelected = selectedNewMovieSlugs.includes(movie.slug);
                    return (
                      <div
                        key={movie.slug}
                        onClick={() => {
                          setSelectedNewMovieSlugs((prev) =>
                            prev.includes(movie.slug)
                              ? prev.filter((s) => s !== movie.slug)
                              : [...prev, movie.slug]
                          );
                        }}
                        className={`group relative border rounded-2xl p-4 flex space-x-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                            : 'bg-[#111726] border-white/10 hover:border-white/20 hover:bg-[#141B2D]'
                        }`}
                      >
                        {/* Checkbox indicator */}
                        <div className="absolute top-3 right-3 z-10">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
                          )}
                        </div>

                        {/* Poster */}
                        <div className="w-20 h-28 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10 relative">
                          {movie.poster ? (
                            <img
                              src={getProxiedPoster(movie.poster)}
                              alt={movie.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <Film className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between pr-6">
                          <div>
                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-amber-300 transition">
                              {movie.title}
                            </h4>

                            {/* Exact Publication Date & Time Badge */}
                            <div className="flex items-center space-x-1.5 text-[11px] text-amber-400 mt-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                              <span className="truncate">
                                {movie.date
                                  ? new Date(movie.date).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true,
                                    })
                                  : 'Recent'}
                              </span>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {movie.qualities?.slice(0, 3).map((q: string) => (
                                <span
                                  key={q}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 font-mono"
                                >
                                  {q}
                                </span>
                              ))}
                              {movie.downloadLinks?.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 border border-green-500/20 text-green-400 font-bold">
                                  {movie.downloadLinks.length} Links
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 1-Click Insert Button for this single movie */}
                          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-mono">
                              wpId: {movie.wpId}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                insertNewMovies([movie]);
                              }}
                              disabled={isInsertingNewMovies}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 active:scale-95 disabled:opacity-50"
                            >
                              <span>📥 Insert to DB</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Synced Movies Table */}
          {(activeTab === 'overview' || activeTab === 'movies') && (
            <div className="bg-[#0F1524] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Film className="w-4 h-4 text-red-500" />
                  <h3 className="text-base font-bold text-white">Movies in Database</h3>
                  <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    8,000 Live
                  </span>
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search synced movies..."
                    className="w-full bg-[#172034] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 pl-8 transition"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Table with responsive horizontal scroll */}
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs min-w-[780px]">
                  <thead className="bg-[#172034] text-gray-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Poster</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Year</th>
                      <th className="py-3 px-4">Rating</th>
                      <th className="py-3 px-4">Date Added</th>
                      <th className="py-3 px-4">Qualities</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-[#0D1322]">
                    {moviesList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          Loading movie catalog...
                        </td>
                      </tr>
                    ) : (
                      moviesList
                        .filter((m) =>
                          searchQuery ? m.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
                        )
                        .map((m) => (
                          <tr key={m.id || m.slug} className="hover:bg-white/[0.03] transition">
                            <td className="py-3 px-4">
                              {m.poster && m.poster !== '/poster-placeholder.svg' ? (
                                <img
                                  src={getProxiedPoster(m.poster)}
                                  alt={m.title}
                                  className="w-14 h-20 object-cover rounded-xl bg-gray-800 border border-white/10 shadow-md"
                                  onError={(e: any) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-14 h-20 rounded-xl bg-gradient-to-br from-red-600/30 to-purple-600/30 border border-white/10 items-center justify-center text-white font-black text-lg"
                                style={{ display: m.poster && m.poster !== '/poster-placeholder.svg' ? 'none' : 'flex' }}
                              >
                                {m.title?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-200 max-w-[240px] truncate">
                              {m.title}
                            </td>
                            <td className="py-3 px-4 text-gray-400">{m.year || '—'}</td>
                            <td className="py-3 px-4">
                              <span className="text-yellow-400 font-bold">★ {m.rating || 'N/A'}</span>
                            </td>
                            <td className="py-3 px-4">
                              {m.date ? (
                                <div>
                                  <p className="text-gray-300 text-[11px] font-medium">
                                    {new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                  <p className="text-gray-500 text-[10px]">
                                    {new Date(m.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {(m.qualities || ['HD']).slice(0, 4).map((q: string) => (
                                  <span
                                    key={q}
                                    className="bg-white/5 border border-white/10 text-[9px] px-1.5 py-0.5 rounded text-gray-300 font-mono"
                                  >
                                    {q}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <a
                                href={`/movie/${m.slug}`}
                                target="_blank"
                                className="inline-flex items-center space-x-1 text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg transition text-[11px]"
                              >
                                <span>View</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {movieTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/5">
                  <p className="text-[11px] text-gray-400">
                    Page <span className="text-white font-bold">{moviePage}</span> of{' '}
                    <span className="text-white font-bold">{movieTotalPages}</span>{' '}
                    ({totalMoviesCount.toLocaleString()} movies)
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchMovies(moviePage - 1)}
                      disabled={moviePage <= 1 || isLoadingMovies}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-[#172034] border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={() => fetchMovies(moviePage + 1)}
                      disabled={moviePage >= movieTotalPages || isLoadingMovies}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-[#172034] border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categories Table */}
          {activeTab === 'categories' && (
            <div className="bg-[#0F1524] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-bold text-white">All Categories</h3>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {categoriesList.length} Total
                  </span>
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full bg-[#172034] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 pl-8 transition"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {isLoadingCategories ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                  Loading categories...
                </div>
              ) : categoriesList.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  <Layers className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  No categories found in the database.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left text-xs min-w-[480px]">
                    <thead className="bg-[#172034] text-gray-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4 w-10">#</th>
                        <th className="py-3 px-4">Category Name</th>
                        <th className="py-3 px-4">Slug</th>
                        <th className="py-3 px-4 text-center">Movies</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-[#0D1322]">
                      {categoriesList
                        .filter((c) =>
                          categorySearch
                            ? c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                              c.slug.toLowerCase().includes(categorySearch.toLowerCase())
                            : true
                        )
                        .map((cat, index) => (
                          <tr key={cat.id || cat.slug} className="hover:bg-white/[0.03] transition">
                            <td className="py-3 px-4 text-gray-500 font-mono">{index + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Tag className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                <span className="font-semibold text-gray-200">{cat.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-white/5 border border-white/10 text-[10px] px-2 py-0.5 rounded text-gray-400 font-mono">
                                {cat.slug}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cat.count > 100
                                  ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                                  : cat.count > 20
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                  : 'bg-white/5 text-gray-400 border border-white/10'
                              }`}>
                                {cat.count}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <a
                                href={`/category/${cat.slug}`}
                                target="_blank"
                                className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg transition text-[11px]"
                              >
                                <span>View</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
