import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Home, Inbox, MapPin, Hammer, ListCheck,
  Users, Building2, Landmark, Italic, ScrollText, CreditCard,
  FileText, ChartBar, Bell, MessageSquare, UserCog
} from 'lucide-react';

const allPages = [
  { title: "Landing", url: "/", icon: Home },
  { title: "Inbox", url: "/dashboard/inbox", icon: Inbox },
  { title: "Map", url: "/dashboard/map", icon: MapPin },
  { title: "Jobs", url: "/dashboard/jobs", icon: Hammer },
  { title: "Orders", url: "/dashboard/orders", icon: ListCheck },
  { title: "People", url: "/dashboard/customers", icon: Users },
  { title: "Companies", url: "/dashboard/companies", icon: Building2 },
  { title: "Products", url: "/dashboard/memorials", icon: Landmark },
  { title: "Inscriptions", url: "/dashboard/inscriptions", icon: Italic },
  { title: "Permits", url: "/dashboard/permit-forms", icon: ScrollText },
  { title: "Payments", url: "/dashboard/payments", icon: CreditCard },
  { title: "Invoicing", url: "/dashboard/invoicing", icon: FileText },
  { title: "Reporting", url: "/dashboard/reporting", icon: ChartBar },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Team Chat", url: "/dashboard/team", icon: MessageSquare },
  { title: "Workers", url: "/dashboard/workers", icon: UserCog },
];

export const ReviewNavToolbar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`fixed left-0 top-0 h-full z-50 bg-slate-900 text-white flex flex-col transition-all duration-200 shadow-xl ${
        collapsed ? 'w-10' : 'w-44'
      }`}
    >
      <div className="flex items-center justify-between p-2 border-b border-slate-700">
        {!collapsed && (
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Review Nav
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        {allPages.map((page) => (
          <NavLink
            key={page.url}
            to={page.url}
            end={page.url === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <page.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{page.title}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
