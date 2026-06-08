"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Button, Badge } from "@serviceops/ui";
import { Plus } from "lucide-react";
import type { Column } from "@serviceops/ui";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  status: "active" | "suspended" | "trial";
  bookings: number;
  revenue: string;
  createdAt: string;
}

const tenants: Tenant[] = [
  { id: "1", name: "SparkleClean Ltd", slug: "sparkleclean", email: "info@sparkleclean.co.ke", phone: "+254 712 345 678", status: "active", bookings: 1234, revenue: "KES 2.4M", createdAt: "2024-01-15" },
  { id: "2", name: "CareFirst Agency", slug: "carefirst", email: "hello@carefirst.co.ke", phone: "+254 723 456 789", status: "active", bookings: 892, revenue: "KES 1.8M", createdAt: "2024-03-20" },
  { id: "3", name: "MegaWash Services", slug: "megawash", email: "support@megawash.co.ke", phone: "+254 734 567 890", status: "trial", bookings: 67, revenue: "KES 89K", createdAt: "2024-06-01" },
  { id: "4", name: "GreenScapes Kenya", slug: "greenscapes", email: "info@greenscapes.co.ke", phone: "+254 745 678 901", status: "active", bookings: 445, revenue: "KES 890K", createdAt: "2024-02-10" },
  { id: "5", name: "SafeHands Homecare", slug: "safehands", email: "care@safehands.co.ke", phone: "+254 756 789 012", status: "suspended", bookings: 0, revenue: "KES 0", createdAt: "2024-04-05" },
];

const columns: Column<Tenant>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "phone", header: "Phone" },
  {
    key: "status",
    header: "Status",
    render: (t) => (
      <Badge variant={t.status === "active" ? "success" : t.status === "trial" ? "warning" : "danger"}>
        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
      </Badge>
    ),
  },
  { key: "bookings", header: "Bookings", sortable: true },
  { key: "revenue", header: "Revenue", sortable: true },
  { key: "createdAt", header: "Created", sortable: true },
];

export default function TenantsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-500">Manage all tenants across the platform</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={tenants}
        keyField="id"
        searchable
        searchPlaceholder="Search tenants..."
        onRowClick={(t) => router.push(`/tenants/${t.id}`)}
      />
    </div>
  );
}
