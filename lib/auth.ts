import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // X3：通行证7天过期，到期重新登录
  // ========== 新增：把用户id写进登录会话，后面权限判断要用 ==========
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });
        if (!user || !user.password) return null;

        // 🛡️ 第 X3 课：防爆破——账号被锁定时，直接拒绝（好人等锁结束，坏人没得试）
        if (user.lockUntil && user.lockUntil > new Date()) {
          return null;
        }

        const passOk = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (passOk) {
          // 登录成功：把之前的"失败账"清零（记仇归零，重新做人）
          if (user.failCount > 0 || user.lockUntil) {
            await prisma.user.update({
              where: { id: user.id },
              data: { failCount: 0, lockUntil: null },
            });
          }
          return user;
        }

        // 密码错了：失败次数 +1；连续错满 5 次 → 锁 15 分钟
        const failCount = user.failCount + 1;
        const lockUntil = failCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await prisma.user.update({
          where: { id: user.id },
          data: { failCount, lockUntil },
        });
        return null;
      }

    })
  ],
  pages: {
    signIn: "/login",
  },
});
