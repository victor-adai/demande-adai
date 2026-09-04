"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/locales";

export default function LanguageSwitcher({ variant = "admin" }: { variant?: "admin" | "front" }) {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className={`${variant}-lang-switch`} role="group" aria-label={t("fr") + " / " + t("en")}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          className={`${variant}-lang-btn`}
          data-active={l === locale}
          disabled={pending}
          onClick={() => change(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
