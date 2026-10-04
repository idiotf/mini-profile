export function getExtOf(name: string) {
  return name.replace(/^.*\.|^[^.]*$/, '')
}

export function formatExt(ext: string) {
  return ext === 'webp' ? 'WebP' : ext === 'webm' ? 'WebM' : ext.toUpperCase()
}

const kib = 1024
const mib = 1024 * kib
const gib = 1024 * mib

export function formatFileSize(size: number) {
  if (size >= gib) return `${(size / gib).toFixed(1)}GiB`
  if (size >= mib) return `${(size / mib).toFixed(1)}MiB`
  if (size >= kib) return `${(size / kib).toFixed(1)}KiB`
  return `${size} bytes`
}
