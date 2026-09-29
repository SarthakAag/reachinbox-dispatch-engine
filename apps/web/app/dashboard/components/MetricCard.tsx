interface MetricCardProps {
  label: string;
  value: number | string;
  detail: string;
  icon: string;
  tone?: "green" | "blue" | "amber" | "red";
}

const toneStyles = {
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    value: "text-slate-900",
    accent: "bg-emerald-500",
  },
  blue: {
    icon: "bg-blue-50 text-blue-600",
    value: "text-slate-900",
    accent: "bg-blue-500",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    value: "text-slate-900",
    accent: "bg-amber-500",
  },
  red: {
    icon: "bg-red-50 text-red-600",
    value: "text-slate-900",
    accent: "bg-red-500",
  },
};

export default function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "green",
}: MetricCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5">
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${styles.accent}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p
            className={`mt-3 text-2xl font-bold tracking-tight sm:text-3xl ${styles.value}`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-xs leading-5 text-slate-400">
            {detail}
          </p>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-transform group-hover:scale-105 ${styles.icon}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}