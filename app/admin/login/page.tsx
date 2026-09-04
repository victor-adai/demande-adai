"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
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
      setError("Identifiants invalides.");
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
            Espace interne ADAI
          </div>

          <div className="login-logo-big">ΛDΛI</div>

          <h1 className="login-headline">
            Qualifier. Configurer.
            <br />
            <em>Rentabiliser.</em>
          </h1>
          <p className="login-sub">
            Le backoffice interne ADAI : pilotage des demandes, du catalogue et de la rentabilité du Cockpit
            Builder V6.
          </p>

          <div className="login-features">
            <div className="login-feature-card">
              <i className="fa-solid fa-table-cells-large" aria-hidden="true" />
              <span>Dashboard</span>
            </div>
            <div className="login-feature-card">
              <i className="fa-solid fa-inbox" aria-hidden="true" />
              <span>Demandes</span>
            </div>
            <div className="login-feature-card">
              <i className="fa-solid fa-book" aria-hidden="true" />
              <span>Catalogue</span>
            </div>
          </div>
        </div>

        <div className="login-bottom">
          <span className="copyright">© 2026 ΛDΛI — THINK • BUILD • SCALE</span>
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
            <div className="mark-box" />
            <span>ΛDΛI Backoffice</span>
          </div>
          <span className="login-brand-sub">Administration</span>

          <div className="login-heading">
            <h2>Connexion</h2>
            <p>Bienvenue. Veuillez vous identifier pour continuer.</p>
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
              <label htmlFor="email">Adresse email admin</label>
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
              <label htmlFor="password">Mot de passe</label>
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
              <span>{loading ? "Connexion..." : "Se connecter"}</span>
              {!loading && <i className="fa-solid fa-arrow-right" style={{ fontSize: 12 }} aria-hidden="true" />}
            </button>
          </form>

          <div className="login-security-note">
            <i className="fa-solid fa-shield-halved" aria-hidden="true" />
            <span>Connexion sécurisée · Accès restreint aux administrateurs ADAI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
