"use client";

import { useCallback, useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import CampaignModal from "./components/CampaignModal";

import Overview from "./sections/Overview";
import Campaigns from "./sections/Campaigns";
import Scheduled from "./sections/Scheduled";
import Sent from "./sections/Sent";
import Search from "./sections/Search";
import DispatchTimeline from "./sections/DispatchTimeline";
import Senders from "./sections/Senders";
import Slack from "./sections/Slack";
import QueueMonitor from "./sections/QueueMonitor";

import type {
  AuthResponse,
  CampaignForm,
  CampaignResponse,
  CampaignRecord,
  DashboardView,
  EmailRecord,
  EmailSearchResponse,
  EmailStats,
  Sender,
  SlackResponse,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

const emptyStats: EmailStats = {
  scheduled: 0,
  queued: 0,
  processing: 0,
  sending: 0,
  sent: 0,
  failed: 0,
  retryPending: 0,
  active: 0,
};

const emptySlack: SlackResponse = {
  connected: false,
  connection: null,
};

export default function DashboardPage() {
  const [activeView, setActiveView] =
    useState<DashboardView>("overview");

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [user, setUser] =
    useState<AuthResponse["user"]>(null);

  const [senders, setSenders] =
    useState<Sender[]>([]);

  const [stats, setStats] =
    useState<EmailStats>(emptyStats);

  const [emails, setEmails] =
    useState<EmailRecord[]>([]);

  const [campaigns, setCampaigns] =
    useState<CampaignRecord[]>([]);

  const [slack, setSlack] =
    useState<SlackResponse>(emptySlack);

  const [loading, setLoading] =
    useState(true);

  const [statsLoading, setStatsLoading] =
    useState(true);

  const [emailsLoading, setEmailsLoading] =
    useState(true);

  const [campaignsLoading, setCampaignsLoading] =
    useState(true);

  const [slackLoading, setSlackLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [campaignModalOpen, setCampaignModalOpen] =
    useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  /*
   * ---------------------------------------------------------
   * Toast
   * ---------------------------------------------------------
   */

  const showToast = useCallback(
    (
      type: "success" | "error",
      message: string,
    ) => {
      setToast({
        type,
        message,
      });

      window.setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    [],
  );

  /*
   * ---------------------------------------------------------
   * API helper
   * ---------------------------------------------------------
   */

  const apiFetch = useCallback(
    async <T,>(
      path: string,
      options?: RequestInit,
    ): Promise<T> => {
      const response = await fetch(
        `${API_URL}${path}`,
        {
          credentials: "include",
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
          },
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.error ??
            data?.message ??
            `Request failed with status ${response.status}`,
        );
      }

      return response.json() as Promise<T>;
    },
    [],
  );

  /*
   * ---------------------------------------------------------
   * Authentication
   * ---------------------------------------------------------
   */

  const loadUser = useCallback(async () => {
    const response =
      await apiFetch<AuthResponse>(
        "/api/auth/me",
      );

    if (
      !response.authenticated ||
      !response.user
    ) {
      window.location.href = "/";
      return null;
    }

    setUser(response.user);

    return response.user;
  }, [apiFetch]);

  /*
   * ---------------------------------------------------------
   * Senders
   * ---------------------------------------------------------
   */

  const loadSenders = useCallback(
    async () => {
      try {
        const response =
          await apiFetch<{
            senders: Sender[];
          }>("/api/senders");

        setSenders(
          Array.isArray(response.senders)
            ? response.senders
            : [],
        );
      } catch (err) {
        console.error(
          "[dashboard] Failed to load senders:",
          err,
        );

        setSenders([]);
      }
    },
    [apiFetch],
  );

  /*
   * ---------------------------------------------------------
   * Email statistics
   * ---------------------------------------------------------
   */

  const loadStats = useCallback(
    async () => {
      setStatsLoading(true);

      try {
        const response =
          await apiFetch<EmailStats>(
            "/api/emails/stats",
          );

        setStats(response);
      } catch (err) {
        console.error(
          "[dashboard] Failed to load stats:",
          err,
        );
      } finally {
        setStatsLoading(false);
      }
    },
    [apiFetch],
  );

  /*
   * ---------------------------------------------------------
   * Emails
   * ---------------------------------------------------------
   */

  const loadEmails = useCallback(
    async () => {
      setEmailsLoading(true);

      try {
        const response =
          await apiFetch<EmailSearchResponse>(
            "/api/emails/search?page=1&limit=50",
          );

        setEmails(
          Array.isArray(response.data)
            ? response.data
            : [],
        );
      } catch (err) {
        console.error(
          "[dashboard] Failed to load emails:",
          err,
        );

        setEmails([]);
      } finally {
        setEmailsLoading(false);
      }
    },
    [apiFetch],
  );

  /*
   * ---------------------------------------------------------
   * Campaigns
   * ---------------------------------------------------------
   */

  const loadCampaigns = useCallback(
    async () => {
      setCampaignsLoading(true);

      try {
        const response =
          await apiFetch<CampaignResponse>(
            "/api/campaigns",
          );

        setCampaigns(
          Array.isArray(response.campaigns)
            ? response.campaigns
            : [],
        );
      } catch (err) {
        console.error(
          "[dashboard] Failed to load campaigns:",
          err,
        );

        setCampaigns([]);
      } finally {
        setCampaignsLoading(false);
      }
    },
    [apiFetch],
  );

  /*
   * ---------------------------------------------------------
   * Slack
   * ---------------------------------------------------------
   */

  const loadSlack = useCallback(
    async () => {
      setSlackLoading(true);

      try {
        const response =
          await apiFetch<SlackResponse>(
            "/api/slack/connection",
          );

        setSlack(response);
      } catch (err) {
        console.error(
          "[dashboard] Failed to load Slack:",
          err,
        );

        setSlack(emptySlack);
      } finally {
        setSlackLoading(false);
      }
    },
    [apiFetch],
  );

  /*
   * ---------------------------------------------------------
   * Refresh dashboard
   * ---------------------------------------------------------
   */

  const refreshDashboard = useCallback(
    async () => {
      await Promise.all([
        loadSenders(),
        loadStats(),
        loadEmails(),
        loadCampaigns(),
        loadSlack(),
      ]);
    },
    [
      loadSenders,
      loadStats,
      loadEmails,
      loadCampaigns,
      loadSlack,
    ],
  );

  /*
   * ---------------------------------------------------------
   * Initial dashboard load
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setLoading(true);
      setError("");

      try {
        const authenticatedUser =
          await loadUser();

        if (
          !authenticatedUser ||
          !mounted
        ) {
          return;
        }

        await refreshDashboard();
      } catch (err) {
        console.error(
          "[dashboard] Initialization failed:",
          err,
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load dashboard.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      mounted = false;
    };
  }, [
    loadUser,
    refreshDashboard,
  ]);

  /*
   * ---------------------------------------------------------
   * Mobile sidebar
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return;
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileSidebarOpen]);

  /*
   * ---------------------------------------------------------
   * Navigation
   * ---------------------------------------------------------
   */

  function handleNavigation(
    view: DashboardView,
  ) {
    setActiveView(view);
    setMobileSidebarOpen(false);
  }

  /*
   * ---------------------------------------------------------
   * Live dashboard refresh
   * ---------------------------------------------------------
   *
   * The worker changes email/campaign state independently
   * of the frontend. Poll the backend every 5 seconds so
   * the dashboard reflects current dispatch state.
   */

  useEffect(() => {
    if (loading) {
      return;
    }

    const refreshInterval =
      window.setInterval(() => {
        void Promise.all([
          loadStats(),
          loadEmails(),
          loadCampaigns(),
        ]);
      }, 5000);

    return () => {
      window.clearInterval(
        refreshInterval,
      );
    };
  }, [
    loading,
    loadStats,
    loadEmails,
    loadCampaigns,
  ]);

  /*
   * ---------------------------------------------------------
   * Create campaign
   * ---------------------------------------------------------
   */

  async function handleCreateCampaign(
    form: CampaignForm,
  ) {
    if (!user) {
      throw new Error(
        "You must be logged in.",
      );
    }

    const response =
      await apiFetch<{
        campaign: {
          id: string;
        };
        scheduled: number;
      }>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          senderId: form.senderId,
          subject: form.subject,
          body: form.body,
          recipients: form.recipients,
          startTime: new Date(
            form.startTime,
          ).toISOString(),
          delayBetweenEmailsMs:
            form.delayBetweenEmailsMs,
          hourlyLimit:
            form.hourlyLimit,
        }),
      });

    setCampaignModalOpen(false);

    showToast(
      "success",
      `Campaign scheduled successfully — ${
        response.scheduled
      } email${
        response.scheduled === 1
          ? ""
          : "s"
      } queued.`,
    );

    await Promise.all([
      loadStats(),
      loadEmails(),
      loadCampaigns(),
    ]);

    handleNavigation("scheduled");
  }

  /*
   * ---------------------------------------------------------
   * Logout
   * ---------------------------------------------------------
   */

  async function handleLogout() {
    try {
      await apiFetch(
        "/api/auth/logout",
        {
          method: "POST",
        },
      );
    } catch (err) {
      console.error(
        "[dashboard] Logout failed:",
        err,
      );
    } finally {
      window.location.href = "/";
    }
  }

  /*
   * ---------------------------------------------------------
   * Campaign modal
   * ---------------------------------------------------------
   */

  function handleOpenCampaign() {
    setCampaignModalOpen(true);
    setMobileSidebarOpen(false);
  }

  /*
   * ---------------------------------------------------------
   * View renderer
   * ---------------------------------------------------------
   */

  function renderView() {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-100 sm:w-56" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-slate-100"
                />
              ),
            )}
          </div>

          <div className="h-72 animate-pulse rounded-2xl bg-slate-100 sm:h-80" />
        </div>
      );
    }

    switch (activeView) {
      /*
       * -----------------------------------------------------
       * Overview
       * -----------------------------------------------------
       */

      case "overview":
        return (
          <Overview
            stats={stats}
            emails={emails}
            senders={senders}
            loading={
              statsLoading ||
              emailsLoading
            }
            onCreateCampaign={
              handleOpenCampaign
            }
            onNavigate={
              handleNavigation
            }
          />
        );

      /*
       * -----------------------------------------------------
       * Campaigns
       * -----------------------------------------------------
       */

      case "campaigns":
        return (
          <Campaigns
            campaigns={campaigns}
            loading={campaignsLoading}
            onCreateCampaign={
              handleOpenCampaign
            }
          />
        );

      /*
       * -----------------------------------------------------
       * Scheduled
       * -----------------------------------------------------
       */

      case "scheduled":
        return (
          <Scheduled
            emails={emails}
            loading={emailsLoading}
          />
        );

      /*
       * -----------------------------------------------------
       * Sent
       * -----------------------------------------------------
       */

      case "sent":
        return (
          <Sent
            emails={emails}
            loading={emailsLoading}
          />
        );

      /*
       * -----------------------------------------------------
       * Search
       * -----------------------------------------------------
       */

      case "search":
        return (
          <Search
            apiUrl={API_URL}
          />
        );

      /*
       * -----------------------------------------------------
       * Dispatch Timeline
       * -----------------------------------------------------
       */

      case "timeline":
        return (
          <DispatchTimeline
            emails={emails}
            loading={emailsLoading}
          />
        );

      /*
       * -----------------------------------------------------
       * Senders
       * -----------------------------------------------------
       */

      case "senders":
        return (
          <Senders
            senders={senders}
          />
        );

      /*
       * -----------------------------------------------------
       * Slack
       * -----------------------------------------------------
       */

      case "slack":
        return (
          <Slack
            apiUrl={API_URL}
            slack={slack}
            loading={slackLoading}
            onRefresh={loadSlack}
          />
        );

      /*
       * -----------------------------------------------------
       * Queue Monitor
       * -----------------------------------------------------
       */

      case "queue":
        return (
          <QueueMonitor
            stats={stats}
            loading={statsLoading}
            onRefresh={async () => {
              await Promise.all([
                loadStats(),
                loadEmails(),
                loadCampaigns(),
              ]);
            }}
          />
        );

      default:
        return null;
    }
  }

  /*
   * ---------------------------------------------------------
   * Render
   * ---------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        user={user}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() =>
          setMobileSidebarOpen(false)
        }
      />

      <div className="min-h-screen lg:pl-64">
        <Header
          view={activeView}
          onNewCampaign={
            handleOpenCampaign
          }
          onRefresh={
            refreshDashboard
          }
          refreshing={loading}
          onOpenMobileMenu={() =>
            setMobileSidebarOpen(true)
          }
        />

        <main className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  Dashboard could not
                  load completely
                </p>

                <p className="mt-1 break-words text-xs text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setError("");

                  try {
                    await refreshDashboard();
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Refresh failed.",
                    );
                  }
                }}
                className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          )}

          {renderView()}
        </main>
      </div>

      <CampaignModal
        open={campaignModalOpen}
        senders={senders}
        onClose={() =>
          setCampaignModalOpen(false)
        }
        onSubmit={
          handleCreateCampaign
        }
      />

      {toast && (
        <div
          className={`fixed bottom-4 left-4 right-4 z-[70] rounded-xl border px-4 py-3 shadow-xl sm:left-auto sm:right-5 sm:max-w-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="text-sm font-semibold">
            {toast.message}
          </p>
        </div>
      )}
    </div>
  );
}