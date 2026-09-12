#!/usr/bin/env node
// ローカル手動実行用のCLIラッパー。実際の処理は lib/party-feed-job.mjs にある。
// 本番の定期実行は Vercel Cron -> app/api/cron/update-feed/route.ts が担う。
//
// 必要な環境変数: SUPABASE_URL(またはNEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { runUpdateJob } from "../lib/party-feed-job.mjs";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || !process.env.ANTHROPIC_API_KEY) {
  console.error(
    "環境変数 SUPABASE_URL(またはNEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY / ANTHROPIC_API_KEY が必要です。",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anthropic = new Anthropic();

const result = await runUpdateJob({ supabase, anthropic });

for (const line of result.log ?? []) console.log(line);
console.log(`完了: 追加${result.itemsInserted}件 / スキップ${result.itemsSkipped}件`);
if (result.error) {
  console.error("エラー:", result.error);
  process.exit(1);
}
