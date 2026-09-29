"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmailStats } from "../types";

interface QueueMonitorProps {
  stats: EmailStats;
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

function QueueBar({
  label,
  value,
  total,
  description,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  description: string;
  tone: "blue" | "amber" | "cyan" | "orange";
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (value / total) * 100,
          ),
        )
      : 0;

  const toneClasses = {
    blue: {
      bar: "bg-blue-500",
      value: "text-blue-700",
      dot: "bg-blue-500",
    },
    amber: {
      bar: "bg-amber-500",
      value: "text-amber-700",
      dot: "bg-amber-500",
    },
    cyan: {
      bar: "bg-cyan-500",
      value: "text-cyan-700",
      dot: "bg-cyan-500",
    },
    orange: {
      bar: "bg-orange-500",
      value: "text-orange-700",
      dot: "bg-orange-500",
    },
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${toneClasses.dot}`}
            />

            <p className="text-sm font-bold text-slate-800">
              {label}
            </p>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>

        <span
          className={`text-xl font-bold ${toneClasses.value}`}
        >
          {value}
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${toneClasses.bar}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[10px] text-slate-400">
          Queue share
        </span>

        <span className="text-[10px] font-semibold text-slate-500">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export default function QueueMonitor({
  stats,
  loading = false,
  onRefresh,
}: QueueMonitorProps) {
  const [refreshing, setRefreshing] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const activeTotal = useMemo(
    () => Math.max(stats.active, 1),
    [stats.active],
  );

  const processingTotal = useMemo(
    () =>
      Math.max(
        stats.active +
          stats.retryPending,
        1,
      ),
    [
      stats.active,
      stats.retryPending,
    ],
  );

  useEffect(() => {
    setLastUpdated(new Date());
  }, [stats]);

  async function handleRefresh() {
    if (!onRefresh || refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      await onRefresh();
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />

            <div className="mt-2 h-7 w-48 animate-pulse rounded bg-slate-100" />

            <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
          </div>

          <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-slate-100"
              />
            ),
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-slate-100"
              />
            ),
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
              BullMQ + Redis
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Queue Monitor
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Live email dispatch state from the persistent queue and database.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void handleRefresh()
          }
          disabled={
            refreshing ||
            !onRefresh
          }
          className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* Primary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QueueMetric
          label="Active"
          value={stats.active}
          description="Moving through dispatch"
          tone="blue"
        />

        <QueueMetric
          label="Processing"
          value={
            stats.processing +
            stats.sending
          }
          description="Worker + SMTP stages"
          tone="amber"
        />

        <QueueMetric
          label="Sent"
          value={stats.sent}
          description="Successfully dispatched"
          tone="emerald"
        />

        <QueueMetric
          label="Failed"
          value={stats.failed}
          description="Requiring attention"
          tone="red"
        />
      </div>

      {/* Queue stages */}
      <div>
        <div className="mb-4">
          <h3 className="font-bold text-slate-900">
            Queue stages
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Distribution of emails across the active dispatch pipeline.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <QueueBar
            label="Queued"
            value={stats.queued}
            total={activeTotal}
            description="Waiting for a worker to claim the job."
            tone="blue"
          />

          <QueueBar
            label="Processing"
            value={stats.processing}
            total={activeTotal}
            description="Worker has claimed the email."
            tone="amber"
          />

          <QueueBar
            label="Sending"
            value={stats.sending}
            total={activeTotal}
            description="Email is being handed to SMTP."
            tone="cyan"
          />

          <QueueBar
            label="Retry pending"
            value={stats.retryPending}
            total={processingTotal}
            description="Waiting for another delivery attempt."
            tone="orange"
          />
        </div>
      </div>

      {/* Operations panel */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              ⚙
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Worker configuration
              </h3>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Queue execution is handled by the dedicated BullMQ worker.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
          <ConfigCard
            label="Concurrency"
            value="Server configured"
            description="Worker parallelism"
          />

          <ConfigCard
            label="Queue"
            value="email-dispatch"
            description="BullMQ queue"
          />

          <ConfigCard
            label="Persistence"
            value="Redis + DB"
            description="Durable queue + source of truth"
            valueClass="text-emerald-600"
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Queue status
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {lastUpdated
                ? `Last updated ${lastUpdated.toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    },
                  )}`
                : "Waiting for statistics"}
            </p>
          </div>

          <a
            href={`${API_URL}/admin/queues`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open BullMQ Dashboard

            <span
              aria-hidden="true"
              className="text-sm"
            >
              ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

function QueueMetric({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  tone:
    | "blue"
    | "amber"
    | "emerald"
    | "red";
}) {
  const styles = {
    blue: {
      wrapper:
        "border-blue-200 bg-blue-50",
      label: "text-blue-600",
      value: "text-blue-900",
      description:
        "text-blue-700",
      dot: "bg-blue-500",
    },
    amber: {
      wrapper:
        "border-amber-200 bg-amber-50",
      label: "text-amber-600",
      value: "text-amber-900",
      description:
        "text-amber-700",
      dot: "bg-amber-500",
    },
    emerald: {
      wrapper:
        "border-emerald-200 bg-emerald-50",
      label:
        "text-emerald-600",
      value:
        "text-emerald-900",
      description:
        "text-emerald-700",
      dot: "bg-emerald-500",
    },
    red: {
      wrapper:
        "border-red-200 bg-red-50",
      label: "text-red-600",
      value: "text-red-900",
      description:
        "text-red-700",
      dot: "bg-red-500",
    },
  }[tone];

  return (
    <div
      className={`rounded-2xl border p-5 ${styles.wrapper}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${styles.dot}`}
        />

        <p
          className={`text-[10px] font-bold uppercase tracking-wider ${styles.label}`}
        >
          {label}
        </p>
      </div>

      <p
        className={`mt-2 text-3xl font-bold ${styles.value}`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-xs ${styles.description}`}
      >
        {description}
      </p>
    </div>
  );
}

function ConfigCard({
  label,
  value,
  description,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  description: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white p-5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-bold ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>
    </div>
  );
}