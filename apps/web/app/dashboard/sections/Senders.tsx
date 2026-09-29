import type { Sender } from "../types";

export default function Senders({
  senders,
}: {
  senders: Sender[];
}) {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                Sender infrastructure
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Sender Pool
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Sender identities available for campaigns and email dispatch.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
            ✉
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total senders"
          value={senders.length}
          valueClass="text-slate-900"
        />

        <SummaryCard
          label="Available"
          value={senders.length}
          valueClass="text-emerald-600"
        />

        <SummaryCard
          label="Campaign ready"
          value={senders.length}
          valueClass="text-blue-600"
        />
      </div>

      {/* Empty */}
      {senders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
            ✉
          </div>

          <h3 className="mt-5 font-semibold text-slate-900">
            No senders configured
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            A sender identity is required before you can create and dispatch a
            campaign.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {senders.map((sender) => (
            <SenderCard
              key={sender.id}
              sender={sender}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SenderCard({
  sender,
}: {
  sender: Sender;
}) {
  const initials =
    sender.displayName
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase(),
      )
      .join("") ||
    sender.email
      .charAt(0)
      .toUpperCase();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      {/* Identity */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">
            {sender.displayName ||
              "Sender"}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {sender.email}
          </p>
        </div>

        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
          title="Available"
        >
          ✓
        </span>
      </div>

      {/* Divider */}
      <div className="my-5 border-t border-slate-100" />

      {/* Status */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Status
          </p>

          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-semibold text-emerald-700">
              Available
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Dispatch
          </p>

          <p className="mt-1.5 text-xs font-semibold text-slate-700">
            Campaign ready
          </p>
        </div>
      </div>

      {/* Sender ID */}
      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Sender ID
        </p>

        <p className="mt-1 truncate font-mono text-[10px] text-slate-500">
          {sender.id}
        </p>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        Sender identity
      </p>
    </div>
  );
}