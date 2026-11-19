"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    let alive = true;
    void client.auth.getSession().then(({ data }) => {
      if (alive && data.session) router.replace("/price-tracker");
    });
    return () => { alive = false; };
  }, [router]);
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const client = getSupabaseBrowserClient();
    if (!client) { setMessage("Sign-in is not connected yet. Add the Supabase URL and publishable key to the deployment environment first."); return; }
    setBusy(true);
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/login` } });
    setBusy(false); setMessage(error ? error.message : "Check your email for the secure sign-in link.");
  }
  return <div className="page-container login-page"><div className="login-card"><p className="eyebrow">YOUR SMARTER SAVINGS</p><h1>Welcome<br /><em>back.</em></h1><p>Sign in with your email. We will send you a secure one-time link.</p><form onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="primary-button full-button" type="submit" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"} <span>↗</span></button></form>{message && <p className="form-message" role="status">{message}</p>}<small>By continuing, you agree to use offers according to each merchant's terms. <Link href="/">Back to home</Link></small></div></div>;
}
