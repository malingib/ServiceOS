"use client";

import { cn } from "../lib";
import { Search, Bell, Moon, Sun } from "lucide-react";
import { Avatar } from "../atoms/Avatar";

export interface HeaderProps {
  title?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  user?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  onThemeToggle?: () => void;
  isDark?: boolean;
  className?: string;
}

function Header({ title, onSearch, searchValue, user, onThemeToggle, isDark, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center gap-4 border-b border-surface-200 bg-white px-6",
        className
      )}
    >
      {title && (
        <h1 className="text-lg font-semibold text-surface-900">{title}</h1>
      )}

      <div className="flex-1" />

      {onSearch && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-3 text-sm placeholder:text-surface-400 focus:border-surface-300 focus:outline-none focus:ring-0"
          />
        </div>
      )}

      {onThemeToggle && (
        <button
          onClick={onThemeToggle}
          className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      )}

      <button className="relative rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
      </button>

      {user && (
        <div className="flex items-center gap-2">
          <Avatar name={user.name} src={user.avatar} size="sm" />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-surface-700">{user.name}</p>
            {user.email && <p className="text-xs text-surface-400">{user.email}</p>}
          </div>
        </div>
      )}
    </header>
  );
}

export { Header };
