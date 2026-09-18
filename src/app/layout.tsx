import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/AppLayout';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  referrer: 'no-referrer',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://movieman4u.vercel.app'),
  title: {
    default: 'Movie Man - Download Bollywood, Hollywood, South Movies & Web Series',
    template: '%s | Movie Man',
  },
  description:
    'Movie Man offers free latest movies available for download in various resolutions including 480p, 720p, 1080p, and 2160p 4K UHD. Bollywood, Hollywood, South Indian, and Hindi Dubbed Web Series.',
  keywords: [
    'movie man',
    'movieman',
    'download movies',
    'bollywood movies',
    'hollywood hindi dubbed',
    'south indian movies hindi',
    'web series 1080p',
    'free movie download',
    'hindi movies 720p',
    '4k movies download',
  ],
  authors: [{ name: 'Movie Man Team' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
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
    url: 'https://allmoviesite.vercel.app',
    siteName: 'Movie Man',
    title: 'Movie Man - Bollywood, Hollywood, South Movies & Web Series',
    description:
      'Download latest movies in 480p, 720p, 1080p & 4K. Bollywood, Hollywood, and Hindi Dubbed web series.',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movie Man - Fast Movies & Web Series Download',
    description: 'Download latest movies and web series in HD qualities.',
    images: ['/logo.png'],
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
        <meta name="referrer" content="no-referrer" />
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
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
