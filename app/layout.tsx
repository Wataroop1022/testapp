import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-shippori-mincho",
  display: "swap",
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-zen-kaku-gothic-new",
  display: "swap",
});

export const metadata: Metadata = {
  title: "国会政党ウォッチ",
  description:
    "衆参両院の主要政党を一望できるディレクトリと議席構成、会員向けのAI自動更新フィード。",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ja" className={`${shipporiMincho.variable} ${zenKakuGothicNew.variable}`}>
      <body>
        <SiteHeader isLoggedIn={!!user} />
        {children}
      </body>
    </html>
  );
}
