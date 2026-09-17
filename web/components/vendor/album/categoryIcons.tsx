import React from 'react'
import {
  Carrot, Apple, Wheat, Milk, Flame, Croissant,
  GlassWater, Fish, Sparkles, Package, Cookie, IceCream, Layers
} from 'lucide-react'

export function getCategoryIcon(name: string, size = 28) {
  const n = (name || '').toLowerCase()
  if (n.includes('vegetable') || n.includes('veg') || n.includes('പച്ചക്കറി')) {
    return <Carrot size={size} color="#22c55e" />
  }
  if (n.includes('fruit') || n.includes('പഴങ്ങൾ')) {
    return <Apple size={size} color="#ef4444" />
  }
  if (n.includes('rice') || n.includes('atta') || n.includes('flour') || n.includes('അരി')) {
    return <Wheat size={size} color="#eab308" />
  }
  if (n.includes('dal') || n.includes('pulse') || n.includes('bean') || n.includes('പരിപ്പ്')) {
    return <Layers size={size} color="#f97316" />
  }
  if (n.includes('dairy') || n.includes('പാൽ') || n.includes('milk')) {
    return <Milk size={size} color="#06b6d4" />
  }
  if (n.includes('cooking') || n.includes('oil') || n.includes('ghee') || n.includes('എണ്ണ')) {
    return <Flame size={size} color="#f59e0b" />
  }
  if (n.includes('spice') || n.includes('masala') || n.includes('മസാല')) {
    return <Flame size={size} color="#dc2626" />
  }
  if (n.includes('biscuit') || n.includes('cookie') || n.includes('ബിസ്ക്കറ്റ്')) {
    return <Cookie size={size} color="#d97706" />
  }
  if (n.includes('bakery') || n.includes('bread') || n.includes('ബേക്കറി')) {
    return <Croissant size={size} color="#b45309" />
  }
  if (n.includes('beverage') || n.includes('tea') || n.includes('coffee') || n.includes('പാനീയ')) {
    return <GlassWater size={size} color="#3b82f6" />
  }
  if (n.includes('dessert') || n.includes('ice cream') || n.includes('ഐസ്')) {
    return <IceCream size={size} color="#ec4899" />
  }
  if (n.includes('meat') || n.includes('fish') || n.includes('മത്സ്യം') || n.includes('ഇറച്ചി')) {
    return <Fish size={size} color="#6366f1" />
  }
  if (n.includes('personal') || n.includes('hygiene') || n.includes('സോപ്പ്')) {
    return <Sparkles size={size} color="#a855f7" />
  }
  return <Package size={size} color="#8b5cf6" />
}
