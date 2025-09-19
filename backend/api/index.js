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

// Create Food model
const Food = mongoose.models.Food || mongoose.model('Food', foodSchema);

// Meal Schema
const mealSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true, default: Date.now },
  meals: {
    breakfast: [{
      food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, default: 'g' }
    }],
    lunch: [{
      food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, default: 'g' }
    }],
    dinner: [{
      food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, default: 'g' }
    }],
    snacks: [{
      food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, default: 'g' }
    }]
  },
  totalNutrition: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Calculate total nutrition before saving
mealSchema.pre('save', async function(next) {
  try {
    let totalNutrition = {
      calories: 0, protein: 0, carbs: 0, fat: 0,
      fiber: 0, sugar: 0, sodium: 0
    };

    // Calculate nutrition for all meal types
    for (const mealType of ['breakfast', 'lunch', 'dinner', 'snacks']) {
      for (const item of this.meals[mealType]) {
        const food = await Food.findById(item.food);
        if (food) {
          const multiplier = item.quantity / 100; // Assuming nutrition is per 100g
          totalNutrition.calories += food.nutrition.calories * multiplier;
          totalNutrition.protein += food.nutrition.protein * multiplier;
          totalNutrition.carbs += food.nutrition.carbs * multiplier;
          totalNutrition.fat += food.nutrition.fat * multiplier;
          totalNutrition.fiber += (food.nutrition.fiber || 0) * multiplier;
          totalNutrition.sugar += (food.nutrition.sugar || 0) * multiplier;
          totalNutrition.sodium += (food.nutrition.sodium || 0) * multiplier;
        }
      }
    }

    this.totalNutrition = totalNutrition;
    next();
  } catch (error) {
    next(error);
  }
});

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

// Main handler
module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    await connectToDatabase();

    const { method, url } = req;
    const urlParts = url.split('?');
    const path = urlParts[0];
    
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
          preferences: user.preferences
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
          preferences: user.preferences
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

      return res.json({
        foods: foods || [],
        total: totalCount || 0,
        pagination: {
          total: totalCount || 0,
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 100,
          pages: Math.ceil((totalCount || 0) / parseInt(limit)) || 1
        }
      });
    }

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
        isVerified: user.role === 'admin'
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
      if (servingSize) food.servingSize = servingSize;
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

      // Handle both /api/meals?date=... and /api/meals/daily/YYYY-MM-DD
      let queryDate;
      if (path.startsWith('/api/meals/daily/')) {
        const dateStr = path.split('/api/meals/daily/')[1];
        queryDate = new Date(dateStr);
      } else {
        const { date } = req.query;
        queryDate = date ? new Date(date) : new Date();
      }
      
      // Set to start and end of day
      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);

      let meal = await Meal.findOne({
        user: user._id,
        date: { $gte: startOfDay, $lte: endOfDay }
      }).populate('meals.breakfast.food meals.lunch.food meals.dinner.food meals.snacks.food');

      if (!meal) {
        meal = new Meal({
          user: user._id,
          date: queryDate,
          meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
        });
        await meal.save();
      }

      return res.json({ 
        meal: meal || {
          user: user._id,
          date: queryDate,
          meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
        }
      });
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
      }).populate('meals.breakfast.food meals.lunch.food meals.dinner.food meals.snacks.food');

      // Calculate stats
      const totalCalories = meals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0);
      const avgCalories = meals.length > 0 ? totalCalories / meals.length : 0;

      // Get frequent foods with proper error handling
      const foodFrequency = {};
      (meals || []).forEach(meal => {
        if (meal && meal.meals) {
          ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
            const mealItems = meal.meals[mealType] || [];
            mealItems.forEach(item => {
              if (item && item.food && item.food._id) {
                const foodId = item.food._id.toString();
                foodFrequency[foodId] = (foodFrequency[foodId] || 0) + 1;
              }
            });
          });
        }
      });

      const frequentFoods = Object.entries(foodFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([foodId, count]) => {
          const food = (meals || []).flatMap(meal => 
            ['breakfast', 'lunch', 'dinner', 'snacks'].flatMap(type => 
              (meal?.meals?.[type] || []).filter(item => item?.food?._id?.toString() === foodId)
            )
          )[0]?.food;
          return food ? { food, count } : null;
        })
        .filter(item => item && item.food);

      return res.json({
        stats: {
          totalMeals: meals?.length || 0,
          totalCalories: totalCalories || 0,
          avgCalories: Math.round(avgCalories) || 0,
          dateRange: { startDate: start, endDate: end }
        },
        meals: meals || [],
        frequentFoods: frequentFoods || []
      });
    }

    // Add food to meal
    if (method === 'POST' && path === '/api/meals/add') {
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

      const { foodId, quantity, mealType, date } = req.body;

      if (!foodId || !quantity || !mealType) {
        return res.status(400).json({ 
          message: 'Food ID, quantity, and meal type are required' 
        });
      }

      if (!['breakfast', 'lunch', 'dinner', 'snacks'].includes(mealType)) {
        return res.status(400).json({ 
          message: 'Invalid meal type' 
        });
      }

      const food = await Food.findById(foodId);
      if (!food) {
        return res.status(404).json({ message: 'Food not found' });
      }

      const queryDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);

      let meal = await Meal.findOne({
        user: user._id,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (!meal) {
        meal = new Meal({
          user: user._id,
          date: queryDate,
          meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
        });
      }

      meal.meals[mealType].push({
        food: foodId,
        quantity: parseFloat(quantity),
        unit: 'g'
      });

      await meal.save();
      await meal.populate('meals.breakfast.food meals.lunch.food meals.dinner.food meals.snacks.food');

      return res.json({
        message: 'Food added to meal successfully',
        meal
      });
    }

    // Remove food from meal
    if (method === 'DELETE' && path.startsWith('/api/meals/')) {
      const pathParts = path.split('/');
      if (pathParts.length === 5 && pathParts[4] === 'remove') {
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

        const { mealType, itemIndex, date } = req.body;

        const queryDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);

        const meal = await Meal.findOne({
          user: user._id,
          date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!meal) {
          return res.status(404).json({ message: 'Meal not found' });
        }

        if (meal.meals[mealType] && meal.meals[mealType][itemIndex]) {
          meal.meals[mealType].splice(itemIndex, 1);
          await meal.save();
          await meal.populate('meals.breakfast.food meals.lunch.food meals.dinner.food meals.snacks.food');
        }

        return res.json({
          message: 'Food removed from meal successfully',
          meal
        });
      }
    }

    // Update user profile
    if (method === 'PUT' && path === '/api/users/profile') {
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

      const { name, profile, dailyGoals, preferences } = req.body;

      if (name) user.name = name.trim();
      if (profile) {
        user.profile = { ...user.profile, ...profile };
      }
      if (dailyGoals) {
        user.dailyGoals = { ...user.dailyGoals, ...dailyGoals };
      }
      if (preferences) {
        user.preferences = { ...user.preferences, ...preferences };
      }

      await user.save();

      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
          dailyGoals: user.dailyGoals,
          preferences: user.preferences
        }
      });
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

      return res.json({
        users: users || [],
        pagination: {
          total: totalUsers || 0,
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 20,
          pages: Math.ceil((totalUsers || 0) / parseInt(limit)) || 1
        }
      });
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
            role: user.role
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
    } else if (path.includes('/api/meals')) {
      errorResponse.meal = {
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
      };
      errorResponse.meals = [];
      errorResponse.frequentFoods = [];
      errorResponse.stats = { totalMeals: 0, totalCalories: 0, avgCalories: 0 };
    } else if (path.includes('/api/admin')) {
      errorResponse.users = [];
      errorResponse.stats = { totalUsers: 0, totalFoods: 0, totalMeals: 0, adminUsers: 0, recentUsers: 0 };
    }

    return res.status(500).json(errorResponse);
  }
};
