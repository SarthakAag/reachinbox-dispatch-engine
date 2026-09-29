"use client";

import type {
  DashboardView,
  User,
} from "../types";

interface SidebarProps {
  user: User | null;
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navigation = [
  {
    id: "overview" as DashboardView,
    label: "Overview",
    icon: "⌂",
  },
  {
    id: "campaigns" as DashboardView,
    label: "Campaigns",
    icon: "✉",
  },
  {
    id: "scheduled" as DashboardView,
    label: "Scheduled",
    icon: "◷",
  },
  {
    id: "sent" as DashboardView,
    label: "Sent",
    icon: "✓",
  },
  {
    id: "search" as DashboardView,
    label: "Search",
    icon: "⌕",
  },
  {
    id: "timeline" as DashboardView,
    label: "Dispatch Timeline",
    icon: "↗",
  },
];

const systemNavigation = [
  {
    id: "senders" as DashboardView,
    label: "Senders",
    icon: "◎",
  },
  {
    id: "slack" as DashboardView,
    label: "Slack",
    icon: "#",
  },
  {
    id: "queue" as DashboardView,
    label: "Queue Monitor",
    icon: "≋",
  },
];

export default function Sidebar({
  user,
  activeView,
  onNavigate,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  function navigate(view: DashboardView) {
    onNavigate(view);
    onCloseMobile?.();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[280px]
          border-r border-slate-200 bg-white
          shadow-xl shadow-slate-900/5
          transition-transform duration-300
          lg:z-30 lg:w-64 lg:translate-x-0
          lg:shadow-none
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-100 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg font-black text-white shadow-sm shadow-emerald-500/20">
                R
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight text-slate-900">
                  ReachInbox
                </p>

                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Dispatch Engine
                </p>
              </div>
            </div>

            {/* Mobile close */}
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              ×
            </button>
          </div>

          {/* Navigation */}
          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            <NavigationGroup
              title="Workspace"
              items={navigation}
              activeView={activeView}
              onNavigate={navigate}
            />

            <div className="my-6 h-px bg-slate-100" />

            <NavigationGroup
              title="Infrastructure"
              items={systemNavigation}
              activeView={activeView}
              onNavigate={navigate}
            />
          </nav>

          {/* User */}
          <div className="shrink-0 border-t border-slate-100 p-4">
            <div className="mb-4 flex items-center gap-3">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-600 ring-2 ring-emerald-100">
                  {user?.name
                    ?.charAt(0)
                    .toUpperCase() ?? "U"}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.name ?? "User"}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavigationGroup({
  title,
  items,
  activeView,
  onNavigate,
}: {
  title: string;
  items: {
    id: DashboardView;
    label: string;
    icon: string;
  }[];
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}) {
  return (
    <>
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            active={activeView === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>
    </>
  );
}

function SidebarItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group flex w-full items-center gap-3 rounded-xl
        px-3 py-2.5 text-sm font-medium
        transition-all duration-200
        ${
          active
            ? "bg-emerald-50 text-emerald-700"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }
      `}
    >
      <span
        className={`
          flex h-8 w-8 shrink-0 items-center justify-center
          rounded-lg text-sm transition
          ${
            active
              ? "bg-emerald-100 text-emerald-600"
              : "text-slate-400 group-hover:bg-white group-hover:text-slate-600"
          }
        `}
      >
        {icon}
      </span>

      <span className="truncate">
        {label}
      </span>

      {active && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
      )}
    </button>
  );
}