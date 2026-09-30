import { useMemo, useState } from "react"

// Horizontal bar breakdown (status or payment-method totals). Each bar
// carries its own category label to the left and its value to the right of
// the bar's tip - direct labels are mandatory here (the dataviz skill's
// 4-slot categorical palette has two slots below 3:1 contrast on the light
// surface), and since every bar is already individually labeled, no
// separate legend is needed - there's nothing left for color-matching to do.
export default function BreakdownBarChart({ items, palette, formatValue, emptyLabel }) {
  const [hoveredKey, setHoveredKey] = useState(null)
  const maxValue = useMemo(() => Math.max(1, ...items.map((item) => item.value)), [items])
  const total = useMemo(() => items.reduce((sum, item) => sum + item.value, 0), [items])

  if (total <= 0) {
    return <div className="chart-empty">{emptyLabel || "No data in this range."}</div>
  }

  return (
    <div className="hbar-chart">
      {items.map((item, index) => {
        const color = palette.categorical[index % palette.categorical.length]
        const widthPercent = Math.max(2, (item.value / maxValue) * 100)
        const isHovered = hoveredKey === item.key

        return (
          <div
            key={item.key}
            className={`hbar-row ${isHovered ? "hovered" : ""}`}
            onPointerEnter={() => setHoveredKey(item.key)}
            onPointerLeave={() => setHoveredKey((prev) => (prev === item.key ? null : prev))}
            tabIndex={0}
            onFocus={() => setHoveredKey(item.key)}
            onBlur={() => setHoveredKey((prev) => (prev === item.key ? null : prev))}
          >
            <span className="hbar-label">{item.label}</span>
            <div className="hbar-track">
              <div
                className="hbar-fill"
                style={{ width: `${widthPercent}%`, background: color, opacity: isHovered ? 1 : 0.9 }}
              />
            </div>
            <span className="hbar-value">
              {formatValue(item.value)}
              {isHovered ? <span className="hbar-count"> · {item.count} bill{item.count === 1 ? "" : "s"}</span> : null}
            </span>
          </div>
        )
      })}
    </div>
  )
}
