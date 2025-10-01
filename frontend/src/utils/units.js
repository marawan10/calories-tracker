// Unit system based on food categories
export const categoryUnits = {
  fruits: { unit: 'g', label: 'جم', displayLabel: 'لكل 100 جم' },
  vegetables: { unit: 'g', label: 'جم', displayLabel: 'لكل 100 جم' },
  grains: { unit: 'g', label: 'جم', displayLabel: 'لكل 100 جم' },
  protein: { unit: 'g', label: 'جم', displayLabel: 'لكل 100 جم' },
  dairy: { unit: 'ml', label: 'مل', displayLabel: 'لكل 100 مل' },
  nuts_seeds: { unit: 'g', label: 'جم', displayLabel: 'لكل 100 جم' },
  oils_fats: { unit: 'ml', label: 'مل', displayLabel: 'لكل 100 مل' },
  beverages: { unit: 'ml', label: 'مل', displayLabel: 'لكل 100 مل' },
  sweets: { unit: 'g', label: 'جم', displayLabel: 'لكل 100 جم' },
  snacks: { unit: 'g', label: 'جم', displayLabel: 'لكل 100 جم' },
  prepared_foods: { unit: 'g', label: 'جم', displayLabel: 'لكل 100 جم' },
  other: { unit: 'g', label: 'جم', displayLabel: 'لكل 100 جم' },
}

// Available units for admin to choose from
export const availableUnits = [
  { value: 'g', label: 'جرام (جم)', displayLabel: 'لكل 100 جم' },
  { value: 'ml', label: 'مليلتر (مل)', displayLabel: 'لكل 100 مل' },
  { value: 'piece', label: 'قطعة', displayLabel: 'لكل قطعة' },
  { value: 'cup', label: 'كوب', displayLabel: 'لكل كوب' },
  { value: 'tbsp', label: 'ملعقة كبيرة', displayLabel: 'لكل ملعقة كبيرة' },
  { value: 'tsp', label: 'ملعقة صغيرة', displayLabel: 'لكل ملعقة صغيرة' },
]

// Get unit info for a category
export function getUnitForCategory(category) {
  return categoryUnits[category] || categoryUnits.other
}

// Get unit info by unit value
export function getUnitInfo(unitValue) {
  return availableUnits.find(u => u.value === unitValue) || availableUnits[0]
}

// Get display label for a food item
export function getDisplayLabel(food) {
  if (food.servingSize && food.servingSize.unit) {
    const unitInfo = getUnitInfo(food.servingSize.unit)
    if (food.servingSize.amount === 100) {
      return unitInfo.displayLabel
    } else {
      return `لكل ${food.servingSize.amount} ${unitInfo.label}`
    }
  }
  
  // Fallback to category-based unit
  const categoryUnit = getUnitForCategory(food.category)
  return categoryUnit.displayLabel
}
