"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, Badge, Timeline, Skeleton } from "@serviceops/ui";
import { ArrowLeft, Phone, MapPin, User } from "lucide-react";
import type { TimelineItem } from "@serviceops/ui";

const timelineItems: TimelineItem[] = [
  { id: "t1", title: "Booking Created", description: "Customer requested Office Cleaning service", timestamp: "Jun 8, 09:00 AM", status: "success" },
  { id: "t2", title: "Payment Confirmed", description: "M-Pesa STK Push - KES 12,500", timestamp: "Jun 8, 09:02 AM", status: "success" },
  { id: "t3", title: "Worker Assigned", description: "Peter K. assigned to this booking", timestamp: "Jun 8, 09:05 AM", status: "primary" },
  { id: "t4", title: "In Progress", description: "Worker has arrived at location", timestamp: "Jun 8, 09:30 AM", status: "primary" },
  { id: "t5", title: "Completed", description: "Awaiting completion", timestamp: "—", status: "default" },
];

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-surface-900">Booking {params.id}</h2>
          <p className="text-sm text-surface-500">Office Cleaning</p>
        </div>
        <Badge variant="primary" className="ml-auto">In Progress</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-surface-200 bg-white p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Booking Timeline</h3>
            <Timeline items={timelineItems} />
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-surface-500">Service</p>
                <p className="font-medium text-surface-700">Office Cleaning</p>
              </div>
              <div>
                <p className="text-surface-500">Amount</p>
                <p className="font-medium text-surface-700">KES 12,500</p>
              </div>
              <div>
                <p className="text-surface-500">Date</p>
                <p className="font-medium text-surface-700">June 8, 2024</p>
              </div>
              <div>
                <p className="text-surface-500">Time</p>
                <p className="font-medium text-surface-700">09:00 AM - 12:00 PM</p>
              </div>
              <div className="col-span-2">
                <p className="text-surface-500">Address</p>
                <p className="font-medium text-surface-700 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-surface-400" />
                  KenGen HQ, Kampala Road, Nairobi
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-surface-200 bg-white p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Customer</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm">
                K
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">KenGen HQ</p>
                <p className="text-xs text-surface-400">+254 712 345 678</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Phone className="h-4 w-4" />
              Call Customer
            </Button>
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Assigned Worker</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                P
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">Peter K.</p>
                <p className="text-xs text-surface-400">Reliability: 96%</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <User className="h-4 w-4" />
              View Profile
            </Button>
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-6 space-y-2">
            <Button variant="danger" className="w-full">Cancel Booking</Button>
            <Button variant="outline" className="w-full">Reschedule</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
