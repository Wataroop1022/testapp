#!/usr/bin/env node
// クラウドのスケジュール実行から `node scripts/update-party-feed.mjs` として呼ばれることを想定した、
// Claude Code CLI自体には依存しない素のNodeスクリプト。
//
// 必要な環境変数:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
//
// 処理:
//   1. update_runs に開始レコードをinsert
//   2. parties テーブルを取得(政党マスタはDBが正)
//   3. 政党を数件ずつのバッチに分け、各バッチについて
//      a) web_search付きのClaude呼び出しで最近のニュース・法案動向を調べさせる
//      b) その回答を、構造化出力(Zod)付きの別呼び出しでJSONに変換させる
//   4. party_updates に upsert（source_url の unique 制約で重複を弾く）
//   5. update_runs に結果を反映

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`環境変数 ${key} が設定されていません。`);
    process.exit(1);
  }
}

const BATCH_SIZE = 3;
const MODEL = "claude-opus-5";
const RESEARCH_EFFORT = "medium"; // 調査・要約タスクなので high/xhigh までは不要

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anthropic = new Anthropic();

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

async function researchBatch(partyNames) {
  const prompt = `以下の日本の政党それぞれについて、直近1週間程度の重要なニュースと、
国会での法案提出・審議に関する動向を調べてください。

対象政党: ${partyNames.join("、")}

政党ごとに0〜2件、本当に重要な項目のみを挙げてください。無理に件数を埋める必要はありません。
各項目について、見出し・2〜3文の要約・出典URL・公表日（分かれば）を含めて、自然な文章で回答してください。
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

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return text;
}

async function extractStructured(researchText, partyNames) {
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

async function main() {
  const { data: run, error: runError } = await supabase
    .from("update_runs")
    .insert({ status: "running" })
    .select()
    .single();
  if (runError) {
    console.error("update_runsへの記録に失敗:", runError.message);
    process.exit(1);
  }

  let itemsInserted = 0;
  let itemsSkipped = 0;
  let runError_ = null;

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
      console.log(`調査中: ${names.join("、")}`);

      const researchText = await researchBatch(names);
      const items = await extractStructured(researchText, names);

      if (items.length === 0) {
        console.log("  -> 新規項目なし");
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
      console.log(`  -> ${inserted}件追加、${rows.length - inserted}件は重複でスキップ`);
    }
  } catch (err) {
    runError_ = err instanceof Error ? err.message : String(err);
    console.error("実行中にエラー:", runError_);
  }

  await supabase
    .from("update_runs")
    .update({
      finished_at: new Date().toISOString(),
      status: runError_ ? "failed" : "succeeded",
      items_inserted: itemsInserted,
      items_skipped: itemsSkipped,
      error: runError_,
    })
    .eq("id", run.id);

  console.log(`完了: 追加${itemsInserted}件 / スキップ${itemsSkipped}件`);
  if (runError_) process.exit(1);
}

main();
