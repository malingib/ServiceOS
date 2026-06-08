"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, Header } from "@serviceops/ui";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCircle,
  CreditCard,
  Settings,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import "./globals.css";

const navSections = [
  {
    title: "Main",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
    ],
  },
  {
    title: "Operations",
    items: [
      { key: "bookings", label: "Bookings", icon: Calendar, href: "/bookings" },
      { key: "workers", label: "Workers", icon: Users, href: "/workers" },
      { key: "customers", label: "Customers", icon: UserCircle, href: "/customers" },
    ],
  },
  {
    title: "Finance",
    items: [
      { key: "payments", label: "Payments", icon: CreditCard, href: "/payments" },
    ],
  },
  {
    title: "Other",
    items: [
      { key: "messages", label: "Messages", icon: MessageSquare, href: "/messages" },
      { key: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" },
      { key: "settings", label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const activeKey = pathname === "/" ? "dashboard" : pathname.split("/")[1];

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
                activeKey === "bookings" ? "Bookings" :
                activeKey === "workers" ? "Workers" :
                activeKey === "customers" ? "Customers" :
                activeKey === "payments" ? "Payments" :
                activeKey === "settings" ? "Settings" :
                activeKey === "messages" ? "Messages" :
                activeKey === "analytics" ? "Analytics" : ""
              }
              onSearch={setSearch}
              searchValue={search}
              user={{ name: "Jane Wanjiku", email: "jane@sparkleclean.co.ke" }}
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
