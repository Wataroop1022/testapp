import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Server Action 用。ユーザーのセッションCookieを使うので
// RLSが効く（anon keyだが auth.uid() はログインユーザーを指す）。
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Componentから呼ばれた場合はCookieを書けない。
            // middleware側でセッション更新しているのでここは無視してよい。
          }
        },
      },
    },
  );
}
