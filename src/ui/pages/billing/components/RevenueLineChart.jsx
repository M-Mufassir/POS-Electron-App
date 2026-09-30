import { useMemo, useRef, useState } from "react"

const WIDTH = 760
const HEIGHT = 280
const PAD_LEFT = 56
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 32
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM

const niceMax = (value) => {
  if (value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

const formatTick = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
  return String(Math.round(value))
}

const formatDateLabel = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

// Two-series ("Sales" vs "Collected") trend line. No area fill - the
// dataviz skill reserves the area treatment for single-series charts;
// with two overlapping series, translucent fills would just muddy the read.
export default function RevenueLineChart({ data, palette, currencySymbol }) {
  const svgRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  const maxValue = useMemo(() => {
    const max = data.reduce((acc, point) => Math.max(acc, point.sales, point.collected), 0)
    return niceMax(max)
  }, [data])

  const xForIndex = (index) =>
    data.length <= 1 ? PAD_LEFT + PLOT_W / 2 : PAD_LEFT + (index / (data.length - 1)) * PLOT_W
  const yForValue = (value) => PAD_TOP + PLOT_H - (value / maxValue) * PLOT_H

  // Cheap to recompute each render (data is at most ~90 points for a
  // 90-day range) - not worth memoizing against xForIndex/yForValue,
  // which are recreated every render since they close over maxValue.
  const salesPath = data
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xForIndex(index)} ${yForValue(point.sales)}`)
    .join(" ")
  const collectedPath = data
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xForIndex(index)} ${yForValue(point.collected)}`)
    .join(" ")

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => maxValue * fraction)

  // Show at most ~8 x-axis labels regardless of range length.
  const labelStride = Math.max(1, Math.ceil(data.length / 8))

  const handlePointerMove = (event) => {
    const svg = svgRef.current
    if (!svg || data.length === 0) return
    const rect = svg.getBoundingClientRect()
    const scaleX = WIDTH / rect.width
    const localX = (event.clientX - rect.left) * scaleX
    const ratio = Math.min(1, Math.max(0, (localX - PAD_LEFT) / PLOT_W))
    const index = Math.round(ratio * (data.length - 1))
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)))
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null
  const tooltipLeft = hoverIndex !== null ? (xForIndex(hoverIndex) / WIDTH) * 100 : 0
  const tooltipAlignRight = tooltipLeft > 60

  if (data.length === 0) {
    return <div className="chart-empty">No bills in this date range yet.</div>
  }

  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span className="chart-legend-item">
          <span className="chart-legend-line" style={{ background: palette.series.sales }} />
          Sales
        </span>
        <span className="chart-legend-item">
          <span className="chart-legend-line" style={{ background: palette.series.collected }} />
          Collected
        </span>
      </div>

      <div className="chart-svg-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="chart-svg"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
          role="img"
          aria-label="Sales and collected revenue over time"
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={yForValue(tick)}
                y2={yForValue(tick)}
                stroke={palette.gridline}
                strokeWidth="1"
              />
              <text x={PAD_LEFT - 8} y={yForValue(tick) + 4} textAnchor="end" fontSize="11" fill={palette.mutedInk}>
                {formatTick(tick)}
              </text>
            </g>
          ))}

          {data.map((point, index) =>
            index % labelStride === 0 ? (
              <text
                key={point.date}
                x={xForIndex(index)}
                y={HEIGHT - 10}
                textAnchor="middle"
                fontSize="11"
                fill={palette.mutedInk}
              >
                {formatDateLabel(point.date)}
              </text>
            ) : null,
          )}

          <path d={salesPath} fill="none" stroke={palette.series.sales} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path
            d={collectedPath}
            fill="none"
            stroke={palette.series.collected}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {hoverIndex !== null ? (
            <line
              x1={xForIndex(hoverIndex)}
              x2={xForIndex(hoverIndex)}
              y1={PAD_TOP}
              y2={PAD_TOP + PLOT_H}
              stroke={palette.axis}
              strokeWidth="1"
            />
          ) : null}

          {data.map((point, index) => {
            const isHovered = index === hoverIndex
            const radius = isHovered ? 5 : 4
            return (
              <g key={point.date}>
                <circle
                  cx={xForIndex(index)}
                  cy={yForValue(point.sales)}
                  r={radius}
                  fill={palette.series.sales}
                  stroke={palette.surface}
                  strokeWidth="2"
                  opacity={isHovered ? 1 : 0.001}
                />
                <circle
                  cx={xForIndex(index)}
                  cy={yForValue(point.collected)}
                  r={radius}
                  fill={palette.series.collected}
                  stroke={palette.surface}
                  strokeWidth="2"
                  opacity={isHovered ? 1 : 0.001}
                />
              </g>
            )
          })}
        </svg>

        {hovered ? (
          <div
            className="chart-tooltip"
            style={{
              left: `${tooltipLeft}%`,
              transform: tooltipAlignRight ? "translateX(-100%)" : "translateX(0)",
            }}
          >
            <div className="chart-tooltip-title">{formatDateLabel(hovered.date)}</div>
            <div className="chart-tooltip-row">
              <span className="chart-tooltip-key" style={{ background: palette.series.sales }} />
              <span className="chart-tooltip-label">Sales</span>
              <strong className="chart-tooltip-value">
                {currencySymbol} {hovered.sales.toFixed(2)}
              </strong>
            </div>
            <div className="chart-tooltip-row">
              <span className="chart-tooltip-key" style={{ background: palette.series.collected }} />
              <span className="chart-tooltip-label">Collected</span>
              <strong className="chart-tooltip-value">
                {currencySymbol} {hovered.collected.toFixed(2)}
              </strong>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
