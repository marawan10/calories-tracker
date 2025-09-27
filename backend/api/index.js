const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Schema (inline to avoid import issues)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profile: {
    age: { type: Number, min: 1, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    height: { type: Number, min: 50, max: 300 },
    weight: { type: Number, min: 20, max: 500 },
    activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], default: 'moderate' },
    goal: { type: String, enum: ['lose_weight', 'maintain_weight', 'gain_weight'], default: 'maintain_weight' }
  },
  dailyGoals: {
    calories: { type: Number, default: 2000 },
    protein: { type: Number, default: 150 },
    carbs: { type: Number, default: 250 },
    fat: { type: Number, default: 65 }
  },
  preferences: {
    language: { type: String, enum: ['en', 'ar'], default: 'en' },
    units: { type: String, enum: ['metric', 'imperial'], default: 'metric' }
  },
  avatar: { 
    type: String, 
    default: null,
    maxlength: [5242880, 'Avatar data cannot exceed 5MB']
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
userSchema.methods.calculateBMR = function() {
  if (!this.profile) return null; // Add guard clause
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
  if (!bmr || !this.profile) return null; // Add guard clause
  
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

// Create User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Food Schema
const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameAr: { type: String, trim: true },
  category: { 
    type: String, 
    required: true,
    enum: ['fruits', 'vegetables', 'grains', 'protein', 'dairy', 'nuts_seeds', 'oils_fats', 'beverages', 'sweets', 'snacks', 'prepared_foods', 'other'],
    default: 'other'
  },
  nutrition: {
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    fiber: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    sodium: { type: Number, default: 0, min: 0 }
  },
  servingSize: {
    amount: { type: Number, default: 100, min: 0 },
    unit: { type: String, default: 'g' }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublic: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  per100g: { type: Boolean, default: true },
  description: { type: String, trim: true }
}, { timestamps: true });

// Add method to calculate nutrition for a given weight
foodSchema.methods.calculateNutrition = function(weight) {
  let multiplier;

  const servingUnit = this.servingSize?.unit || 'g';
  const servingAmount = Number(this.servingSize?.amount || 100);
  
  // Determine if nutrition values are per 100g or per serving
  const isPer100g = this.per100g === true && servingUnit === 'g' && servingAmount === 100;
  
  if (isPer100g) {
    // Nutrition values are per 100g
    multiplier = weight / 100;
  } else {
    // Nutrition values are per serving (regardless of per100g flag if serving size doesn't match)
    multiplier = weight / servingAmount;
  }
  
  return {
    calories: Math.round((this.nutrition.calories || 0) * multiplier),
    protein: Math.round(((this.nutrition.protein || 0) * multiplier) * 10) / 10,
    carbs: Math.round(((this.nutrition.carbs || 0) * multiplier) * 10) / 10,
    fat: Math.round(((this.nutrition.fat || 0) * multiplier) * 10) / 10,
    fiber: Math.round(((this.nutrition.fiber || 0) * multiplier) * 10) / 10,
    sugar: Math.round(((this.nutrition.sugar || 0) * multiplier) * 10) / 10,
    sodium: Math.round((this.nutrition.sodium || 0) * multiplier)
  };
};

// Create Food model
const Food = mongoose.models.Food || mongoose.model('Food', foodSchema);

// Activity Schema (inline to avoid import issues)
const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  nameAr: { type: String, trim: true },
  type: { type: String, required: true, enum: ['cardio', 'strength', 'sports', 'daily', 'other'], default: 'cardio' },
  duration: { type: Number, required: true, min: 1, max: 1440 },
  intensity: { type: String, enum: ['low', 'moderate', 'high', 'very_high'], default: 'moderate' },
  caloriesBurned: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, trim: true, maxlength: 500 },
  metValue: { type: Number, required: true, min: 1, max: 25 }
}, { timestamps: true });

activitySchema.index({ user: 1, date: -1 });
activitySchema.index({ user: 1, type: 1 });

activitySchema.statics.getPredefinedActivities = function() {
  return [
    { name: 'Walking (slow pace)', nameAr: 'المشي (بطيء)', type: 'cardio', metValue: 3.0, intensity: 'low' },
    { name: 'Walking (moderate pace)', nameAr: 'المشي (متوسط)', type: 'cardio', metValue: 3.5, intensity: 'moderate' },
    { name: 'Walking (fast pace)', nameAr: 'المشي (سريع)', type: 'cardio', metValue: 4.3, intensity: 'high' },
    { name: 'Jogging', nameAr: 'الهرولة', type: 'cardio', metValue: 7.0, intensity: 'high' },
    { name: 'Running (6 mph)', nameAr: 'الجري (متوسط)', type: 'cardio', metValue: 9.8, intensity: 'high' },
    { name: 'Running (8 mph)', nameAr: 'الجري (سريع)', type: 'cardio', metValue: 11.8, intensity: 'very_high' },
    { name: 'Cycling (leisure)', nameAr: 'ركوب الدراجة (ترفيهي)', type: 'cardio', metValue: 4.0, intensity: 'low' },
    { name: 'Cycling (moderate)', nameAr: 'ركوب الدراجة (متوسط)', type: 'cardio', metValue: 6.8, intensity: 'moderate' },
    { name: 'Cycling (vigorous)', nameAr: 'ركوب الدراجة (مكثف)', type: 'cardio', metValue: 10.0, intensity: 'high' },
    { name: 'Swimming (leisure)', nameAr: 'السباحة (ترفيهية)', type: 'cardio', metValue: 6.0, intensity: 'moderate' },
    { name: 'Swimming (vigorous)', nameAr: 'السباحة (مكثفة)', type: 'cardio', metValue: 10.0, intensity: 'high' },
    { name: 'Weight lifting (light)', nameAr: 'رفع الأثقال (خفيف)', type: 'strength', metValue: 3.0, intensity: 'low' },
    { name: 'Weight lifting (moderate)', nameAr: 'رفع الأثقال (متوسط)', type: 'strength', metValue: 5.0, intensity: 'moderate' },
    { name: 'Weight lifting (vigorous)', nameAr: 'رفع الأثقال (مكثف)', type: 'strength', metValue: 6.0, intensity: 'high' },
    { name: 'Bodyweight exercises', nameAr: 'تمارين وزن الجسم', type: 'strength', metValue: 4.5, intensity: 'moderate' },
    { name: 'Push-ups, sit-ups', nameAr: 'الضغط والبطن', type: 'strength', metValue: 3.8, intensity: 'moderate' },
    { name: 'Football/Soccer', nameAr: 'كرة القدم', type: 'sports', metValue: 7.0, intensity: 'high' },
    { name: 'Basketball', nameAr: 'كرة السلة', type: 'sports', metValue: 6.5, intensity: 'high' },
    { name: 'Tennis', nameAr: 'التنس', type: 'sports', metValue: 7.3, intensity: 'high' },
    { name: 'Volleyball', nameAr: 'الكرة الطائرة', type: 'sports', metValue: 4.0, intensity: 'moderate' },
    { name: 'Badminton', nameAr: 'الريشة الطائرة', type: 'sports', metValue: 5.5, intensity: 'moderate' },
    { name: 'Household cleaning', nameAr: 'تنظيف المنزل', type: 'daily', metValue: 3.3, intensity: 'low' },
    { name: 'Gardening', nameAr: 'البستنة', type: 'daily', metValue: 4.0, intensity: 'moderate' },
    { name: 'Stairs climbing', nameAr: 'صعود الدرج', type: 'daily', metValue: 8.0, intensity: 'high' },
    { name: 'Dancing', nameAr: 'الرقص', type: 'other', metValue: 4.8, intensity: 'moderate' },
    { name: 'Yoga', nameAr: 'اليوغا', type: 'other', metValue: 2.5, intensity: 'low' },
    { name: 'Pilates', nameAr: 'البيلاتس', type: 'other', metValue: 3.0, intensity: 'low' }
  ];
};

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);

// Meal Item Schema
const mealItemSchema = new mongoose.Schema({
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [1, 'Weight must be at least 1 gram'],
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

// Meal Schema
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

// Create Meal model
const Meal = mongoose.models.Meal || mongoose.model('Meal', mealSchema);

// Database connection
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    // Use the simplest connection possible
    await mongoose.connect(process.env.MONGODB_URI);
    
    isConnected = true;
    console.log('✅ Connected to MongoDB');
    
    // Create admin user if doesn't exist
    if (!global.adminCreated) {
      const adminExists = await User.findOne({ email: 'admin@gmail.com' });
      if (!adminExists) {
        const admin = new User({
          name: 'Admin',
          email: 'admin@gmail.com',
          password: 'messi1010@',
          role: 'admin',
          profile: { age: 30 }
        });
        await admin.save();
        console.log('👑 Admin user created');
        
        // Create some initial foods
        const foodCount = await Food.countDocuments();
        if (foodCount === 0) {
          const initialFoods = [
            { name: 'Apple', nameAr: 'تفاح', category: 'fruits', nutrition: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 } },
            { name: 'Banana', nameAr: 'موز', category: 'fruits', nutrition: { calories: 96, protein: 1.3, carbs: 27, fat: 0.3 } },
            { name: 'Rice', nameAr: 'أرز', category: 'grains', nutrition: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 } },
            { name: 'Chicken breast', nameAr: 'صدر دجاج', category: 'protein', nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6 } },
            { name: 'Egg', nameAr: 'بيض', category: 'protein', nutrition: { calories: 155, protein: 13, carbs: 1, fat: 11 } },
            { name: 'Bread', nameAr: 'خبز', category: 'grains', nutrition: { calories: 265, protein: 9, carbs: 49, fat: 3.2 } },
            { name: 'Potato', nameAr: 'بطاطس', category: 'vegetables', nutrition: { calories: 77, protein: 2, carbs: 17, fat: 0.1 } },
            { name: 'Tomato', nameAr: 'طماطم', category: 'vegetables', nutrition: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 } },
            { name: 'Cucumber', nameAr: 'خيار', category: 'vegetables', nutrition: { calories: 16, protein: 0.6, carbs: 4, fat: 0.1 } },
            { name: 'Milk', nameAr: 'حليب', category: 'dairy', nutrition: { calories: 42, protein: 3.4, carbs: 5, fat: 1 } }
          ];
          
          for (const foodData of initialFoods) {
            const food = new Food({
              ...foodData,
              servingSize: { amount: 100, unit: 'g' },
              createdBy: admin._id,
              isPublic: true,
              isVerified: true,
              per100g: true,
              description: 'Initial seed food (per 100g)'
            });
            await food.save();
          }
          console.log('🌱 Initial foods created');
        }
      }
      global.adminCreated = true;
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
}

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to set CORS headers
const setCORSHeaders = (req, res) => {
  const allowedOrigins = [
    'https://calories-tracker-6oiu.vercel.app',
    'https://calories-tracker-6oiu-git-main-marawanmokhtar10-1042s-projects.vercel.app',
    'https://calories-tracker-opal.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For production, be more permissive to handle various Vercel preview URLs
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-auth-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
};

// Main handler
module.exports = async (req, res) => {
  try {
    // Set CORS headers
    setCORSHeaders(req, res);

    const { method, url } = req;
    const urlParts = url.split('?');
    const path = urlParts[0];

    if (req.method === 'OPTIONS') {
      console.log('OPTIONS request received for:', path);
      return res.status(200).end();
    }

    // Connect to database inside try-catch to ensure CORS headers are always sent
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    // Parse query parameters manually for better compatibility
    const queryParams = {};
    if (urlParts[1]) {
      urlParts[1].split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          queryParams[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    }
    
    // Merge with req.query for compatibility
    req.query = { ...req.query, ...queryParams };

    // Health check
    if (method === 'GET' && (path === '/' || path === '/api/health')) {
      return res.json({
        message: 'كُل بحساب API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongoConnected: mongoose.connection.readyState === 1
      });
    }

    // Test endpoint for meal creation
    if (method === 'POST' && path === '/api/test-meals') {
      return res.json({
        message: 'Test endpoint working',
        received: req.body,
        timestamp: new Date().toISOString()
      });
    }

    // Login endpoint
    if (method === 'POST' && path === '/api/auth/login') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Please provide a valid email' });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ 
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const token = generateToken(user._id);

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
          dailyGoals: user.dailyGoals,
          preferences: user.preferences,
          avatar: user.avatar
        }
      });
    }

    // Register endpoint
    if (method === 'POST' && path === '/api/auth/register') {
      const { name, email, password, age, gender, height, weight } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: [{ msg: 'Name, email, and password are required' }]
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: [{ msg: 'Please provide a valid email' }]
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: [{ msg: 'Password must be at least 6 characters long' }]
        });
      }

      if (age && (age < 1 || age > 120)) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: [{ msg: 'Age must be between 1 and 120' }]
        });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          message: 'User already exists with this email',
          code: 'USER_EXISTS'
        });
      }

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        profile: { age, gender, height, weight }
      });

      await user.save();
      const token = generateToken(user._id);

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
          dailyGoals: user.dailyGoals,
          preferences: user.preferences,
          avatar: user.avatar
        }
      });
    }

    // Get current user endpoint
    if (method === 'GET' && path === '/api/auth/me') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }

        return res.json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile,
            dailyGoals: user.dailyGoals,
            preferences: user.preferences,
            createdAt: user.createdAt
          }
        });
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }

    // Debug admin endpoint
    if (method === 'GET' && path === '/api/debug/admin') {
      const adminUser = await User.findOne({ email: 'admin@gmail.com' });
      return res.json({
        adminExists: !!adminUser,
        adminData: adminUser ? {
          id: adminUser._id,
          email: adminUser.email,
          role: adminUser.role,
          hasPassword: !!adminUser.password,
          createdAt: adminUser.createdAt
        } : null,
        totalUsers: await User.countDocuments(),
        totalFoods: await Food.countDocuments()
      });
    }

    // Get Foods endpoint
    if (method === 'GET' && path === '/api/foods') {
      try {
        const { search, category, limit = 100, page = 1 } = req.query || {};
        
        let query = {};
        
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { nameAr: { $regex: search, $options: 'i' } }
          ];
        }
        
        if (category) {
          query.category = category;
        }

        const totalCount = await Food.countDocuments(query);
        const foods = await Food.find(query)
          .populate('createdBy', 'name email')
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .sort({ name: 1 });

        // Ensure foods is always an array with proper structure
        const safeFoods = Array.isArray(foods) ? foods.map(food => ({
          _id: food._id,
          name: food.name || '',
          nameAr: food.nameAr || '',
          category: food.category || 'other',
          nutrition: {
            calories: food.nutrition?.calories || 0,
            protein: food.nutrition?.protein || 0,
            carbs: food.nutrition?.carbs || 0,
            fat: food.nutrition?.fat || 0,
            fiber: food.nutrition?.fiber || 0,
            sugar: food.nutrition?.sugar || 0,
            sodium: food.nutrition?.sodium || 0
          },
          servingSize: food.servingSize || { amount: 100, unit: 'g' },
          createdBy: food.createdBy || null,
          isPublic: food.isPublic !== false,
          isVerified: food.isVerified || false,
          per100g: food.per100g !== false,
          description: food.description || '',
          createdAt: food.createdAt,
          updatedAt: food.updatedAt
        })) : [];

        const response = {
          foods: safeFoods,
          total: totalCount || 0,
          pagination: {
            total: totalCount || 0,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 100,
            pages: Math.ceil((totalCount || 0) / parseInt(limit)) || 1
          }
        };
        
        console.log('Foods API Response:', {
          foodsCount: safeFoods.length,
          total: totalCount,
          query: req.query
        });
        
        return res.json(response);
      } catch (error) {
        console.error('Foods endpoint error:', error);
        return res.json({
          foods: [],
          total: 0,
          pagination: { total: 0, page: 1, limit: 100, pages: 1 }
        });
      }
    }

    // Activities: Get predefined (place before generic activities route)
    if (method === 'GET' && path === '/api/activities/predefined') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }
      try {
        const activities = Activity.getPredefinedActivities();
        return res.json({ message: 'Predefined activities retrieved successfully', activities });
      } catch (error) {
        console.error('Predefined activities error:', error);
        return res.status(500).json({ message: 'Server error while fetching predefined activities' });
      }
    }

    // Activities: Create a new activity (supports direct calories from smartwatch)
    if (method === 'POST' && path === '/api/activities') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { name, nameAr, type, duration, intensity, metValue, date, notes, caloriesBurned: providedCalories } = req.body || {};

      // Basic validation
      if (!name || !type) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: [
            !name ? { msg: 'Activity name is required', path: 'name' } : null,
            !type ? { msg: 'Activity type is required', path: 'type' } : null
          ].filter(Boolean)
        });
      }
      const allowedTypes = ['cardio', 'strength', 'sports', 'daily', 'other'];
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid activity type' });
      }

      // Determine calories
      let caloriesBurned;
      const finalDuration = duration || 60;
      const finalMetValue = metValue || 5.0;
      if (providedCalories) {
        caloriesBurned = parseInt(providedCalories, 10);
      } else {
        if (!user.profile?.weight) {
          return res.status(400).json({ message: 'User weight is required for calorie calculation. Please update your profile.' });
        }
        caloriesBurned = Activity.calculateCaloriesBurned(finalMetValue, user.profile.weight, finalDuration);
      }

      try {
        const activity = new Activity({
          user: user._id,
          name,
          nameAr,
          type,
          duration: finalDuration,
          intensity: intensity || 'moderate',
          caloriesBurned,
          metValue: finalMetValue,
          date: date ? new Date(date) : new Date(),
          notes
        });

        await activity.save();
        return res.status(201).json({ message: 'Activity created successfully', activity });
      } catch (error) {
        console.error('POST /api/activities error:', error);
        return res.status(500).json({ message: 'Server error while creating activity' });
      }
    }

    // Activities: stats summary (supports days or explicit startDate/endDate)
    if (method === 'GET' && path === '/api/activities/stats/summary') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { days, startDate, endDate } = req.query || {};
      let start;
      let end;
      if (startDate || endDate) {
        start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        end = endDate ? new Date(endDate) : new Date();
      } else {
        const d = parseInt(days) || 7;
        end = new Date();
        start = new Date();
        start.setDate(start.getDate() - d);
      }

      const stats = await Activity.aggregate([
        { $match: { user: user._id, date: { $gte: start } } },
        { $group: {
          _id: null,
          totalCaloriesBurned: { $sum: '$caloriesBurned' },
          totalDuration: { $sum: '$duration' },
          totalActivities: { $sum: 1 },
          avgCaloriesPerActivity: { $avg: '$caloriesBurned' },
          avgDurationPerActivity: { $avg: '$duration' },
          typeBreakdown: { $push: { type: '$type', calories: '$caloriesBurned', duration: '$duration' } },
          dailyBreakdown: { $push: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, calories: '$caloriesBurned', duration: '$duration' } }
        } }
      ]);

      const summary = {
        totalCaloriesBurned: 0,
        totalDuration: 0,
        totalActivities: 0,
        avgCaloriesPerActivity: 0,
        avgDurationPerActivity: 0,
        typeBreakdown: {},
        dailyBreakdown: {}
      };

      if (stats.length > 0) {
        const data = stats[0];
        summary.totalCaloriesBurned = data.totalCaloriesBurned || 0;
        summary.totalDuration = data.totalDuration || 0;
        summary.totalActivities = data.totalActivities || 0;
        summary.avgCaloriesPerActivity = Math.round(data.avgCaloriesPerActivity || 0);
        summary.avgDurationPerActivity = Math.round(data.avgDurationPerActivity || 0);
        (data.typeBreakdown || []).forEach(item => {
          if (!summary.typeBreakdown[item.type]) {
            summary.typeBreakdown[item.type] = { calories: 0, duration: 0, count: 0 };
          }
          summary.typeBreakdown[item.type].calories += item.calories;
          summary.typeBreakdown[item.type].duration += item.duration;
          summary.typeBreakdown[item.type].count += 1;
        });
        (data.dailyBreakdown || []).forEach(item => {
          if (!summary.dailyBreakdown[item.date]) {
            summary.dailyBreakdown[item.date] = { calories: 0, duration: 0, count: 0 };
          }
          summary.dailyBreakdown[item.date].calories += item.calories;
          summary.dailyBreakdown[item.date].duration += item.duration;
          summary.dailyBreakdown[item.date].count += 1;
        });
      }

      return res.json({ message: 'Activity statistics retrieved successfully', summary, period: startDate || endDate ? 'custom' : `${parseInt(days) || 7} days` });
    }

    // Activities: List with optional date/type filters and daily totals (support trailing slash)
    if (method === 'GET' && (path === '/api/activities' || path === '/api/activities/')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { date, type, limit = 50, page = 1 } = req.query || {};
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = { user: user._id };
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }
      if (type) {
        query.type = type;
      }

      const activities = await Activity.find(query)
        .sort({ date: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Activity.countDocuments(query);

      let dailyTotals = null;
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        const dailyStats = await Activity.aggregate([
          { $match: { user: user._id, date: { $gte: startDate, $lt: endDate } } },
          { $group: {
            _id: null,
            totalCaloriesBurned: { $sum: '$caloriesBurned' },
            totalDuration: { $sum: '$duration' },
            activityCount: { $sum: 1 },
            typeBreakdown: { $push: { type: '$type', calories: '$caloriesBurned', duration: '$duration' } }
          } }
        ]);

        if (dailyStats.length > 0) {
          const stats = dailyStats[0];
          const typeStats = {};
          (stats.typeBreakdown || []).forEach(item => {
            if (!typeStats[item.type]) {
              typeStats[item.type] = { calories: 0, duration: 0, count: 0 };
            }
            typeStats[item.type].calories += item.calories;
            typeStats[item.type].duration += item.duration;
            typeStats[item.type].count += 1;
          });

          dailyTotals = {
            totalCaloriesBurned: stats.totalCaloriesBurned || 0,
            totalDuration: stats.totalDuration || 0,
            activityCount: stats.activityCount || 0,
            typeBreakdown: typeStats
          };
        }
      }

      return res.json({
        message: 'Activities retrieved successfully',
        activities,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)) || 1
        },
        dailyTotals
      });
    }

    // (stats/summary handler moved above)
    // Create Food endpoint
    if (method === 'POST' && path === '/api/foods') {
      // Get user from token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { name, nameAr, category, nutrition, servingSize, description, isPublic } = req.body;

      // Validation
      if (!name || !category || !nutrition) {
        return res.status(400).json({ 
          message: 'Name, category, and nutrition are required' 
        });
      }

      if (!nutrition.calories || nutrition.calories < 0) {
        return res.status(400).json({ 
          message: 'Valid calories value is required' 
        });
      }

      const derivedPer100g = servingSize?.unit === 'g' && Number(servingSize?.amount) === 100;

      const food = new Food({
        name: name.trim(),
        nameAr: nameAr?.trim(),
        category,
        nutrition: {
          calories: parseFloat(nutrition.calories) || 0,
          protein: parseFloat(nutrition.protein) || 0,
          carbs: parseFloat(nutrition.carbs) || 0,
          fat: parseFloat(nutrition.fat) || 0,
          fiber: parseFloat(nutrition.fiber) || 0,
          sugar: parseFloat(nutrition.sugar) || 0,
          sodium: parseFloat(nutrition.sodium) || 0
        },
        servingSize: servingSize || { amount: 100, unit: 'g' },
        description: description?.trim(),
        isPublic: isPublic !== false,
        createdBy: user._id,
        isVerified: user.role === 'admin',
        per100g: derivedPer100g
      });

      await food.save();
      await food.populate('createdBy', 'name email');

      return res.status(201).json({
        message: 'Food created successfully',
        food
      });
    }

    // Update Food endpoint
    if (method === 'PUT' && path.startsWith('/api/foods/')) {
      const foodId = path.split('/')[3];
      
      // Get user from token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const food = await Food.findById(foodId);
      if (!food) {
        return res.status(404).json({ message: 'Food not found' });
      }

      // Check permissions
      if (user.role !== 'admin' && food.createdBy.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this food' });
      }

      const { name, nameAr, category, nutrition, servingSize, description, isPublic } = req.body;

      // Update fields
      if (name) food.name = name.trim();
      if (nameAr !== undefined) food.nameAr = nameAr?.trim();
      if (category) food.category = category;
      if (nutrition) {
        food.nutrition = {
          calories: parseFloat(nutrition.calories) || food.nutrition.calories,
          protein: parseFloat(nutrition.protein) || food.nutrition.protein,
          carbs: parseFloat(nutrition.carbs) || food.nutrition.carbs,
          fat: parseFloat(nutrition.fat) || food.nutrition.fat,
          fiber: parseFloat(nutrition.fiber) || food.nutrition.fiber,
          sugar: parseFloat(nutrition.sugar) || food.nutrition.sugar,
          sodium: parseFloat(nutrition.sodium) || food.nutrition.sodium
        };
      }
      if (servingSize) {
        food.servingSize = servingSize;
        food.per100g = servingSize?.unit === 'g' && Number(servingSize?.amount) === 100;
      }
      if (description !== undefined) food.description = description?.trim();
      if (isPublic !== undefined) food.isPublic = isPublic;

      await food.save();
      await food.populate('createdBy', 'name email');

      return res.json({
        message: 'Food updated successfully',
        food
      });
    }

    // Delete Food endpoint
    if (method === 'DELETE' && path.startsWith('/api/foods/')) {
      const foodId = path.split('/')[3];
      
      // Get user from token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const food = await Food.findById(foodId);
      if (!food) {
        return res.status(404).json({ message: 'Food not found' });
      }

      // Check permissions
      if (user.role !== 'admin' && food.createdBy.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this food' });
      }

      await Food.findByIdAndDelete(foodId);

      return res.json({
        message: 'Food deleted successfully'
      });
    }

    // Get user's meals for a specific date
    if (method === 'GET' && (path === '/api/meals' || path.startsWith('/api/meals/daily/'))) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Handle different meal query types
      const { date, limit = 20, page = 1 } = req.query;
      let query = { user: user._id };
      let meals;

      if (path.startsWith('/api/meals/daily/')) {
        // Daily meals endpoint - get meals for specific date
        const dateStr = path.split('/api/meals/daily/')[1];
        const queryDate = new Date(dateStr);
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        query.date = { $gte: startOfDay, $lte: endOfDay };
        meals = await Meal.find(query)
          .populate('items.food', 'name nameAr category nutrition')
          .sort({ createdAt: -1 });
      } else if (date) {
        // Specific date query
        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        query.date = { $gte: startOfDay, $lte: endOfDay };
        meals = await Meal.find(query)
          .populate('items.food', 'name nameAr category nutrition')
          .sort({ createdAt: -1 });
      } else {
        // Get all meals with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        meals = await Meal.find(query)
          .populate('items.food', 'name nameAr category nutrition')
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));
      }

      // Calculate daily totals
      const dailyTotals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      };

      meals.forEach(meal => {
        dailyTotals.calories += meal.totals?.calories || 0;
        dailyTotals.protein += meal.totals?.protein || 0;
        dailyTotals.carbs += meal.totals?.carbs || 0;
        dailyTotals.fat += meal.totals?.fat || 0;
        dailyTotals.fiber += meal.totals?.fiber || 0;
        dailyTotals.sugar += meal.totals?.sugar || 0;
        dailyTotals.sodium += meal.totals?.sodium || 0;
      });

      // Group meals by type
      const mealsByType = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      };

      meals.forEach(meal => {
        if (mealsByType[meal.mealType]) {
          mealsByType[meal.mealType].push(meal);
        }
      });

      // For daily/specific date queries, return daily format
      if (path.startsWith('/api/meals/daily/') || date) {
        return res.json({ 
          dailyTotals,
          mealsByType,
          totalMeals: meals.length,
          meals: meals
        });
      } else {
        // For all meals query, return paginated format
        const total = await Meal.countDocuments({ user: user._id });
        return res.json({
          meals,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        });
      }
    }

    // Get meal statistics for date range
    if (method === 'GET' && path === '/api/meals/stats') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const meals = await Meal.find({
        user: user._id,
        date: { $gte: start, $lte: end }
      }).populate('items.food', 'name nameAr category categoryAr nutrition');

      // Build daily map and aggregate stats aligned with Express route implementation
      const dailyMap = new Map();
      const mostLoggedFoods = {};
      const categoryBreakdown = {};

      (meals || []).forEach(meal => {
        const dateKey = meal.date.toISOString().split('T')[0];
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { date: dateKey, calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 });
        }
        const day = dailyMap.get(dateKey);
        day.calories += meal.totals?.calories || 0;
        day.protein += meal.totals?.protein || 0;
        day.carbs += meal.totals?.carbs || 0;
        day.fat += meal.totals?.fat || 0;
        day.mealCount += 1;

        (meal.items || []).forEach(item => {
          if (item?.food) {
            const foodName = item.food.nameAr || item.food.name;
            const category = item.food.categoryAr || item.food.category || 'other';
            mostLoggedFoods[foodName] = (mostLoggedFoods[foodName] || 0) + 1;
            categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (item.weight || 0);
          }
        });
      });

      const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      const daysCount = dailyData.length || 1;
      const totalCalories = dailyData.reduce((s, d) => s + d.calories, 0);
      const totalProtein = dailyData.reduce((s, d) => s + d.protein, 0);
      const totalCarbs = dailyData.reduce((s, d) => s + d.carbs, 0);
      const totalFat = dailyData.reduce((s, d) => s + d.fat, 0);

      const response = {
        totalMeals: meals?.length || 0,
        avgCaloriesPerDay: Math.round(totalCalories / daysCount),
        avgProteinPerDay: Math.round((totalProtein / daysCount) * 10) / 10,
        avgCarbsPerDay: Math.round((totalCarbs / daysCount) * 10) / 10,
        avgFatPerDay: Math.round((totalFat / daysCount) * 10) / 10,
        mostLoggedFoods,
        categoryBreakdown,
        dailyData
      };

      return res.json(response);
    }

    // Create/Update meal (POST /api/meals) - NEW SCHEMA VERSION
    if (method === 'POST' && path === '/api/meals') {
      console.log('=== POST /api/meals START ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Basic auth check
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No authorization header found');
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          console.log('User not found for token');
          return res.status(401).json({ message: 'Invalid token' });
        }
        console.log('User authenticated:', user.email);
      } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid token' });
      }

      try {
        const { date, mealType, items, notes } = req.body;
        console.log('Parsed data:', { date, mealType, items, notes });

        // Validation
        if (!mealType || !items || !Array.isArray(items) || items.length === 0) {
          console.log('Validation failed - missing required fields');
          return res.status(400).json({ 
            message: 'Meal type and items are required' 
          });
        }

        if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
          console.log('Validation failed - invalid meal type:', mealType);
          return res.status(400).json({ 
            message: 'Invalid meal type. Must be breakfast, lunch, dinner, or snack' 
          });
        }

        // Validate and calculate nutrition for each item
        const processedItems = [];
        
        for (const item of items) {
          console.log('Processing item:', { foodId: item.food, weight: item.weight });
          
          let food = null;
          if (item.food) {
            food = await Food.findById(item.food);
          }

          // If food not found but we have inline data from import, create it
          if (!food && item.foodData && item.foodData.name && item.foodData.nutrition) {
            // Try to reuse an existing food by name (case-insensitive) and creator/public
            const nameRegex = new RegExp(`^${(item.foodData.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            const nameArRegex = item.foodData.nameAr ? new RegExp(`^${(item.foodData.nameAr || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') : null;
            const existingFood = await Food.findOne({
              $and: [
                { $or: [ { name: nameRegex }, ...(nameArRegex ? [{ nameAr: nameArRegex }] : []) ] },
                { $or: [ { createdBy: user._id }, { isPublic: true } ] }
              ]
            });
            if (existingFood) {
              food = existingFood;
            } else {
              // Create new food only if no existing match found
              const servingSize = item.foodData.servingSize || { amount: 100, unit: 'g' };
              const newFood = new Food({
                name: item.foodData.name,
                nameAr: item.foodData.nameAr,
                category: item.foodData.category || 'other',
                nutrition: item.foodData.nutrition,
                servingSize: servingSize,
                createdBy: user._id,
                isPublic: false,
                // Auto-set per100g based on serving size
                per100g: servingSize.unit === 'g' && servingSize.amount === 100
              });
              await newFood.save();
              food = newFood;
            }
          }

          if (!food) {
            console.error('Food not found and no foodData provided:', item.food);
            return res.status(400).json({
              message: `Food with ID ${item.food} not found and no inline food data provided`
            });
          }

          console.log('Found food:', { name: food.name, nameAr: food.nameAr, servingSize: food.servingSize });

          // Check if user can access this food
          if (!food.isPublic && !food.createdBy.equals(user._id)) {
            return res.status(403).json({
              message: `Access denied to food: ${food.name}`
            });
          }

          try {
            // Calculate nutrition for the specified weight
            const nutrition = food.calculateNutrition(item.weight);
            console.log('Calculated nutrition:', nutrition);
            
            processedItems.push({
              food: food._id,
              weight: item.weight,
              nutrition
            });
          } catch (error) {
            console.error('Error calculating nutrition:', error);
            return res.status(500).json({
              message: `Error calculating nutrition for ${food.name}`,
              error: error.message
            });
          }
        }

        // Create meal
        const meal = new Meal({
          user: user._id,
          date: date ? new Date(date) : new Date(),
          mealType,
          items: processedItems,
          notes
        });

        await meal.save();
        
        // Populate food details for response
        await meal.populate('items.food', 'name nameAr category nutrition');

        res.status(201).json({
          message: 'Meal logged successfully',
          meal
        });

      } catch (error) {
        console.error('POST /api/meals error:', error);
        return res.status(500).json({
          message: 'Server error while creating meal',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }

    // Batch import meals: POST /api/meals/import-batch
    if (method === 'POST' && path === '/api/meals/import-batch') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const mealsInput = Array.isArray(req.body?.meals) ? req.body.meals : [];
      if (mealsInput.length === 0) {
        return res.status(400).json({ message: 'meals must be a non-empty array' });
      }

      const results = [];
      for (const [index, input] of mealsInput.entries()) {
        try {
          const { date, mealType, items, notes } = input;
          if (!mealType || !items || !Array.isArray(items) || items.length === 0) {
            results.push({ index, success: false, error: 'Meal type and items are required' });
            continue;
          }
          if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
            results.push({ index, success: false, error: 'Invalid meal type' });
            continue;
          }

          const processedItems = [];
          for (const item of items) {
            let food = null;
            if (item.food) {
              food = await Food.findById(item.food);
            }
            if (!food && item.foodData && item.foodData.name && item.foodData.nutrition) {
              // Try to find existing food by name (case-insensitive) to avoid duplicates
              const nameRegex = new RegExp(`^${(item.foodData.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
              const nameArRegex = item.foodData.nameAr ? new RegExp(`^${(item.foodData.nameAr || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') : null;
              
              const existingFood = await Food.findOne({
                $and: [
                  { $or: [ { name: nameRegex }, ...(nameArRegex ? [{ nameAr: nameArRegex }] : []) ] },
                  { $or: [ { createdBy: user._id }, { isPublic: true } ] }
                ]
              });
              
              if (existingFood) {
                food = existingFood;
              } else {
                // Create new food only if no existing match found
                const servingSize = item.foodData.servingSize || { amount: 100, unit: 'g' };
                const newFood = new Food({
                  name: item.foodData.name,
                  nameAr: item.foodData.nameAr,
                  category: item.foodData.category || 'other',
                  nutrition: item.foodData.nutrition,
                  servingSize: servingSize,
                  createdBy: user._id,
                  isPublic: false,
                  // Auto-set per100g based on serving size
                  per100g: servingSize.unit === 'g' && servingSize.amount === 100
                });
                await newFood.save();
                food = newFood;
              }
            }
            if (!food) {
              results.push({ index, success: false, error: `Food ${item.food || '(missing id)'} not found` });
              food = null;
              break;
            }
            
            // Use the actual weight from the item, don't default to 100
            const weight = item.weight;
            if (!weight || weight <= 0) {
              results.push({ index, success: false, error: `Invalid weight/amount for food: ${food.name} (${food.servingSize?.unit || 'g'})` });
              food = null;
              break;
            }
            
            const nutrition = food.calculateNutrition(weight);
            processedItems.push({ food: food._id, weight: weight, nutrition });
          }

          if (processedItems.length !== (items?.length || 0)) {
            // Already recorded an error for this index; skip creation
            continue;
          }

          const meal = new Meal({
            user: user._id,
            date: date ? new Date(date) : new Date(),
            mealType,
            items: processedItems,
            notes
          });
          await meal.save();
          results.push({ index, success: true, mealId: meal._id });
        } catch (e) {
          results.push({ index, success: false, error: e.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;
      return res.json({ message: 'Batch import completed', successCount, errorCount, results });
    }

    // Update meal (PUT /api/meals/:id)
    if (method === 'PUT' && path.startsWith('/api/meals/')) {
      const mealId = path.split('/')[3];
      
      console.log('=== PUT /api/meals/:id START ===');
      console.log('Meal ID:', mealId);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No authorization header found');
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          console.log('User not found for token');
          return res.status(401).json({ message: 'Invalid token' });
        }
        console.log('User authenticated:', user.email);
      } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid token' });
      }

      try {
        // Find the meal to update
        const existingMeal = await Meal.findById(mealId);
        if (!existingMeal) {
          return res.status(404).json({ message: 'Meal not found' });
        }

        // Check if user owns this meal
        if (!existingMeal.user.equals(user._id)) {
          return res.status(403).json({ message: 'Access denied. You can only update your own meals.' });
        }

        const { date, mealType, items, notes } = req.body;
        console.log('Parsed data:', { date, mealType, items, notes });

        // Validation
        if (!mealType || !items || !Array.isArray(items) || items.length === 0) {
          console.log('Validation failed - missing required fields');
          return res.status(400).json({ 
            message: 'Meal type and items are required' 
          });
        }

        if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
          console.log('Validation failed - invalid meal type:', mealType);
          return res.status(400).json({ 
            message: 'Invalid meal type. Must be breakfast, lunch, dinner, or snack' 
          });
        }

        // Validate and calculate nutrition for each item
        const processedItems = [];
        
        for (const item of items) {
          console.log('Processing item:', { foodId: item.food, weight: item.weight });
          
          let food = null;
          if (item.food) {
            food = await Food.findById(item.food);
          }

          // If food not found but we have inline data from import, create it
          if (!food && item.foodData && item.foodData.name && item.foodData.nutrition) {
            // Try to reuse an existing food by name
            const nameRegex = new RegExp(`^${(item.foodData.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            const nameArRegex = item.foodData.nameAr ? new RegExp(`^${(item.foodData.nameAr || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') : null;
            const existingFood = await Food.findOne({
              $and: [
                { $or: [ { name: nameRegex }, ...(nameArRegex ? [{ nameAr: nameArRegex }] : []) ] },
                { $or: [ { createdBy: user._id }, { isPublic: true } ] }
              ]
            });
            if (existingFood) {
              food = existingFood;
            }
          }

          if (!food && item.foodData && item.foodData.name && item.foodData.nutrition) {
            const newFood = new Food({
              name: item.foodData.name,
              nameAr: item.foodData.nameAr,
              category: item.foodData.category || 'other',
              nutrition: item.foodData.nutrition,
              servingSize: item.foodData.servingSize || { amount: 100, unit: 'g' },
              createdBy: user._id,
              isPublic: false,
              per100g: true
            });
            await newFood.save();
            food = newFood;
          }

          if (!food) {
            console.error('Food not found and no foodData provided:', item.food);
            return res.status(400).json({
              message: `Food with ID ${item.food} not found and no inline food data provided`
            });
          }

          console.log('Found food:', { name: food.name, nameAr: food.nameAr, servingSize: food.servingSize });

          // Check if user can access this food
          if (!food.isPublic && !food.createdBy.equals(user._id)) {
            return res.status(403).json({
              message: `Access denied to food: ${food.name}`
            });
          }

          try {
            // Calculate nutrition for the specified weight
            const nutrition = food.calculateNutrition(item.weight);
            console.log('Calculated nutrition:', nutrition);
            
            processedItems.push({
              food: food._id,
              weight: item.weight,
              nutrition
            });
          } catch (error) {
            console.error('Error calculating nutrition:', error);
            return res.status(500).json({
              message: `Error calculating nutrition for ${food.name}`,
              error: error.message
            });
          }
        }

        // Update meal
        if (date) existingMeal.date = new Date(date);
        existingMeal.mealType = mealType;
        existingMeal.items = processedItems;
        existingMeal.notes = notes;

        await existingMeal.save();
        
        // Populate food details for response
        await existingMeal.populate('items.food', 'name nameAr category nutrition');

        res.json({
          message: 'Meal updated successfully',
          meal: existingMeal
        });

      } catch (error) {
        console.error('PUT /api/meals/:id error:', error);
        return res.status(500).json({
          message: 'Server error while updating meal',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }

    // Delete meal (DELETE /api/meals/:id)
    if (method === 'DELETE' && path.startsWith('/api/meals/')) {
      const mealId = path.split('/')[3];
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      try {
        const meal = await Meal.findOne({ _id: mealId, user: user._id });
        if (!meal) {
          return res.status(404).json({ message: 'Meal not found' });
        }

        // Delete entire meal document
        await Meal.findByIdAndDelete(mealId);

        return res.json({ message: 'Meal deleted successfully' });
      } catch (error) {
        console.error('Delete meal error:', error);
        return res.status(500).json({ message: 'Failed to delete meal' });
      }
    }

    // Get user profile
    if (method === 'GET' && path === '/api/users/profile') {
      // Ensure CORS headers are set
      setCORSHeaders(req, res);

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      try {
        return res.json({
          message: 'Profile retrieved successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile || {},
            dailyGoals: user.dailyGoals || {},
            preferences: user.preferences || {},
            avatar: user.avatar
          }
        });
      } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({
          message: 'Server error while retrieving profile',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }

    // Update user profile
    if (method === 'PUT' && path === '/api/users/profile') {
      // Ensure CORS headers are set
      setCORSHeaders(req, res);

      console.log('Profile update request received:', {
        method,
        path,
        headers: req.headers,
        body: req.body
      });

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No auth header provided');
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          console.log('User not found for token');
          return res.status(401).json({ message: 'Invalid token' });
        }
        console.log('User authenticated:', user.email);
      } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid token' });
      }

      try {
        const { name, profile, dailyGoals, preferences, avatar, age, gender, height, weight, activityLevel, goal } = req.body;

        console.log('Profile update data:', { name, profile, dailyGoals, preferences, avatar, age, gender, height, weight, activityLevel, goal });

        // Ensure profile object exists
        if (!user.profile) {
          user.profile = {};
        }

        // Handle direct profile fields (from frontend form)
        if (name) user.name = name.trim();
        if (age !== undefined) user.profile.age = age;
        if (gender !== undefined) user.profile.gender = gender;
        if (height !== undefined) user.profile.height = height;
        if (weight !== undefined) user.profile.weight = weight;
        if (activityLevel !== undefined) user.profile.activityLevel = activityLevel;
        if (goal !== undefined) user.profile.goal = goal;
        if (avatar !== undefined) user.avatar = avatar;

        // Handle nested profile object
        if (profile) {
          user.profile = { ...user.profile, ...profile };
        }
        if (dailyGoals) {
          user.dailyGoals = { ...user.dailyGoals, ...dailyGoals };
        }
        if (preferences) {
          user.preferences = { ...user.preferences, ...preferences };
        }

        // Auto-calculate daily calorie goal if we have enough data
        if (user.profile.age && user.profile.gender && user.profile.height && user.profile.weight) {
          const calculatedCalories = user.calculateDailyCalories();
          if (calculatedCalories) {
            // Adjust based on goal
            let adjustedCalories = calculatedCalories;
            if (user.profile.goal === 'lose_weight') {
              adjustedCalories = Math.round(calculatedCalories * 0.85); // 15% deficit
            } else if (user.profile.goal === 'gain_weight') {
              adjustedCalories = Math.round(calculatedCalories * 1.15); // 15% surplus
            }
            
            user.dailyGoals.calories = adjustedCalories;
            
            // Calculate macro goals (protein: 25%, carbs: 45%, fat: 30%)
            user.dailyGoals.protein = Math.round((adjustedCalories * 0.25) / 4);
            user.dailyGoals.carbs = Math.round((adjustedCalories * 0.45) / 4);
            user.dailyGoals.fat = Math.round((adjustedCalories * 0.30) / 9);
          }
        }

        await user.save();
        console.log('Profile updated successfully for user:', user.email);

        return res.json({
          message: 'Profile updated successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile,
            dailyGoals: user.dailyGoals,
            preferences: user.preferences,
            avatar: user.avatar
          }
        });
      } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({
          message: 'Server error while updating profile',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }

    // Upload profile image
    if (method === 'POST' && path === '/api/users/avatar') {
      // Ensure CORS headers are set
      setCORSHeaders(req, res);

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      try {
        const { avatar } = req.body;
        
        console.log('Avatar upload request:', {
          hasAvatar: !!avatar,
          avatarLength: avatar ? avatar.length : 0,
          avatarType: avatar ? (avatar.startsWith('data:image/') ? 'base64' : 'url') : 'none'
        });
        
        if (!avatar) {
          return res.status(400).json({ message: 'Avatar data is required' });
        }

        // Validate avatar format (allow base64 images up to 500KB)
        if (typeof avatar !== 'string' || avatar.length > 5242880) {
          return res.status(400).json({ message: 'Avatar too large (max 5MB)' });
        }
        
        // Basic validation for base64 image format
        if (avatar && !avatar.startsWith('data:image/') && !avatar.startsWith('http')) {
          return res.status(400).json({ message: 'Invalid avatar format. Must be base64 image or URL' });
        }

        // Update user avatar
        user.avatar = avatar;
        await user.save();
        
        console.log('Avatar saved successfully for user:', user.email);

        return res.json({
          message: 'Avatar updated successfully',
          avatar: user.avatar
        });

      } catch (error) {
        console.error('Avatar upload error:', error);
        return res.status(500).json({
          message: 'Server error while updating avatar',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }

    // Get user goals
    if (method === 'GET' && path === '/api/users/goals') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      return res.json({
        goals: user.dailyGoals || {
          calories: 2000,
          protein: 150,
          carbs: 250,
          fat: 65
        }
      });
    }

    // Update user goals
    if (method === 'PUT' && path === '/api/users/goals') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { calories, protein, carbs, fat } = req.body;

      // Validate goals
      if (calories && (calories < 800 || calories > 5000)) {
        return res.status(400).json({ message: 'Calories must be between 800 and 5000' });
      }
      if (protein && (protein < 10 || protein > 500)) {
        return res.status(400).json({ message: 'Protein must be between 10 and 500g' });
      }
      if (carbs && (carbs < 10 || carbs > 800)) {
        return res.status(400).json({ message: 'Carbs must be between 10 and 800g' });
      }
      if (fat && (fat < 10 || fat > 300)) {
        return res.status(400).json({ message: 'Fat must be between 10 and 300g' });
      }

      // Update goals
      user.dailyGoals = {
        calories: calories || user.dailyGoals?.calories || 2000,
        protein: protein || user.dailyGoals?.protein || 150,
        carbs: carbs || user.dailyGoals?.carbs || 250,
        fat: fat || user.dailyGoals?.fat || 65
      };

      await user.save();

      return res.json({
        message: 'Goals updated successfully',
        goals: user.dailyGoals
      });
    }

    // Change user password
    if (method === 'PUT' && path === '/api/users/password') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: [
            !currentPassword ? { msg: 'Current password is required', path: 'currentPassword' } : null,
            !newPassword ? { msg: 'New password must be at least 6 characters long', path: 'newPassword' } : null
          ].filter(Boolean)
        });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: [{ msg: 'New password must be at least 6 characters long', path: 'newPassword' }]
        });
      }
      if (newPassword === currentPassword) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: [{ msg: 'New password must be different from current password', path: 'newPassword' }]
        });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password (pre-save hook hashes it)
      user.password = newPassword;
      await user.save();

      return res.json({ message: 'Password changed successfully' });
    }

    // Get user statistics
    if (method === 'GET' && path === '/api/users/stats') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Get last 7 days of meals
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const meals = await Meal.find({
        user: user._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });

      const totalMeals = await Meal.countDocuments({ user: user._id });
      const totalFoodsCreated = await Food.countDocuments({ createdBy: user._id });

      return res.json({
        stats: {
          totalMeals: totalMeals || 0,
          totalFoodsCreated: totalFoodsCreated || 0,
          recentMeals: meals?.length || 0,
          avgCaloriesPerDay: meals?.length > 0 
            ? Math.round(meals.reduce((sum, meal) => sum + (meal.totalNutrition?.calories || 0), 0) / meals.length)
            : 0
        },
        recentMeals: meals?.slice(0, 5) || []
      });
    }

    // Admin: Get all users
    if (method === 'GET' && path === '/api/admin/users') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { page = 1, limit = 20 } = req.query;
      const users = await User.find({})
        .select('-password')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

      const totalUsers = await User.countDocuments();

      // Compute stats to match Express route response shape
      let rolesAgg = [];
      try {
        rolesAgg = await User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
      } catch (_) {
        rolesAgg = [];
      }
      const roles = (rolesAgg || []).reduce((acc, r) => {
        acc[r._id] = r.count;
        return acc;
      }, {});

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

      return res.json({
        users: users || [],
        pagination: {
          total: totalUsers || 0,
          current: parseInt(page) || 1,
          limit: parseInt(limit) || 20,
          pages: Math.ceil((totalUsers || 0) / parseInt(limit)) || 1
        },
        stats: {
          total: totalUsers || 0,
          roles: roles || {},
          recentUsers: recentUsers || 0
        }
      });
    }

    // Admin: Get specific user details
    if (method === 'GET' && path.startsWith('/api/admin/users/')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let requester;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        requester = await User.findById(decoded.userId);
        if (!requester || requester.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const userId = path.split('/')[4];
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Compute activity stats
      const mealCount = await Meal.countDocuments({ user: userId });
      const recentMeals = await Meal.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('date totals.calories mealType createdAt')
        .lean();
      const foodCount = await Food.countDocuments({ createdBy: userId });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentMealCount = await Meal.countDocuments({ user: userId, createdAt: { $gte: thirtyDaysAgo } });

      return res.json({
        user,
        activity: {
          totalMeals: mealCount,
          totalFoods: foodCount,
          recentMeals: recentMealCount,
          lastActive: recentMeals.length > 0 ? recentMeals[0].createdAt : user.createdAt
        },
        recentMeals
      });
    }

    // Admin: Update user (role/email/name etc.)
    if (method === 'PUT' && path.startsWith('/api/admin/users/')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let requester;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        requester = await User.findById(decoded.userId);
        if (!requester || requester.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const userId = path.split('/')[4];
      const updates = req.body || {};

      // Prevent admin from demoting themselves
      if (userId === String(requester._id) && updates.role === 'user') {
        return res.status(400).json({ message: 'Cannot demote yourself from admin' });
      }

      // If email is being updated, ensure uniqueness
      if (updates.email) {
        const existing = await User.findOne({ email: updates.email });
        if (existing && String(existing._id) !== userId) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      try {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: updates },
          { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ message: 'User updated successfully', user: updatedUser });
      } catch (error) {
        console.error('Admin update user error:', error);
        return res.status(500).json({ message: 'Server error while updating user' });
      }
    }

    // Admin: Delete user
    if (method === 'DELETE' && path.startsWith('/api/admin/users/')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let requester;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        requester = await User.findById(decoded.userId);
        if (!requester || requester.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const userId = path.split('/')[4];

      try {
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (userId === String(requester._id)) {
          return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        // Delete related data
        const [foodsResult, mealsResult] = await Promise.all([
          Food.deleteMany({ createdBy: userId }),
          Meal.deleteMany({ user: userId })
        ]);

        // Delete user
        await User.findByIdAndDelete(userId);

        return res.json({
          message: 'User and related data deleted successfully',
          deleted: {
            user: user.name,
            foods: foodsResult.deletedCount || 0,
            meals: mealsResult.deletedCount || 0
          }
        });
      } catch (error) {
        console.error('Admin delete user error:', error);
        return res.status(500).json({ 
          message: 'Server error while deleting user',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }

    // Admin: Get system stats
    if (method === 'GET' && path === '/api/admin/stats') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const totalUsers = await User.countDocuments();
      const totalFoods = await Food.countDocuments();
      const totalMeals = await Meal.countDocuments();
      const adminUsers = await User.countDocuments({ role: 'admin' });

      // Get recent registrations (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentUsers = await User.countDocuments({ 
        createdAt: { $gte: weekAgo } 
      });

      return res.json({
        stats: {
          totalUsers: totalUsers || 0,
          totalFoods: totalFoods || 0,
          totalMeals: totalMeals || 0,
          adminUsers: adminUsers || 0,
          recentUsers: recentUsers || 0
        }
      });
    }

    // Calculate BMR/TDEE for user
    if (method === 'POST' && path === '/api/users/calculate-calories') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      let user;
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { age, gender, height, weight, activityLevel, goal } = req.body;

      // Temporarily update profile for calculation
      const tempProfile = {
        ...user.profile,
        age: age || user.profile.age,
        gender: gender || user.profile.gender,
        height: height || user.profile.height,
        weight: weight || user.profile.weight,
        activityLevel: activityLevel || user.profile.activityLevel,
        goal: goal || user.profile.goal
      };

      // Create temporary user object for calculation
      const tempUser = { profile: tempProfile };
      tempUser.calculateBMR = userSchema.methods.calculateBMR;
      tempUser.calculateDailyCalories = userSchema.methods.calculateDailyCalories;

      const bmr = tempUser.calculateBMR();
      const tdee = tempUser.calculateDailyCalories();

      if (!bmr || !tdee) {
        return res.status(400).json({ 
          message: 'Unable to calculate. Please provide age, gender, height, weight, and activity level.' 
        });
      }

      // Adjust calories based on goal
      let targetCalories = tdee;
      if (tempProfile.goal === 'lose_weight') {
        targetCalories = Math.round(tdee * 0.8); // 20% deficit
      } else if (tempProfile.goal === 'gain_weight') {
        targetCalories = Math.round(tdee * 1.2); // 20% surplus
      }

      // Calculate macros (example distribution)
      const protein = Math.round((targetCalories * 0.25) / 4); // 25% protein
      const carbs = Math.round((targetCalories * 0.45) / 4);   // 45% carbs
      const fat = Math.round((targetCalories * 0.30) / 9);     // 30% fat

      return res.json({
        calculations: {
          bmr,
          tdee,
          targetCalories,
          macros: { protein, carbs, fat }
        },
        profile: tempProfile
      });
    }

    // Password reset request (basic implementation)
    if (method === 'POST' && path === '/api/auth/forgot-password') {
      const { email } = req.body;

      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ message: 'Valid email is required' });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
      }

      // In a real app, you'd send an email with a reset token
      // For now, just return success
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Verify token endpoint
    if (method === 'POST' && path === '/api/auth/verify-token') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ valid: false, message: 'No token provided' });
      }

      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return res.status(401).json({ valid: false, message: 'Invalid token' });
        }

        return res.json({
          valid: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar
          }
        });
      } catch (error) {
        return res.status(401).json({ valid: false, message: 'Invalid token' });
      }
    }

    // Default response
    return res.status(404).json({ message: 'Route not found' });

  } catch (error) {
    console.error('API Error:', error);
    
    // Ensure CORS headers are set even for errors
    setCORSHeaders(req, res);
    
    // Return safe error response with expected structure
    const errorResponse = { 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    };

    // Add safe defaults for common endpoints
    if (path === '/api/foods') {
      errorResponse.foods = [];
      errorResponse.total = 0;
      errorResponse.pagination = { total: 0, page: 1, limit: 100, pages: 1 };
    } else if (path && path.includes('/api/meals')) {
      errorResponse.meal = {
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
      };
      errorResponse.meals = [];
      errorResponse.frequentFoods = [];
      errorResponse.stats = { totalMeals: 0, totalCalories: 0, avgCalories: 0 };
    } else if (path && path.includes('/api/admin')) {
      errorResponse.users = [];
      errorResponse.stats = { totalUsers: 0, totalFoods: 0, totalMeals: 0, adminUsers: 0, recentUsers: 0 };
    }

    return res.status(500).json(errorResponse);
  }
};
