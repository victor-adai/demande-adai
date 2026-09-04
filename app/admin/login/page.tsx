"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function AdminLoginPage() {
  const router = useRouter();
  const t = useTranslations("AdminLogin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(t("invalidCredentials"));
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-topbar">
          <span className="mark">ΛDΛI</span>
          <span className="sep" />
          <span className="sub">Backoffice</span>
        </div>

        <div className="login-center">
          <div className="login-badge">
            <span className="dot" />
            {t("badge")}
          </div>

          <div className="login-logo-big">ΛDΛI</div>

          <h1 className="login-headline">
            {t("headlineLine1")}
            <br />
            <em>{t("headlineLine2")}</em>
          </h1>
          <p className="login-sub">{t("sub")}</p>

          <div className="login-features">
            <div className="login-feature-card">
              <i className="fa-solid fa-table-cells-large" aria-hidden="true" />
              <span>{t("featureDashboard")}</span>
            </div>
            <div className="login-feature-card">
              <i className="fa-solid fa-inbox" aria-hidden="true" />
              <span>{t("featureDemandes")}</span>
            </div>
            <div className="login-feature-card">
              <i className="fa-solid fa-book" aria-hidden="true" />
              <span>{t("featureCatalogue")}</span>
            </div>
          </div>
        </div>

        <div className="login-bottom">
          <span className="copyright">{t("copyright")}</span>
          <div className="login-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-brand-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/adai-logo.png" alt="ΛDΛI" className="mark-box" />
            <span>{t("brand")}</span>
          </div>
          <span className="login-brand-sub">{t("administration")}</span>

          <div className="login-heading">
            <h2>{t("connexion")}</h2>
            <p>{t("welcome")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field-wrap">
              <i className="fa-regular fa-envelope input-icon" aria-hidden="true" />
              <input
                id="email"
                type="email"
                placeholder="email@adaiexpertise.fr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label htmlFor="email">{t("emailLabel")}</label>
            </div>

            <div className="field-wrap">
              <i className="fa-solid fa-lock input-icon" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: 42 }}
              />
              <label htmlFor="password">{t("passwordLabel")}</label>
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} aria-hidden="true" />
              </button>
            </div>

            {error && (
              <p role="alert" style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>
                {error}
              </p>
            )}

            <button type="submit" className="admin-btn login-submit" disabled={loading}>
              <span>{loading ? t("connecting") : t("submit")}</span>
              {!loading && <i className="fa-solid fa-arrow-right" style={{ fontSize: 12 }} aria-hidden="true" />}
            </button>
          </form>

          <div className="login-security-note">
            <i className="fa-solid fa-shield-halved" aria-hidden="true" />
            <span>{t("securityNote")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
