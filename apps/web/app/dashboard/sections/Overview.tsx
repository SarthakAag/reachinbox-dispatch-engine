"use client";

import type {
  DashboardView,
  EmailRecord,
  EmailStats,
  Sender,
} from "../types";

import MetricCard from "../components/MetricCard";
import HealthCard from "../components/HealthCard";

interface OverviewProps {
  stats: EmailStats;
  emails: EmailRecord[];
  senders: Sender[];
  loading?: boolean;
  onCreateCampaign: () => void;
  onNavigate: (view: DashboardView) => void;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusStyles(status: string) {
  switch (status) {
    case "SENT":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "QUEUED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PROCESSING":
    case "SENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    case "RETRY_PENDING":
      return "border-orange-200 bg-orange-50 text-orange-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default function Overview({
  stats,
  emails,
  senders,
  loading = false,
  onCreateCampaign,
  onNavigate,
}: OverviewProps) {
  const recentEmails = [...emails]
    .sort(
      (a, b) =>
        new Date(
          b.createdAt,
        ).getTime() -
        new Date(
          a.createdAt,
        ).getTime(),
    )
    .slice(0, 6);

  if (loading) {
    return (
      <section className="space-y-6">
        <div>
          <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>

        <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Intro */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              Dispatch control center
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Overview
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor campaigns, queue health, and
            email delivery from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateCampaign}
          className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.99] sm:w-fit"
        >
          + Create Campaign
        </button>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          label="Scheduled"
          value={stats.scheduled}
          detail="Waiting for dispatch"
          icon="◷"
          tone="blue"
        />

        <MetricCard
          label="Active"
          value={stats.active}
          detail="Currently in queue"
          icon="⚡"
          tone="amber"
        />

        <MetricCard
          label="Sent"
          value={stats.sent}
          detail="Successfully dispatched"
          icon="✓"
          tone="green"
        />

        <MetricCard
          label="Failed"
          value={stats.failed}
          detail="Need attention"
          icon="!"
          tone="red"
        />
      </div>

      {/* Infrastructure */}
      <HealthCard stats={stats} />

      {/* Activity + resources */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent dispatches */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">
                Recent dispatches
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Latest email activity
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate("sent")
              }
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              View all →
            </button>
          </div>

          {recentEmails.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-400">
                ✉
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-600">
                No email activity yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Create a campaign to start
                dispatching.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center gap-3 px-4 py-4 transition hover:bg-slate-50 sm:px-6"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {email.recipient
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {email.recipient}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {email.subject}
                    </p>
                  </div>

                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-[11px] text-slate-400">
                      {formatTime(
                        email.sentAt ??
                          email.updatedAt,
                      )}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${statusStyles(
                      email.status,
                    )}`}
                  >
                    {email.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispatch resources */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Infrastructure
            </p>

            <h2 className="mt-1.5 font-bold text-slate-900">
              Dispatch resources
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Your current sending setup
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <ResourceButton
              title="Sender Pool"
              description="Configured sending identities"
              value={senders.length}
              onClick={() =>
                onNavigate("senders")
              }
              tone="green"
            />

            <ResourceButton
              title="Active Queue"
              description="Jobs moving through workers"
              value={stats.active}
              onClick={() =>
                onNavigate("queue")
              }
              tone="blue"
            />

            <ResourceButton
              title="Dispatch Timeline"
              description="View scheduled sending windows"
              value="→"
              onClick={() =>
                onNavigate("timeline")
              }
              tone="violet"
            />

            <ResourceButton
              title="Slack Integration"
              description={
                "Dispatch-limit notifications"
              }
              value={
                slackStatus(
                  false,
                )
              }
              onClick={() =>
                onNavigate("slack")
              }
              tone="purple"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ResourceButton({
  title,
  description,
  value,
  onClick,
  tone,
}: {
  title: string;
  description: string;
  value: number | string;
  onClick: () => void;
  tone:
    | "green"
    | "blue"
    | "violet"
    | "purple";
}) {
  const styles = {
    green:
      "hover:border-emerald-200 hover:bg-emerald-50",
    blue:
      "hover:border-blue-200 hover:bg-blue-50",
    violet:
      "hover:border-violet-200 hover:bg-violet-50",
    purple:
      "hover:border-purple-200 hover:bg-purple-50",
  };

  const valueStyles = {
    green: "text-emerald-600",
    blue: "text-blue-600",
    violet: "text-violet-600",
    purple: "text-purple-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-left transition ${styles[tone]}`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 truncate text-xs text-slate-400">
          {description}
        </p>
      </div>

      <span
        className={`shrink-0 text-lg font-bold ${valueStyles[tone]}`}
      >
        {value}
      </span>
    </button>
  );
}

function slackStatus(
  connected: boolean,
) {
  return connected
    ? "●"
    : "→";
}