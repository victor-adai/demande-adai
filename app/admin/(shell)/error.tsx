"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="admin-card" role="alert">
      <h2>Une erreur est survenue</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>{error.message}</p>
      <button className="admin-btn" onClick={reset}>
        Réessayer
      </button>
    </div>
  );
}
