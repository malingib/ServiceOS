"use client";

import { useState } from "react";
import { DataTable, Badge } from "@serviceops/ui";
import type { Column } from "@serviceops/ui";

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  tenant: string;
  ipAddress: string;
  status: "success" | "failure" | "pending";
}

const logs: AuditLog[] = [
  { id: "1", timestamp: "2026-06-08 09:23:15", actor: "admin@serviceos.co.ke", action: "tenant.created", entity: "Tenant", entityId: "t-001", tenant: "System", ipAddress: "192.168.1.100", status: "success" },
  { id: "2", timestamp: "2026-06-08 09:15:42", actor: "jane@sparkleclean.co.ke", action: "booking.cancelled", entity: "Booking", entityId: "bk-1234", tenant: "SparkleClean", ipAddress: "10.0.0.45", status: "success" },
  { id: "3", timestamp: "2026-06-08 08:55:03", actor: "system", action: "payment.sync", entity: "Payment", entityId: "pay-567", tenant: "CareFirst", ipAddress: "—", status: "success" },
  { id: "4", timestamp: "2026-06-08 08:30:18", actor: "admin@serviceos.co.ke", action: "user.suspended", entity: "User", entityId: "u-789", tenant: "System", ipAddress: "192.168.1.100", status: "success" },
  { id: "5", timestamp: "2026-06-08 08:12:55", actor: "system", action: "mpesa.callback", entity: "Payment", entityId: "pay-568", tenant: "MegaWash", ipAddress: "196.201.214.200", status: "failure" },
  { id: "6", timestamp: "2026-06-08 07:45:30", actor: "peter@greenscapes.co.ke", action: "worker.assigned", entity: "Booking", entityId: "bk-1235", tenant: "GreenScapes", ipAddress: "10.0.0.89", status: "success" },
  { id: "7", timestamp: "2026-06-08 07:30:00", actor: "admin@serviceos.co.ke", action: "tenant.config.updated", entity: "Tenant", entityId: "t-003", tenant: "System", ipAddress: "192.168.1.100", status: "success" },
  { id: "8", timestamp: "2026-06-08 06:55:12", actor: "system", action: "backup.started", entity: "System", entityId: "—", tenant: "System", ipAddress: "—", status: "pending" },
];

const columns: Column<AuditLog>[] = [
  { key: "timestamp", header: "Timestamp", sortable: true },
  { key: "actor", header: "Actor", sortable: true },
  {
    key: "action",
    header: "Action",
    render: (l) => <code className="rounded bg-surface-100 px-2 py-0.5 text-xs font-mono text-surface-700">{l.action}</code>,
  },
  { key: "entity", header: "Entity" },
  { key: "entityId", header: "Entity ID" },
  { key: "tenant", header: "Tenant", sortable: true },
  {
    key: "status",
    header: "Status",
    render: (l) => (
      <Badge variant={l.status === "success" ? "success" : l.status === "failure" ? "danger" : "warning"}>
        {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
      </Badge>
    ),
  },
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-surface-500">Track all system changes and user actions</p>
      </div>
      <DataTable
        columns={columns}
        data={logs}
        keyField="id"
        searchable
        searchPlaceholder="Search logs..."
        pageSize={20}
      />
    </div>
  );
}
