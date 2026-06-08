"use client";

import { useState } from "react";
import { Button, Spinner } from "@serviceops/ui";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  uptime: string;
  latency: string;
  lastChecked: string;
  version: string;
}

const services: ServiceHealth[] = [
  { name: "API Gateway", status: "healthy", uptime: "99.99%", latency: "12ms", lastChecked: "Just now", version: "v1.2.0" },
  { name: "Identity Service", status: "healthy", uptime: "99.97%", latency: "45ms", lastChecked: "Just now", version: "v1.0.3" },
  { name: "Booking Service", status: "healthy", uptime: "99.95%", latency: "52ms", lastChecked: "1m ago", version: "v1.1.0" },
  { name: "Payments Service", status: "degraded", uptime: "98.32%", latency: "340ms", lastChecked: "30s ago", version: "v1.0.5" },
  { name: "CRM Service", status: "healthy", uptime: "99.99%", latency: "38ms", lastChecked: "Just now", version: "v1.0.2" },
  { name: "Messaging Service", status: "healthy", uptime: "99.89%", latency: "65ms", lastChecked: "45s ago", version: "v1.0.1" },
  { name: "Dispatch Service", status: "healthy", uptime: "99.98%", latency: "41ms", lastChecked: "20s ago", version: "v1.0.4" },
  { name: "Documents Service", status: "healthy", uptime: "99.99%", latency: "28ms", lastChecked: "1m ago", version: "v1.0.0" },
  { name: "Analytics Service", status: "down", uptime: "95.12%", latency: "—", lastChecked: "5m ago", version: "v0.9.0" },
  { name: "AI Orchestrator", status: "healthy", uptime: "99.91%", latency: "1.2s", lastChecked: "2m ago", version: "v0.8.0" },
  { name: "Workflow Service", status: "healthy", uptime: "99.97%", latency: "33ms", lastChecked: "1m ago", version: "v1.0.0" },
  { name: "Rewards Service", status: "healthy", uptime: "99.99%", latency: "22ms", lastChecked: "30s ago", version: "v0.9.5" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "healthy") return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (status === "degraded") return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

export default function HealthPage() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const uptime = 99.63;
  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const degradedCount = services.filter((s) => s.status === "degraded").length;
  const downCount = services.filter((s) => s.status === "down").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-500">
            {healthyCount} healthy · {degradedCount} degraded · {downCount} down
          </p>
        </div>
        <Button onClick={handleRefresh} loading={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{healthyCount}</p>
              <p className="text-sm text-surface-500">Healthy</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2.5">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{degradedCount}</p>
              <p className="text-sm text-surface-500">Degraded</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2.5">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{downCount}</p>
              <p className="text-sm text-surface-500">Down</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-200 bg-white">
        <div className="border-b border-surface-100 px-6 py-4">
          <h2 className="font-semibold text-surface-900">Service Status</h2>
        </div>
        <div className="divide-y divide-surface-100">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <StatusIcon status={svc.status} />
                <div>
                  <p className="text-sm font-medium text-surface-900">{svc.name}</p>
                  <p className="text-xs text-surface-400">v{svc.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-surface-500">Uptime</p>
                  <p className="font-medium text-surface-700">{svc.uptime}</p>
                </div>
                <div className="text-right">
                  <p className="text-surface-500">Latency</p>
                  <p className="font-medium text-surface-700">{svc.latency}</p>
                </div>
                <div className="text-right">
                  <p className="text-surface-500">Checked</p>
                  <p className="text-surface-500">{svc.lastChecked}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
