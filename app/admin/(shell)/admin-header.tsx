"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/demandes": "Demandes",
  "/admin/catalogue": "Catalogue",
  "/admin/parametres": "Paramètres ROI",
};

export default function AdminHeader() {
  const pathname = usePathname() ?? "";
  const title =
    TITLES[pathname] ??
    (pathname.startsWith("/admin/demandes/") ? "Détail demande" : "Backoffice");

  return (
    <header className="admin-header">
      <h1>{title}</h1>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {process.env.NODE_ENV === "production" ? "PRODUCTION" : "DÉVELOPPEMENT"}
      </span>
    </header>
  );
}
