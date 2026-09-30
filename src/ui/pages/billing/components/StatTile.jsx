// Figure contract (dataviz skill): label in sentence case with no trailing
// colon, value in semibold proportional figures (never tabular-nums at
// display size - that's reserved for table columns).
export default function StatTile({ label, value, tone = "default" }) {
  return (
    <div className={`stat-tile stat-tile-${tone}`}>
      <span className="stat-tile-label">{label}</span>
      <strong className="stat-tile-value">{value}</strong>
    </div>
  )
}
