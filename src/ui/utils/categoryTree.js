// Nests a flat category list (each row carrying `id`/`parent_id`) into a
// tree, sorted by `sort_order` then name at every level. Orphaned rows
// (parent_id pointing at a missing/inactive category) are treated as roots
// so they never silently disappear from the UI.
export function buildCategoryTree(flatList = []) {
  const byId = new Map()
  flatList.forEach((category) => {
    byId.set(category.id, { ...category, children: [] })
  })

  const roots = []
  byId.forEach((category) => {
    const parentId = category.parent_id ? Number(category.parent_id) : null
    const parent = parentId !== null ? byId.get(parentId) : null

    if (parent) {
      parent.children.push(category)
    } else {
      roots.push(category)
    }
  })

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      const orderDiff = Number(a.sort_order || 0) - Number(b.sort_order || 0)
      if (orderDiff !== 0) return orderDiff
      return String(a.name || "").localeCompare(String(b.name || ""))
    })
    nodes.forEach((node) => sortNodes(node.children))
  }
  sortNodes(roots)

  return roots
}

// Flattens a tree back into an ordered list of { category, depth } pairs,
// depth-first, for rendering indented rows/options.
export function flattenCategoryTree(tree, depth = 0) {
  return tree.flatMap((node) => [
    { category: node, depth },
    ...flattenCategoryTree(node.children, depth + 1),
  ])
}

// Own product_count plus every descendant's, for a "rolled up" total shown
// on parent rows.
export function getSubtreeProductCount(node) {
  return (
    Number(node.product_count || 0) +
    node.children.reduce((sum, child) => sum + getSubtreeProductCount(child), 0)
  )
}

// Every id in the subtree rooted at `categoryId`, including itself - used to
// exclude a category (and its descendants) from its own parent picker.
export function collectSubtreeIds(flatList, categoryId) {
  const ids = new Set([Number(categoryId)])
  let added = true

  while (added) {
    added = false
    flatList.forEach((category) => {
      if (ids.has(Number(category.parent_id)) && !ids.has(category.id)) {
        ids.add(category.id)
        added = true
      }
    })
  }

  return ids
}
