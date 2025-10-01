// Profile utility functions

// Calculate BMI
export const calculateBMI = (height, weight) => {
  if (!height || !weight) return null
  const heightInMeters = Number(height) / 100
  const weightInKg = Number(weight)
  return (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
}

// Get BMI category
export const getBMICategory = (bmi) => {
  if (!bmi) return null
  const bmiValue = Number(bmi)
  if (bmiValue < 18.5) return { text: 'نقص في الوزن', color: 'text-blue-600', bg: 'bg-blue-50' }
  if (bmiValue < 25) return { text: 'وزن طبيعي', color: 'text-green-600', bg: 'bg-green-50' }
  if (bmiValue < 30) return { text: 'زيادة في الوزن', color: 'text-yellow-600', bg: 'bg-yellow-50' }
  return { text: 'سمنة', color: 'text-red-600', bg: 'bg-red-50' }
}

// Calculate BMR (Basal Metabolic Rate)
export const calculateBMR = (age, gender, height, weight) => {
  if (!age || !gender || !height || !weight) return null
  
  const ageNum = Number(age)
  const heightNum = Number(height)
  const weightNum = Number(weight)
  
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return Math.round((10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5)
  } else {
    return Math.round((10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161)
  }
}

// Calculate TDEE (Total Daily Energy Expenditure)
export const calculateTDEE = (bmr, activityLevel) => {
  if (!bmr || !activityLevel) return null
  
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }
  
  return Math.round(bmr * activityMultipliers[activityLevel])
}

// Automatic macro calculation functions
export const calculateMacros = (calories) => {
  if (!calories || calories <= 0) return { protein: '', carbs: '', fat: '' }
  
  const caloriesNum = Number(calories)
  
  // Standard macro distribution:
  // Protein: 25% of calories (4 cal/g) = 0.25 * calories / 4
  // Carbs: 45% of calories (4 cal/g) = 0.45 * calories / 4  
  // Fat: 30% of calories (9 cal/g) = 0.30 * calories / 9
  
  const protein = Math.round((caloriesNum * 0.25) / 4)
  const carbs = Math.round((caloriesNum * 0.45) / 4)
  const fat = Math.round((caloriesNum * 0.30) / 9)
  
  return { protein, carbs, fat }
}

// Generate recommendations based on data
export const generateRecommendations = (stats, goals) => {
  const recommendations = []
  const avgCalories = stats.avgCaloriesPerDay || 0
  const targetCalories = goals?.dailyCalories || 2000
  
  if (avgCalories < targetCalories * 0.8) {
    recommendations.push('تحتاج لزيادة السعرات الحرارية اليومية للوصول لهدفك')
  } else if (avgCalories > targetCalories * 1.2) {
    recommendations.push('تحتاج لتقليل السعرات الحرارية اليومية للوصول لهدفك')
  } else {
    recommendations.push('أنت على المسار الصحيح لتحقيق أهدافك')
  }
  
  const activeDays = stats.dailyData?.filter(d => d.calories > 0).length || 0
  if (activeDays < 20) {
    recommendations.push('حاول تسجيل وجباتك بانتظام أكثر لتتبع أفضل')
  }
  
  return recommendations
}
