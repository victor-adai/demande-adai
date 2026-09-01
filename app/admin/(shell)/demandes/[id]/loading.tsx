export default function DemandeDetailLoading() {
  return (
    <div className="admin-detail-grid" aria-busy="true" aria-label="Chargement de la demande">
      {[1, 2, 3].map((i) => (
        <div key={i} className="admin-card">
          <div style={{ height: 14, width: 140, background: "var(--elevated)", borderRadius: 6, marginBottom: 16 }} />
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} style={{ height: 12, background: "var(--elevated)", borderRadius: 6, marginBottom: 10 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
