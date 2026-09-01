import type { ReactNode } from "react";
import AdminProviders from "./providers";
import "./admin.css";

export const metadata = {
  title: "ADAI Backoffice",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProviders>
      <div className="admin-root">{children}</div>
    </AdminProviders>
  );
}
