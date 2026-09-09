import type { PartyUpdate } from "@/lib/types";

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

export default function PartyUpdateFeed({ items }: { items: PartyUpdate[] }) {
  if (items.length === 0) {
    return (
      <div className="feed-empty">
        まだフィード項目がありません。定期更新ジョブが初回実行されるとここに表示されます。
      </div>
    );
  }

  return (
    <div className="feed-list">
      {items.map((item) => {
        const dateLabel = formatDate(item.published_at ?? item.created_at);
        return (
          <article className="feed-item" key={item.id}>
            <div className="f-top">
              <span className={`feed-badge ${item.category === "bill" ? "bill" : ""}`}>
                {item.category === "bill" ? "法案動向" : "ニュース"}
              </span>
              {item.party?.name && <span className="feed-party">{item.party.name}</span>}
              {dateLabel && <span className="feed-date">{dateLabel}</span>}
            </div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <a className="f-source" href={item.source_url} target="_blank" rel="noopener noreferrer">
              出典を見る ↗
            </a>
          </article>
        );
      })}
    </div>
  );
}
