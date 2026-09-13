import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabaseの確認メール(サインアップ確認・パスワードリセット等)のリンク先。
// メールテンプレート側を {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=... に
// 変更しておく必要がある(Supabaseダッシュボード: Authentication > Email Templates)。
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/member";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=confirm_failed");
}
