"use client";

import {
  useState,
} from "react";

import type {
  EmailRecord,
  EmailSearchResponse,
} from "../types";

interface SearchProps {
  apiUrl: string;
}

type StatusFilter =
  | ""
  | "SCHEDULED"
  | "QUEUED"
  | "PROCESSING"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "RETRY_PENDING";

const statusOptions: {
  value: StatusFilter;
  label: string;
}[] = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "SCHEDULED",
    label: "Scheduled",
  },
  {
    value: "QUEUED",
    label: "Queued",
  },
  {
    value: "PROCESSING",
    label: "Processing",
  },
  {
    value: "SENDING",
    label: "Sending",
  },
  {
    value: "SENT",
    label: "Sent",
  },
  {
    value: "FAILED",
    label: "Failed",
  },
  {
    value: "RETRY_PENDING",
    label: "Retry pending",
  },
];

export default function Search({
  apiUrl,
}: SearchProps) {
  const [query, setQuery] =
    useState("");

  const [status, setStatus] =
    useState<StatusFilter>("");

  const [results, setResults] =
    useState<EmailRecord[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [searched, setSearched] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });

  async function performSearch(
    requestedPage = page,
  ) {
    try {
      setLoading(true);
      setError(null);
      setSearched(true);

      const params =
        new URLSearchParams();

      params.set(
        "page",
        String(requestedPage),
      );

      params.set(
        "limit",
        "20",
      );

      if (query.trim()) {
        params.set(
          "q",
          query.trim(),
        );
      }

      if (status) {
        params.set(
          "status",
          status,
        );
      }

      const response =
        await fetch(
          `${apiUrl}/api/emails/search?${params.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

      if (!response.ok) {
        throw new Error(
          "Unable to search emails.",
        );
      }

      const data =
        (await response.json()) as EmailSearchResponse;

      setResults(
        data.data ?? [],
      );

      setPagination(
        data.pagination ?? {
          page: requestedPage,
          limit: 20,
          total: 0,
          totalPages: 1,
        },
      );

      setPage(requestedPage);
    } catch (searchError) {
      console.error(
        "[search] Failed:",
        searchError,
      );

      setResults([]);

      setError(
        searchError instanceof Error
          ? searchError.message
          : "Unable to search emails.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    void performSearch(1);
  }

  function clearSearch() {
    setQuery("");
    setStatus("");
    setResults([]);
    setError(null);
    setSearched(false);
    setPage(1);

    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });
  }

  function changeStatus(
    value: StatusFilter,
  ) {
    setStatus(value);

    if (searched) {
      window.setTimeout(() => {
        void performSearch(1);
      }, 0);
    }
  }

  function goToPage(
    nextPage: number,
  ) {
    if (
      nextPage < 1 ||
      nextPage >
        pagination.totalPages ||
      loading
    ) {
      return;
    }

    void performSearch(
      nextPage,
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-500" />

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
                Elasticsearch
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Search Email Activity
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Search indexed email content,
              recipients, subjects, and delivery
              status.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600">
            ⌕
          </div>
        </div>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search input */}
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search recipient, subject, message..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(event) =>
              changeStatus(
                event.target
                  .value as StatusFilter,
              )
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
          >
            {statusOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          {/* Search */}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>

          {/* Clear */}
          {(query ||
            status ||
            searched) && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search hints */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Hint text="recipient" />
          <Hint text="subject" />
          <Hint text="message body" />
          <Hint text="status" />
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
              !
            </span>

            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Results header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="font-bold text-slate-900">
              Search Results
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              {searched
                ? `${pagination.total} result${
                    pagination.total ===
                    1
                      ? ""
                      : "s"
                  } found`
                : "Run a search to explore indexed emails."}
            </p>
          </div>

          {searched &&
            pagination.total > 0 && (
              <div className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </div>
            )}
        </div>

        {/* Loading */}
        {loading ? (
          <SearchSkeleton />
        ) : !searched ? (
          <SearchIntro />
        ) : results.length === 0 ? (
          <EmptySearch />
        ) : (
          <>
            <ResultsTable
              results={results}
            />

            <Pagination
              page={pagination.page}
              totalPages={
                pagination.totalPages
              }
              onPageChange={
                goToPage
              }
            />
          </>
        )}
      </div>
    </section>
  );
}

function ResultsTable({
  results,
}: {
  results: EmailRecord[];
}) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-[0.15em] text-slate-400">
              <th className="px-6 py-4">
                Recipient
              </th>

              <th className="px-6 py-4">
                Subject
              </th>

              <th className="px-6 py-4">
                Status
              </th>

              <th className="px-6 py-4">
                Scheduled
              </th>

              <th className="px-6 py-4">
                Sent
              </th>
            </tr>
          </thead>

          <tbody>
            {results.map(
              (email) => (
                <tr
                  key={email.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="max-w-[240px] px-6 py-4">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {email.recipient}
                    </p>

                    <p className="mt-1 truncate font-mono text-[9px] text-slate-400">
                      {email.id}
                    </p>
                  </td>

                  <td className="max-w-[260px] px-6 py-4">
                    <p className="truncate text-sm text-slate-500">
                      {email.subject}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge
                      status={
                        email.status
                      }
                    />
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                    {formatDate(
                      email.scheduledAt,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                    {email.sentAt
                      ? formatDate(
                          email.sentAt,
                        )
                      : "—"}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-4 md:hidden">
        {results.map(
          (email) => (
            <article
              key={email.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {email.recipient}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {email.subject}
                  </p>
                </div>

                <StatusBadge
                  status={
                    email.status
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MobileDetail
                  label="Scheduled"
                  value={formatDate(
                    email.scheduledAt,
                  )}
                />

                <MobileDetail
                  label="Sent"
                  value={
                    email.sentAt
                      ? formatDate(
                          email.sentAt,
                        )
                      : "—"
                  }
                />
              </div>

              <p className="mt-3 truncate font-mono text-[9px] text-slate-400">
                {email.id}
              </p>
            </article>
          ),
        )}
      </div>
    </>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (
    page: number,
  ) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages =
    createPageNumbers(
      page,
      totalPages,
    );

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() =>
          onPageChange(
            page - 1,
          )
        }
        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        ← Previous
      </button>

      <div className="flex items-center justify-center gap-1 overflow-x-auto">
        {pages.map(
          (
            pageNumber,
            index,
          ) =>
            pageNumber ===
            "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-xs text-slate-400"
              >
                ...
              </span>
            ) : (
              <button
                key={pageNumber}
                type="button"
                onClick={() =>
                  onPageChange(
                    pageNumber,
                  )
                }
                className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition ${
                  pageNumber === page
                    ? "bg-emerald-500 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {pageNumber}
              </button>
            ),
        )}
      </div>

      <button
        type="button"
        disabled={
          page >= totalPages
        }
        onClick={() =>
          onPageChange(
            page + 1,
          )
        }
        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
}

function SearchIntro() {
  return (
    <div className="flex min-h-72 items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
          ⌕
        </div>

        <h3 className="mt-5 font-bold text-slate-900">
          Search your email activity
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Search recipients, subjects,
          message content, and delivery
          status from your Elasticsearch
          index.
        </p>
      </div>
    </div>
  );
}

function EmptySearch() {
  return (
    <div className="flex min-h-72 items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
          ⌕
        </div>

        <h3 className="mt-4 font-semibold text-slate-800">
          No matching emails
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Try another keyword or status
          filter.
        </p>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-3 p-4 sm:p-6">
      {[1, 2, 3, 4].map(
        (item) => (
          <div
            key={item}
            className="animate-pulse rounded-xl border border-slate-100 p-5"
          >
            <div className="h-4 w-48 rounded bg-slate-100" />

            <div className="mt-3 h-3 w-72 max-w-full rounded bg-slate-100" />

            <div className="mt-4 h-3 w-32 rounded bg-slate-100" />
          </div>
        ),
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  const styles: Record<
    string,
    string
  > = {
    SENT:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    SCHEDULED:
      "border-slate-200 bg-slate-50 text-slate-600",
    QUEUED:
      "border-blue-200 bg-blue-50 text-blue-700",
    PROCESSING:
      "border-violet-200 bg-violet-50 text-violet-700",
    SENDING:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
    FAILED:
      "border-red-200 bg-red-50 text-red-700",
    RETRY_PENDING:
      "border-orange-200 bg-orange-50 text-orange-700",
  };

  return (
    <span
      className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${
        styles[normalized] ??
        "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {status}
    </span>
  );
}

function Hint({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-400">
      {text}
    </span>
  );
}

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[11px] text-slate-600">
        {value}
      </p>
    </div>
  );
}

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createPageNumbers(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from(
      { length: total },
      (_, index) =>
        index + 1,
    );
  }

  const pages: (
    | number
    | "..."
  )[] = [1];

  if (current > 4) {
    pages.push("...");
  }

  const start = Math.max(
    2,
    current - 1,
  );

  const end = Math.min(
    total - 1,
    current + 1,
  );

  for (
    let index = start;
    index <= end;
    index += 1
  ) {
    pages.push(index);
  }

  if (current < total - 3) {
    pages.push("...");
  }

  pages.push(total);

  return pages;
}