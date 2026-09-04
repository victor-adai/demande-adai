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

  const isProd = process.env.NODE_ENV === "production";

  return (
    <header className="admin-header">
      <h1>{title}</h1>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: isProd ? "var(--success-text)" : "var(--text-muted)",
          background: isProd ? "var(--success-bg)" : "var(--elevated)",
          border: `1px solid ${isProd ? "var(--success-bg)" : "var(--border)"}`,
          borderRadius: 999,
          padding: "4px 10px",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isProd ? "var(--success)" : "var(--text-muted)",
          }}
        />
        {isProd ? "Production" : "Développement"}
      </span>
    </header>
  );
}
