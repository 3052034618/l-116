import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileInput,
  Lightbulb,
  Target,
  FileBarChart,
  Leaf,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "总览" },
  { to: "/emission", icon: FileInput, label: "排放录入" },
  { to: "/measures", icon: Lightbulb, label: "措施库" },
  { to: "/targets", icon: Target, label: "目标看板" },
  { to: "/reports", icon: FileBarChart, label: "报告" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-6 pt-6 pb-4">
        <h1 className="font-serif text-2xl text-ink leading-tight">碳中和</h1>
        <p className="text-sm text-ink-secondary mt-0.5">管理平台</p>
      </div>

      <nav className="flex-1 px-3 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-500/10 text-teal-500 border-l-[3px] border-teal-500"
                  : "text-ink-secondary hover:bg-gray-50 border-l-[3px] border-transparent",
              ].join(" ")
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-2 text-xs text-ink-muted">
        <Leaf className="w-3.5 h-3.5" />
        <span>v1.0</span>
      </div>
    </aside>
  );
}
