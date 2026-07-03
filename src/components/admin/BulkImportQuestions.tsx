"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Upload, XCircle } from "lucide-react";

type ParsedRow = {
  type?: string;
  prompt?: string;
  options?: string[];
  correctIndex?: number;
  logsReward?: number;
  activeDate?: string;
};

type RowResult = { row: number; ok: boolean; error?: string; prompt?: string };

// Hand-rolled quote-aware CSV parser (handles quoted fields containing commas
// and "" as an escaped literal quote) — no external CSV library available in
// this environment.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += char;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function rowsToQuestions(raw: string[][]): ParsedRow[] {
  if (raw.length === 0) return [];
  const header = raw[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const typeIdx = idx("type");
  const activeDateIdx = idx("activedate");
  const promptIdx = idx("prompt");
  const optionsIdx = idx("options");
  const correctIdx = idx("correctindex");
  const logsIdx = idx("logsreward");

  return raw.slice(1).map((cols) => ({
    type: typeIdx >= 0 ? cols[typeIdx] : undefined,
    activeDate: activeDateIdx >= 0 ? cols[activeDateIdx] : undefined,
    prompt: promptIdx >= 0 ? cols[promptIdx] : undefined,
    options: optionsIdx >= 0 ? cols[optionsIdx]?.split(";").map((o) => o.trim()) : undefined,
    correctIndex: correctIdx >= 0 ? Number(cols[correctIdx]) : undefined,
    logsReward: logsIdx >= 0 ? Number(cols[logsIdx]) : undefined,
  }));
}

const TEMPLATE = `type,activeDate,prompt,options,correctIndex,logsReward
DAILY,2026-08-01,"What year did Sun Country Airlines begin flying?","1982;1983;1990;2000",1,2
WEEKLY,2026-08-03,"Which airport is Sun Country's home hub?","MSP;ORD;DFW;ATL",0,3
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bonfire-questions-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkImportQuestions() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{ created: number; failed: number; results: RowResult[] } | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setError("");
    setSummary(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || "");
      const raw = parseCSV(text);
      if (raw.length < 2) {
        setError("That file doesn't have any data rows below the header.");
        return;
      }
      const rows = rowsToQuestions(raw);
      setLoading(true);
      try {
        const res = await fetch("/api/admin/questions/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Import failed.");
          return;
        }
        setSummary(data);
        router.refresh();
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(file);
  }

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-ash-100">Bulk import from CSV</p>
          <p className="text-xs text-ash-500">
            Columns: type, activeDate, prompt, options (separate with <code>;</code>), correctIndex, logsReward.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 rounded-lg border border-ash-700 px-3 py-1.5 text-xs text-ash-200 hover:border-ember-500 hover:text-ember-200"
          >
            <Download className="h-3.5 w-3.5" /> Download template
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-ember-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ember-600 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" /> {loading ? "Importing..." : "Upload CSV"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {fileName && !loading && <p className="mt-3 text-xs text-ash-500">Last file: {fileName}</p>}
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {summary && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-ash-100">
            <span className="text-emerald-400">{summary.created} created</span>
            {summary.failed > 0 && <span className="text-rose-400"> &middot; {summary.failed} failed</span>}
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-ash-900">
            {summary.results.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 border-t border-ash-900 px-3 py-2 text-xs first:border-t-0 ${
                  r.ok ? "text-ash-300" : "bg-rose-500/5 text-rose-300"
                }`}
              >
                {r.ok ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                )}
                <span>
                  Row {r.row}
                  {r.prompt ? ` — ${r.prompt}` : ""}
                  {r.error ? `: ${r.error}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
