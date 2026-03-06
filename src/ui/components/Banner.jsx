import React from "react"

export default function Banner({ type = "success", message = "", onClose }) {
  if (!message) return null

  const styles =
    type === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : type === "warning"
        ? "bg-amber-50 border-amber-200 text-amber-800"
        : "bg-green-50 border-green-200 text-green-800"

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-center justify-between ${styles}`}>
      <p className="text-sm font-medium">{message}</p>
      {onClose ? (
        <button type="button" onClick={onClose} className="text-sm underline">
          Dismiss
        </button>
      ) : null}
    </div>
  )
}

