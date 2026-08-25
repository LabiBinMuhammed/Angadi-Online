export type DatePreset = 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_month' | 'custom'

export function getDateRangeFromPreset(preset: DatePreset): { start: string; end: string } {
  const today = new Date()
  const formatDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const todayStr = formatDate(today)

  switch (preset) {
    case 'today':
      return { start: todayStr, end: todayStr }

    case 'yesterday': {
      const yest = new Date(today)
      yest.setDate(yest.getDate() - 1)
      const yestStr = formatDate(yest)
      return { start: yestStr, end: yestStr }
    }

    case 'last_7_days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { start: formatDate(start), end: todayStr }
    }

    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: formatDate(start), end: todayStr }
    }

    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return { start: formatDate(start), end: formatDate(end) }
    }

    default:
      return { start: todayStr, end: todayStr }
  }
}
