import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signIn } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="auth-shell wrap">
      <div className="auth-card">
        <h1 className="mincho">ログイン</h1>
        <p className="auth-sub">会員限定の政党別ニュース・法案動向フィードを見るにはログインしてください。</p>
        <AuthForm mode="login" action={signIn} next={next} />
        <div className="auth-switch">
          アカウントをお持ちでない方は <Link href="/signup">無料登録</Link>
        </div>
      </div>
    </div>
  );
}
