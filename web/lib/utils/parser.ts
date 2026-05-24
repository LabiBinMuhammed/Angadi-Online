import { Unit } from '@/types'

interface ParsedVariant {
  value: number
  unitId: string | null
  label: string
}

/**
 * Auto-parses a variant label to extract quantity values and units.
 * @param label - E.g. "500g", "1.5L", "250 ml", "10"
 * @param categoryId - The item's category ID for unit system fallbacks
 * @param dbUnits - List of available units from database
 */
export function parseVariantLabel(
  label: string,
  categoryId: string,
  dbUnits: Unit[]
): ParsedVariant {
  const cleanLabel = label.trim()
  if (!cleanLabel) {
    return { value: 1, unitId: null, label: '' }
  }

  // Regular expression to capture numbers (including decimal) and optional unit symbols/letters
  const match = cleanLabel.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/)
  
  if (!match) {
    // If it's a descriptive variant label like "Family Pack" or "Small Box" rather than a measure,
    // default to value 1 and no specific unit
    return { value: 1, unitId: null, label: cleanLabel }
  }

  const rawValue = parseFloat(match[1])
  const rawUnit = match[2] ? match[2].trim().toLowerCase() : null

  let matchedUnit: Unit | undefined = undefined

  if (rawUnit) {
    // Attempt to match symbol or name in database units (case-insensitive)
    matchedUnit = dbUnits.find(
      u =>
        u.symbol.toLowerCase() === rawUnit ||
        u.name.toLowerCase() === rawUnit ||
        (rawUnit === 'l' && u.symbol === 'L') // specific volume case
    )
  }

  // Fallback logic when no unit is specified (or if specified unit isn't found)
  if (!matchedUnit) {
    // Define category types based on system seeds
    const isLiquid = categoryId === 'cat-oil' || categoryId === 'cat-dairy'
    const isCount = categoryId === 'cat-bakery'

    if (isCount) {
      matchedUnit = dbUnits.find(u => u.symbol === 'pcs')
    } else if (rawValue > 100) {
      // If it is more than 100 set ml or g
      const fallbackSymbol = isLiquid ? 'ml' : 'g'
      matchedUnit = dbUnits.find(u => u.symbol === fallbackSymbol)
    } else {
      // If under 100 set as L or Kg
      const fallbackSymbol = isLiquid ? 'L' : 'kg'
      matchedUnit = dbUnits.find(u => u.symbol === fallbackSymbol)
    }
  }

  return {
    value: rawValue,
    unitId: matchedUnit ? matchedUnit.id : null,
    label: cleanLabel
  }
}
