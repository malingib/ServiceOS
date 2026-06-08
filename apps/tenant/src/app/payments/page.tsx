"use client";

import { useState } from "react";
import { DataTable, Badge } from "@serviceops/ui";
import type { Column } from "@serviceops/ui";

interface Payment {
  id: string;
  receiptNo: string;
  customer: string;
  service: string;
  amount: string;
  method: string;
  status: "completed" | "pending" | "failed" | "refunded";
  date: string;
}

const payments: Payment[] = [
  { id: "p1", receiptNo: "MP-2024-001", customer: "KenGen HQ", service: "Office Cleaning", amount: "KES 12,500", method: "M-Pesa", status: "completed", date: "2024-06-08" },
  { id: "p2", receiptNo: "MP-2024-002", customer: "Sarah M.", service: "Deep Cleaning", amount: "KES 8,500", method: "M-Pesa", status: "completed", date: "2024-06-07" },
  { id: "p3", receiptNo: "MP-2024-003", customer: "Tech Park Ltd", service: "Carpet Shampooing", amount: "KES 18,000", method: "M-Pesa", status: "pending", date: "2024-06-06" },
  { id: "p4", receiptNo: "MP-2024-004", customer: "Mall & More", service: "Window Cleaning", amount: "KES 6,500", method: "M-Pesa", status: "completed", date: "2024-06-07" },
  { id: "p5", receiptNo: "MP-2024-005", customer: "Delta Hotel", service: "Floor Polishing", amount: "KES 22,000", method: "M-Pesa", status: "failed", date: "2024-06-06" },
  { id: "p6", receiptNo: "MP-2024-006", customer: "St. Mary's School", service: "Sanitization", amount: "KES 15,000", method: "Bank Transfer", status: "refunded", date: "2024-06-05" },
];

const columns: Column<Payment>[] = [
  { key: "receiptNo", header: "Receipt", sortable: true },
  { key: "customer", header: "Customer", sortable: true },
  { key: "service", header: "Service" },
  { key: "amount", header: "Amount", sortable: true },
  { key: "method", header: "Method" },
  {
    key: "status",
    header: "Status",
    render: (p) => (
      <Badge
        variant={
          p.status === "completed" ? "success" :
          p.status === "pending" ? "warning" :
          p.status === "failed" ? "danger" : "info"
        }
      >
        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
      </Badge>
    ),
  },
  { key: "date", header: "Date", sortable: true },
];

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = statusFilter === "all" ? payments : payments.filter((p) => p.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-surface-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        keyField="id"
        searchable
        searchPlaceholder="Search transactions..."
      />
    </div>
  );
}
