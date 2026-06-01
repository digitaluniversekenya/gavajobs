export function slugify(title, employer, id) {
  const clean = (str) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40)

  const titleSlug = clean(title || '')
  const empSlug = clean(employer || '').slice(0, 20)
  const idSlug = (id || '').replace(/_/g, '-')

  return `${titleSlug}-${empSlug}-${idSlug}`
}