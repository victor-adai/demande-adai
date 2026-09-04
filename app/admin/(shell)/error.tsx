"use client";

import { useTranslations } from "next-intl";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("AdminError");
  return (
    <div className="admin-card" role="alert">
      <h2>{t("title")}</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>{error.message}</p>
      <button className="admin-btn" onClick={reset}>
        {t("retry")}
      </button>
    </div>
  );
}
