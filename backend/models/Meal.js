const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0.1, 'Weight must be at least 0.1 gram'],
    max: [5000, 'Weight cannot exceed 5000 grams']
  },
  // Store calculated nutrition at time of logging (in case food is modified later)
  nutrition: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 }
  }
});

const mealSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mealType: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  items: [mealItemSchema],
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  // Calculated totals for the entire meal
  totals: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
mealSchema.index({ user: 1, date: -1 });
mealSchema.index({ user: 1, mealType: 1, date: -1 });

// Pre-save middleware to calculate meal totals
mealSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

// Method to calculate meal totals
mealSchema.methods.calculateTotals = function() {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  this.items.forEach(item => {
    totals.calories += item.nutrition.calories || 0;
    totals.protein += item.nutrition.protein || 0;
    totals.carbs += item.nutrition.carbs || 0;
    totals.fat += item.nutrition.fat || 0;
    totals.fiber += item.nutrition.fiber || 0;
    totals.sugar += item.nutrition.sugar || 0;
    totals.sodium += item.nutrition.sodium || 0;
  });

  // Round to appropriate decimal places
  this.totals = {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
    fiber: Math.round(totals.fiber * 10) / 10,
    sugar: Math.round(totals.sugar * 10) / 10,
    sodium: Math.round(totals.sodium)
  };
};

// Static method to get daily totals for a user
mealSchema.statics.getDailyTotals = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const meals = await this.find({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  const dailyTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    mealCount: meals.length
  };

  meals.forEach(meal => {
    dailyTotals.calories += meal.totals.calories || 0;
    dailyTotals.protein += meal.totals.protein || 0;
    dailyTotals.carbs += meal.totals.carbs || 0;
    dailyTotals.fat += meal.totals.fat || 0;
    dailyTotals.fiber += meal.totals.fiber || 0;
    dailyTotals.sugar += meal.totals.sugar || 0;
    dailyTotals.sodium += meal.totals.sodium || 0;
  });

  // Round totals
  Object.keys(dailyTotals).forEach(key => {
    if (key !== 'mealCount') {
      dailyTotals[key] = key === 'calories' || key === 'sodium' 
        ? Math.round(dailyTotals[key])
        : Math.round(dailyTotals[key] * 10) / 10;
    }
  });

  return { dailyTotals, meals };
};

// Static method to get weekly/monthly statistics
mealSchema.statics.getStatistics = async function(userId, startDate, endDate) {
  const meals = await this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).populate('items.food', 'name nameAr category categoryAr');

  const stats = {
    totalMeals: meals.length,
    avgCaloriesPerDay: 0,
    avgProteinPerDay: 0,
    avgCarbsPerDay: 0,
    avgFatPerDay: 0,
    mostLoggedFoods: {},
    categoryBreakdown: {},
    dailyData: []
  };

  // Calculate daily data
  const dailyMap = new Map();
  
  meals.forEach(meal => {
    const dateKey = meal.date.toISOString().split('T')[0];
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        mealCount: 0
      });
    }
    
    const dayData = dailyMap.get(dateKey);
    dayData.calories += meal.totals.calories || 0;
    dayData.protein += meal.totals.protein || 0;
    dayData.carbs += meal.totals.carbs || 0;
    dayData.fat += meal.totals.fat || 0;
    dayData.mealCount += 1;

    // Track food frequency and categories
    meal.items.forEach(item => {
      if (item.food) {
        const foodName = item.food.nameAr || item.food.name;
        const category = item.food.categoryAr || item.food.category;
        
        stats.mostLoggedFoods[foodName] = (stats.mostLoggedFoods[foodName] || 0) + 1;
        stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + item.weight;
      }
    });
  });

  stats.dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate averages
  const daysCount = stats.dailyData.length || 1;
  const totalCalories = stats.dailyData.reduce((sum, day) => sum + day.calories, 0);
  const totalProtein = stats.dailyData.reduce((sum, day) => sum + day.protein, 0);
  const totalCarbs = stats.dailyData.reduce((sum, day) => sum + day.carbs, 0);
  const totalFat = stats.dailyData.reduce((sum, day) => sum + day.fat, 0);

  stats.avgCaloriesPerDay = Math.round(totalCalories / daysCount);
  stats.avgProteinPerDay = Math.round((totalProtein / daysCount) * 10) / 10;
  stats.avgCarbsPerDay = Math.round((totalCarbs / daysCount) * 10) / 10;
  stats.avgFatPerDay = Math.round((totalFat / daysCount) * 10) / 10;

  return stats;
};

module.exports = mongoose.model('Meal', mealSchema);
