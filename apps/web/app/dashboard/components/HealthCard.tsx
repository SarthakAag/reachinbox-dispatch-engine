import type { EmailStats } from "../types";

interface HealthCardProps {
  stats: EmailStats;
}

export default function HealthCard({
  stats,
}: HealthCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Infrastructure
          </p>

          <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900">
            Queue Health
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Core dispatch services and worker status.
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Operational
        </span>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <HealthRow
          label="Redis"
          status="Connected"
        />

        <HealthRow
          label="PostgreSQL"
          status="Connected"
        />

        <HealthRow
          label="Elasticsearch"
          status="Connected"
        />

        <HealthRow
          label="Worker"
          status="Running"
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
        <MiniStat
          label="Active jobs"
          value={stats.active}
        />

        <MiniStat
          label="Retry pending"
          value={stats.retryPending}
        />
      </div>
    </div>
  );
}

function HealthRow({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

      <span className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}