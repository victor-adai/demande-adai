export default function DemandesLoading() {
  return (
    <div className="admin-card" aria-busy="true" aria-label="Chargement des demandes">
      <div style={{ height: 20, width: 240, background: "var(--elevated)", borderRadius: 8, marginBottom: 20 }} />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ height: 16, background: "var(--elevated)", borderRadius: 6, marginBottom: 10 }} />
      ))}
    </div>
  );
}
