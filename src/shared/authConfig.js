export const DEFAULT_ADMIN_CREDENTIALS = Object.freeze({
  username: "Admin",
  password: "12345",
})

export const AUTH_ROLE_DEFINITIONS = Object.freeze([
  {
    key: "admin",
    name: "Admin",
    description: "Administrator with full access",
    permissions: {
      delete_bill_records: true,
      delete_product: true,
      manage_bill_history: true,
      manage_passwords: true,
      manage_products: true,
      manage_catalog: true,
      manage_users: true,
      manage_settings: true,
    },
  },
  {
    key: "cashier",
    name: "Cashier",
    description: "Can sell products and manage orders",
    permissions: {
      delete_bill_records: false,
      delete_product: false,
      manage_bill_history: true,
      manage_passwords: false,
      manage_products: false,
      manage_catalog: false,
      manage_users: false,
      manage_settings: false,
    },
  },
  {
    key: "manager",
    name: "Manager",
    description: "Manages inventory and reports",
    permissions: {
      delete_bill_records: false,
      delete_product: false,
      manage_bill_history: true,
      manage_passwords: false,
      manage_products: true,
      manage_catalog: true,
      manage_users: false,
      manage_settings: false,
    },
  },
])

export const normalizeRoleName = (roleName) => String(roleName || "").trim().toLowerCase()

export const getPermissionsForRole = (roleName) => {
  const normalized = normalizeRoleName(roleName)
  const role = AUTH_ROLE_DEFINITIONS.find((entry) => entry.key === normalized)
  return role?.permissions || AUTH_ROLE_DEFINITIONS.find((entry) => entry.key === "cashier")?.permissions || {}
}

export const getRoleSortOrder = (roleName) => {
  const normalized = normalizeRoleName(roleName)
  const index = AUTH_ROLE_DEFINITIONS.findIndex((entry) => entry.key === normalized)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

export const isAdminRole = (roleName) => normalizeRoleName(roleName) === "admin"
