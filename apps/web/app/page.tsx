"use client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export default function Home() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <main className="min-h-screen bg-[#070b12] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12 lg:px-10">
        <div className="grid w-full gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left side */}
          <section>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-[#06110d]">
                R
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight">
                  ReachInbox
                </p>

                <p className="text-xs text-slate-500">
                  Dispatch Engine
                </p>
              </div>
            </div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Reliable email orchestration
            </div>

            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Schedule.
              <br />
              Dispatch.
              <br />
              <span className="text-emerald-400">
                Never duplicate.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400">
              A distributed email dispatch engine built around
              durable queues, rate limits, delayed jobs and
              idempotent delivery.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              <Feature
                value="BullMQ"
                label="Durable jobs"
              />

              <Feature
                value="Redis"
                label="Distributed limits"
              />

              <Feature
                value="Elastic"
                label="Fast search"
              />
            </div>
          </section>

          {/* Login card */}
          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="mb-8">
                <p className="text-sm font-medium text-emerald-400">
                  Workspace access
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Sign in to manage campaigns, senders,
                  delivery queues and dispatch activity.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.99]"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-slate-600">
                  SECURE ACCESS
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-3 text-sm text-slate-400">
                <SecurityItem>
                  Google OAuth authentication
                </SecurityItem>

                <SecurityItem>
                  PostgreSQL-backed sessions
                </SecurityItem>

                <SecurityItem>
                  Idempotent email dispatch
                </SecurityItem>
              </div>

              <p className="mt-8 text-center text-xs leading-5 text-slate-600">
                By continuing, you agree to use this
                development workspace responsibly.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Feature({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-slate-200">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}

function SecurityItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-xs text-emerald-400">
        ✓
      </span>

      <span>{children}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.78-.07-1.54-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 21.99c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.99Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 14.07A5.86 5.86 0 0 1 6.23 12c0-.72.12-1.42.31-2.07V7.4H3.3A10 10 0 0 0 2.25 12c0 1.66.4 3.23 1.05 4.6l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.9c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 2.96 14.63 2 12 2a9.75 9.75 0 0 0-8.7 5.4l3.24 2.53C7.31 7.62 9.46 5.9 12 5.9Z"
      />
    </svg>
  );
}