"use client";

import { cn } from "../lib";
import { type LucideIcon, ChevronLeft, ChevronRight } from "lucide-react";

export interface SidebarItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  sections: SidebarSection[];
  activeKey: string;
  onNavigate: (href: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  logo?: React.ReactNode;
  className?: string;
}

function Sidebar({ sections, activeKey, onNavigate, collapsed, onToggle, logo, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-surface-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-surface-200 px-4", collapsed && "justify-center")}>
        {collapsed ? (
          <div className="h-8 w-8 rounded-lg bg-brand-500" />
        ) : (
          logo || <span className="text-lg font-bold text-surface-900">ServiceOS</span>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn("ml-auto rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600", collapsed && "ml-0")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && !collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeKey === item.key || activeKey.startsWith(item.key + "/");
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => onNavigate(item.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-surface-600 hover:bg-surface-50 hover:text-surface-900",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-brand-600" : "text-surface-400")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export { Sidebar };
