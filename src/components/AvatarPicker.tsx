"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Palette } from "lucide-react";
import Avatar, { AVATAR_COLOR_PALETTE, AVATAR_ICON_OPTIONS } from "@/components/Avatar";

const COLOR_KEYS = Object.keys(AVATAR_COLOR_PALETTE);

export default function AvatarPicker({
  userId,
  name,
  initialColor,
  initialIcon,
}: {
  userId: string;
  name: string;
  initialColor?: string | null;
  initialIcon?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(initialColor ?? COLOR_KEYS[0]);
  const [icon, setIcon] = useState(initialIcon ?? "initials");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/account/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarColor: color, avatarIcon: icon }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Couldn't save your avatar.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-ash-400 hover:text-ember-300"
      >
        <Palette className="h-3.5 w-3.5" /> Customize avatar
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-ash-800 bg-bg-panel p-4">
      <div className="flex items-center gap-3">
        <Avatar id={userId} name={name} size="md" avatarColor={color} avatarIcon={icon} />
        <p className="text-xs text-ash-500">This is how you&apos;ll show up on the leaderboard and everywhere else.</p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ash-400">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_KEYS.map((key) => {
            const c = AVATAR_COLOR_PALETTE[key];
            const selected = color === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setColor(key)}
                title={c.label}
                aria-label={c.label}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform ${
                  selected ? "scale-110 border-white" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c.bg }}
              >
                {selected && <Check className="h-4 w-4" style={{ color: c.text }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ash-400">Style</p>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          <button
            type="button"
            onClick={() => setIcon("letter")}
            title="First letter"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold ${
              icon === "letter" ? "border-ember-500 bg-ember-500/10 text-ember-300" : "border-ash-800 text-ash-300 hover:border-ash-600"
            }`}
          >
            {name.trim()[0]?.toUpperCase() ?? "?"}
          </button>
          <button
            type="button"
            onClick={() => setIcon("initials")}
            title="Initials"
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[10px] font-semibold ${
              icon === "initials" ? "border-ember-500 bg-ember-500/10 text-ember-300" : "border-ash-800 text-ash-300 hover:border-ash-600"
            }`}
          >
            {name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("")}
          </button>
          {AVATAR_ICON_OPTIONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              title={label}
              aria-label={label}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                icon === key ? "border-ember-500 bg-ember-500/10 text-ember-300" : "border-ash-800 text-ash-300 hover:border-ash-600"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-ember-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-ember-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save avatar"}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={saving}
          className="rounded-lg border border-ash-700 px-4 py-1.5 text-xs font-medium text-ash-300 hover:border-ash-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
