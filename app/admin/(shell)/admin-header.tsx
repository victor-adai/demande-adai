"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/language-switcher";

export default function AdminHeader() {
  const pathname = usePathname() ?? "";
  const t = useTranslations("AdminHeader");

  const titles: Record<string, string> = {
    "/admin/dashboard": t("titleDashboard"),
    "/admin/demandes": t("titleDemandes"),
    "/admin/catalogue": t("titleCatalogue"),
    "/admin/parametres": t("titleParametres"),
  };

  const title = titles[pathname] ?? (pathname.startsWith("/admin/demandes/") ? t("titleDemandeDetail") : t("titleFallback"));

  const isProd = process.env.NODE_ENV === "production";

  return (
    <header className="admin-header">
      <h1>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <LanguageSwitcher />
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
          {isProd ? t("production") : t("development")}
        </span>
      </div>
    </header>
  );
}
