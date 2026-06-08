import { cn } from "../lib";
import { Badge } from "../atoms/Badge";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  status?: "default" | "primary" | "success" | "warning" | "danger";
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "h-3 w-3 rounded-full border-2",
                item.status === "success" && "border-green-500 bg-green-100",
                item.status === "warning" && "border-yellow-500 bg-yellow-100",
                item.status === "danger" && "border-red-500 bg-red-100",
                item.status === "primary" && "border-brand-500 bg-brand-100",
                (!item.status || item.status === "default") && "border-surface-300 bg-white"
              )}
            />
            {index < items.length - 1 && (
              <div className="mt-1 w-0.5 flex-1 bg-surface-200" />
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-surface-900">{item.title}</p>
              <span className="text-xs text-surface-400">{item.timestamp}</span>
            </div>
            {item.description && (
              <p className="mt-0.5 text-sm text-surface-500">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export { Timeline };
