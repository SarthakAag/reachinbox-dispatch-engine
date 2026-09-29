"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CampaignForm,
  Sender,
} from "../types";

interface CampaignModalProps {
  open: boolean;
  senders: Sender[];
  onClose: () => void;
  onSubmit: (
    form: CampaignForm,
  ) => Promise<void>;
}

const defaultForm: CampaignForm = {
  senderId: "",
  subject: "",
  body: "",
  recipients: [],
  startTime: "",
  delayBetweenEmailsMs: 2000,
  hourlyLimit: 100,
};

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CampaignModal({
  open,
  senders,
  onClose,
  onSubmit,
}: CampaignModalProps) {
  const [form, setForm] =
    useState<CampaignForm>(
      defaultForm,
    );

  const [recipientText, setRecipientText] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fileName, setFileName] =
    useState("");

  const [invalidRecipients, setInvalidRecipients] =
    useState<string[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const recipientCount = useMemo(
    () => form.recipients.length,
    [form.recipients],
  );

  const validRecipientCount =
    form.recipients.filter(
      (email) =>
        EMAIL_PATTERN.test(email),
    ).length;

  if (!open) {
    return null;
  }

  function updateField<
    K extends keyof CampaignForm,
  >(
    field: K,
    value: CampaignForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function parseRecipientInput(
    value: string,
  ) {
    const rawRecipients = value
      .split(/[\n,;]+/)
      .map((email) =>
        email.trim().toLowerCase(),
      )
      .filter(Boolean);

    const uniqueRecipients = [
      ...new Set(rawRecipients),
    ];

    const valid: string[] = [];
    const invalid: string[] = [];

    for (const email of uniqueRecipients) {
      if (EMAIL_PATTERN.test(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    }

    return {
      valid,
      invalid,
    };
  }

  function handleRecipientChange(
    value: string,
  ) {
    setRecipientText(value);

    const parsed =
      parseRecipientInput(value);

    updateField(
      "recipients",
      parsed.valid,
    );

    setInvalidRecipients(
      parsed.invalid,
    );

    if (parsed.invalid.length > 0) {
      setError("");
    }
  }

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      const contents =
        typeof reader.result === "string"
          ? reader.result
          : "";

      if (!contents.trim()) {
        setError(
          "The uploaded file is empty.",
        );
        return;
      }

      const parsed =
        parseRecipientInput(contents);

      setRecipientText(
        parsed.valid.join("\n"),
      );

      updateField(
        "recipients",
        parsed.valid,
      );

      setInvalidRecipients(
        parsed.invalid,
      );

      if (parsed.valid.length === 0) {
        setError(
          "No valid email addresses were found in the uploaded file.",
        );
      }
    };

    reader.onerror = () => {
      setError(
        "Unable to read the uploaded file.",
      );
    };

    reader.readAsText(file);

    event.target.value = "";
  }

  function resetForm() {
    setForm(defaultForm);
    setRecipientText("");
    setError("");
    setFileName("");
    setInvalidRecipients([]);
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!form.senderId) {
      setError(
        "Please select a sender.",
      );
      return;
    }

    if (!form.subject.trim()) {
      setError(
        "Please enter an email subject.",
      );
      return;
    }

    if (!form.body.trim()) {
      setError(
        "Please enter the email body.",
      );
      return;
    }

    if (
      form.recipients.length === 0
    ) {
      setError(
        "Add at least one valid recipient.",
      );
      return;
    }

    if (
      invalidRecipients.length > 0
    ) {
      setError(
        `${invalidRecipients.length} invalid email address${
          invalidRecipients.length === 1
            ? ""
            : "es"
        } detected. Remove or correct them before scheduling.`,
      );
      return;
    }

    if (
      form.startTime === ""
    ) {
      setError(
        "Please select a start time.",
      );
      return;
    }

    const selectedStart =
      new Date(
        form.startTime,
      );

    if (
      Number.isNaN(
        selectedStart.getTime(),
      )
    ) {
      setError(
        "Please provide a valid start time.",
      );
      return;
    }

    if (
      form.delayBetweenEmailsMs < 0
    ) {
      setError(
        "Email delay cannot be negative.",
      );
      return;
    }

    if (
      form.hourlyLimit <= 0
    ) {
      setError(
        "Hourly limit must be greater than zero.",
      );
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        subject:
          form.subject.trim(),
        body:
          form.body.trim(),
      });

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to schedule campaign.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                Dispatch campaign
              </p>
            </div>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Create campaign
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Schedule a batch of emails through
              the persistent dispatch engine.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close"
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"
        >
          <div className="space-y-6">
            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                    !
                  </span>

                  <p className="leading-5">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Sender + start time */}
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Sender
                </span>

                <select
                  value={
                    form.senderId
                  }
                  onChange={(event) =>
                    updateField(
                      "senderId",
                      event.target.value,
                    )
                  }
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                >
                  <option value="">
                    Select sender
                  </option>

                  {senders.map(
                    (sender) => (
                      <option
                        key={sender.id}
                        value={sender.id}
                      >
                        {sender.displayName
                          ? `${sender.displayName} — ${sender.email}`
                          : sender.email}
                      </option>
                    ),
                  )}
                </select>

                {senders.length ===
                  0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No sender is available.
                    Add a sender before
                    creating a campaign.
                  </p>
                )}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Start time
                </span>

                <input
                  type="datetime-local"
                  value={
                    form.startTime
                  }
                  onChange={(event) =>
                    updateField(
                      "startTime",
                      event.target.value,
                    )
                  }
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </label>
            </div>

            {/* Subject */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Subject
              </span>

              <input
                type="text"
                value={
                  form.subject
                }
                onChange={(event) =>
                  updateField(
                    "subject",
                    event.target.value,
                  )
                }
                placeholder="e.g. Quick introduction"
                disabled={submitting}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              />
            </label>

            {/* Body */}
            <label className="block">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Email body
                </span>

                <span className="text-[10px] text-slate-400">
                  Plain text / HTML-ready content
                </span>
              </div>

              <textarea
                value={form.body}
                onChange={(event) =>
                  updateField(
                    "body",
                    event.target.value,
                  )
                }
                rows={8}
                placeholder="Write your email content..."
                disabled={submitting}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              />
            </label>

            {/* Recipients */}
            <div>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label
                    htmlFor="recipients"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Recipients
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    Paste addresses or upload a
                    CSV/text file.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {recipientCount} valid
                  </span>

                  {invalidRecipients.length >
                    0 && (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                      {
                        invalidRecipients.length
                      }{" "}
                      invalid
                    </span>
                  )}
                </div>
              </div>

              {/* Upload */}
              <div className="mb-3 flex flex-col gap-3 sm:flex-row">
                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  onChange={
                    handleFileUpload
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>↑</span>
                  Upload CSV / TXT
                </button>

                {fileName && (
                  <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <span className="text-emerald-600">
                      ✓
                    </span>

                    <span className="max-w-[240px] truncate text-xs font-medium text-slate-600">
                      {fileName}
                    </span>
                  </div>
                )}
              </div>

              <textarea
                id="recipients"
                value={
                  recipientText
                }
                onChange={(event) =>
                  handleRecipientChange(
                    event.target.value,
                  )
                }
                rows={7}
                placeholder={`alice@example.com
bob@example.com
charlie@example.com`}
                disabled={submitting}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 text-slate-800 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              />

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Separate recipients with
                commas, semicolons, or new lines.
                Duplicate addresses are removed
                automatically.
              </p>

              {invalidRecipients.length >
                0 && (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50/60 p-3">
                  <p className="text-xs font-semibold text-red-700">
                    Invalid addresses detected
                  </p>

                  <div className="mt-2 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
                    {invalidRecipients.map(
                      (email) => (
                        <span
                          key={email}
                          className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-red-600 ring-1 ring-red-100"
                        >
                          {email}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Configuration */}
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Delay between emails
                </span>

                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={
                      form.delayBetweenEmailsMs
                    }
                    onChange={(event) =>
                      updateField(
                        "delayBetweenEmailsMs",
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-16 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    ms
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-5 text-slate-400">
                  Minimum spacing reserved across
                  workers for this sender.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Hourly sending limit
                </span>

                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={
                      form.hourlyLimit
                    }
                    onChange={(event) =>
                      updateField(
                        "hourlyLimit",
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-20 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    / hour
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-5 text-slate-400">
                  Emails above this limit are
                  delayed into the next hour.
                </p>
              </label>
            </div>

            {/* Dispatch behavior */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  ⚙
                </div>

                <div>
                  <h3 className="text-sm font-bold text-blue-900">
                    Dispatch behavior
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    Jobs are persisted in PostgreSQL
                    and BullMQ. Redis coordinates
                    sender rate limits and minimum
                    send spacing across workers.
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Campaign preview
                  </p>

                  <h3 className="mt-1 text-sm font-bold text-slate-800">
                    {form.subject.trim() ||
                      "Untitled campaign"}
                  </h3>
                </div>

                <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                  {recipientCount} recipient
                  {recipientCount ===
                  1
                    ? ""
                    : "s"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <PreviewValue
                  label="Sender"
                  value={
                    getSenderLabel(
                      senders,
                      form.senderId,
                    ) || "Not selected"
                  }
                />

                <PreviewValue
                  label="Start"
                  value={
                    form.startTime
                      ? formatStartTime(
                          form.startTime,
                        )
                      : "Not scheduled"
                  }
                />

                <PreviewValue
                  label="Rate"
                  value={`${form.hourlyLimit}/hour`}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                senders.length === 0
              }
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Scheduling..."
                : "Schedule Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getSenderLabel(
  senders: Sender[],
  senderId: string,
) {
  if (!senderId) {
    return "";
  }

  const sender = senders.find(
    (item) => item.id === senderId,
  );

  if (!sender) {
    return "";
  }

  return (
    sender.displayName ||
    sender.email
  );
}

function formatStartTime(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PreviewValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-white px-3 py-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}