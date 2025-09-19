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

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Create model
const User = mongoose.models.User || mongoose.model('User', userSchema);

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
    const path = url.split('?')[0];

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
        totalUsers: await User.countDocuments()
      });
    }

    // Default response
    return res.status(404).json({ message: 'Route not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
