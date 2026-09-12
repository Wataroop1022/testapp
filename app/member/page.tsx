import { createClient } from "@/lib/supabase/server";
import PartyUpdateFeed from "@/components/PartyUpdateFeed";
import type { PartyUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MemberPage() {
  const supabase = await createClient();

  // middlewareで未ログインは/loginへリダイレクト済みなので、ここに来る時点でログイン済み。
  // 実際にpartyUpdatesが読めるかどうかはRLS(members read updates policy)が守っている。
  const { data } = await supabase
    .from("party_updates")
    .select("*, party:parties(name, short, color)")
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (data ?? []) as PartyUpdate[];

  return (
    <section>
      <div className="wrap">
        <div className="section-head">
          <div className="kicker">Members only</div>
          <h2>政党別 最新動向フィード</h2>
          <p>
            Claudeが定期的にWeb検索で調査した、各党の直近のニュース・法案提出動向です。1日1回ほどのペースで更新されます。
            出典元へのリンクを必ず確認したうえで参照してください。
          </p>
        </div>
        <PartyUpdateFeed items={items} />
      </div>
    </section>
  );
}
