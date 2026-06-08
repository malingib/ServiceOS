"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button, Badge, StatCard, FormField, Skeleton } from "@serviceops/ui";
import { Building2, Users, Calendar, ArrowLeft, DollarSign, Mail, Phone, MapPin } from "lucide-react";

const tenantData = {
  id: "1",
  name: "SparkleClean Ltd",
  slug: "sparkleclean",
  email: "info@sparkleclean.co.ke",
  phone: "+254 712 345 678",
  address: "Mombasa Road, Nairobi",
  status: "active" as const,
  plan: "Growth",
  bookings: 1234,
  workers: 47,
  customers: 891,
  revenue: "KES 2.4M",
  features: ["mpesa", "sms", "whatsapp", "analytics", "dispatch"],
  createdAt: "Jan 15, 2024",
};

export default function TenantDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" variant="rectangular" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" variant="rectangular" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-surface-900">{tenantData.name}</h2>
          <p className="text-sm text-surface-500">Tenant ID: {params.id}</p>
        </div>
        <Badge variant={tenantData.status === "active" ? "success" : "warning"} className="ml-auto">
          {tenantData.status.charAt(0).toUpperCase() + tenantData.status.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Bookings" value={tenantData.bookings.toLocaleString()} icon={Calendar} />
        <StatCard title="Active Workers" value={tenantData.workers.toString()} icon={Users} />
        <StatCard title="Customers" value={tenantData.customers.toLocaleString()} icon={Building2} />
        <StatCard title="Revenue" value={tenantData.revenue} icon={DollarSign} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Tenant Information</h3>
          <div className="space-y-4">
            <FormField label="Business Name">
              <input
                className="flex h-10 w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-surface-500"
                value={tenantData.name}
                readOnly={!editMode}
              />
            </FormField>
            <FormField label="Slug">
              <input className="flex h-10 w-full rounded-lg border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-surface-500" value={tenantData.slug} readOnly />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Email">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 text-sm text-surface-600">
                  <Mail className="h-4 w-4 text-surface-400" />
                  {tenantData.email}
                </div>
              </FormField>
              <FormField label="Phone">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 text-sm text-surface-600">
                  <Phone className="h-4 w-4 text-surface-400" />
                  {tenantData.phone}
                </div>
              </FormField>
            </div>
            <FormField label="Address">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 text-sm text-surface-600">
                <MapPin className="h-4 w-4 text-surface-400" />
                {tenantData.address}
              </div>
            </FormField>
            <FormField label="Plan">
              <Badge variant="primary">{tenantData.plan}</Badge>
            </FormField>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => setEditMode(!editMode)} variant="outline">
              {editMode ? "Cancel" : "Edit Tenant"}
            </Button>
            <Button variant="danger">Suspend Tenant</Button>
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Enabled Features</h3>
          <div className="flex flex-wrap gap-2">
            {tenantData.features.map((feat) => (
              <Badge key={feat} variant="success">{feat}</Badge>
            ))}
          </div>

          <h3 className="font-semibold text-surface-900 mt-6 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4" />
              View Users
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4" />
              View Bookings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="h-4 w-4" />
              Billing & Invoices
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
