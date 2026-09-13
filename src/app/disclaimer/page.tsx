import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Legal Disclaimer & Copyright Notice - Movie Man',
  description: 'Legal disclaimer, non-hosting policy, and copyright compliance terms for Movie Man.',
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-slate-200 dark:border-white/10 relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Legal Disclaimer & Copyright Compliance
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1">
              Please review our operational terms, non-hosting declaration, and fair-use guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-slate-200 dark:border-white/10 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-gray-300">
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            1. Non-Hosting & Third-Party Indexing
          </h2>
          <p>
            <strong>Movie Man</strong> does not host, store, or upload any files on its own server. All content, including links, is sourced from third-party websites that are publicly available on the internet. We only share information that is already available online for educational and promotional purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            2. Anti-Piracy & Fair Use Statement
          </h2>
          <p>
            We do not store any copyrighted files and we do not support or encourage piracy. All materials linked or referenced on this website are meant strictly for preview, review, testing, and educational purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            3. Supporting Content Creators
          </h2>
          <p>
            We strongly encourage users to purchase original content such as DVDs, Blu-rays, or digital copies from official platforms to support the creators.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            4. User Terms & Agreement
          </h2>
          <p>
            If you do not agree with these terms, please leave this website immediately. By continuing to use this website, you acknowledge that you have read, understood, and agreed to this disclaimer, and that you release this website from any responsibility related to your actions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            5. Trademarks & Public Domain Content
          </h2>
          <p>
            All trademarks, logos, and images belong to their respective owners. Any content shown here is believed to be sourced from the public domain or submitted by users.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            6. DMCA & Fast Removal Request
          </h2>
          <p>
            If you are a copyright owner or an authorised representative and believe that any material on this website infringes your rights, or if you find any file appearing to be hosted or streamed from our server, please contact us immediately with valid proof. We will review the request and remove the content promptly.
          </p>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
            <div className="flex items-center gap-2 text-xs">
              <Mail className="w-4 h-4 text-red-600 shrink-0" />
              <span>DMCA / Copyright Removal Email:</span>
              <a href="mailto:anilarangi6@gmail.com" className="font-bold text-red-600 hover:underline">
                anilarangi6@gmail.com
              </a>
            </div>
            <a
              href="mailto:anilarangi6@gmail.com"
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs text-center transition-colors shadow-sm"
            >
              Contact Support
            </a>
          </div>
        </section>

        {/* 24-Hour Rule Alert Box */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-medium">
            <strong>Important Notice:</strong> Users are advised to delete any downloaded content within 24 hours and purchase the original from official sources.
          </p>
        </div>
      </div>
    </div>
  );
}
