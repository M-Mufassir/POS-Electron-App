import React from "react"
import { useNavigate } from "react-router-dom"

function Table({ data = [], tableSchema = [] }) {
  const navigate = useNavigate()

  const handleActionClicked = (id) => {
    navigate(`/products/${id}`)
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              {tableSchema.map((col) => (
                <th key={col.key} className="px-6 py-4">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition">
                {tableSchema.map((col) => {
                  
                  if (col.type === "action") {
                    return (
                      <td key={col.key} className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleActionClicked(row.id)}
                          className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110"
                        >
                          ➜
                        </button>
                      </td>
                    )
                  }

                  // 🔥 Handle Normal Columns
                  return (
                    <td key={col.key} className="px-6 py-4">
                      {row[col.key] ?? "-"}
                    </td>
                  )
                })}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td
                  colSpan={tableSchema.length}
                  className="text-center py-6 text-gray-500"
                >
                  No data found.
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