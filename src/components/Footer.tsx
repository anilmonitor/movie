import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 sm:mt-20 border-t border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-[#06080d] text-slate-600 dark:text-gray-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 sm:mb-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30">
                <Image src="/logo.png" alt="Movie Man" fill className="object-cover" sizes="32px" />
              </div>
              <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white">
                MOVIE <span className="text-red-600">MAN</span>
              </span>
            </Link>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed max-w-md">
              Movie Man offers latest movies and web series previews in 480p, 720p, 1080p, and 4K UHD.
              Watch and explore Bollywood, Hollywood, South Indian, Hindi Dubbed, and K-Drama releases.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://t.me/+E2B_D_7AQIkyMjI1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-medium hover:bg-sky-500/20 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Join Official Telegram</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Categories
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/category/bollywood" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Bollywood Movies
                </Link>
              </li>
              <li>
                <Link href="/category/hollywood" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Hollywood Movies
                </Link>
              </li>
              <li>
                <Link href="/category/dual-audio" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Dual Audio Movies
                </Link>
              </li>
              <li>
                <Link href="/category/south-indian" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  South Indian Hindi
                </Link>
              </li>
              <li>
                <Link href="/category/web-series" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Web Series & Shows
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation & Legal Links */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Legal & Info
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/disclaimer" className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium text-red-600 dark:text-red-400">
                  Legal Disclaimer
                </Link>
              </li>
              <li>
                <a href="/privacy/" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <Link href="/categories" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  All Movie Genres
                </Link>
              </li>
              <li>
                <a href="mailto:anilarangi6@gmail.com" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  DMCA & Removal Request
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-slate-500 dark:text-gray-500">
          <p>© {new Date().getFullYear()} Movie Man. All rights reserved.</p>
          <p>Online Entertainment Catalog</p>
        </div>
      </div>
    </footer>
  );
}
