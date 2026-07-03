"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Search, Users } from "lucide-react";
import Avatar from "@/components/Avatar";

export type AdminPlayerRow = {
  id: string;
  name: string;
  email: string;
  answered: number;
  correct: number;
  wrong: number;
  tier: string;
  monthlyLogs: number;
  allTimeLogs: number;
};

type SortKey = "name" | "answered" | "correct" | "wrong" | "monthlyLogs" | "allTimeLogs";

export default function AdminPlayersTable({ rows }: { rows: AdminPlayerRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("monthlyLogs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)) : rows;
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" || typeof bv === "string") {
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [rows, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  function SortHeader({ label, sortableKey, right }: { label: string; sortableKey: SortKey; right?: boolean }) {
    const active = sortKey === sortableKey;
    return (
      <th className={`px-5 py-3 font-medium ${right ? "text-right" : ""}`}>
        <button
          onClick={() => toggleSort(sortableKey)}
          className={`inline-flex items-center gap-1 hover:text-ember-300 ${active ? "text-ember-300" : ""}`}
        >
          {label}
          {active && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        </button>
      </th>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-8 text-center text-ash-500">
        <Users className="h-6 w-6 text-ash-600" />
        <p>No players yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-lg border border-ash-800 bg-bg-panel py-2 pl-9 pr-3 text-sm text-ash-100 outline-none focus:border-ember-500"
        />
      </div>

      {filteredRows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-8 text-center text-ash-500">
          <Search className="h-6 w-6 text-ash-600" />
          <p>No players match &quot;{search}&quot;.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ash-900 bg-bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-panel text-ash-500">
              <tr>
                <SortHeader label="Name" sortableKey="name" />
                <th className="px-5 py-3 font-medium">Email</th>
                <SortHeader label="Answered" sortableKey="answered" right />
                <SortHeader label="Correct" sortableKey="correct" right />
                <SortHeader label="Wrong" sortableKey="wrong" right />
                <th className="px-5 py-3 font-medium">Tier</th>
                <SortHeader label="Logs (month)" sortableKey="monthlyLogs" right />
                <SortHeader label="Logs (all-time)" sortableKey="allTimeLogs" right />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id} className="border-t border-ash-900 hover:bg-ash-900/40">
                  <td className="px-5 py-3">
                    <Link href={`/admin/players/${r.id}`} className="flex items-center gap-2.5 font-medium text-ember-300 hover:underline">
                      <Avatar id={r.id} name={r.name} />
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ash-500">{r.email}</td>
                  <td className="px-5 py-3 text-right text-ash-100">{r.answered}</td>
                  <td className="px-5 py-3 text-right text-emerald-400">{r.correct}</td>
                  <td className="px-5 py-3 text-right text-rose-400">{r.wrong}</td>
                  <td className="px-5 py-3 text-ash-300">{r.tier}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ash-100">{r.monthlyLogs}</td>
                  <td className="px-5 py-3 text-right text-ash-500">{r.allTimeLogs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
