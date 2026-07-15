export const TAG_COLORS = [
  'slate',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'violet',
  'pink',
] as const

export type TagColor = (typeof TAG_COLORS)[number]

// Tailwind needs literal class strings in source to generate them - this map
// is that literal list (can't build class names from an arbitrary string).
const chipClasses: Record<TagColor, string> = {
  slate: 'bg-slate-100 text-slate-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  amber: 'bg-amber-100 text-amber-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  lime: 'bg-lime-100 text-lime-800',
  green: 'bg-green-100 text-green-800',
  teal: 'bg-teal-100 text-teal-800',
  cyan: 'bg-cyan-100 text-cyan-800',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  pink: 'bg-pink-100 text-pink-700',
}

const swatchClasses: Record<TagColor, string> = {
  slate: 'bg-slate-400',
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  amber: 'bg-amber-400',
  yellow: 'bg-yellow-400',
  lime: 'bg-lime-400',
  green: 'bg-green-400',
  teal: 'bg-teal-400',
  cyan: 'bg-cyan-400',
  blue: 'bg-blue-400',
  indigo: 'bg-indigo-400',
  violet: 'bg-violet-400',
  pink: 'bg-pink-400',
}

export function tagChipClass(color: string) {
  return chipClasses[color as TagColor] ?? chipClasses.slate
}

export function tagSwatchClass(color: string) {
  return swatchClasses[color as TagColor] ?? swatchClasses.slate
}
