const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Food = require('../models/Food');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/calories-calculator', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Import foods from JSON file
const importFoods = async () => {
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, '../../Data/comprehensive_egyptian_foods.json');
    const foodsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`📊 Found ${foodsData.length} foods in JSON file`);
    
    // Create a default admin user ID (you should replace this with actual admin ID)
    const defaultAdminId = new mongoose.Types.ObjectId();
    
    // Process each food item
    const processedFoods = foodsData.map(food => ({
      ...food,
      createdBy: defaultAdminId,
      isPublic: true,
      isVerified: true,
      per100g: food.servingSize?.unit === 'piece' ? false : true
    }));
    
    // Clear existing foods (optional - comment out if you want to keep existing foods)
    console.log('🗑️ Clearing existing foods...');
    await Food.deleteMany({});
    
    // Insert new foods
    console.log('📥 Inserting foods...');
    const insertedFoods = await Food.insertMany(processedFoods);
    
    console.log(`✅ Successfully imported ${insertedFoods.length} foods`);
    
    // Show some sample foods
    console.log('\n🍎 Sample imported foods:');
    const sampleFoods = insertedFoods.slice(0, 5);
    sampleFoods.forEach(food => {
      console.log(`  - ${food.nameAr || food.name} (${food.name})`);
    });
    
    // Check for Egyptian Bread specifically
    const egyptianBread = insertedFoods.filter(f => f.nameAr && f.nameAr.includes('عيش'));
    console.log(`\n🍞 Found ${egyptianBread.length} Egyptian bread items:`);
    egyptianBread.forEach(food => {
      console.log(`  - ${food.nameAr} (${food.name}) - ${food.servingSize.amount} ${food.servingSize.unit}`);
    });
    
  } catch (error) {
    console.error('❌ Error importing foods:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the import
const run = async () => {
  await connectDB();
  await importFoods();
};

run();
