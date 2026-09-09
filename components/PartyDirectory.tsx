import type { Party } from "@/lib/types";

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

export default function PartyDirectory({ parties }: { parties: Party[] }) {
  return (
    <div className="party-grid">
      {parties.map((p) => (
        <div
          className="party-card"
          key={p.id}
          style={p.color ? ({ "--card-color": p.color } as React.CSSProperties) : undefined}
        >
          <div className="p-top">
            <h3 className="mincho">{p.name}</h3>
            <div className="p-seats">
              議席（目安）
              <br />
              <b>{p.seats_note ?? "非公表"}</b>
            </div>
          </div>
          <div className="party-meta">
            <span>
              <span className="lbl">党首</span>
              {p.leader ?? "―"}
            </span>
            <span>
              <span className="lbl">結党</span>
              {p.founded ?? "―"}
            </span>
          </div>
          <div className="party-desc">{p.description}</div>
          {p.url && (
            <a className="party-link" href={p.url} target="_blank" rel="noopener noreferrer">
              公式サイト {linkIcon}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
