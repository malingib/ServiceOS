"use client";

import { cn } from "../lib";
import { Badge } from "../atoms/Badge";
import { Avatar } from "../atoms/Avatar";
import { MapPin, Calendar, Clock, type LucideIcon } from "lucide-react";

export interface BookingCardProps {
  id: string;
  service: string;
  status: "pending" | "confirmed" | "assigned" | "in_progress" | "completed" | "cancelled";
  customer: { name: string; avatar?: string };
  worker?: { name: string; avatar?: string };
  date: string;
  time: string;
  address: string;
  amount: number;
  currency?: string;
  onClick?: () => void;
  className?: string;
}

const statusMap: Record<string, { label: string; variant: "warning" | "primary" | "info" | "success" | "danger" }> = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "primary" },
  assigned: { label: "Assigned", variant: "info" },
  in_progress: { label: "In Progress", variant: "primary" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

function BookingCard({ id, service, status, customer, worker, date, time, address, amount, currency = "KES", onClick, className }: BookingCardProps) {
  const statusInfo = statusMap[status] || { label: status, variant: "default" as const };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-surface-200 bg-white p-4 transition-all hover:shadow-md cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-surface-900">{service}</h3>
          <p className="text-xs text-surface-400">#{id.slice(0, 8)}</p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <div className="space-y-2 text-sm text-surface-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-surface-400" />
          <span>{date}</span>
          <Clock className="ml-2 h-4 w-4 text-surface-400" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-surface-400" />
          <span className="truncate">{address}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-3">
        <div className="flex items-center gap-2">
          <Avatar name={customer.name} src={customer.avatar} size="sm" />
          <span className="text-sm text-surface-600">{customer.name}</span>
          {worker && (
            <>
              <span className="text-surface-300 mx-1">·</span>
              <Avatar name={worker.name} src={worker.avatar} size="sm" />
              <span className="text-sm text-surface-600">{worker.name}</span>
            </>
          )}
        </div>
        <p className="text-sm font-semibold text-surface-900">
          {currency} {amount.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export { BookingCard };
