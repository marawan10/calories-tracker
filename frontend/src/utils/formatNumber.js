// Number formatting utilities

/**
 * Format a number to remove unnecessary decimal places
 * @param {number} num - The number to format
 * @param {number} maxDecimals - Maximum decimal places (default: 1)
 * @returns {string} - Formatted number as string
 */
export function formatNumber(num, maxDecimals = 1) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0'
  }
  
  // Convert to number if it's a string
  const number = typeof num === 'string' ? parseFloat(num) : num
  
  // If it's a whole number, return without decimals
  if (number % 1 === 0) {
    return number.toString()
  }
  
  // Round to specified decimal places and remove trailing zeros
  const rounded = Math.round(number * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals)
  return rounded.toString()
}

/**
 * Format nutrition values (calories, protein, carbs, fat)
 * @param {number} value - The nutrition value
 * @returns {string} - Formatted value
 */
export function formatNutrition(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  // Handle very small numbers (close to zero)
  if (Math.abs(num) < 0.01) {
    return '0'
  }
  
  // For calories and larger values, show whole numbers
  if (num >= 10) {
    return Math.round(num).toString()
  }
  
  // For values between 1-10, show 1 decimal place
  if (num >= 1) {
    return parseFloat(num.toFixed(1)).toString()
  }
  
  // For small values (0.01-1), show 1 decimal place
  return parseFloat(num.toFixed(1)).toString()
}

/**
 * Format percentage values
 * @param {number} value - The percentage value
 * @returns {string} - Formatted percentage
 */
export function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  return Math.round(num).toString()
}
