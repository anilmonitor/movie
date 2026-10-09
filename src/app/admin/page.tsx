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
  Copy,
  Check,
} from 'lucide-react';

// .. 

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

  // Sync Engine direct helper & bookmarklet state
  const [directSyncJson, setDirectSyncJson] = useState<string>('');
  const [isDirectSyncing, setIsDirectSyncing] = useState<boolean>(false);
  const [showDirectSyncBox, setShowDirectSyncBox] = useState<boolean>(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState<boolean>(false);

  type AdminTab = 'overview' | 'movies' | 'categories' | 'sync' | 'new_movies';
  const VALID_TABS: AdminTab[] = ['overview', 'movies', 'categories', 'sync', 'new_movies'];

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Tab switching helper that updates state, localStorage, and URL search params
  const switchTab = (
    newTab: AdminTab,
    options?: { page?: number; q?: string }
  ) => {
    setActiveTab(newTab);
    setSidebarOpen(false);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', newTab);

      if (newTab === 'movies') {
        const p = options?.page !== undefined ? options.page : moviePage;
        const q = options?.q !== undefined ? options.q : searchQuery;
        if (p && p > 1) params.set('page', String(p));
        else params.delete('page');
        if (q && q.trim()) params.set('q', q.trim());
        else params.delete('q');
      } else {
        params.delete('page');
        params.delete('q');
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ tab: newTab }, '', newUrl);
      localStorage.setItem('mm_admin_tab', newTab);
    }
  };

  // Synchronize activeTab, page, and search query from URL or localStorage on mount & popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncStateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab') as AdminTab;
      const savedTab = localStorage.getItem('mm_admin_tab') as AdminTab;

      const resolvedTab: AdminTab = VALID_TABS.includes(urlTab)
        ? urlTab
        : VALID_TABS.includes(savedTab)
        ? savedTab
        : 'overview';

      setActiveTab(resolvedTab);

      // Restore movie page and search query if tab is movies
      const pageFromUrl = parseInt(params.get('page') || '1', 10);
      const qFromUrl = params.get('q') || '';
      if (!isNaN(pageFromUrl) && pageFromUrl >= 1) {
        setMoviePage(pageFromUrl);
      }
      if (qFromUrl) {
        setSearchQuery(qFromUrl);
      }

      // Ensure URL search param is present
      if (urlTab !== resolvedTab) {
        params.set('tab', resolvedTab);
        window.history.replaceState(
          { tab: resolvedTab },
          '',
          `${window.location.pathname}?${params.toString()}`
        );
      }
    };

    syncStateFromUrl();

    const handlePopState = () => {
      syncStateFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    let initialPage = 1;
    let initialQuery = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const parsedPage = parseInt(params.get('page') || '1', 10);
      if (!isNaN(parsedPage) && parsedPage >= 1) initialPage = parsedPage;
      initialQuery = params.get('q') || '';
    }
    fetchMovies(initialPage, initialQuery);
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
    setNewMoviesStatus('');
    try {
      const res = await fetch('/api/admin/new-movies');
      if (res.ok) {
        const data = await res.json();
        const incoming = data.newMovies || [];
        setNewMoviesList(incoming);
        if (incoming.length > 0) {
          setNewMoviesStatus(`✨ Found ${incoming.length} new movie(s) ready to import.`);
        } else if (data.needsClientFetch) {
          setNewMoviesStatus('⚠️ Cloudflare Protection Active: Direct server scan was blocked by movies4u.kg. Use the JSON Import below to import new movies in seconds!');
          setShowManualInput(true);
        } else {
          setNewMoviesStatus('All movies are up to date in the database.');
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
          setNewMoviesStatus(`✨ Found ${data.newCount} new movie(s) ready to import.`);
        } else {
          setNewMoviesStatus('');
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

  const handleMovieSearch = (query: string) => {
    setSearchQuery(query);
    fetchMovies(1, query);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'movies');
      params.delete('page');
      if (query.trim()) params.set('q', query.trim());
      else params.delete('q');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const handleMoviePageChange = (newPage: number) => {
    fetchMovies(newPage, searchQuery);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'movies');
      params.set('page', String(newPage));
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
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

  const handleDirectJsonSync = async () => {
    if (!directSyncJson.trim()) return;
    setIsDirectSyncing(true);
    setSyncStatus('⏳ Parsing and saving movies into Hostinger MySQL...');
    try {
      let parsed: any[] = [];
      try {
        const data = JSON.parse(directSyncJson);
        parsed = Array.isArray(data) ? data : [data];
      } catch {
        setSyncStatus('❌ Invalid JSON: Please paste a valid WordPress posts JSON array.');
        setIsDirectSyncing(false);
        return;
      }

      if (parsed.length === 0) {
        setSyncStatus('❌ JSON array is empty. Please provide posts.');
        setIsDirectSyncing(false);
        return;
      }

      const syncRes = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail,
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({ posts: parsed }),
      });

      const result = await syncRes.json();
      if (syncRes.ok) {
        setSyncStatus(
          `🎉 Successfully synced ${result.totalProcessed || parsed.length} movies: ${result.added || 0} newly added, ${result.updated || 0} updated!`
        );
        setDirectSyncJson('');
        setShowDirectSyncBox(false);
        fetchStats();
        fetchMovies(1, '');
      } else {
        setSyncStatus(`❌ Error syncing JSON: ${result.error || 'Failed'}`);
      }
    } catch (err: any) {
      setSyncStatus(`❌ Error: ${err.message || 'Network error'}`);
    } finally {
      setIsDirectSyncing(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    let totalAddedAll = 0;
    let totalUpdatedAll = 0;
    let totalProcessedAll = 0;
    let syncErrorOccurred = false;
    let lastErrorMessage = '';

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
          if (result.count === 0 && (!result.totalProcessed || result.totalProcessed === 0)) {
            syncErrorOccurred = true;
            lastErrorMessage = result.message || 'No posts returned from source (Cloudflare may be blocking server).';
            break;
          }
          totalAddedAll += result.added || 0;
          totalUpdatedAll += result.updated || 0;
          totalProcessedAll += result.totalProcessed || (posts.length || syncCount);
          setSyncStatus(
            `Page ${page}/${pagesToSync} done! Total added: ${totalAddedAll}, updated: ${totalUpdatedAll}...`
          );
          fetchStats();
        } else {
          syncErrorOccurred = true;
          lastErrorMessage = result.error || 'Failed to sync with source.';
          break;
        }
      }

      if (syncErrorOccurred) {
        setSyncStatus(`❌ Sync Paused: ${lastErrorMessage}`);
      } else {
        setSyncStatus(
          `Sync Complete! Successfully processed ${totalProcessedAll} movies: ${totalAddedAll} newly added, ${totalUpdatedAll} updated.`
        );
      }
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
    <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'bg-[#070A11] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* Clean scrollbar styling */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(150, 150, 150, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(150, 150, 150, 0.4);
        }
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
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 border-r flex flex-col h-screen max-h-screen overflow-hidden transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0]'}`}
      >
        {/* Brand Header */}
        <div className={`p-4 sm:p-5 border-b flex-shrink-0 flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/30 flex-shrink-0">
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

        {/* Scrollable Navigation Links */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-1.5 custom-scrollbar">
          <button
            onClick={() => switchTab('overview')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => switchTab('sync')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : darkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
            }`}
          >
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            <span>Database Sync Engine</span>
          </button>

          <button
            onClick={() => switchTab('new_movies')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
            onClick={() => switchTab('movies')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
            onClick={() => switchTab('categories')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
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

        {/* Sidebar Bottom: Admin Profile & Prominent Sign Out Button (Always Pinned) */}
        <div className={`p-3.5 border-t flex-shrink-0 space-y-2.5 ${darkMode ? 'border-white/10 bg-[#0A0F1B]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
          <div className="flex items-center space-x-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow flex-shrink-0">
              {(adminEmail[0] || 'A').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                {adminEmail.split('@')[0] || 'Admin'}
              </p>
              <p className={`text-[10px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{adminEmail}</p>
            </div>
          </div>

          <button
            onClick={() => handleLogout()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-red-600 transition shadow-sm cursor-pointer"
            title="Sign Out of Admin Dashboard"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
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

            {/* Header Logout Button */}
            <button
              onClick={() => handleLogout()}
              title="Sign Out"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 rounded-xl border border-red-500/20 transition cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body - Full Page Width */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 space-y-6 w-full min-w-0 ${darkMode ? 'bg-[#070A11] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'}`}>
          {/* Stat Cards (Visible on Overview and Sync pages) */}
          {(activeTab === 'overview' || activeTab === 'sync') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Movies */}
              <div
                onClick={() => switchTab('movies')}
                className={`border hover:border-red-500/40 rounded-2xl p-5 flex items-center space-x-4 shadow-sm cursor-pointer transition group ${
                  darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0]'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0 group-hover:scale-105 transition">
                  <Database className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Movies in DB</p>
                  <h2 className={`text-2xl font-black mt-0.5 truncate ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>{stats?.totalMovies ?? '8,000'}</h2>
                </div>
              </div>

              {/* Categories */}
              <div
                onClick={() => switchTab('categories')}
                className={`border hover:border-blue-500/40 rounded-2xl p-5 flex items-center space-x-4 shadow-sm cursor-pointer transition group ${
                  darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0]'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0 group-hover:scale-105 transition">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Categories</p>
                  <h2 className={`text-2xl font-black mt-0.5 truncate ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>{stats?.totalCategories ?? '28'}</h2>
                </div>
              </div>

              {/* Last Synced */}
              <div
                onClick={() => switchTab('sync')}
                className={`border hover:border-green-500/40 rounded-2xl p-5 flex items-center space-x-4 shadow-sm cursor-pointer transition group ${
                  darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0]'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 flex-shrink-0 group-hover:scale-105 transition">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Sync Activity</p>
                  <h2 className={`text-sm font-bold mt-0.5 truncate ${darkMode ? 'text-gray-200' : 'text-[#0F172A]'}`}>
                    {stats?.lastSync ? new Date(stats.lastSync).toLocaleTimeString() : 'Up to date'}
                  </h2>
                  <p className={`text-[10px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stats?.latestMovieTitle || 'Catalog Loaded'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Overview Dashboard Hub: Quick Navigation Cards & Catalog Preview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Movies Card */}
                <div
                  onClick={() => switchTab('movies')}
                  className={`border hover:border-red-500/40 rounded-2xl p-5 cursor-pointer transition shadow-sm group ${
                    darkMode ? 'bg-[#0D1322] hover:bg-[#141B2D] border-white/10' : 'bg-white hover:bg-slate-50 border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-105 transition">
                      <Film className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition" />
                  </div>
                  <h4 className={`text-sm font-bold group-hover:text-red-500 transition ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>Movie Catalog</h4>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Browse, search & manage database movies.</p>
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${darkMode ? 'border-white/5' : 'border-[#E2E8F0]'}`}>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Total in DB</span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>{totalMoviesCount || stats?.totalMovies || '8,000'}</span>
                  </div>
                </div>

                {/* New Movies Card */}
                <div
                  onClick={() => switchTab('new_movies')}
                  className={`border hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition shadow-sm group ${
                    darkMode ? 'bg-[#0D1322] hover:bg-[#141B2D] border-white/10' : 'bg-white hover:bg-slate-50 border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition" />
                  </div>
                  <h4 className={`text-sm font-bold group-hover:text-amber-500 transition ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>New Movies Live</h4>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Scan source for newly added releases.</p>
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${darkMode ? 'border-white/5' : 'border-[#E2E8F0]'}`}>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Pending Import</span>
                    <span className="font-bold text-amber-400">{newMoviesList.length} Pending</span>
                  </div>
                </div>

                {/* Sync Card */}
                <div
                  onClick={() => switchTab('sync')}
                  className={`border hover:border-blue-500/40 rounded-2xl p-5 cursor-pointer transition shadow-sm group ${
                    darkMode ? 'bg-[#0D1322] hover:bg-[#141B2D] border-white/10' : 'bg-white hover:bg-slate-50 border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                  </div>
                  <h4 className={`text-sm font-bold group-hover:text-blue-500 transition ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>Database Sync</h4>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Automated seeder with posters & mirrors.</p>
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${darkMode ? 'border-white/5' : 'border-[#E2E8F0]'}`}>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Pages Available</span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>160+ Pages</span>
                  </div>
                </div>

                {/* Categories Card */}
                <div
                  onClick={() => switchTab('categories')}
                  className={`border hover:border-purple-500/40 rounded-2xl p-5 cursor-pointer transition shadow-sm group ${
                    darkMode ? 'bg-[#0D1322] hover:bg-[#141B2D] border-white/10' : 'bg-white hover:bg-slate-50 border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
                      <Layers className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition" />
                  </div>
                  <h4 className={`text-sm font-bold group-hover:text-purple-500 transition ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>All Categories</h4>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Explore all categories & movie counts.</p>
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${darkMode ? 'border-white/5' : 'border-[#E2E8F0]'}`}>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Total Genres</span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>{categoriesList.length || '28'}</span>
                  </div>
                </div>
              </div>

              {/* Recent Catalog Preview */}
              <div className={`border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 ${
                darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-base font-bold flex items-center space-x-2 ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                      <Film className="w-4 h-4 text-red-500" />
                      <span>Recent Catalog Movies</span>
                    </h3>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quick preview of synced database movies</p>
                  </div>
                  <button
                    onClick={() => switchTab('movies')}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View All ({totalMoviesCount || stats?.totalMovies || '8,000'})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {moviesList.slice(0, 6).map((movie) => (
                    <div
                      key={movie.id || movie.slug}
                      onClick={() => switchTab('movies')}
                      className="group cursor-pointer space-y-1.5"
                    >
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 border border-white/10 relative">
                        {movie.poster && movie.poster !== '/poster-placeholder.svg' ? (
                          <img
                            src={getProxiedPoster(movie.poster)}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={(e: any) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Film className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition">
                        {movie.title}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {movie.year ? `${movie.year} • ` : ''}★ {movie.rating || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sync Engine Page */}
          {activeTab === 'sync' && (
            <div className={`border rounded-2xl p-5 sm:p-6 space-y-4 w-full ${
              darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0] shadow-sm'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className={`text-base sm:text-lg font-bold flex items-center space-x-2 ${
                    darkMode ? 'text-white' : 'text-[#0F172A]'
                  }`}>
                    <RefreshCw className="w-5 h-5 text-red-500" />
                    <span>1-Click Database Sync & Seeding Engine</span>
                  </h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Fetches movies with posters, screenshots, categories, and direct cloud download mirrors into Hostinger MySQL.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className={`flex items-center space-x-1.5 border rounded-xl px-2.5 py-2 text-xs ${
                    darkMode ? 'bg-[#172034] border-white/10 text-gray-300' : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]'
                  }`}>
                    <span className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Per Page:</span>
                    <select
                      value={syncCount}
                      onChange={(e) => setSyncCount(Number(e.target.value))}
                      className="bg-transparent font-bold focus:outline-none cursor-pointer"
                    >
                      <option value={20} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>20 Movies</option>
                      <option value={50} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>50 Movies</option>
                      <option value={100} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>100 Movies</option>
                    </select>
                  </div>

                  <div className={`flex items-center space-x-1.5 border rounded-xl px-2.5 py-2 text-xs ${
                    darkMode ? 'bg-[#172034] border-white/10 text-gray-300' : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]'
                  }`}>
                    <span className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pages:</span>
                    <select
                      value={pagesToSync}
                      onChange={(e) => setPagesToSync(Number(e.target.value))}
                      className="bg-transparent font-bold focus:outline-none cursor-pointer"
                    >
                      <option value={1} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>1 Page</option>
                      <option value={5} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>5 Pages ({syncCount * 5})</option>
                      <option value={10} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>10 Pages ({syncCount * 10})</option>
                      <option value={20} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>20 Pages ({syncCount * 20})</option>
                      <option value={50} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>50 Pages ({syncCount * 50})</option>
                      <option value={100} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>100 Pages ({syncCount * 100})</option>
                      <option value={160} className={darkMode ? 'bg-[#172034] text-white' : 'bg-white text-[#0F172A]'}>⚡ All 160 Pages (7,900+)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:opacity-50 active:scale-[0.98] text-white font-bold px-5 py-2 rounded-xl transition text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : pagesToSync >= 160 ? '⚡ Sync All 7,900+' : `Sync (${syncCount * pagesToSync} max)`}</span>
                  </button>
                </div>
              </div>

              <div className={`flex items-center space-x-2 pt-2 border-t ${
                darkMode ? 'border-white/5' : 'border-[#E2E8F0]'
              }`}>
                <span className={`text-[11px] flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-600 font-medium'}`}>Source API:</span>
                <input
                  type="text"
                  value={sourceApiUrl}
                  onChange={(e) => setSourceApiUrl(e.target.value)}
                  className={`w-full border rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-red-500/50 transition ${
                    darkMode ? 'bg-[#172034]/60 border-white/5 text-gray-400 focus:text-white' : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]'
                  }`}
                  placeholder="https://movies4u.kg/wp-json/wp/v2"
                />
              </div>

              {syncStatus && (
                <div className={`p-3.5 border rounded-xl flex items-start space-x-2.5 text-xs ${
                  syncStatus.includes('❌') || syncStatus.includes('⚠️') || syncStatus.includes('Error')
                    ? darkMode
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : 'bg-red-50 border-red-200 text-red-900'
                    : darkMode
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  {syncStatus.includes('❌') || syncStatus.includes('⚠️') || syncStatus.includes('Error') ? (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div>{syncStatus}</div>
                    {(syncStatus.includes('❌') || syncStatus.includes('⚠️')) && (
                      <div className="pt-1 flex flex-wrap gap-2">
                        <button
                          onClick={() => switchTab('new_movies')}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Go to New Movies Live</span>
                        </button>
                        <a
                          href="https://movies4u.kg/wp-json/wp/v2/posts?_embed=1&per_page=50&orderby=date&order=desc"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                        >
                          <span>Open Source API</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Direct JSON Import & Cloudflare Bypass Card */}
              <div className={`p-4 border rounded-xl space-y-3 ${
                darkMode ? 'bg-[#141C30]/50 border-white/10' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                      Bypass Cloudflare: Direct JSON Ingest
                    </span>
                  </div>
                  <a
                    href="https://movies4u.kg/wp-json/wp/v2/posts?_embed=1&per_page=50&orderby=date&order=desc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-400 hover:underline flex items-center space-x-1"
                  >
                    <span>1. Open Source API (50 Posts)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <textarea
                  rows={2}
                  value={directSyncJson}
                  onChange={(e) => setDirectSyncJson(e.target.value)}
                  placeholder="2. Paste JSON array here to sync directly into Hostinger MySQL..."
                  className={`w-full border rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-blue-500/50 transition ${
                    darkMode ? 'bg-[#0B0F19] border-white/10 text-gray-200 placeholder-gray-500' : 'bg-white border-blue-200 text-[#0F172A] placeholder-gray-400'
                  }`}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text && text.trim()) setDirectSyncJson(text.trim());
                      } catch (_) {
                        alert('Please press Ctrl+V inside the box.');
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center space-x-1 ${
                      darkMode ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    <Copy className="w-3 h-3" />
                    <span>Paste Clipboard</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {directSyncJson.trim() && (
                      <button
                        type="button"
                        onClick={() => setDirectSyncJson('')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer ${
                          darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDirectJsonSync}
                      disabled={!directSyncJson.trim() || isDirectSyncing}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      {isDirectSyncing ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                      <span>3. Ingest &amp; Save to DB</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Movies Discovery & Insertion Section */}
          {activeTab === 'new_movies' && (
            <div className={`border rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 w-full ${
              darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0] shadow-sm'
            }`}>
              {/* Header & Controls */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                darkMode ? 'border-white/10' : 'border-[#E2E8F0]'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>New Movies</h3>
                      <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[11px] px-2 py-0.5 rounded-full font-semibold">
                        {newMoviesList.length} Pending
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Discover and import new releases from source.
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons - Mobile Responsive */}
                <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                  <button
                    onClick={fetchNewMovies}
                    disabled={isLoadingNewMovies}
                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer ${
                      darkMode ? 'bg-[#172034] hover:bg-[#1E2B47] border-white/10 text-gray-200' : 'bg-[#F8FAFC] hover:bg-slate-100 border-[#CBD5E1] text-[#0F172A]'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNewMovies ? 'animate-spin text-amber-500' : ''}`} />
                    <span>{isLoadingNewMovies ? 'Scanning...' : 'Scan Source'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualInput((prev) => !prev)}
                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                      darkMode ? 'bg-[#172034] hover:bg-[#1E2B47] border-white/10 text-gray-300' : 'bg-[#F8FAFC] hover:bg-slate-100 border-[#CBD5E1] text-[#0F172A]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>{showManualInput ? 'Close' : 'JSON Import'}</span>
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
                        className={`w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                          darkMode ? 'bg-[#172034] hover:bg-[#1E2B47] border-white/10 text-gray-200' : 'bg-[#F8FAFC] hover:bg-slate-100 border-[#CBD5E1] text-[#0F172A]'
                        }`}
                      >
                        {selectedNewMovieSlugs.length === newMoviesList.length ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Square className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
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
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Download className={`w-3.5 h-3.5 ${isInsertingNewMovies ? 'animate-bounce' : ''}`} />
                        <span>
                          {isInsertingNewMovies
                            ? 'Inserting...'
                            : `Insert Selected (${selectedNewMovieSlugs.length})`}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Collapsible Manual JSON Import */}
              {showManualInput && (
                <div className={`p-3.5 sm:p-4 border rounded-xl space-y-2.5 ${
                  darkMode ? 'bg-[#141C30] border-blue-500/20' : 'bg-blue-50/60 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-semibold flex items-center space-x-1.5 ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span>Paste Posts JSON</span>
                    </h4>
                    <a
                      href="https://movies4u.kg/wp-json/wp/v2/posts?_embed=1&per_page=40&orderby=date&order=desc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-500 hover:text-blue-600 underline flex items-center space-x-1"
                    >
                      <span>Open Source API</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <textarea
                    rows={3}
                    value={rawPostsInput}
                    onChange={(e) => setRawPostsInput(e.target.value)}
                    placeholder="Paste WordPress posts JSON array here: [{ id: ..., title: ... }]"
                    className={`w-full border rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-blue-500/50 transition ${
                      darkMode ? 'bg-[#0B0F19] border-white/10 text-gray-200 placeholder-gray-500' : 'bg-white border-blue-200 text-[#0F172A] placeholder-gray-400'
                    }`}
                  />
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text && text.trim()) {
                            setRawPostsInput(text.trim());
                          }
                        } catch (_) {
                          alert('Please press Ctrl+V inside the box to paste.');
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center space-x-1 ${
                        darkMode ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <Copy className="w-3 h-3" />
                      <span>Paste from Clipboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRawPostsInput('')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer ${
                        darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleFilterRawPosts}
                      disabled={!rawPostsInput.trim() || isFilteringManual}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isFilteringManual ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>Compare & Find</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {newMoviesStatus && (
                <div className={`p-3 border rounded-xl flex items-center justify-between text-xs ${
                  darkMode ? 'bg-[#172034] border-white/10' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className={darkMode ? 'text-gray-200' : 'text-amber-950'}>{newMoviesStatus}</span>
                  </div>
                  {isInsertingNewMovies && (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin flex-shrink-0" />
                  )}
                </div>
              )}

              {/* Content / Movies Grid or Empty State */}
              {isLoadingNewMovies ? (
                <div className="py-12 text-center text-gray-400">
                  <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-amber-500" />
                  <p className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>Comparing source with database...</p>
                </div>
              ) : newMoviesList.length === 0 ? (
                /* Informative Empty State with Quick Import Guide */
                <div className={`py-10 sm:py-12 text-center border rounded-2xl p-6 ${
                  darkMode ? 'bg-[#111726] border-white/5' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <div className="w-12 h-12 bg-amber-500/15 border border-amber-500/25 rounded-xl flex items-center justify-center text-amber-500 mx-auto mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className={`text-sm sm:text-base font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                    Ready to Import New Movies
                  </h4>
                  <p className={`text-xs max-w-md mx-auto mt-1.5 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    movies4u.kg par Cloudflare Bot Protection active hai, isliye upar <strong>Paste Posts JSON</strong> box me posts paste karein aur <strong>Compare & Find</strong> dabayein.
                  </p>

                  <div className="mt-5 max-w-md mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                    <div className={`p-3 rounded-xl border text-xs ${darkMode ? 'bg-[#172034]/60 border-white/10 text-gray-300' : 'bg-white border-[#E2E8F0] text-gray-700'}`}>
                      <div className="font-bold text-amber-500 mb-1">Step 1</div>
                      <a
                        href="https://movies4u.kg/wp-json/wp/v2/posts?_embed=1&per_page=40&orderby=date&order=desc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center space-x-1"
                      >
                        <span>Open API Tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className={`p-3 rounded-xl border text-xs ${darkMode ? 'bg-[#172034]/60 border-white/10 text-gray-300' : 'bg-white border-[#E2E8F0] text-gray-700'}`}>
                      <div className="font-bold text-amber-500 mb-1">Step 2</div>
                      <span>Ctrl+A &amp; Ctrl+C (Copy all)</span>
                    </div>
                    <div className={`p-3 rounded-xl border text-xs ${darkMode ? 'bg-[#172034]/60 border-white/10 text-gray-300' : 'bg-white border-[#E2E8F0] text-gray-700'}`}>
                      <div className="font-bold text-amber-500 mb-1">Step 3</div>
                      <span>Paste &amp; Compare &amp; Find</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setShowManualInput(true)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Open JSON Paste Box</span>
                    </button>
                    <button
                      onClick={fetchNewMovies}
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-2 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                        darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200' : 'bg-white hover:bg-slate-100 border-[#CBD5E1] text-[#0F172A] shadow-sm'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3 text-gray-400" />
                      <span>Re-Scan Server</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Responsive Movie Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
                        className={`group relative border rounded-xl p-3 flex space-x-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                            : darkMode ? 'bg-[#111726] border-white/10 hover:border-white/20' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <div className="absolute top-2.5 right-2.5 z-10">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className={`w-4 h-4 ${darkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'}`} />
                          )}
                        </div>

                        {/* Movie Poster */}
                        <div className={`w-16 h-22 sm:w-18 sm:h-26 rounded-lg overflow-hidden flex-shrink-0 border relative ${
                          darkMode ? 'bg-black/40 border-white/10' : 'bg-slate-200 border-slate-300'
                        }`}>
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
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Film className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {/* Movie Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between pr-4">
                          <div>
                            <h4 className={`text-xs font-semibold line-clamp-2 leading-snug group-hover:text-amber-500 transition ${
                              darkMode ? 'text-white' : 'text-[#0F172A]'
                            }`}>
                              {movie.title}
                            </h4>

                            <div className="flex items-center space-x-1.5 text-[11px] text-amber-500 mt-1 font-medium">
                              <Clock className="w-3 h-3 flex-shrink-0" />
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

                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {movie.qualities?.slice(0, 2).map((q: string) => (
                                <span
                                  key={q}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                                    darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-200/70 border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {q}
                                </span>
                              ))}
                              {movie.downloadLinks?.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-500 font-bold">
                                  {movie.downloadLinks.length} Links
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action footer */}
                          <div className={`mt-2 pt-1.5 border-t flex items-center justify-between ${
                            darkMode ? 'border-white/5' : 'border-[#E2E8F0]'
                          }`}>
                            <span className="text-[10px] text-gray-500 font-mono">
                              #{movie.wpId}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                insertNewMovies([movie]);
                              }}
                              disabled={isInsertingNewMovies}
                              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/30 rounded-md text-[10px] font-bold transition flex items-center space-x-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              <Download className="w-2.5 h-2.5" />
                              <span>Insert</span>
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

          {/* Synced Movies Table (Movies Page - Full Page View) */}
          {activeTab === 'movies' && (
            <div className={`border rounded-2xl p-4 sm:p-6 space-y-4 w-full ${
              darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0] shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Film className="w-4 h-4 text-red-500" />
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>Movies in Database</h3>
                  <span className="bg-red-500/15 text-red-500 border border-red-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {totalMoviesCount ? `${totalMoviesCount.toLocaleString()} Live` : '8,000 Live'}
                  </span>
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleMovieSearch(e.target.value)}
                    placeholder="Search synced movies..."
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs pl-8 transition focus:outline-none focus:border-red-500 ${
                      darkMode ? 'bg-[#172034] border-white/10 text-white placeholder-gray-500' : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] placeholder-gray-400'
                    }`}
                  />
                  <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
              </div>

              {/* Table with responsive horizontal scroll */}
              <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
                <table className="w-full text-left text-xs min-w-[780px]">
                  <thead className={`uppercase tracking-wider text-[10px] font-bold ${
                    darkMode ? 'bg-[#172034] text-gray-400' : 'bg-[#F1F5F9] text-gray-600 border-b border-[#E2E8F0]'
                  }`}>
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
                  <tbody className={`divide-y ${darkMode ? 'divide-white/5 bg-[#0D1322]' : 'divide-[#F1F5F9] bg-white'}`}>
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
                          <tr key={m.id || m.slug} className={`transition ${darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}>
                            <td className="py-3 px-4">
                              {m.poster && m.poster !== '/poster-placeholder.svg' ? (
                                <img
                                  src={getProxiedPoster(m.poster)}
                                  alt={m.title}
                                  className={`w-14 h-20 object-cover rounded-xl border shadow-sm ${
                                    darkMode ? 'bg-gray-800 border-white/10' : 'bg-slate-100 border-slate-200'
                                  }`}
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
                            <td className={`py-3 px-4 font-semibold max-w-[240px] truncate ${darkMode ? 'text-gray-200' : 'text-[#0F172A]'}`}>
                              {m.title}
                            </td>
                            <td className={`py-3 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.year || '—'}</td>
                            <td className="py-3 px-4">
                              <span className="text-yellow-500 font-bold">★ {m.rating || 'N/A'}</span>
                            </td>
                            <td className="py-3 px-4">
                              {m.date ? (
                                <div>
                                  <p className={`text-[11px] font-medium ${darkMode ? 'text-gray-300' : 'text-[#0F172A]'}`}>
                                    {new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                  <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {new Date(m.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </p>
                                </div>
                              ) : (
                                <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {(m.qualities || ['HD']).slice(0, 4).map((q: string) => (
                                  <span
                                    key={q}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                                      darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                                    }`}
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
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg transition text-[11px] font-medium ${
                                  darkMode
                                    ? 'text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20'
                                    : 'text-red-600 hover:text-red-700 bg-red-50 border border-red-200'
                                }`}
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
                <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t ${
                  darkMode ? 'border-white/5 text-gray-400' : 'border-[#E2E8F0] text-gray-600'
                }`}>
                  <p className="text-[11px]">
                    Page <span className={`font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>{moviePage}</span> of{' '}
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>{movieTotalPages}</span>{' '}
                    ({totalMoviesCount.toLocaleString()} movies)
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleMoviePageChange(moviePage - 1)}
                      disabled={moviePage <= 1 || isLoadingMovies}
                      className={`flex items-center space-x-1 px-3 py-1.5 border rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        darkMode ? 'bg-[#172034] border-white/10 text-gray-300 hover:text-white' : 'bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-slate-50'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={() => handleMoviePageChange(moviePage + 1)}
                      disabled={moviePage >= movieTotalPages || isLoadingMovies}
                      className={`flex items-center space-x-1 px-3 py-1.5 border rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        darkMode ? 'bg-[#172034] border-white/10 text-gray-300 hover:text-white' : 'bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-slate-50'
                      }`}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categories Table (Categories Page - Full Page View) */}
          {activeTab === 'categories' && (
            <div className={`border rounded-2xl p-4 sm:p-6 space-y-4 w-full ${
              darkMode ? 'bg-[#0D1322] border-white/10' : 'bg-white border-[#E2E8F0] shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>All Categories</h3>
                  <span className="bg-blue-500/15 text-blue-500 border border-blue-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {categoriesList.length} Total
                  </span>
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs pl-8 transition focus:outline-none focus:border-blue-500 ${
                      darkMode ? 'bg-[#172034] border-white/10 text-white placeholder-gray-500' : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] placeholder-gray-400'
                    }`}
                  />
                  <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
              </div>

              {isLoadingCategories ? (
                <div className={`py-12 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                  Loading categories...
                </div>
              ) : categoriesList.length === 0 ? (
                <div className={`py-12 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Layers className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  No categories found in the database.
                </div>
              ) : (
                <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
                  <table className="w-full text-left text-xs min-w-[480px]">
                    <thead className={`uppercase tracking-wider text-[10px] font-bold ${
                      darkMode ? 'bg-[#172034] text-gray-400' : 'bg-[#F1F5F9] text-gray-600 border-b border-[#E2E8F0]'
                    }`}>
                      <tr>
                        <th className="py-3 px-4 w-10">#</th>
                        <th className="py-3 px-4">Category Name</th>
                        <th className="py-3 px-4">Slug</th>
                        <th className="py-3 px-4 text-center">Movies</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-white/5 bg-[#0D1322]' : 'divide-[#F1F5F9] bg-white'}`}>
                      {categoriesList
                        .filter((c) =>
                          categorySearch
                            ? c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                              c.slug.toLowerCase().includes(categorySearch.toLowerCase())
                            : true
                        )
                        .map((cat, index) => (
                          <tr key={`cat-${cat.slug || cat.id || index}`} className={`transition ${darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}>
                            <td className="py-3 px-4 text-gray-500 font-mono">{index + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Tag className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-[#0F172A]'}`}>{cat.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`border text-[10px] px-2 py-0.5 rounded font-mono ${
                                darkMode ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}>
                                {cat.slug}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cat.count > 100
                                  ? 'bg-green-500/15 text-green-500 border border-green-500/25'
                                  : cat.count > 20
                                  ? 'bg-blue-500/15 text-blue-500 border border-blue-500/25'
                                  : darkMode ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {cat.count}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <a
                                href={`/category/${cat.slug}`}
                                target="_blank"
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg transition text-[11px] font-medium ${
                                  darkMode
                                    ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20'
                                    : 'text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200'
                                }`}
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
