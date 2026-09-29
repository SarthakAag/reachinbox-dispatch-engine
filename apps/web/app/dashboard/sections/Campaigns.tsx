"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CampaignRecord,
  CampaignStatus,
} from "../types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

interface CampaignsProps {
  campaigns: CampaignRecord[];
  loading?: boolean;
  onCreateCampaign: () => void;
}

interface ActionState {
  campaignId: string;
  action: "pause" | "resume" | "cancel";
}

const STATUS_CONFIG: Record<
  CampaignStatus,
  {
    label: string;
    className: string;
    dotClassName: string;
  }
> = {
  DRAFT: {
    label: "Draft",
    className:
      "border-slate-200 bg-slate-50 text-slate-700",
    dotClassName: "bg-slate-400",
  },

  SCHEDULED: {
    label: "Scheduled",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
    dotClassName: "bg-blue-500",
  },

  RUNNING: {
    label: "Running",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },

  COMPLETED: {
    label: "Completed",
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-700",
    dotClassName: "bg-indigo-500",
  },

  PAUSED: {
    label: "Paused",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
  },

  CANCELLED: {
    label: "Cancelled",
    className:
      "border-red-200 bg-red-50 text-red-700",
    dotClassName: "bg-red-500",
  },
};

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function formatDelay(
  milliseconds: number,
): string {
  if (milliseconds <= 0) {
    return "No delay";
  }

  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = milliseconds / 1000;

  if (Number.isInteger(seconds)) {
    return `${seconds}s`;
  }

  return `${seconds.toFixed(1)}s`;
}

function getStatusConfig(
  status: CampaignStatus,
) {
  return STATUS_CONFIG[status];
}

function StatusBadge({
  status,
}: {
  status: CampaignStatus;
}) {
  const config =
    getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`}
      />

      {config.label}
    </span>
  );
}

function CampaignSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-5 w-48 rounded bg-slate-100" />

          <div className="mt-2 h-3 w-64 rounded bg-slate-100" />
        </div>

        <div className="h-7 w-24 rounded-full bg-slate-100" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="h-16 rounded-xl bg-slate-100"
            />
          ),
        )}
      </div>

      <div className="mt-5 h-2 rounded-full bg-slate-100" />
    </div>
  );
}

export default function Campaigns({
  campaigns,
  loading = false,
  onCreateCampaign,
}: CampaignsProps) {
  const [
    actionState,
    setActionState,
  ] = useState<ActionState | null>(
    null,
  );

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    localCampaigns,
    setLocalCampaigns,
  ] = useState<CampaignRecord[]>(
    campaigns,
  );

  /*
   * Keep the local list synchronized
   * with the dashboard polling response.
   */
  useEffect(() => {
    setLocalCampaigns(campaigns);
  }, [campaigns]);

  const totalEmails = useMemo(
    () =>
      localCampaigns.reduce(
        (total, campaign) =>
          total + campaign._count.emails,
        0,
      ),
    [localCampaigns],
  );

  /*
   * ---------------------------------------------------------
   * Pause / Resume / Cancel
   * ---------------------------------------------------------
   */

  async function handleAction(
    campaignId: string,
    action:
      | "pause"
      | "resume"
      | "cancel",
  ) {
    setActionError("");

    setActionState({
      campaignId,
      action,
    });

    try {
      const response =
        await fetch(
          `${API_URL}/api/campaigns/${campaignId}/${action}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            data?.message ??
            `Failed to ${action} campaign`,
        );
      }

      const nextStatus: CampaignStatus =
        action === "pause"
          ? "PAUSED"
          : action === "resume"
            ? "RUNNING"
            : "CANCELLED";

      setLocalCampaigns(
        (current) =>
          current.map(
            (campaign) =>
              campaign.id ===
              campaignId
                ? {
                    ...campaign,
                    status: nextStatus,
                  }
                : campaign,
          ),
      );
    } catch (error) {
      console.error(
        `[campaigns] Failed to ${action} campaign:`,
        error,
      );

      setActionError(
        error instanceof Error
          ? error.message
          : `Failed to ${action} campaign.`,
      );
    } finally {
      setActionState(null);
    }
  }

  function renderActions(
    campaign: CampaignRecord,
  ) {
    const isProcessing =
      actionState?.campaignId ===
      campaign.id;

    if (
      campaign.status ===
      "COMPLETED"
    ) {
      return null;
    }

    if (
      campaign.status ===
      "CANCELLED"
    ) {
      return null;
    }

    if (
      campaign.status ===
        "SCHEDULED" ||
      campaign.status ===
        "RUNNING"
    ) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              void handleAction(
                campaign.id,
                "pause",
              )
            }
            className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing &&
            actionState?.action ===
              "pause"
              ? "Pausing..."
              : "Pause"}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              void handleAction(
                campaign.id,
                "cancel",
              )
            }
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing &&
            actionState?.action ===
              "cancel"
              ? "Cancelling..."
              : "Cancel"}
          </button>
        </div>
      );
    }

    if (
      campaign.status ===
      "PAUSED"
    ) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              void handleAction(
                campaign.id,
                "resume",
              )
            }
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing &&
            actionState?.action ===
              "resume"
              ? "Resuming..."
              : "Resume"}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              void handleAction(
                campaign.id,
                "cancel",
              )
            }
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing &&
            actionState?.action ===
              "cancel"
              ? "Cancelling..."
              : "Cancel"}
          </button>
        </div>
      );
    }

    return null;
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Dispatch
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Campaigns
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage scheduled campaigns,
            dispatch windows, sender limits,
            and delivery state.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateCampaign}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <span className="mr-2 text-base">
            +
          </span>
          New Campaign
        </button>
      </div>

      {/* Summary */}
      {!loading &&
        localCampaigns.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Campaigns
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {localCampaigns.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Emails
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {totalEmails}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Running
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {
                  localCampaigns.filter(
                    (campaign) =>
                      campaign.status ===
                      "RUNNING",
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Paused
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-600">
                {
                  localCampaigns.filter(
                    (campaign) =>
                      campaign.status ===
                      "PAUSED",
                  ).length
                }
              </p>
            </div>
          </div>
        )}

      {/* Action error */}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {actionError}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(
            (item) => (
              <CampaignSkeleton
                key={item}
              />
            ),
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading &&
        localCampaigns.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
              ✉
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No campaigns yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Create your first campaign
              to start scheduling emails
              through the ReachInbox
              dispatch engine.
            </p>

            <button
              type="button"
              onClick={
                onCreateCampaign
              }
              className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create Campaign
            </button>
          </div>
        )}

      {/* Campaign list */}
      {!loading &&
        localCampaigns.length >
          0 && (
          <div className="space-y-4">
            {localCampaigns.map(
              (campaign) => {
                const statusConfig =
                  getStatusConfig(
                    campaign.status,
                  );

                return (
                  <article
                    key={campaign.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Main card */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                              {
                                campaign.subject
                              }
                            </h2>

                            <StatusBadge
                              status={
                                campaign.status
                              }
                            />
                          </div>

                          <p className="mt-1 break-all text-xs text-slate-400">
                            Campaign ID:{" "}
                            {
                              campaign.id
                            }
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>
                              Sender:{" "}
                              <strong className="font-semibold text-slate-700">
                                {campaign.sender
                                  ?.displayName ??
                                  campaign
                                    .sender
                                    ?.email ??
                                  "Unknown"}
                              </strong>
                            </span>

                            <span>
                              Start:{" "}
                              <strong className="font-semibold text-slate-700">
                                {formatDate(
                                  campaign.startTime,
                                )}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {renderActions(
                            campaign,
                          )}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Recipients
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {
                              campaign
                                ._count
                                .emails
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Hourly limit
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {
                              campaign.hourlyLimit
                            }

                            <span className="ml-1 text-xs font-medium text-slate-400">
                              / hr
                            </span>
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Send delay
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {formatDelay(
                              campaign.delayBetweenEmailsMs,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Created
                          </p>

                          <p className="mt-1 truncate text-sm font-bold text-slate-900">
                            {formatDate(
                              campaign.createdAt,
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Dispatch information */}
                      <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Dispatch state
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {
                                statusConfig.label
                              }
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-xs text-slate-400">
                              Scheduled start
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {formatDate(
                                campaign.startTime,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              campaign.status ===
                              "COMPLETED"
                                ? "w-full bg-indigo-500"
                                : campaign.status ===
                                    "RUNNING"
                                  ? "w-2/3 bg-emerald-500"
                                  : campaign.status ===
                                      "PAUSED"
                                    ? "w-1/2 bg-amber-500"
                                    : campaign.status ===
                                        "CANCELLED"
                                      ? "w-full bg-red-400"
                                      : "w-1/4 bg-blue-500"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <span>
                        Last updated{" "}
                        {formatDate(
                          campaign.updatedAt,
                        )}
                      </span>

                      <span className="font-medium">
                        {
                          campaign
                            ._count
                            .emails
                        }{" "}
                        scheduled recipient
                        {campaign
                            ._count
                            .emails === 1
                          ? ""
                          : "s"}
                      </span>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
    </section>
  );
}