import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "账号密码",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        // 把传过来的值统一转成字符串，防止类型问题
        const username = String(credentials?.username || "");
        const password = String(credentials?.password || "");

        // 本地写死测试账号：admin / 123456
        if (username === "admin" && password === "123456") {
          return { id: "1", name: "管理员" };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
});
