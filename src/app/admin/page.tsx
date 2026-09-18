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

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'categories' | 'sync'>('overview');
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
  useEffect(() => {
    getSession().then((session) => {
      if (session?.user?.email) {
        setAdminEmail(session.user.email);
        setIsAuthenticated(true);
        loadAllAdminData();
        return;
      }

      const savedEmail = localStorage.getItem('mm_admin_email');
      const savedPass = localStorage.getItem('mm_admin_passcode');
      if (savedEmail || savedPass) {
        setAdminEmail(savedEmail || '');
        setPasscode(savedPass || '');
        setIsAuthenticated(true);
        loadAllAdminData();
      }
    });
  }, []);

  const loadAllAdminData = () => {
    fetchStats();
    fetchMovies(1, '');
    fetchCategories();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();

    const allowed = ['anilarangi6@gmail.com', 'anilarangi7@gmail.com'];
    const isEmailAllowed = allowed.includes(cleanEmail);
    const isPasscodeValid = passcode.trim() === 'movieman@admin2024';

    if (isEmailAllowed || isPasscodeValid) {
      setIsAuthenticated(true);
      setLoginError('');
      localStorage.setItem('mm_admin_email', cleanEmail);
      localStorage.setItem('mm_admin_passcode', passcode);
      loadAllAdminData();
    } else {
      setLoginError('Access Denied: Invalid credentials or unauthorized account.');
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    localStorage.removeItem('mm_admin_email');
    localStorage.removeItem('mm_admin_passcode');
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

  // Standalone Clean Admin Login View
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
              Sign in to manage database & movie catalog
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* 1-Click Google Sign In */}
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/admin' })}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2.5 px-4 rounded-xl transition shadow text-sm flex items-center justify-center space-x-3 active:scale-[0.99]"
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

          {/* Simple Divider */}
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
              <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-300 mb-1">
                Passcode
              </label>
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
              className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-red-600/20 text-sm flex items-center justify-center space-x-2 mt-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign In to Dashboard</span>
            </button>
          </form>
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
              onClick={handleLogout}
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
              onClick={handleLogout}
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
