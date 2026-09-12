import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, Send, Heart } from 'lucide-react';

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
              Movie Man offers free latest movies and web series downloads in 480p, 720p, 1080p, and 4K UHD.
              Watch and explore Bollywood, Hollywood, South Indian, Hindi Dubbed, and K-Drama releases with lightning-fast speeds.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://t.me/+igUrTM5-zxY4M2Jl"
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

          {/* DMCA & Info */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Disclaimer
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-gray-500">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 inline mr-1" />
              All files and media provided on this platform are hosted on third-party non-affiliated servers.
              Movie Man does not store or host any copyrighted material on its web servers.
              All video content is provided by non-affiliated third parties or scraped through public indexing APIs.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Link href="/categories" className="text-red-600 dark:text-red-400 font-medium hover:underline">
                Explore Genres
              </Link>
              <span>•</span>
              <a href="https://movies4u.kg/how-to-download/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">
                How to Download
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-slate-500 dark:text-gray-500">
          <p>© {new Date().getFullYear()} Movie Man Cinema. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1">
            Engineered with <Heart className="w-3 h-3 text-red-600 fill-current inline" /> for Cinephiles
          </p>
        </div>
      </div>
    </footer>
  );
}
