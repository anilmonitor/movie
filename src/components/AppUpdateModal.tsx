'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Download, X, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface UpdateData {
  hasUpdate: boolean;
  forceUpdate: boolean;
  latestVersion: string;
  latestVersionCode: number;
  title: string;
  message: string;
  playStoreUrl: string;
  whatsNew: string[];
}

const DEFAULT_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.movie.man&pcampaignid=web_share';

export default function AppUpdateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [updateData, setUpdateData] = useState<UpdateData | null>(null);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        // Check if user dismissed update within last 24 hours
        const dismissedAt = localStorage.getItem('mm_app_update_dismissed_at');
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        const isDismissedRecently =
          dismissedAt && Date.now() - parseInt(dismissedAt, 10) < TWENTY_FOUR_HOURS;

        // Current installed or stored client version (defaults to 1.0.4)
        const installedVersion = localStorage.getItem('mm_app_client_version') || '1.0.4';
        const installedVersionCode = localStorage.getItem('mm_app_client_version_code') || '5';

        const res = await fetch(
          `/api/app-update?version=${encodeURIComponent(installedVersion)}&versionCode=${encodeURIComponent(installedVersionCode)}`
        );
        if (!res.ok) return;

        const data: UpdateData = await res.json();
        if (data && data.hasUpdate) {
          setUpdateData(data);
          // If force update is true, always show. Otherwise check dismissal
          if (data.forceUpdate || !isDismissedRecently) {
            // Small initial delay so the main page renders smoothly first
            const timer = setTimeout(() => {
              setIsOpen(true);
            }, 1200);
            return () => clearTimeout(timer);
          }
        }
      } catch (_) {
        // Silently ignore network check errors
      }
    };

    checkUpdate();
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('mm_app_update_dismissed_at', String(Date.now()));
  };

  const handleOpenPlayStore = () => {
    const targetUrl = updateData?.playStoreUrl || DEFAULT_PLAY_STORE_URL;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!updateData?.forceUpdate) {
      setIsOpen(false);
      localStorage.setItem('mm_app_update_dismissed_at', String(Date.now()));
    }
  };

  if (!isOpen || !updateData) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-[#131B2E] via-[#0E1526] to-[#0A0E1A] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-red-950/40 text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background effects */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-red-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button (only if not a mandatory force update) */}
        {!updateData.forceUpdate && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition cursor-pointer"
            aria-label="Close update popup"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Badge */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-red-500/15 text-red-400 border border-red-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Google Play Update</span>
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
            v{updateData.latestVersion}
          </span>
        </div>

        {/* App Icon & Title */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-amber-600 p-0.5 shadow-lg shadow-red-600/30 flex-shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-[#0A0E1A] rounded-[14px] flex items-center justify-center">
              <Download className="w-7 h-7 text-red-500 animate-bounce" />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
              {updateData.title || 'New Update Available!'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {updateData.message ||
                'A new version of Movie Man is available on Google Play Store with latest movies and bug fixes.'}
            </p>
          </div>
        </div>

        {/* What's New List */}
        {updateData.whatsNew && updateData.whatsNew.length > 0 && (
          <div className="my-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
            <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span>What&apos;s New in v{updateData.latestVersion}:</span>
            </p>
            <ul className="space-y-1.5">
              {updateData.whatsNew.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-gray-300 leading-snug">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={handleOpenPlayStore}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm rounded-2xl shadow-xl shadow-red-600/30 active:scale-[0.98] transition flex items-center justify-center space-x-2.5 cursor-pointer"
          >
            {/* Google Play Store Icon SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a1.986 1.986 0 0 1-.61-.926V2.74c0-.34.22-.68.61-.926zm11.3 11.3l2.288 2.288-12.016 6.94 9.728-9.228zm0-2.228L5.18 1.658l12.016 6.94-2.288 2.288zm1.12 1.114l3.525 2.036c.866.5.866 1.32 0 1.82l-3.525 2.036-2.022-2.022 2.022-2.022z" />
            </svg>
            <span>Update on Google Play</span>
            <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
          </button>

          {!updateData.forceUpdate && (
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 text-xs font-semibold text-gray-400 hover:text-white bg-transparent hover:bg-white/5 rounded-xl transition cursor-pointer"
            >
              Remind Me Later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
