export default function DashboardLoading() {
  return (
    <div className="admin-metric-grid" aria-busy="true" aria-label="Chargement du dashboard">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="admin-metric">
          <div style={{ height: 12, width: 80, background: "var(--elevated)", borderRadius: 6, marginBottom: 10 }} />
          <div style={{ height: 24, width: 60, background: "var(--elevated)", borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
