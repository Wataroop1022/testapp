import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signUp } from "@/lib/actions/auth";

export default function SignupPage() {
  return (
    <div className="auth-shell wrap">
      <div className="auth-card">
        <h1 className="mincho">無料登録</h1>
        <p className="auth-sub">
          メールアドレスとパスワードだけで登録できます。登録後、確認メールのリンクを開くとログインできるようになります。
        </p>
        <AuthForm mode="signup" action={signUp} />
        <div className="auth-switch">
          すでにアカウントをお持ちの方は <Link href="/login">ログイン</Link>
        </div>
      </div>
    </div>
  );
}
