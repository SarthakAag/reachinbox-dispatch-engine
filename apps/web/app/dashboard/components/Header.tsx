"use client";

import type { DashboardView } from "../types";

interface HeaderProps {
  view: DashboardView;
  onNewCampaign: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onOpenMobileMenu?: () => void;
}

const titles: Record<
  DashboardView,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  overview: {
    eyebrow: "Workspace",
    title: "Dispatch Overview",
    description:
      "Monitor your email infrastructure in real time.",
  },
  campaigns: {
    eyebrow: "Campaigns",
    title: "Campaign Management",
    description:
      "Create and manage outbound campaigns.",
  },
  scheduled: {
    eyebrow: "Delivery",
    title: "Scheduled Emails",
    description:
      "Emails waiting for their dispatch window.",
  },
  sent: {
    eyebrow: "Delivery",
    title: "Sent Emails",
    description:
      "Recently processed email deliveries.",
  },
  search: {
    eyebrow: "Discovery",
    title: "Email Search",
    description:
      "Search indexed email activity using Elasticsearch.",
  },
  timeline: {
    eyebrow: "Infrastructure",
    title: "Dispatch Timeline",
    description:
      "Understand when your emails are scheduled to leave.",
  },
  senders: {
    eyebrow: "Infrastructure",
    title: "Sender Pool",
    description:
      "Manage the sender identities used by campaigns.",
  },
  slack: {
    eyebrow: "Integrations",
    title: "Slack Notifications",
    description:
      "Configure delivery-limit notifications.",
  },
  queue: {
    eyebrow: "Infrastructure",
    title: "Queue Monitor",
    description:
      "Monitor BullMQ dispatch activity.",
  },
};

export default function Header({
  view,
  onNewCampaign,
  onRefresh,
  refreshing,
  onOpenMobileMenu,
}: HeaderProps) {
  const content = titles[view];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
          >
            ☰
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              {content.eyebrow}
            </p>

            <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {content.title}
            </h1>

            <p className="mt-1 hidden max-w-xl text-sm text-slate-500 md:block">
              {content.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 sm:h-auto sm:w-auto sm:px-3 sm:py-2.5"
          >
            <span className="text-base sm:mr-1">
              ↻
            </span>

            <span className="hidden text-sm font-medium sm:inline">
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>

          <button
            type="button"
            onClick={onNewCampaign}
            className="rounded-xl bg-emerald-500 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.98] sm:px-4"
          >
            <span className="sm:hidden">
              +
            </span>

            <span className="hidden sm:inline">
              + New Campaign
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}