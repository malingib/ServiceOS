import { cn } from "../lib";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    positive?: boolean;
  };
  icon?: LucideIcon;
  className?: string;
}

function StatCard({ title, value, trend, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-surface-200 bg-white p-6 transition-shadow hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-surface-500">{title}</p>
          <p className="text-2xl font-bold text-surface-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.positive !== undefined ? (
                trend.positive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )
              ) : null}
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.positive ? "text-green-600" : trend.positive === false ? "text-red-600" : "text-surface-500"
                )}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-brand-50 p-2.5">
            <Icon className="h-5 w-5 text-brand-600" />
          </div>
        )}
      </div>
    </div>
  );
}

export { StatCard };
