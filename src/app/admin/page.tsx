'use client';

import React, { useState, useEffect } from 'react';
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

  // Check persisted auth
  useEffect(() => {
    const savedEmail = localStorage.getItem('mm_admin_email');
    const savedPass = localStorage.getItem('mm_admin_passcode');
    if (savedEmail || savedPass) {
      setAdminEmail(savedEmail || 'anilarangi6@gmail.com');
      setPasscode(savedPass || '');
      setIsAuthenticated(true);
      fetchStats();
      fetchMovies();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();

    const allowed = ['anilarangi6@gmail.com', 'anilarangi7@gmail.com'];
    const isEmailAllowed = allowed.includes(cleanEmail);
    const isPasscodeValid = passcode.trim() === 'movieman@admin2024';

    if (isEmailAllowed || isPasscodeValid) {
      setIsAuthenticated(true);
      setLoginError('');
      localStorage.setItem('mm_admin_email', cleanEmail || 'anilarangi6@gmail.com');
      localStorage.setItem('mm_admin_passcode', passcode);
      fetchStats();
      fetchMovies();
    } else {
      setLoginError('Access Denied: Email is not in ADMIN_EMAILS list, or invalid passcode.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('mm_admin_email');
    localStorage.removeItem('mm_admin_passcode');
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

  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies?perPage=25');
      if (res.ok) {
        const data = await res.json();
        setMoviesList(data.movies || []);
      }
    } catch (_) {}
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

  // Login View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-[#0F1422] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">MOVIE MAN</h1>
              <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Admin Control Portal</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 text-center mb-6">
            Sign in to manage Hostinger MySQL database & trigger movie sync.
          </p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Admin Google Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. anilarangi6@gmail.com"
                className="w-full bg-[#182032] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Admin Passcode (or Leave blank if using whitelisted email)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode or default: movieman@admin2024"
                  className="w-full bg-[#182032] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 text-white placeholder-gray-500 pl-10"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition shadow-lg shadow-red-600/20 text-sm flex items-center justify-center space-x-2 mt-4"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Access Admin Dashboard</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">
              Authorized Emails: <span className="text-gray-300">anilarangi6@gmail.com, anilarangi7@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col">
      {/* Top Navigation */}
      <header className="bg-[#0F1422] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-black shadow-md shadow-red-600/30">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg">MOVIE MAN</span>
              <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
            <p className="text-xs text-gray-400">{adminEmail}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/"
            target="_blank"
            className="hidden sm:flex items-center space-x-1.5 text-xs text-gray-300 hover:text-white bg-[#182032] border border-white/10 px-3 py-2 rounded-lg transition"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0F1422] border border-white/10 rounded-2xl p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Total Movies in DB</p>
              <h2 className="text-2xl font-black mt-0.5">{stats?.totalMovies ?? '...'}</h2>
            </div>
          </div>

          <div className="bg-[#0F1422] border border-white/10 rounded-2xl p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Categories</p>
              <h2 className="text-2xl font-black mt-0.5">{stats?.totalCategories ?? '...'}</h2>
            </div>
          </div>

          <div className="bg-[#0F1422] border border-white/10 rounded-2xl p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Last Synced</p>
              <h2 className="text-sm font-bold mt-0.5 text-gray-200">
                {stats?.lastSync ? new Date(stats.lastSync).toLocaleTimeString() : 'Never'}
              </h2>
              <p className="text-[11px] text-gray-500 truncate max-w-[150px]">
                {stats?.latestMovieTitle || 'Ready to sync'}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Controls Section */}
        <div className="bg-[#0F1422] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-red-500" />
                <span>1-Click Database Sync & Seeding Engine</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Fetches movies with posters, screenshots, categories, qualities, sizes & download links, and saves directly into Hostinger MySQL.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1.5 bg-[#182032] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
                <span className="text-gray-500 font-medium">Per Page:</span>
                <select
                  value={syncCount}
                  onChange={(e) => setSyncCount(Number(e.target.value))}
                  className="bg-transparent font-bold text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value={20} className="bg-[#182032]">20 Movies</option>
                  <option value={50} className="bg-[#182032]">50 Movies</option>
                  <option value={100} className="bg-[#182032]">100 Movies</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-[#182032] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
                <span className="text-gray-500 font-medium">Pages:</span>
                <select
                  value={pagesToSync}
                  onChange={(e) => setPagesToSync(Number(e.target.value))}
                  className="bg-transparent font-bold text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value={1} className="bg-[#182032]">1 Page</option>
                  <option value={2} className="bg-[#182032]">2 Pages ({syncCount * 2} max)</option>
                  <option value={5} className="bg-[#182032]">5 Pages ({syncCount * 5} max)</option>
                  <option value={10} className="bg-[#182032]">10 Pages ({syncCount * 10} max)</option>
                </select>
              </div>

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 active:scale-[0.98] text-white font-bold px-5 py-2 rounded-xl transition text-xs flex items-center space-x-2 shadow-lg shadow-red-600/20"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : `Sync (${syncCount * pagesToSync} max)`}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
            <span className="text-[11px] text-gray-500 flex-shrink-0">Source API:</span>
            <input
              type="text"
              value={sourceApiUrl}
              onChange={(e) => setSourceApiUrl(e.target.value)}
              className="w-full bg-[#182032]/60 border border-white/5 rounded-lg px-2.5 py-1 text-[11px] text-gray-400 focus:text-white focus:outline-none focus:border-red-500/50"
              placeholder="https://movies4u.kg/wp-json/wp/v2"
            />
          </div>

          {syncStatus && (
            <div className="p-3 bg-[#182032] border border-white/10 rounded-xl flex items-center space-x-2 text-xs">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">{syncStatus}</span>
            </div>
          )}
        </div>

        {/* Synced Movies Table */}
        <div className="bg-[#0F1422] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold flex items-center space-x-2">
              <Film className="w-4 h-4 text-gray-400" />
              <span>Movies in Database</span>
            </h3>

            <div className="relative max-w-xs w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search synced movies..."
                className="w-full bg-[#182032] border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 pl-8"
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#182032]/60 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Poster</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Qualities</th>
                  <th className="py-3 px-4 rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {moviesList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No movies loaded in MySQL yet. Click "Sync Now" above to populate!
                    </td>
                  </tr>
                ) : (
                  moviesList
                    .filter((m) =>
                      searchQuery ? m.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
                    )
                    .map((m) => (
                      <tr key={m.id || m.slug} className="hover:bg-white/[0.02] transition">
                        <td className="py-2.5 px-4">
                          <img
                            src={m.poster}
                            alt=""
                            className="w-8 h-11 object-cover rounded-md bg-gray-800"
                            onError={(e: any) => {
                              e.target.src = '/poster-placeholder.svg';
                            }}
                          />
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-gray-200">{m.title}</td>
                        <td className="py-2.5 px-4 text-gray-400">{m.year || '—'}</td>
                        <td className="py-2.5 px-4">
                          <span className="text-yellow-400 font-bold">★ {m.rating || 'N/A'}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(m.qualities || ['HD']).map((q: string) => (
                              <span
                                key={q}
                                className="bg-white/5 border border-white/10 text-[9px] px-1.5 py-0.5 rounded text-gray-300 font-mono"
                              >
                                {q}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <a
                            href={`/movies/${m.slug}`}
                            target="_blank"
                            className="text-red-400 hover:text-red-300 flex items-center space-x-1"
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
        </div>
      </main>
    </div>
  );
}
