const linkIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={11}
    height={11}
  >
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
);

const dietLinks = [
  ["国会会議録検索システム", "https://kokkai.ndl.go.jp/", "本会議・委員会の発言を発言者名や政党名、キーワードで検索できる。"],
  ["衆議院インターネット審議中継", "https://www.shugiintv.go.jp/", "衆議院本会議・委員会の中継と録画をアーカイブで視聴できる。"],
  ["参議院インターネット審議中継", "https://www.webtv.sangiin.go.jp/", "参議院本会議・委員会の中継と録画をアーカイブで視聴できる。"],
] as const;

const seatLinks = [
  ["衆議院 会派名及び所属議員数", "https://www.shugiin.go.jp/internet/itdb_annai.nsf/html/statics/shiryo/kaiha_m.htm", "衆議院の会派別議席数の公式・最新データ。"],
  ["参議院 会派別所属議員数", "https://www.sangiin.go.jp/japanese/joho1/kousei/giin/current/giinsu.htm", "参議院の会派別議席数の公式・最新データ。"],
] as const;

const moneyLinks = [
  ["総務省 政治資金収支報告書公表サイト", "https://www.soumu.go.jp/senkyo/seiji_s/seijishikin/index.html", "政党・政治団体の収支報告書を確認できる総務省の窓口。"],
] as const;

function ResList({ items }: { items: readonly (readonly [string, string, string])[] }) {
  return (
    <div className="res-list">
      {items.map(([name, url, desc]) => (
        <a className="res-item" href={url} target="_blank" rel="noopener noreferrer" key={url}>
          <div className="r-name">
            {name} {linkIcon}
          </div>
          <div className="r-desc">{desc}</div>
        </a>
      ))}
    </div>
  );
}

export default function ResourceLinks() {
  return (
    <div className="res-grid">
      <div className="res-col">
        <h4>審議・議事録</h4>
        <ResList items={dietLinks} />
      </div>
      <div className="res-col">
        <h4>議席・会派の現況</h4>
        <ResList items={seatLinks} />
      </div>
      <div className="res-col">
        <h4>政治とお金</h4>
        <ResList items={moneyLinks} />
      </div>
    </div>
  );
}
