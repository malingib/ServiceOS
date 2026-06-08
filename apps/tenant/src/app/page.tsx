"use client";

import { useEffect, useState } from "react";
import { StatCard, BookingCard, Spinner } from "@serviceops/ui";
import { DollarSign, Calendar, Users, Star, TrendingUp } from "lucide-react";

const stats = [
  { title: "Revenue This Month", value: "KES 184,500", trend: { value: 12.3, positive: true }, icon: DollarSign },
  { title: "Active Bookings", value: "24", trend: { value: 8.1, positive: true }, icon: Calendar },
  { title: "Total Workers", value: "47", trend: { value: 3, positive: true }, icon: Users },
  { title: "Avg. Rating", value: "4.8", trend: { value: 0.2, positive: true }, icon: Star },
];

const recentBookings = [
  {
    id: "BK-2024-001", service: "Office Cleaning", status: "in_progress" as const,
    customer: { name: "KenGen HQ" },
    worker: { name: "Peter K." },
    date: "Today", time: "09:00 AM", address: "Kampala Road, Nairobi",
    amount: 12500,
  },
  {
    id: "BK-2024-002", service: "Deep Cleaning", status: "confirmed" as const,
    customer: { name: "Sarah M." },
    date: "Tomorrow", time: "10:00 AM", address: "Westlands, Nairobi",
    amount: 8500,
  },
  {
    id: "BK-2024-003", service: "Carpet Shampooing", status: "pending" as const,
    customer: { name: "Tech Park Ltd" },
    date: "Jun 10", time: "02:00 PM", address: "Upper Hill, Nairobi",
    amount: 18000,
  },
  {
    id: "BK-2024-004", service: "Window Cleaning", status: "completed" as const,
    customer: { name: "Mall & More" },
    worker: { name: "James O." },
    date: "Jun 7", time: "11:00 AM", address: "Two Rivers Mall",
    amount: 6500,
  },
];

export default function TenantDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
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
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} trend={s.trend} icon={s.icon} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-surface-200 bg-white p-6 lg:col-span-2">
          <h2 className="font-semibold text-surface-900 mb-4">Recent Bookings</h2>
          <div className="space-y-4">
            {recentBookings.map((bk) => (
              <BookingCard key={bk.id} {...bk} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-surface-200 bg-white p-6">
            <h2 className="font-semibold text-surface-900 mb-4">Today&apos;s Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Completed</span>
                <span className="text-sm font-semibold text-surface-900">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">In Progress</span>
                <span className="text-sm font-semibold text-green-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Pending</span>
                <span className="text-sm font-semibold text-yellow-600">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Cancelled</span>
                <span className="text-sm font-semibold text-red-600">1</span>
              </div>
              <div className="pt-2 border-t border-surface-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-surface-700">Total Today</span>
                  <span className="text-sm font-bold text-surface-900">17</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-6">
            <h2 className="font-semibold text-surface-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <a href="/bookings/new" className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
                <Calendar className="h-4 w-4" />
                New Booking
              </a>
              <button className="flex w-full items-center gap-2 rounded-lg border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors">
                <Users className="h-4 w-4" />
                Assign Worker
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors">
                <DollarSign className="h-4 w-4" />
                Send Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
