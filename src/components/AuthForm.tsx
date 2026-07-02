"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Loader2 } from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { email, name, password, remember } : { email, password, remember }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-ash-900 bg-bg-card p-8 shadow-glow">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Flame className="h-10 w-10 text-ember-400" />
        <h1 className="font-display text-2xl font-bold text-ash-100">Bonfire</h1>
        <p className="text-sm text-ash-500">Answer questions. Earn logs. Build the biggest bonfire.</p>
      </div>

      <div className="mb-6 flex rounded-xl bg-bg-panel p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
              mode === m ? "bg-ember-500 text-white" : "text-ash-400 hover:text-ash-200"
            }`}
          >
            {m === "login" ? "Log In" : "Sign Up"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-ash-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100 outline-none focus:border-ember-500"
              placeholder="Jamie Rivera"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Work Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100 outline-none focus:border-ember-500"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100 outline-none focus:border-ember-500"
            placeholder="At least 8 characters"
          />
        </div>

        <label className="flex select-none items-center gap-2 text-sm text-ash-400">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded accent-ember-500"
          />
          Remember me
        </label>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-ember-500 to-ember-600 py-2.5 font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Log In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
