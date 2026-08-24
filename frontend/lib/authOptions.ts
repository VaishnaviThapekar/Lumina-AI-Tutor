import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all sign-ins
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful login
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      return baseUrl + '/dashboard';
    },
    async session({ session, token }) {
      // Add user info to session — pull name/email fresh from the token
      // rather than leaving Next-Auth's defaults, since we explicitly
      // refresh these on every sign-in in the jwt callback below.
      if (session.user) {
        (session.user as any).id = token.sub as string;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      // `user` is only populated on a fresh sign-in (not on every request).
      // If someone signs in with a DIFFERENT account while an old session
      // is still active (i.e. they didn't log out first), we must
      // explicitly overwrite name/email/id here — otherwise NextAuth
      // silently keeps stale values from whichever account was cached
      // first, regardless of which account they just signed in with.
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        if ((user as any).image) {
          token.picture = (user as any).image;
        }
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
