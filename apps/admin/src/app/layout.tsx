"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, Header } from "@serviceops/ui";
import {
  LayoutDashboard,
  Building2,
  Activity,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import "./globals.css";

const navSections = [
  {
    title: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
    ],
  },
  {
    title: "Management",
    items: [
      { key: "tenants", label: "Tenants", icon: Building2, href: "/tenants" },
      { key: "users", label: "Users", icon: Users, href: "/users" },
      { key: "roles", label: "Roles", icon: Shield, href: "/roles" },
    ],
  },
  {
    title: "System",
    items: [
      { key: "system/health", label: "Health", icon: Activity, href: "/system/health" },
      { key: "system/audit-logs", label: "Audit Logs", icon: ScrollText, href: "/system/audit-logs" },
      { key: "settings", label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const activeKey = pathname === "/" ? "dashboard" : pathname.slice(1);

  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            sections={navSections}
            activeKey={activeKey}
            onNavigate={(href) => router.push(href)}
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header
              title={
                activeKey === "dashboard" ? "Dashboard" :
                activeKey === "tenants" ? "Tenants" :
                activeKey === "system/health" ? "System Health" :
                activeKey === "system/audit-logs" ? "Audit Logs" : ""
              }
              onSearch={setSearch}
              searchValue={search}
              user={{ name: "Super Admin", email: "admin@serviceos.co.ke" }}
            />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
