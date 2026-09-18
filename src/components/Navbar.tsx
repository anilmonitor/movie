'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Menu, X, Send, Sparkles, Search } from 'lucide-react';
import Image from 'next/image';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Bollywood', href: '/category/bollywood' },
  { name: 'Hollywood', href: '/category/hollywood' },
  { name: 'Dual Audio', href: '/category/dual-audio' },
  { name: 'Web Series', href: '/category/web-series' },
  { name: 'South Indian', href: '/category/south-indian' },
  { name: '18+', href: '/category/18' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform border border-amber-500/30">
              <Image
                src="/logo.png"
                alt="Movie Man Logo"
                fill
                className="object-cover"
                sizes="40px"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold tracking-wider text-slate-900 dark:text-white">
                MOVIE <span className="text-red-600 font-black">MAN</span>
              </span>
            </div>
          </Link>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 justify-center max-w-lg mx-4">
            <SearchBar />
          </div>

          {/* Right Action: Theme Toggle & Telegram & Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Telegram Link */}
            <a
              href="https://t.me/+E2B_D_7AQIkyMjI1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 transition-all hover:scale-105"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Join Telegram</span>
            </a>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-full text-slate-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Secondary Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 py-2 border-t border-black/5 dark:border-white/5 overflow-x-auto text-xs font-medium scrollbar-none">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="px-3 py-1.5 rounded-full text-slate-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/categories"
            className="px-3 py-1.5 rounded-full text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors ml-auto whitespace-nowrap font-semibold"
          >
            All Categories →
          </Link>
        </nav>

        {/* Mobile Search Bar Toggle Expandable */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 animate-in fade-in duration-150">
            <SearchBar />
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-[#0a0e17]/95 backdrop-blur-xl border-b border-black/10 dark:border-white/10 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Navigation Menu
            </span>
            <ThemeToggle showLabel />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 dark:text-gray-200 bg-slate-100/70 dark:bg-white/5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-white/10 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 rounded-xl bg-red-600/10 dark:bg-white/5 text-sm font-semibold text-red-600 dark:text-gray-200 hover:bg-red-600/20"
            >
              Browse All Categories Directory
            </Link>
            <a
              href="https://t.me/+E2B_D_7AQIkyMjI1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600/15 dark:bg-sky-600/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-sm font-semibold"
            >
              <Send className="w-4 h-4" />
              <span>Join Official Telegram</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
