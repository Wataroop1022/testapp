"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/lib/actions/auth";

export default function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "login" | "signup";
  action: (prev: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  next?: string;
}) {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(action, {
    error: null,
  });

  return (
    <form className="auth-form" action={formAction}>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <div className="auth-error">{state.error}</div>}
      <div className="auth-field">
        <label htmlFor="email">メールアドレス</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="auth-field">
        <label htmlFor="password">パスワード</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={mode === "signup" ? 8 : undefined}
          required
        />
      </div>
      <button className="auth-submit" type="submit" disabled={isPending}>
        {isPending ? "処理中…" : mode === "signup" ? "登録する" : "ログイン"}
      </button>
    </form>
  );
}
