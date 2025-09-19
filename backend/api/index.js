const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('../routes/auth');
const foodRoutes = require('../routes/foods');
const mealRoutes = require('../routes/meals');
const userRoutes = require('../routes/users');
const adminRoutes = require('../routes/admin');
const User = require('../models/User');
const Food = require('../models/Food');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://calories-tracker-6oiu.vercel.app', 'https://kul-behesab.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
// Increase body limits to support base64 avatars
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'كُل بحساب API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to check admin user
app.get('/api/debug/admin', async (req, res) => {
  try {
    await connectToDatabase();
    const adminUser = await User.findOne({ email: 'admin@gmail.com' });
    res.json({
      adminExists: !!adminUser,
      adminData: adminUser ? {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        hasPassword: !!adminUser.password
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'كُل بحساب API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaloriApp';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    isConnected = true;
    console.log(`✅ Connected to MongoDB: ${mongoUri}`);
    
    // Seed initial data if needed
    await seedInitialFoods();
    await ensureAdminUser();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Seed function: create admin user and 10 sample foods if collection is empty
async function seedInitialFoods() {
  try {
    const count = await Food.countDocuments();
    if (count > 0) return; // Already seeded

    console.log('🌱 Seeding initial foods...');

    // Ensure admin user exists for seeding
    let adminUser = await User.findOne({ email: 'admin@gmail.com' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: 'messi1010@',
        role: 'admin',
        profile: { age: 30 }
      });
      await adminUser.save();
      console.log('👑 Admin user created for seeding');
    }

    const foods = [
      { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
      { name: 'Banana', calories: 96, protein: 1.3, carbs: 27, fat: 0.3 },
      { name: 'Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { name: 'Chicken breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { name: 'Egg', calories: 155, protein: 13, carbs: 1, fat: 11 },
      { name: 'Bread', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
      { name: 'Potato', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { name: 'Cucumber', calories: 16, protein: 0.6, carbs: 4, fat: 0.1 },
      { name: 'Milk', calories: 42, protein: 3.4, carbs: 5, fat: 1 },
    ];

    // Map to our Food model shape (per 100g)
    const docs = foods.map(f => ({
      name: f.name,
      category: 'other',
      nutrition: {
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
      servingSize: { amount: 100, unit: 'g' },
      createdBy: adminUser._id,
      isPublic: true,
      isVerified: true,
      per100g: true,
      description: 'Seed food (per 100g)'
    }));

    await Food.insertMany(docs);
    console.log('✅ Seeded 10 foods');
  } catch (error) {
    console.error('Seeding error:', error);
  }
}

// Ensure a single admin exists
async function ensureAdminUser() {
  try {
    const adminEmail = 'admin@gmail.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: 'messi1010@',
        role: 'admin',
        profile: { age: 30 }
      });
      await admin.save();
      console.log('👑 Admin user created (admin@gmail.com / messi1010@)');
    }
  } catch (error) {
    console.error('Admin seed error:', error);
  }
}

// Serverless function handler
module.exports = async (req, res) => {
  await connectToDatabase();
  return app(req, res);
};
