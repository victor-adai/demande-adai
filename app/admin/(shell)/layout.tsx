import type { ReactNode } from "react";
import AdminSidebar from "./admin-sidebar";
import AdminHeader from "./admin-header";

export default function AdminShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
