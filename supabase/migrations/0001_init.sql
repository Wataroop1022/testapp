-- 国会政党ウォッチ: 初期スキーマ + シードデータ
-- Supabase SQL Editorで実行してください。

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short text,
  leader text,
  founded text,
  color text,
  description text,
  url text,
  seats_note text,
  display_order int not null default 0
);

create table if not exists seat_snapshots (
  id uuid primary key default gen_random_uuid(),
  chamber text not null check (chamber in ('shugiin','sangiin')),
  party_name text not null,
  seats int not null,
  total int not null,
  note text,
  source text,
  as_of_date date not null,
  created_at timestamptz not null default now(),
  unique (chamber, party_name, as_of_date)
);

create table if not exists party_updates (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references parties(id),
  category text not null check (category in ('news','bill')),
  title text not null,
  summary text not null,
  source_url text not null unique,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists update_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  items_inserted int default 0,
  items_skipped int default 0,
  error text
);

-- ---------- new user -> profiles 自動作成 ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- RLS ----------

alter table profiles enable row level security;
alter table parties enable row level security;
alter table seat_snapshots enable row level security;
alter table party_updates enable row level security;
alter table update_runs enable row level security;

drop policy if exists "own profile select" on profiles;
create policy "own profile select" on profiles for select using (auth.uid() = id);

drop policy if exists "own profile update" on profiles;
create policy "own profile update" on profiles for update using (auth.uid() = id);

drop policy if exists "public read parties" on parties;
create policy "public read parties" on parties for select using (true);

drop policy if exists "public read seats" on seat_snapshots;
create policy "public read seats" on seat_snapshots for select using (true);

drop policy if exists "members read updates" on party_updates;
create policy "members read updates" on party_updates for select using (auth.role() = 'authenticated');

-- parties / seat_snapshots / party_updates / update_runs に insert/update/delete policyは意図的に作らない。
-- クライアント(anon/authenticated)からの書き込みは一切できず、service-role keyのみが書き込める。

-- ---------- Seed data ----------
-- 現行の静的サイト(index.html)の内容をそのまま移植したもの。
-- 情報基準日: 2026年9月9日時点の公開情報。

insert into parties (name, short, leader, founded, color, description, url, seats_note, display_order) values
('自由民主党', '自民党', '高市早苗（総裁）', '1955年', 'var(--p-ldp)',
  '保守系。1955年の結党以来ほぼ一貫して政権を担ってきた日本最大の政党。2026年2月の総選挙で単独過去最多の316議席を獲得し、戦後初めて定数の3分の2を超えた。',
  'https://www.jimin.jp/', '衆316・参101', 1),
('立憲民主党', '立憲', '水岡俊一（代表）', '2020年（2026年に再結成）', 'var(--p-cdp)',
  '中道からリベラルまでを含む野党第一党。2026年1月に公明党と合流して「中道改革連合」を結成したが総選挙で大敗し、全面合流を延期したうえで党を再結成した。',
  'https://cdp-japan.jp/', '衆48（会派）', 2),
('日本維新の会', '維新', '吉村洋文（代表）', '2015年', 'var(--p-isin)',
  '大阪発の改革保守系政党。行政改革・地方分権・規制改革を重視。2026年総選挙で議席を伸ばし自民党と連立を組む。',
  'https://o-ishin.jp/', '衆36・参19', 3),
('公明党', '公明', '竹谷とし子（代表）', '1964年（2026年に活動再開）', 'var(--p-komei)',
  '福祉・平和外交を重視する中道政党。2026年1月に立憲民主党と合流し「中道改革連合」を結成したが、総選挙後に分党して公明党として活動を再開した。',
  'https://www.komei.or.jp/', '衆28（会派）・参21', 4),
('国民民主党', '国民民主', '玉木雄一郎（代表）', '2020年', 'var(--p-dpfp)',
  '「対決より解決」を掲げる中道政党。個別政策ごとの是々非々路線が特徴。2026年総選挙では中道改革連合への不合流を選び単独で議席を伸ばした。',
  'https://new-kokumin.jp/', '衆28・参25（会派）', 5),
('日本共産党', '共産党', '田村智子（委員長）', '1922年', 'var(--p-jcp)',
  '現存する日本最古の政党。護憲・格差是正・大企業への規制強化を主張。2026年総選挙では議席を減らした。',
  'https://www.jcp.or.jp/', '衆4・参7', 6),
('いのちの党（旧れいわ新選組）', 'いのち', '山本譲司（代表）', '2019年（2026年8月に改称）', 'var(--p-inochi)',
  '消費税減税・積極財政を掲げる政党。2026年2月の総選挙は「れいわ新選組」名で戦い衆院1議席にとどまった。同年7月に山本太郎氏が代表辞任・政界引退を表明し、8月に党名を「いのちの党」へ変更。',
  'https://reiwa-shinsengumi.com/', '衆1・参6', 7),
('参政党', '参政党', '神谷宗幣（代表）', '2020年', 'var(--p-sansei)',
  '教育・食・健康・国防を重視する新興保守系政党。党員参加型の運営を掲げ、2026年総選挙・前年の参院選ともに議席を伸ばした。',
  'https://sanseito.jp/', '衆15・参15', 8),
('社会民主党', '社民党', '福島瑞穂（党首）', '1996年（前身は1945年）', null,
  '護憲・平和主義・労働者保護を掲げる革新政党。2026年総選挙で衆議院の議席をすべて失った。',
  'https://sdp.or.jp/', '衆0・参は立憲などとの合同会派に参加', 9),
('チームみらい', 'みらい', '安野貴博（党首）', '2025年', null,
  'テクノロジー・AIを政策形成に活用することを掲げる新興政党。2026年総選挙で衆院に初めて議席を獲得した。党首の安野氏本人は参議院議員。',
  'https://team-mir.ai/', '衆11・参1', 10),
('中道改革連合', '中道', '小川淳也（代表）', '2026年1月', 'var(--p-chukai)',
  '高市首相の解散表明直前、立憲民主党と公明党が合流して結党。公示前172議席から総選挙で49議席へ大敗し、上院議員・地方議員を含む全面合流を延期。事実上、立憲系・公明系がそれぞれの党名で分党した後も、小川氏のグループが「中道改革連合」として存続している。',
  'https://craj.jp/', '衆49（総選挙時）→分党後は非公表', 11)
on conflict (name) do nothing;

insert into seat_snapshots (chamber, party_name, seats, total, note, source, as_of_date) values
('shugiin', '自由民主党', 316, 465, '戦後最多、単独で定数の3分の2超', '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('shugiin', '中道改革連合', 49, 465, '立憲民主党・公明党が合流した新党。公示前172から大幅減', '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('shugiin', '日本維新の会', 36, 465, null, '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('shugiin', '国民民主党', 28, 465, null, '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('shugiin', '参政党', 15, 465, null, '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('shugiin', 'チームみらい', 11, 465, '2026年衆院選で初議席', '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('shugiin', '日本共産党', 4, 465, null, '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('shugiin', '無所属', 4, 465, null, '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('shugiin', 'れいわ新選組', 1, 465, '選挙後の2026年8月に「いのちの党」へ改称', '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('shugiin', '減税日本・ゆうこく連合', 1, 465, '得票率2%未満で政党要件を喪失', '日本経済新聞・nippon.com の選挙結果報道', '2026-02-08'),
('sangiin', '自由民主党', 101, 248, null, '参議院会派別所属議員数・報道（2025年7月29日時点）', '2025-07-29'),
('sangiin', '立憲・社民・無所属', 43, 248, '3会派合同', '参議院会派別所属議員数・報道（2025年7月29日時点）', '2025-07-29'),
('sangiin', '国民民主党・新緑風会', 25, 248, null, '参議院会派別所属議員数・報道（2025年7月29日時点）', '2025-07-29'),
('sangiin', '公明党', 21, 248, null, '参議院会派別所属議員数・報道（2025年7月29日時点）', '2025-07-29'),
('sangiin', '日本維新の会', 19, 248, null, '参議院会派別所属議員数・報道（2025年7月29日時点）', '2025-07-29'),
('sangiin', '参政党', 15, 248, null, '参議院会派別所属議員数・報道（2025年7月29日時点）', '2025-07-29'),
('sangiin', '日本共産党', 7, 248, null, '参議院会派別所属議員数・報道（2025年7月29日時点）', '2025-07-29'),
('sangiin', 'いのちの党（旧れいわ新選組）', 6, 248, null, '参議院会派別所属議員数・報道（2025年7月29日時点）', '2025-07-29'),
('sangiin', 'その他会派', 11, 248, '日本保守党／沖縄の風／無所属', '参議院会派別所属議員数・報道（2025年7月29日時点）', '2025-07-29')
on conflict (chamber, party_name, as_of_date) do nothing;
