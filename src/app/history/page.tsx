import { getCurrentSession } from "@/lib/session";
import { getMonthlyHistory } from "@/lib/history";
import SectionHeader from "@/components/SectionHeader";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import { Flame, History, Medal } from "lucide-react";

const medalColor: Record<number, string> = {
  1: "text-gold-400",
  2: "text-navy-100",
  3: "text-ember-600",
};

export default async function HistoryPage() {
  const session = await getCurrentSession();
  const months = await getMonthlyHistory();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ash-100">Past Bonfires</h1>
        <p className="text-ash-500">Final standings from completed months.</p>
      </div>

      {months.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-10 text-center text-ash-500">
          <History className="h-6 w-6 text-ash-600" />
          <p>No completed Bonfires yet — this month&apos;s standings will land here once it wraps up.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {months.map((m) => (
            <div key={m.label} className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
              <SectionHeader
                icon={History}
                tone="gold"
                title={m.label}
                subtitle={`${m.participantCount} players · ${m.totalLogsIssued} logs issued`}
                className="mb-4"
              />
              <div className="space-y-1.5">
                {m.standings.map((s, i) => {
                  const rank = i + 1;
                  const isSelf = s.id === session?.sub;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all ${
                        isSelf
                          ? "scale-[1.02] border-navy-300 bg-gradient-to-r from-navy-300/20 to-navy-300/5 shadow-[0_4px_14px_rgba(74,158,255,0.15)]"
                          : "border-transparent hover:bg-bg-panel"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex w-6 items-center gap-1 font-semibold ${medalColor[rank] ?? "text-ash-500"}`}>
                          {rank <= 3 ? <Medal className="h-3.5 w-3.5" /> : null}
                          {rank}
                        </span>
                        <Avatar id={s.id} name={s.name} avatarColor={s.avatarColor} avatarIcon={s.avatarIcon} />
                        <span className={isSelf ? "font-semibold text-white" : "text-ash-100"}>
                          {s.name}
                          {isSelf && <span className="font-normal text-ash-300"> (you)</span>}
                        </span>
                        <Badge tone="gold">{s.tier}</Badge>
                      </div>
                      <span className="flex items-center gap-1 font-semibold text-ember-400">
                        <Flame className="h-3.5 w-3.5" />
                        {s.logs}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
