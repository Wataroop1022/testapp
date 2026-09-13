"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null };

export async function signUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }
  if (password.length < 8) {
    return { error: "パスワードは8文字以上にしてください。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // メール確認が必須の設定なら session は null(確認メール待ち)。
  // 確認不要の設定(お試し環境など)なら signUp() の時点で session が張られる。
  if (data.session) {
    redirect("/member");
  }

  redirect("/signup/check-email");
}

export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/member");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  redirect(next.startsWith("/") ? next : "/member");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
