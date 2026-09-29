"use client";

import type { EmailRecord } from "../types";

interface SentProps {
  emails: EmailRecord[];
  loading?: boolean;
}

function formatSentDate(value: string | null) {
  if (!value) {
    return {
      date: "—",
      time: "",
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "Unknown",
      time: "",
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

function formatRelativeTime(value: string | null) {
  if (!value) {
    return "";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const difference = Date.now() - timestamp;
  const minutes = Math.floor(
    difference / 60000,
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return "";
}

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="animate-pulse space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>

          <div className="h-6 w-16 rounded-full bg-slate-100" />
        </div>

        <div className="h-10 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function Sent({
  emails,
  loading = false,
}: SentProps) {
  const sent = emails
    .filter(
      (email) => email.status === "SENT",
    )
    .sort(
      (a, b) =>
        new Date(
          b.sentAt ?? b.updatedAt,
        ).getTime() -
        new Date(
          a.sentAt ?? a.updatedAt,
        ).getTime(),
    );

  const uniqueRecipients = new Set(
    sent.map((email) => email.recipient),
  ).size;

  const totalAttempts = sent.reduce(
    (total, email) =>
      total + Math.max(email.attemptCount, 1),
    0,
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                Delivery
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sent Emails
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Successfully dispatched emails and
              their delivery metadata.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl font-bold text-emerald-600">
            ✓
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonRow key={item} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && sent.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center shadow-sm sm:px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-bold text-emerald-600">
            ✓
          </div>

          <h3 className="mt-5 text-base font-bold text-slate-900">
            No sent emails yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Successfully dispatched emails will
            appear here with their delivery
            metadata.
          </p>
        </div>
      )}

      {/* Content */}
      {!loading && sent.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              label="Delivered"
              value={sent.length}
            />

            <StatCard
              label="Recipients"
              value={uniqueRecipients}
            />

            <div className="col-span-2 sm:col-span-1">
              <StatCard
                label="Total attempts"
                value={totalAttempts}
              />
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_170px_150px] border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Recipient
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Subject
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Sent
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Delivery
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {sent.map((email) => {
                const sentTime =
                  formatSentDate(email.sentAt);

                const relative =
                  formatRelativeTime(
                    email.sentAt,
                  );

                return (
                  <div
                    key={email.id}
                    className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_170px_150px] items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
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
                        {sentTime.date}
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {sentTime.time}
                        {relative &&
                          ` · ${relative}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />

                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        SENT
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {sent.map((email) => {
              const sentTime =
                formatSentDate(email.sentAt);

              const relative =
                formatRelativeTime(
                  email.sentAt,
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

                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      SENT
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Sent date
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {sentTime.date}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        Sent time
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {sentTime.time}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[9px] text-slate-500">
                      Attempt #{email.attemptCount}
                    </span>

                    {email.messageId && (
                      <span className="max-w-full truncate rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[9px] text-slate-500">
                        {email.messageId}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 truncate text-[10px] text-slate-400">
                    Campaign ID: {email.campaignId}
                  </p>

                  {relative && (
                    <p className="mt-1 text-[10px] font-medium text-emerald-600">
                      Delivered {relative}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}