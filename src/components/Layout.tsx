import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto min-h-screen bg-surface">
        <Outlet />
      </main>
    </div>
  );
}
