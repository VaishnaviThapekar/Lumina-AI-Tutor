import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

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
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check localStorage for user (client-side auth)
        // This is a simplified version - in production, verify against your backend
        try {
          const users = JSON.parse(localStorage.getItem('lumina_users') || '[]');
          const user = users.find(
            (u: any) => u.email === credentials.email && u.password === credentials.password
          );

          if (user) {
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.username,
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
        }

        return null;
      },
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
      // Add user info to session
      if (session.user) {
        session.user.id = token.sub as string;
      }

      // Store session in localStorage for persistence
      if (typeof window !== 'undefined') {
        const sessionData = {
          userId: token.sub,
          email: token.email,
          username: token.name,
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
          rememberMe: true,
        };
        localStorage.setItem('lumina_session', JSON.stringify(sessionData));
      }

      return session;
    },
    async jwt({ token, user, account }) {
      // First time JWT callback is run, user object is available
      if (user) {
        token.id = user.id;
      }

      // Store OAuth user in localStorage
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (typeof window !== 'undefined') {
          const users = JSON.parse(localStorage.getItem('lumina_users') || '[]');

          // Check if user already exists
          let existingUser = users.find((u: any) => u.email === token.email);

          if (!existingUser) {
            // Create new user from OAuth data
            const newUser = {
              id: Date.now(),
              email: token.email,
              username: token.name,
              password: '', // OAuth users don't have passwords
              createdAt: new Date().toISOString(),
              oauthProvider: account.provider,
            };
            users.push(newUser);
            localStorage.setItem('lumina_users', JSON.stringify(users));
          }
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };