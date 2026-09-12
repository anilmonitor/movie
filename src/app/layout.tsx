import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://movies4u.kg'),
  title: {
    default: 'Movies4u - Download Bollywood, Hollywood, South Movies & Web Series',
    template: '%s | Movies4u',
  },
  description:
    'Movies4u offers free latest movies available for download in various resolutions including 480p, 720p, 1080p, and 2160p 4K UHD. Bollywood, Hollywood, South Indian, and Hindi Dubbed Web Series.',
  keywords: [
    'movies4u',
    'download movies',
    'bollywood movies',
    'hollywood hindi dubbed',
    'south indian movies hindi',
    'web series 1080p',
    'free movie download',
    'hindi movies 720p',
    '4k movies download',
  ],
  authors: [{ name: 'Movies4u Team' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://movies4u.kg',
    siteName: 'Movies4u',
    title: 'Movies4u - Bollywood, Hollywood, South Movies & Web Series',
    description:
      'Download latest movies in 480p, 720p, 1080p & 4K. Bollywood, Hollywood, and Hindi Dubbed web series.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movies4u - Fast Movies & Web Series Download',
    description: 'Download latest movies and web series in HD qualities.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flicker theme script: Light mode default unless user explicitly set dark */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('movies4u-theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased selection:bg-red-600 selection:text-white">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
