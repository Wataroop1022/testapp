import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  const p = profile as Profile | null;
  const joined = p?.created_at
    ? new Date(p.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : "―";

  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <div className="kicker">Account</div>
          <h2>アカウント</h2>
        </div>
        <div className="account-card">
          <div className="account-row">
            <span className="a-lbl">メールアドレス</span>
            <span className="a-val">{user?.email}</span>
          </div>
          <div className="account-row">
            <span className="a-lbl">プラン</span>
            <span className="a-val">
              <span className="plan-badge">{p?.plan === "free" ? "無料会員" : p?.plan ?? "無料会員"}</span>
            </span>
          </div>
          <div className="account-row">
            <span className="a-lbl">登録日</span>
            <span className="a-val">{joined}</span>
          </div>
          <form action={signOut}>
            <button className="signout-btn" type="submit">
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
