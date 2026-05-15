import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <>
      <div className="gradient-bg" />
      <div
        className="grid h-screen relative"
        style={{ gridTemplateColumns: "220px 1fr", padding: "14px", gap: "14px" }}
      >
        <Sidebar />
        <main className="glass-panel rounded-xl shadow-glass overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </>
  );
}
