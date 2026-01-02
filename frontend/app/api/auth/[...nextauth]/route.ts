import NextAuth from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"
import type { Profile } from 'next-auth'

interface TwitterProfile extends Profile {
  data: {
    username: string
  }
}

console.log('Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('TWITTER_CLIENT_ID:', process.env.TWITTER_CLIENT_ID);

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access",
          prompt: "consent",
          force_login: false,
          code_challenge: "challenge",
          code_challenge_method: "plain",
          response_type: "code"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  logger: {
    error(code, ...message) {
      console.error('=== NextAuth Error ===\n', code, message);
    },
    warn(code, ...message) {
      console.warn('=== NextAuth Warning ===\n', code, message);
    },
    debug(code, ...message) {
      console.log('=== NextAuth Debug ===\n', code, message);
    },
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
      }
      if (profile) {
        const twitterProfile = profile as TwitterProfile
        token.username = twitterProfile.data.username
      }
      return token
    },
    async session({ session, token }) {
      session.user = session.user || {}
      session.user.name = token.username || null
      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log("=== Sign In Attempt ===\n", { user, account, profile })
      return true
    }
  },
  events: {
    signIn({ user, account, profile }) { 
      console.log("SignIn Event:", { user, account, profile }) 
    },
    signOut({ session, token }) { 
      console.log("SignOut Event:", { session, token }) 
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
    signOut: '/auth/signout'
  }
})

export { handler as GET, handler as POST }

