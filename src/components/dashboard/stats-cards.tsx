type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "primary" | "success" | "warning" | "danger" | "info";
};

const colors = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export function StatCard({ title, value, subtitle, color = "primary" }: StatCardProps) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-6">
      <p className="text-sm text-muted mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
    </div>
  );
}
