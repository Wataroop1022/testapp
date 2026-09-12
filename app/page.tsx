import { createClient } from "@/lib/supabase/server";
import SeatChart from "@/components/SeatChart";
import PartyDirectory from "@/components/PartyDirectory";
import ResourceLinks from "@/components/ResourceLinks";
import type { Party, SeatSnapshot } from "@/lib/types";

export const revalidate = 3600;

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: parties }, { data: seats }] = await Promise.all([
    supabase.from("parties").select("*").order("display_order", { ascending: true }),
    supabase.from("seat_snapshots").select("*"),
  ]);

  const partyRows = (parties ?? []) as Party[];
  const seatRows = (seats ?? []) as SeatSnapshot[];
  const shugiin = seatRows.filter((s) => s.chamber === "shugiin");
  const sangiin = seatRows.filter((s) => s.chamber === "sangiin");
  const shugiinTotal = shugiin[0]?.total ?? 465;
  const sangiinTotal = sangiin[0]?.total ?? 248;
  const shugiinDate = shugiin[0]?.as_of_date;
  const sangiinDate = sangiin[0]?.as_of_date;

  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <div className="eyebrow">
            <span className="dot" />
            国会・政党情報ポータル
          </div>
          <h1 className="mincho">国会政党ウォッチ</h1>
          <p className="lede">
            衆参両院に議席を持つ主要政党の党首・結党年・公式発信先と、両院の会派別議席構成をひとつにまとめました。
            無料登録すると、AIが定期的に調査する政党別の最新ニュース・法案提出動向フィードも見られます。
            国会審議や政治資金の一次情報は速報性が命なので、下部の「活動を追う」から各院・省庁の公式ページへ直接アクセスできるようにしています。
          </p>
          <div className="asof-badge">
            議席データ基準日: <b>衆院 {shugiinDate ?? "―"} ／ 参院 {sangiinDate ?? "―"}</b>
          </div>
        </div>
      </header>

      <section id="seats">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">Composition</div>
            <h2>両院の会派別議席構成</h2>
            <p>バーにカーソルを合わせると詳細が出ます。データはSupabaseで管理しており、選挙結果や会派異動があれば更新されます。</p>
          </div>
          <div className="chart-grid">
            <SeatChart
              title={`衆議院（定数${shugiinTotal}）`}
              sourceLabel={shugiin[0]?.source ?? "出典未設定"}
              rows={shugiin}
              total={shugiinTotal}
              footnote="現在の会派構成は"
              footnoteLinkLabel="衆議院サイト"
              footnoteLinkUrl="https://www.shugiin.go.jp/internet/itdb_annai.nsf/html/statics/shiryo/kaiha_m.htm"
            />
            <SeatChart
              title={`参議院（定数${sangiinTotal}）`}
              sourceLabel={sangiin[0]?.source ?? "出典未設定"}
              rows={sangiin}
              total={sangiinTotal}
              footnote="最新値は"
              footnoteLinkLabel="参議院サイト"
              footnoteLinkUrl="https://www.sangiin.go.jp/japanese/joho1/kousei/giin/current/giinsu.htm"
            />
          </div>
        </div>
      </section>

      <section id="directory">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">Directory</div>
            <h2>政党ディレクトリ</h2>
            <p>国政に議席を持つ主要政党を掲載。左端の色は上のグラフと対応しています。</p>
          </div>
          <PartyDirectory parties={partyRows} />
          <p className="legend-note">
            ※ 党の説明は基本理念・結党経緯など事実関係を簡潔にまとめたもので、政策の当否についての評価は含みません。
            党名・代表者・議席数は変動します。最終確認は各党公式サイトおよび衆参両院の公式ページで行ってください。
          </p>
        </div>
      </section>

      <section id="track">
        <div className="wrap">
          <div className="section-head">
            <div className="kicker">Live sources</div>
            <h2>国会の活動を追う</h2>
            <p>「今どうなっているか」はこのページではなく一次情報を見るのが確実です。よく使う公式窓口をまとめました。</p>
          </div>
          <ResourceLinks />
        </div>
      </section>

      <footer>
        <div className="wrap foot-inner">
          <div className="disclaimer">
            本ページは公開情報をもとに作成した参考資料であり、いずれの政党・候補者を支持または推奨するものではありません。
            誤り・更新遅れに気づいた場合は各公式サイトの情報を優先してください。
          </div>
          <div>
            <b>国会政党ウォッチ</b>
          </div>
        </div>
      </footer>
    </>
  );
}
