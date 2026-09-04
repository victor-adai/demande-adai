"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
            marginBottom: 16,
          }}
        />
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          ΛDΛI Backoffice
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Connexion administrateur</p>

        <label htmlFor="email" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          className="admin-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />

        <label htmlFor="password" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          className="admin-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />

        {error && (
          <p role="alert" style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button type="submit" className="admin-btn" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
