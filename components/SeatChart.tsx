import type { SeatSnapshot } from "@/lib/types";

const PARTY_COLOR_VAR: Record<string, string> = {
  "自由民主党": "var(--p-ldp)",
  "自由民主党・無所属の会": "var(--p-ldp)",
  "立憲民主党": "var(--p-cdp)",
  "立憲民主党・無所属": "var(--p-cdp)",
  "立憲・社民・無所属": "var(--p-cdp)",
  "日本維新の会": "var(--p-isin)",
  "公明党": "var(--p-komei)",
  "公明党・無所属クラブ": "var(--p-komei)",
  "国民民主党": "var(--p-dpfp)",
  "国民民主党・新緑風会": "var(--p-dpfp)",
  "日本共産党": "var(--p-jcp)",
  "いのちの党（旧れいわ新選組）": "var(--p-inochi)",
  "れいわ新選組": "var(--p-inochi)",
  "参政党": "var(--p-sansei)",
  "中道改革連合": "var(--p-chukai)",
};

function colorFor(partyName: string) {
  return PARTY_COLOR_VAR[partyName] ?? "var(--chip-other)";
}

export default function SeatChart({
  title,
  sourceLabel,
  rows,
  total,
  footnote,
  footnoteLinkLabel,
  footnoteLinkUrl,
}: {
  title: string;
  sourceLabel: string;
  rows: SeatSnapshot[];
  total: number;
  footnote: string;
  footnoteLinkLabel: string;
  footnoteLinkUrl: string;
}) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="chart-sub">{sourceLabel}</div>
      <div className="bars">
        {rows.map((row) => {
          const pct = (row.seats / total) * 100;
          const color = colorFor(row.party_name);
          return (
            <div className="bar-row" key={row.id}>
              <div className="bar-label">
                <span className="name">{row.party_name}</span>
                <span className="val tabular">{row.seats}議席</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <div className="bar-tooltip">
                {row.party_name}：<b className="tabular">{row.seats}</b>議席（
                {pct.toFixed(1)}%）{row.note ? ` ・ ${row.note}` : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div className="chart-foot">
        {footnote}{" "}
        <a href={footnoteLinkUrl} target="_blank" rel="noopener noreferrer">
          {footnoteLinkLabel}
        </a>{" "}
        で確認してください。
      </div>
    </div>
  );
}
