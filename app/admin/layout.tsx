import type { ReactNode } from "react";
import AdminProviders from "./providers";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./admin.css";

export const metadata = {
  title: "ADAI Backoffice",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProviders>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,500&display=swap"
      />
      <div className="admin-root">{children}</div>
    </AdminProviders>
  );
}
