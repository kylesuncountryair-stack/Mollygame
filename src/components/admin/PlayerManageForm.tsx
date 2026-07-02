"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

export default function PlayerManageForm({
  playerId,
  initialName,
  role,
}: {
  playerId: string;
  initialName: string;
  role: "PLAYER" | "ADMIN";
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingRole, setTogglingRole] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setSuccess("Name updated.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleRole() {
    setError("");
    setSuccess("");
    setTogglingRole(true);
    try {
      const nextRole = role === "ADMIN" ? "PLAYER" : "ADMIN";
      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.refresh();
    } finally {
      setTogglingRole(false);
    }
  }

  async function deletePlayer() {
    if (!confirm(`Permanently delete ${initialName}? This removes their answers and log history.`)) return;
    setError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/players/${playerId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.push("/admin/players");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-ash-100">Manage Player</h3>

      <form onSubmit={saveName} className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ash-400">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
          />
        </div>
        <button
          type="submit"
          disabled={saving || name.trim() === initialName}
          className="flex items-center gap-1.5 rounded-lg border border-ash-700 px-4 py-2 text-sm font-medium text-ash-200 hover:border-ember-500 hover:text-ember-200 disabled:opacity-40"
        >
          <Save className="h-4 w-4" /> Save
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-400">{success}</p>}

      <div className="mt-5 flex flex-wrap gap-3 border-t border-ash-900 pt-5">
        <button
          onClick={toggleRole}
          disabled={togglingRole}
          className="flex items-center gap-1.5 rounded-lg border border-ash-700 px-4 py-2 text-sm font-medium text-ash-200 hover:border-ember-500 hover:text-ember-200 disabled:opacity-50"
        >
          {role === "ADMIN" ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {role === "ADMIN" ? "Demote to Player" : "Promote to Admin"}
        </button>
        <button
          onClick={deletePlayer}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-lg border border-rose-900 px-4 py-2 text-sm font-medium text-rose-300 hover:border-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" /> Delete Player
        </button>
      </div>
    </div>
  );
}
