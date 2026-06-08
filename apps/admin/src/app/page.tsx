"use client";

import { useState, useEffect } from "react";
import { StatCard, Spinner } from "@serviceops/ui";
import { DollarSign, Users, Calendar, Activity, AlertTriangle, Building2 } from "lucide-react";

const kpiData = [
  { title: "Total Revenue", value: "KES 2.4M", trend: { value: 12.5, positive: true }, icon: DollarSign },
  { title: "Active Tenants", value: "48", trend: { value: 8.2, positive: true }, icon: Building2 },
  { title: "Total Workers", value: "1,247", trend: { value: 15.3, positive: true }, icon: Users },
  { title: "Bookings Today", value: "342", trend: { value: 5.1, positive: true }, icon: Calendar },
];

const services = [
  { name: "Identity Service", status: "healthy", uptime: "99.9%", latency: "45ms" },
  { name: "Booking Service", status: "healthy", uptime: "99.8%", latency: "52ms" },
  { name: "Payments Service", status: "degraded", uptime: "98.5%", latency: "340ms" },
  { name: "CRM Service", status: "healthy", uptime: "99.9%", latency: "38ms" },
  { name: "Messaging Service", status: "healthy", uptime: "99.7%", latency: "65ms" },
  { name: "Dispatch Service", status: "healthy", uptime: "99.9%", latency: "41ms" },
];

const recentBookings = [
  { id: "BK-001", tenant: "SparkleClean Ltd", service: "Office Cleaning", amount: "KES 12,500", status: "completed" },
  { id: "BK-002", tenant: "CareFirst Agency", service: "Elderly Care", amount: "KES 8,000", status: "in_progress" },
  { id: "BK-003", tenant: "MegaWash Services", service: "Car Detailing", amount: "KES 5,500", status: "pending" },
  { id: "BK-004", tenant: "SparkleClean Ltd", service: "Deep Cleaning", amount: "KES 18,000", status: "confirmed" },
  { id: "BK-005", tenant: "GreenScapes", service: "Garden Maintenance", amount: "KES 6,000", status: "completed" },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-green-100 text-green-700",
    degraded: "bg-yellow-100 text-yellow-800",
    down: "bg-red-100 text-red-700",
    completed: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-brand-100 text-brand-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-surface-100 text-surface-700"}`}>
      {status === "healthy" && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />}
      {status === "degraded" && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500" />}
      {status === "down" && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />}
      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
    </span>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <StatCard key={kpi.title} title={kpi.title} value={kpi.value} trend={kpi.trend} icon={kpi.icon} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-900">System Health</h2>
            <Activity className="h-5 w-5 text-surface-400" />
          </div>
          <div className="space-y-3">
            {services.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between text-sm">
                <span className="text-surface-700">{svc.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-surface-400">{svc.latency}</span>
                  <StatusBadge status={svc.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-900">Recent Bookings</h2>
            <Calendar className="h-5 w-5 text-surface-400" />
          </div>
          <div className="space-y-3">
            {recentBookings.map((bk) => (
              <div key={bk.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-surface-900">{bk.id}</p>
                  <p className="text-surface-500">{bk.tenant}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-surface-900">{bk.amount}</p>
                  <StatusBadge status={bk.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-900">Active Alerts</h2>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-sm font-medium text-yellow-800">Payments Service Degraded</p>
              <p className="text-xs text-yellow-600 mt-1">Latency spike detected. Check M-Pesa integration.</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm font-medium text-blue-800">Scheduled Maintenance</p>
              <p className="text-xs text-blue-600 mt-1">Database upgrade at 02:00 AM EAT.</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-sm font-medium text-green-800">All Clear</p>
              <p className="text-xs text-green-600 mt-1">No critical issues. All services nominal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
