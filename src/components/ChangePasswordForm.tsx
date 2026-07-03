"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ash-100">
        <KeyRound className="h-5 w-5 text-ember-400" /> Change Password
      </h2>
      <form onSubmit={submit} className="max-w-sm space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100 outline-none focus:border-ember-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100 outline-none focus:border-ember-500"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100 outline-none focus:border-ember-500"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-ember-500 hover:bg-ember-600 px-5 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {loading ? "Saving..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
