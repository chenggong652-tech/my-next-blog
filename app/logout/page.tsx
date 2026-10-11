import { signOut } from "@/auth/auth";

export default function LogoutPage() {
  return (
    <main style={{ maxWidth: "400px", margin: "60px auto" }}>
      <h2>退出登录</h2>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" style={{ padding: "8px 16px" }}>
          确认退出
        </button>
      </form>
    </main>
  );
}
