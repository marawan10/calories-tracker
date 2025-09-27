const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  avatar: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profile: {
    age: {
      type: Number,
      min: [1, 'Age must be positive'],
      max: [120, 'Age must be realistic']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    height: {
      type: Number,
      min: [50, 'Height must be at least 50cm'],
      max: [300, 'Height must be less than 300cm']
    },
    weight: {
      type: Number,
      min: [20, 'Weight must be at least 20kg'],
      max: [500, 'Weight must be less than 500kg']
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      default: 'moderate'
    },
    goal: {
      type: String,
      enum: ['lose_weight', 'maintain_weight', 'gain_weight'],
      default: 'maintain_weight'
    }
  },
  dailyGoals: {
    calories: {
      type: Number,
      default: 2000,
      min: [800, 'Daily calorie goal too low'],
      max: [5000, 'Daily calorie goal too high']
    },
    protein: {
      type: Number,
      default: 150,
      min: [20, 'Protein goal too low']
    },
    carbs: {
      type: Number,
      default: 250,
      min: [50, 'Carbs goal too low']
    },
    fat: {
      type: Number,
      default: 65,
      min: [20, 'Fat goal too low']
    }
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'ar'],
      default: 'en'
    },
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    }
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    // Check if password is already hashed (prevent double-hashing)
    const isAlreadyHashed = /^\$2[aby]\$\d{1,2}\$/.test(this.password);
    if (isAlreadyHashed) {
      console.warn('Warning: Password appears to already be hashed, skipping hash operation');
      return next();
    }
    
    // Log for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Hashing password for user:', this.email);
      console.log('Original password length:', this.password.length);
    }
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Password hashed successfully, hash length:', this.password.length);
    }
    
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
userSchema.methods.calculateBMR = function() {
  const { age, gender, height, weight } = this.profile;
  
  if (!age || !height || !weight || !gender) return null;
  
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  return Math.round(bmr);
};

// Calculate daily calorie needs based on activity level
userSchema.methods.calculateDailyCalories = function() {
  const bmr = this.calculateBMR();
  if (!bmr) return null;
  
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  const multiplier = activityMultipliers[this.profile.activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
