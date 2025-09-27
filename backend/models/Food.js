const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
    maxlength: [100, 'Food name cannot exceed 100 characters']
  },
  nameAr: {
    type: String,
    trim: true,
    maxlength: [100, 'Arabic name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'fruits',
      'vegetables',
      'grains',
      'protein',
      'dairy',
      'nuts_seeds',
      'oils_fats',
      'beverages',
      'sweets',
      'snacks',
      'prepared_foods',
      'other'
    ]
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  // Nutritional values per 100 grams
  nutrition: {
    calories: {
      type: Number,
      required: [true, 'Calories per 100g is required'],
      min: [0, 'Calories cannot be negative'],
      max: [2000, 'Calories per 100g seems too high']
    },
    protein: {
      type: Number,
      required: [true, 'Protein per 100g is required'],
      min: [0, 'Protein cannot be negative'],
      max: [100, 'Protein per 100g cannot exceed 100g']
    },
    carbs: {
      type: Number,
      required: [true, 'Carbohydrates per 100g is required'],
      min: [0, 'Carbs cannot be negative'],
      max: [100, 'Carbs per 100g cannot exceed 100g']
    },
    fat: {
      type: Number,
      required: [true, 'Fat per 100g is required'],
      min: [0, 'Fat cannot be negative'],
      max: [100, 'Fat per 100g cannot exceed 100g']
    },
    fiber: {
      type: Number,
      min: [0, 'Fiber cannot be negative'],
      max: [100, 'Fiber per 100g cannot exceed 100g'],
      default: 0
    },
    sugar: {
      type: Number,
      min: [0, 'Sugar cannot be negative'],
      max: [100, 'Sugar per 100g cannot exceed 100g'],
      default: 0
    },
    sodium: {
      type: Number,
      min: [0, 'Sodium cannot be negative'],
      max: [50000, 'Sodium per 100g seems too high (mg)'],
      default: 0
    }
  },
  servingSize: {
    amount: {
      type: Number,
      default: 100
    },
    unit: {
      type: String,
      enum: ['g', 'ml', 'piece', 'cup', 'tbsp', 'tsp'],
      default: 'g'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  per100g: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better search performance
foodSchema.index({ name: 'text', nameAr: 'text', tags: 'text' });
foodSchema.index({ category: 1 });
foodSchema.index({ createdBy: 1 });
foodSchema.index({ isPublic: 1 });

// Virtual for calculating nutrition per serving
foodSchema.virtual('nutritionPerServing').get(function() {
  let ratio;
  
  // Handle different serving units
  if (this.servingSize.unit === 'piece' || this.servingSize.unit === 'cup' || 
      this.servingSize.unit === 'tbsp' || this.servingSize.unit === 'tsp') {
    // For unit-based foods, nutrition values are already per unit
    ratio = 1;
  } else {
    // For weight-based foods, calculate ratio based on serving size vs 100g/100ml
    ratio = this.servingSize.amount / 100;
  }
  
  return {
    calories: Math.round(this.nutrition.calories * ratio),
    protein: Math.round(this.nutrition.protein * ratio * 10) / 10,
    carbs: Math.round(this.nutrition.carbs * ratio * 10) / 10,
    fat: Math.round(this.nutrition.fat * ratio * 10) / 10,
    fiber: Math.round(this.nutrition.fiber * ratio * 10) / 10,
    sugar: Math.round(this.nutrition.sugar * ratio * 10) / 10,
    sodium: Math.round(this.nutrition.sodium * ratio)
  };
});

// Method to calculate nutrition for a specific weight/amount
foodSchema.methods.calculateNutrition = function(amount) {
  let ratio;
  
  // Safety check for servingSize
  if (!this.servingSize) {
    console.warn(`Food ${this.name} missing servingSize, defaulting to 100g`);
    ratio = amount / 100;
  } else {
    // Handle different serving units
    if (this.servingSize.unit === 'piece' || this.servingSize.unit === 'cup' || 
        this.servingSize.unit === 'tbsp' || this.servingSize.unit === 'tsp') {
      // For unit-based foods, nutrition values are per unit (piece, cup, tbsp, tsp)
      // So if someone wants 2 pieces/cups/etc, multiply by 2
      ratio = amount / (this.servingSize.amount || 1);
    } else {
      // For weight-based foods (g, ml), nutrition values are per 100g/100ml
      // So calculate ratio based on 100g/100ml
      ratio = amount / 100;
    }
  }
  
  // Safety check for nutrition field
  if (!this.nutrition) {
    console.error(`Food ${this.name} missing nutrition data`);
    throw new Error(`Food ${this.name} missing nutrition data`);
  }
  
  return {
    calories: Math.round((this.nutrition.calories || 0) * ratio),
    protein: Math.round((this.nutrition.protein || 0) * ratio * 10) / 10,
    carbs: Math.round((this.nutrition.carbs || 0) * ratio * 10) / 10,
    fat: Math.round((this.nutrition.fat || 0) * ratio * 10) / 10,
    fiber: Math.round((this.nutrition.fiber || 0) * ratio * 10) / 10,
    sugar: Math.round((this.nutrition.sugar || 0) * ratio * 10) / 10,
    sodium: Math.round((this.nutrition.sodium || 0) * ratio)
  };
};

// Static method to search foods
foodSchema.statics.searchFoods = function(query, userId, options = {}) {
  const searchQuery = {
    $or: [
      { isPublic: true },
      { createdBy: userId }
    ]
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  if (options.category) {
    searchQuery.category = options.category;
  }

  return this.find(searchQuery)
    .populate('createdBy', 'name')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 50);
};

module.exports = mongoose.model('Food', foodSchema);
