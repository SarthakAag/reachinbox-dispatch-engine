"use client";

import { useState } from "react";
import type { SlackResponse } from "../types";

interface SlackProps {
  apiUrl: string;
  slack: SlackResponse;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function Slack({
  apiUrl,
  slack,
  loading,
  onRefresh,
}: SlackProps) {
  const [disconnecting, setDisconnecting] =
    useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const handleConnect = () => {
    window.location.href =
      `${apiUrl}/api/slack/oauth/connect`;
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      setActionError(null);

      const response = await fetch(
        `${apiUrl}/api/slack/disconnect`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.error ??
            `Disconnect failed: ${response.status}`,
        );
      }

      await onRefresh();
    } catch (error) {
      console.error(
        "[dashboard] Failed to disconnect Slack:",
        error,
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to disconnect Slack.",
      );
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <SlackHeader
          onRefresh={onRefresh}
          refreshing
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="animate-pulse space-y-5">
            <div className="flex gap-4">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-100" />

              <div className="flex-1 space-y-3">
                <div className="h-4 w-28 rounded bg-slate-100" />
                <div className="h-6 w-52 rounded bg-slate-100" />
                <div className="h-4 w-full max-w-lg rounded bg-slate-100" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-20 rounded-xl bg-slate-50"
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const connection =
    slack.connected &&
    slack.connection
      ? slack.connection
      : null;

  return (
    <section className="space-y-6">
      <SlackHeader
        onRefresh={onRefresh}
        refreshing={false}
      />

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
              !
            </span>

            <div>
              <p className="font-semibold">
                Slack action failed
              </p>

              <p className="mt-0.5 text-xs text-red-600">
                {actionError}
              </p>
            </div>
          </div>
        </div>
      )}

      {connection ? (
        <ConnectedSlack
          connection={connection}
          onReconnect={handleConnect}
          onDisconnect={() =>
            void handleDisconnect()
          }
          disconnecting={disconnecting}
        />
      ) : (
        <DisconnectedSlack
          onConnect={handleConnect}
        />
      )}
    </section>
  );
}

function SlackHeader({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-500" />

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
            Integration
          </p>
        </div>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Slack Notifications
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Connect Slack to receive a live notification when a sender reaches
          its hourly dispatch limit.
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          void onRefresh()
        }
        disabled={refreshing}
        className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {refreshing
          ? "Refreshing..."
          : "Refresh"}
      </button>
    </div>
  );
}

function ConnectedSlack({
  connection,
  onReconnect,
  onDisconnect,
  disconnecting,
}: {
  connection: NonNullable<
    SlackResponse["connection"]
  >;
  onReconnect: () => void;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
      {/* Connected hero */}
      <div className="border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-emerald-100">
              #
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>

              <h3 className="mt-3 truncate text-xl font-bold text-slate-900 sm:text-2xl">
                {connection.teamName}
              </h3>

              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                ReachInbox can send hourly dispatch-limit notifications to
                your configured Slack channel.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReconnect}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Reconnect
            </button>

            <button
              type="button"
              onClick={onDisconnect}
              disabled={disconnecting}
              className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {disconnecting
                ? "Disconnecting..."
                : "Disconnect"}
            </button>
          </div>
        </div>
      </div>

      {/* Connection details */}
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <ConnectionDetail
          label="Workspace"
          value={
            connection.teamName
          }
        />

        <ConnectionDetail
          label="Channel"
          value={
            connection.channelId
          }
        />

        <ConnectionDetail
          label="Connected"
          value={formatDateTime(
            connection.createdAt,
          )}
        />

        <ConnectionDetail
          label="Last updated"
          value={formatDateTime(
            connection.updatedAt,
          )}
        />
      </div>

      {/* Notification flow */}
      <div className="border-t border-slate-100 bg-slate-50/60 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 font-bold text-violet-600">
            →
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800">
              Rate-limit notification flow
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              When the sender reaches its hourly Redis-backed limit, the
              dispatch worker can notify this Slack destination while
              remaining emails are moved into the next available window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DisconnectedSlack({
  onConnect,
}: {
  onConnect: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
              #
            </div>

            <div>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Not connected
              </span>

              <h3 className="mt-3 text-xl font-bold text-slate-900">
                Connect your Slack workspace
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Authorize ReachInbox to send dispatch-limit notifications to
                an accessible Slack channel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onConnect}
            className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            Connect Slack
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="grid gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3 sm:p-5">
        <FlowStep
          number="01"
          title="Connect"
          description="Authorize your Slack workspace."
        />

        <FlowStep
          number="02"
          title="Dispatch"
          description="Worker enforces the sender limit."
        />

        <FlowStep
          number="03"
          title="Notify"
          description="Slack receives the limit alert."
        />
      </div>
    </div>
  );
}

function ConnectionDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function FlowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <span className="font-mono text-[10px] font-bold text-violet-500">
        {number}
      </span>

      <p className="mt-2 text-xs font-bold text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function formatDateTime(
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