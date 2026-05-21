"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface SidebarProps {
  onDisconnect: () => void;
}

const NAV_ITEMS = [
  {
    href: "/dashboard",
    title: "Terminal",
    exact: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    href: "/dashboard/markets",
    title: "Markets",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    ),
  },
  {
    href: "/dashboard/portfolio",
    title: "Portfolio",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
      </svg>
    ),
  },
  {
    href: "/dashboard/trade",
    title: "Trade",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    title: "Profile",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
  },
];

export default function DashboardSidebar({ onDisconnect }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-20 md:w-24 border-r-4 border-black bg-neo-yellow flex flex-col items-center py-6 shrink-0 z-20 relative">
      <div className="font-black text-xs uppercase tracking-widest border-b-2 border-black pb-2 mb-6 w-full text-center">
        Menu
      </div>

      <nav className="flex flex-col gap-4 w-full px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={`w-full flex flex-col items-center gap-1 py-2.5 border-[3px] transition-all group ${
                active
                  ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                  : "border-transparent hover:border-black hover:bg-white"
              }`}
            >
              <span className={`transition-transform group-hover:scale-110 ${active ? "text-neo-lime" : ""}`}>
                {item.icon}
              </span>
              <span className="font-black text-[8px] uppercase tracking-widest">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 w-full">
        <button
          onClick={onDisconnect}
          title="Disconnect wallet"
          className="w-full flex flex-col items-center gap-1 py-2.5 border-[3px] border-transparent hover:border-black hover:bg-neo-orange transition-all group rounded-none"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span className="font-black text-[8px] uppercase tracking-widest">Exit</span>
        </button>
      </div>
    </aside>
  );
}
