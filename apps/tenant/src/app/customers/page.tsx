"use client";

import { DataTable, Badge } from "@serviceops/ui";
import type { Column } from "@serviceops/ui";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  totalSpent: string;
  lastBooking: string;
  status: "active" | "inactive";
}

const customers: Customer[] = [
  { id: "c1", name: "Sarah Mwangi", phone: "+254 712 345 678", email: "sarah@email.com", totalBookings: 24, totalSpent: "KES 256,000", lastBooking: "2024-06-05", status: "active" },
  { id: "c2", name: "KenGen HQ", phone: "+254 720 123 456", email: "procurement@kengen.co.ke", totalBookings: 67, totalSpent: "KES 892,000", lastBooking: "2024-06-08", status: "active" },
  { id: "c3", name: "Tech Park Ltd", phone: "+254 733 456 789", email: "admin@techpark.co.ke", totalBookings: 12, totalSpent: "KES 145,000", lastBooking: "2024-05-28", status: "active" },
  { id: "c4", name: "Mall & More", phone: "+254 745 678 901", email: "info@mallmore.co.ke", totalBookings: 8, totalSpent: "KES 98,000", lastBooking: "2024-06-07", status: "active" },
  { id: "c5", name: "Delta Hotel", phone: "+254 756 789 012", email: "ops@deltahotel.co.ke", totalBookings: 34, totalSpent: "KES 567,000", lastBooking: "2024-06-06", status: "active" },
  { id: "c6", name: "John Njoroge", phone: "+254 767 890 123", email: "john.n@email.com", totalBookings: 2, totalSpent: "KES 17,000", lastBooking: "2024-04-15", status: "inactive" },
];

const columns: Column<Customer>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "phone", header: "Phone" },
  { key: "email", header: "Email" },
  { key: "totalBookings", header: "Bookings", sortable: true },
  { key: "totalSpent", header: "Total Spent", sortable: true },
  { key: "lastBooking", header: "Last Booking", sortable: true },
  {
    key: "status",
    header: "Status",
    render: (c) => (
      <Badge variant={c.status === "active" ? "success" : "default"}>
        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
      </Badge>
    ),
  },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-surface-500">{customers.length} customers</p>
      </div>
      <DataTable
        columns={columns}
        data={customers}
        keyField="id"
        searchable
        searchPlaceholder="Search customers..."
        pageSize={10}
      />
    </div>
  );
}
