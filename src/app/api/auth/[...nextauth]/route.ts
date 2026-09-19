import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { isAdminEmail, verifyAdminPasscode } from '@/lib/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'select_account',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Admin Passcode',
      credentials: {
        passcode: { label: 'Admin Passcode', type: 'password' },
      },
      async authorize(credentials) {
        if (verifyAdminPasscode(credentials?.passcode)) {
          return {
            id: 'admin',
            name: 'MovieMan Admin',
            email: 'admin@movieman.internal',
            image: null,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        return isAdminEmail(user.email);
      }
      return true;
    },
    async session({ session }) {
      if (session?.user?.email) {
        (session.user as any).isAdmin = isAdminEmail(session.user.email) || session.user.email === 'admin@movieman.internal';
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
  secret: process.env.NEXTAUTH_SECRET || 'movieman_super_secure_nextauth_secret_token_99182312',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
