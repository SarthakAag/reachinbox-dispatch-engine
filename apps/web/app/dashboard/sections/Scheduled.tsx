"use client";

import type { EmailRecord } from "../types";

interface ScheduledProps {
  emails: EmailRecord[];
  loading?: boolean;
}

function statusStyles(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "border-slate-200 bg-slate-50 text-slate-600";

    case "QUEUED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PROCESSING":
    case "SENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "RETRY_PENDING":
      return "border-orange-200 bg-orange-50 text-orange-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "Unknown",
      time: "--",
    };
  }

  return {
    date: date.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function getStatusLabel(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";

    case "QUEUED":
      return "Queued";

    case "PROCESSING":
      return "Processing";

    case "SENDING":
      return "Sending";

    case "RETRY_PENDING":
      return "Retry pending";

    default:
      return status;
  }
}

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="animate-pulse space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>

          <div className="h-6 w-20 rounded-full bg-slate-100" />
        </div>

        <div className="h-10 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function Scheduled({
  emails,
  loading = false,
}: ScheduledProps) {
  const scheduled = emails
    .filter(
      (email) =>
        email.status === "SCHEDULED" ||
        email.status === "QUEUED" ||
        email.status === "PROCESSING" ||
        email.status === "SENDING" ||
        email.status === "RETRY_PENDING",
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() -
        new Date(b.scheduledAt).getTime(),
    );

  const queuedCount = scheduled.filter(
    (email) =>
      email.status === "QUEUED" ||
      email.status === "SCHEDULED",
  ).length;

  const activeCount = scheduled.filter(
    (email) =>
      email.status === "PROCESSING" ||
      email.status === "SENDING",
  ).length;

  const retryCount = scheduled.filter(
    (email) =>
      email.status === "RETRY_PENDING",
  ).length;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                Delivery queue
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Scheduled
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Emails waiting to move through the
              dispatch engine.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
            ◷
          </div>
        </div>
      </div>

      {/* Summary */}
      {!loading && scheduled.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Waiting"
            value={queuedCount}
            tone="blue"
          />

          <SummaryCard
            label="Processing"
            value={activeCount}
            tone="amber"
          />

          <SummaryCard
            label="Retry pending"
            value={retryCount}
            tone="orange"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonRow key={item} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && scheduled.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center shadow-sm sm:px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
            ◷
          </div>

          <h3 className="mt-5 text-base font-bold text-slate-900">
            Nothing scheduled
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Upcoming emails will appear here once
            a campaign is scheduled.
          </p>
        </div>
      )}

      {/* Desktop table */}
      {!loading && scheduled.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_180px_130px] border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Recipient
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Subject
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Dispatch time
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Status
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {scheduled.map((email) => {
                const timing = formatDate(
                  email.scheduledAt,
                );

                return (
                  <div
                    key={email.id}
                    className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_180px_130px] items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {email.recipient}
                      </p>

                      <p className="mt-1 truncate text-[11px] text-slate-400">
                        Campaign {email.campaignId}
                      </p>
                    </div>

                    <p className="truncate text-sm text-slate-500">
                      {email.subject}
                    </p>

                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        {timing.date}
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {timing.time}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles(
                        email.status,
                      )}`}
                    >
                      {getStatusLabel(
                        email.status,
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {scheduled.map((email) => {
              const timing = formatDate(
                email.scheduledAt,
              );

              return (
                <article
                  key={email.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {email.recipient}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {email.subject}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${statusStyles(
                        email.status,
                      )}`}
                    >
                      {getStatusLabel(
                        email.status,
                      )}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Dispatch date
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {timing.date}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Dispatch time
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {timing.time}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 truncate text-[10px] text-slate-400">
                    Campaign ID: {email.campaignId}
                  </p>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "orange";
}) {
  const styles = {
    blue: {
      wrapper:
        "border-blue-100 bg-blue-50/50",
      value: "text-blue-700",
    },
    amber: {
      wrapper:
        "border-amber-100 bg-amber-50/50",
      value: "text-amber-700",
    },
    orange: {
      wrapper:
        "border-orange-100 bg-orange-50/50",
      value: "text-orange-700",
    },
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${styles[tone].wrapper}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${styles[tone].value}`}
      >
        {value}
      </p>
    </div>
  );
}