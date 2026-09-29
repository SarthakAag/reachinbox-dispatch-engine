"use client";

import { useMemo } from "react";
import type { EmailRecord } from "../types";

interface DispatchTimelineProps {
  emails: EmailRecord[];
  loading?: boolean;
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status: string) {
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

    case "SCHEDULED":
      return "border-slate-200 bg-slate-50 text-slate-600";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function statusDotClass(status: string) {
  switch (status) {
    case "SENT":
      return "bg-emerald-500";

    case "QUEUED":
      return "bg-blue-500";

    case "PROCESSING":
    case "SENDING":
      return "bg-amber-500";

    case "FAILED":
      return "bg-red-500";

    case "RETRY_PENDING":
      return "bg-orange-500";

    default:
      return "bg-slate-400";
  }
}

export default function DispatchTimeline({
  emails,
  loading = false,
}: DispatchTimelineProps) {
  const timeline = useMemo(() => {
    return [...emails]
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime(),
      )
      .slice(0, 50);
  }, [emails]);

  const summary = useMemo(() => {
    return {
      total: timeline.length,
      sent: timeline.filter(
        (email) => email.status === "SENT",
      ).length,
      queued: timeline.filter(
        (email) =>
          email.status === "QUEUED" ||
          email.status === "SCHEDULED",
      ).length,
      retrying: timeline.filter(
        (email) =>
          email.status === "RETRY_PENDING",
      ).length,
      failed: timeline.filter(
        (email) => email.status === "FAILED",
      ).length,
    };
  }, [timeline]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />

            <div className="mt-2 h-6 w-48 animate-pulse rounded bg-slate-100" />

            <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
          </div>

          <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-50"
              />
            ),
          )}
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(
            (item) => (
              <div
                key={item}
                className="flex gap-4 rounded-xl border border-slate-100 p-4"
              >
                <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-slate-100" />

                <div className="min-w-0 flex-1">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />

                  <div className="mt-3 h-3 w-72 max-w-full animate-pulse rounded bg-slate-100" />

                  <div className="mt-3 h-3 w-32 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ),
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              Dispatch engine
            </p>
          </div>

          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Dispatch Timeline
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            A chronological view of scheduled and dispatched emails.
          </p>
        </div>

        <div className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Showing
          </p>

          <p className="mt-0.5 text-sm font-bold text-slate-700">
            {summary.total} events
          </p>
        </div>
      </div>

      {/* Summary */}
      {timeline.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Sent"
            value={summary.sent}
            valueClass="text-emerald-600"
          />

          <SummaryCard
            label="Queued"
            value={summary.queued}
            valueClass="text-blue-600"
          />

          <SummaryCard
            label="Retrying"
            value={summary.retrying}
            valueClass="text-orange-600"
          />

          <SummaryCard
            label="Failed"
            value={summary.failed}
            valueClass="text-red-600"
          />
        </div>
      )}

      {/* Empty */}
      {timeline.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-slate-400 shadow-sm">
            ◷
          </div>

          <h3 className="mt-5 font-semibold text-slate-900">
            No dispatch activity yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Scheduled emails will appear here as campaigns are created and
            dispatched.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute bottom-5 left-[15px] top-5 w-px bg-slate-200" />

            <div className="space-y-2">
              {timeline.map((email) => (
                <TimelineItem
                  key={email.id}
                  email={email}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TimelineItem({
  email,
}: {
  email: EmailRecord;
}) {
  return (
    <article className="group relative flex gap-3 rounded-2xl p-2 transition hover:bg-slate-50 sm:gap-4 sm:p-3">
      {/* Timeline marker */}
      <div className="relative z-10 mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-4 border-white bg-slate-100 shadow-sm">
        <span
          className={`h-2.5 w-2.5 rounded-full ${statusDotClass(
            email.status,
          )}`}
        />
      </div>

      {/* Event */}
      <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-white p-3 transition group-hover:border-slate-200 group-hover:shadow-sm sm:p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Main information */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="max-w-full truncate text-sm font-semibold text-slate-900">
                {email.recipient}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${statusClass(
                  email.status,
                )}`}
              >
                {email.status}
              </span>
            </div>

            <p className="mt-1.5 truncate text-sm text-slate-600">
              {email.subject}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
              <span>
                Sequence{" "}
                <strong className="font-semibold text-slate-600">
                  #{email.sequence + 1}
                </strong>
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

              <span>
                ID{" "}
                <strong className="font-mono font-medium text-slate-500">
                  {email.id.slice(0, 10)}
                </strong>
              </span>
            </div>
          </div>

          {/* Scheduled time */}
          <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 lg:min-w-[125px] lg:text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Scheduled
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              {formatTime(
                email.scheduledAt,
              )}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              {formatDate(
                email.scheduledAt,
              )}
            </p>
          </div>
        </div>

        {/* Delivery information */}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {email.sentAt ? (
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] text-emerald-700">
              Sent{" "}
              <strong className="font-semibold">
                {formatTime(email.sentAt)}
              </strong>
            </span>
          ) : (
            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-500">
              Awaiting dispatch
            </span>
          )}

          {email.attemptCount > 0 && (
            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-500">
              Attempt #{email.attemptCount}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}