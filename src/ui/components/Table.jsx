import React from "react"

function Table({ data = [], tableSchema = [], onRowClick, onActionClick, actionLabel = "View" }) {

  const handleRowClicked = (id) => {
    if (onRowClick) {
      onRowClick(id)
    }
  }

  const handleActionClicked = (event, row) => {
    event.stopPropagation()
    if (onActionClick) {
      onActionClick(row.id, row)
      return
    }
    handleRowClicked(row.id)
  }

  return (
    <div className="pos-card overflow-hidden h-full flex flex-col">
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="pos-table">
          <thead>
            <tr>
              {tableSchema.map((col) => (
                <th key={col.key}>
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                className={onRowClick ? "cursor-pointer" : ""}
                onClick={() => handleRowClicked(row.id)}
              >
                {tableSchema.map((col) => {
                  
                  if (col.type === "action") {
                    return (
                      <td key={col.key} className="text-center">
                        <button
                          onClick={(e) => handleActionClicked(e, row)}
                          className="pos-btn-primary py-2 px-4 inline-block"
                          title={actionLabel}
                        >
                          {actionLabel}
                        </button>
                      </td>
                    )
                  }

                  if (col.type === "status") {
                    const isActive = Number(row[col.key]) === 1
                    return (
                      <td key={col.key}>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    )
                  }

                  // Handle Normal Columns
                  return (
                    <td key={col.key} className="text-gray-700 font-medium">
                      {col.type === "number" 
                        ? typeof row[col.key] === "number" 
                          ? `$${row[col.key].toFixed(2)}`
                          : row[col.key] ?? "-"
                        : row[col.key] ?? "-"
                      }
                    </td>
                  )
                })}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td
                  colSpan={tableSchema.length}
                  className="text-center py-8 text-gray-500 font-medium"
                >
                  No products found. Add one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table
