import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service-role key は RLS を完全にバイパスする。
// サーバー専用コード(scripts/ や app/api/.../route.ts のようなRoute Handler)からのみ
// importすること。"use client"なコンポーネントやクライアントバンドルに含まれる
// コードから絶対にimportしない（ブラウザに鍵が漏れる）。
export function createServiceRoleClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL(またはNEXT_PUBLIC_SUPABASE_URL) と SUPABASE_SERVICE_ROLE_KEY の環境変数が必要です",
    );
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
