"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Button, Badge, BookingCard, EmptyState } from "@serviceops/ui";
import { Plus, Calendar as CalendarIcon, List, Grid3X3 } from "lucide-react";
import type { Column } from "@serviceops/ui";

interface Booking {
  id: string;
  service: string;
  customer: string;
  worker: string;
  date: string;
  time: string;
  amount: string;
  status: string;
}

const bookings: Booking[] = [
  { id: "BK-2024-001", service: "Office Cleaning", customer: "KenGen HQ", worker: "Peter K.", date: "2024-06-08", time: "09:00", amount: "KES 12,500", status: "in_progress" },
  { id: "BK-2024-002", service: "Deep Cleaning", customer: "Sarah M.", worker: "Unassigned", date: "2024-06-09", time: "10:00", amount: "KES 8,500", status: "confirmed" },
  { id: "BK-2024-003", service: "Carpet Shampooing", customer: "Tech Park Ltd", worker: "Unassigned", date: "2024-06-10", time: "14:00", amount: "KES 18,000", status: "pending" },
  { id: "BK-2024-004", service: "Window Cleaning", customer: "Mall & More", worker: "James O.", date: "2024-06-07", time: "11:00", amount: "KES 6,500", status: "completed" },
  { id: "BK-2024-005", service: "Floor Polishing", customer: "Delta Hotel", worker: "Grace W.", date: "2024-06-06", time: "08:00", amount: "KES 22,000", status: "completed" },
  { id: "BK-2024-006", service: "Sanitization", customer: "St. Mary's School", worker: "John K.", date: "2024-06-05", time: "13:00", amount: "KES 15,000", status: "cancelled" },
];

const columns: Column<Booking>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "service", header: "Service", sortable: true },
  { key: "customer", header: "Customer", sortable: true },
  { key: "worker", header: "Worker" },
  { key: "date", header: "Date", sortable: true },
  { key: "time", header: "Time" },
  { key: "amount", header: "Amount", sortable: true },
  {
    key: "status",
    header: "Status",
    render: (b) => (
      <Badge
        variant={
          b.status === "completed" ? "success" :
          b.status === "in_progress" ? "primary" :
          b.status === "confirmed" ? "info" :
          b.status === "pending" ? "warning" : "danger"
        }
      >
        {b.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </Badge>
    ),
  },
];

export default function BookingsPage() {
  const router = useRouter();
  const [view, setView] = useState<"table" | "cards">("table");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-surface-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex rounded-lg border border-surface-200">
            <button
              onClick={() => setView("table")}
              className={`p-2 ${view === "table" ? "bg-surface-100 text-surface-700" : "text-surface-400 hover:text-surface-600"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("cards")}
              className={`p-2 ${view === "cards" ? "bg-surface-100 text-surface-700" : "text-surface-400 hover:text-surface-600"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Button onClick={() => router.push("/bookings/new")}>
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      {view === "table" ? (
        <DataTable
          columns={columns}
          data={filtered}
          keyField="id"
          searchable
          searchPlaceholder="Search bookings..."
          onRowClick={(b) => router.push(`/bookings/${b.id}`)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              <EmptyState title="No bookings found" description="Try changing your filters or create a new booking." action={{ label: "New Booking", onClick: () => router.push("/bookings/new") }} />
            </div>
          ) : (
            filtered.map((bk) => (
              <BookingCard
                key={bk.id}
                id={bk.id}
                service={bk.service}
                status={bk.status as any}
                customer={{ name: bk.customer }}
                worker={bk.worker !== "Unassigned" ? { name: bk.worker } : undefined}
                date={bk.date}
                time={bk.time}
                address="Nairobi"
                amount={parseInt(bk.amount.replace(/[^0-9]/g, ""))}
                onClick={() => router.push(`/bookings/${bk.id}`)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
