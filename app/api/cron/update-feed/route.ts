import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { runUpdateJob } from "@/lib/party-feed-job.mjs";

// Web検索を挟むバッチ処理なので長めに確保(Hobbyプランの上限は300秒)
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const anthropic = new Anthropic();

  const result = await runUpdateJob({ supabase, anthropic });

  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}
