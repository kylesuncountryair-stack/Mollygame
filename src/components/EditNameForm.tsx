"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X } from "lucide-react";

export default function EditNameForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setName(initialName);
          setEditing(true);
        }}
        className="flex items-center gap-1 text-xs font-medium text-ash-500 hover:text-ember-300"
      >
        <Pencil className="h-3 w-3" /> Edit name
      </button>
    );
  }

  return (
    <form onSubmit={save} className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="rounded-lg border border-ash-800 bg-bg-panel px-2 py-1 text-sm text-ash-100 outline-none focus:border-ember-500"
      />
      <button
        type="submit"
        disabled={saving}
        aria-label="Save name"
        className="rounded-lg border border-ash-700 p-1.5 text-ash-200 hover:border-ember-500 hover:text-ember-200 disabled:opacity-50"
      >
        <Save className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label="Cancel"
        className="rounded-lg border border-ash-700 p-1.5 text-ash-200 hover:border-rose-500 hover:text-rose-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </form>
  );
}
