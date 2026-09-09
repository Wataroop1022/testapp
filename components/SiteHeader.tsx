import Link from "next/link";

export default function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="site-header">
      <div className="wrap inner">
        <Link href="/" className="brand mincho">
          国会政党ウォッチ
        </Link>
        <nav>
          {isLoggedIn ? (
            <>
              <Link href="/member">会員フィード</Link>
              <Link href="/account" className="pill">
                アカウント
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">ログイン</Link>
              <Link href="/signup" className="pill primary">
                無料登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
