// AI自動更新フィードの中身。Vercel Cron("app/api/cron/update-feed/route.ts")と
// ローカル手動実行("scripts/update-party-feed.mjs")の両方から呼ばれる共通ロジック。
//
// あえて素のJS(ESM)にしてTypeScriptのパスエイリアスに依存しない形にしている。
// これにより`node scripts/update-party-feed.mjs`でビルド無しに直接実行できる。
//
// supabase / anthropic のクライアントは呼び出し側で作って渡す(このファイル自体は
// 環境変数やimport元を気にしない)。

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const BATCH_SIZE = 3;
const MODEL = "claude-opus-5";
const RESEARCH_EFFORT = "medium"; // 調査・要約タスクなので high/xhigh までは不要

const UpdateItemSchema = z.object({
  party_name: z.string().describe("対象政党の正式名称。partiesテーブルのnameと一致させる"),
  category: z.enum(["news", "bill"]),
  title: z.string().describe("30文字程度の短い見出し"),
  summary: z.string().describe("2〜3文程度の要約"),
  source_url: z.string().url(),
  published_at: z.string().nullable().describe("ISO 8601形式の日付。不明ならnull"),
});
const BatchResultSchema = z.object({ items: z.array(UpdateItemSchema) });

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function researchBatch(anthropic, partyNames) {
  const prompt = `以下の日本の政党それぞれについて、直近1週間程度の重要なニュースと、
国会での法案提出・審議に関する動向を調べてください。

対象政党: ${partyNames.join("、")}

政党ごとに0〜2件、本当に重要な項目のみを挙げてください。無理に件数を埋める必要はありません。
各項目について、見出し・2〜3文の要約・出典URL・公表日(分かれば)を含めて、自然な文章で回答してください。
出典URLは実在する具体的な記事ページを示してください。`;

  let messages = [{ role: "user", content: prompt }];
  let response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: RESEARCH_EFFORT },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
    messages,
  });

  // 長時間の検索でpause_turnになった場合は続きを取得する
  while (response.stop_reason === "pause_turn") {
    messages = [...messages, { role: "assistant", content: response.content }];
    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: RESEARCH_EFFORT },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
      messages,
    });
  }

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

async function extractStructured(anthropic, researchText, partyNames) {
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { format: zodOutputFormat(BatchResultSchema) },
    messages: [
      {
        role: "user",
        content: `次の調査メモを、指定スキーマのJSONに変換してください。
party_name は必ず次のいずれかの表記に正規化してください: ${partyNames.join(" / ")}
情報が薄い・出典URLが不明な項目は含めないでください。

---調査メモ---
${researchText}`,
      },
    ],
  });

  return response.parsed_output?.items ?? [];
}

/**
 * @param {{ supabase: import("@supabase/supabase-js").SupabaseClient, anthropic: import("@anthropic-ai/sdk").default }} deps
 */
export async function runUpdateJob({ supabase, anthropic }) {
  const { data: run, error: runError } = await supabase
    .from("update_runs")
    .insert({ status: "running" })
    .select()
    .single();
  if (runError) {
    return { itemsInserted: 0, itemsSkipped: 0, error: `update_runsへの記録に失敗: ${runError.message}` };
  }

  let itemsInserted = 0;
  let itemsSkipped = 0;
  let jobError = null;
  const log = [];

  try {
    const { data: parties, error: partiesError } = await supabase
      .from("parties")
      .select("id, name")
      .order("display_order", { ascending: true });
    if (partiesError) throw partiesError;
    if (!parties || parties.length === 0) throw new Error("partiesテーブルが空です");

    const nameToId = new Map(parties.map((p) => [p.name, p.id]));

    for (const batch of chunk(parties, BATCH_SIZE)) {
      const names = batch.map((p) => p.name);

      const researchText = await researchBatch(anthropic, names);
      const items = await extractStructured(anthropic, researchText, names);

      if (items.length === 0) {
        log.push(`${names.join("、")}: 新規項目なし`);
        continue;
      }

      const rows = items
        .map((item) => ({
          party_id: nameToId.get(item.party_name) ?? null,
          category: item.category,
          title: item.title,
          summary: item.summary,
          source_url: item.source_url,
          published_at: item.published_at,
        }))
        .filter((row) => row.party_id !== null);

      if (rows.length === 0) continue;

      const { data: upserted, error: upsertError } = await supabase
        .from("party_updates")
        .upsert(rows, { onConflict: "source_url", ignoreDuplicates: true })
        .select("id");
      if (upsertError) throw upsertError;

      const inserted = upserted?.length ?? 0;
      itemsInserted += inserted;
      itemsSkipped += rows.length - inserted;
      log.push(`${names.join("、")}: ${inserted}件追加、${rows.length - inserted}件スキップ`);
    }
  } catch (err) {
    jobError = err instanceof Error ? err.message : String(err);
  }

  await supabase
    .from("update_runs")
    .update({
      finished_at: new Date().toISOString(),
      status: jobError ? "failed" : "succeeded",
      items_inserted: itemsInserted,
      items_skipped: itemsSkipped,
      error: jobError,
    })
    .eq("id", run.id);

  return { itemsInserted, itemsSkipped, error: jobError, log };
}
