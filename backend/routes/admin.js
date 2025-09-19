const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Food = require('../models/Food');
const Meal = require('../models/Meal');

const router = express.Router();

// Admin-only guard
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
}

// POST /api/admin/purge-non-admins
// Deletes all users except the admin and cleans related foods/meals
router.post('/purge-non-admins', auth, requireAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id email');
    if (admins.length === 0) {
      return res.status(400).json({ message: 'No admin found to keep' });
    }

    const adminIds = admins.map(a => a._id);
    const usersToDelete = await User.find({ role: { $ne: 'admin' } }).select('_id');
    const userIds = usersToDelete.map(u => u._id);

    // Delete related data
    const foodsResult = await Food.deleteMany({ createdBy: { $in: userIds } });
    const mealsResult = await Meal.deleteMany({ user: { $in: userIds } });
    const usersResult = await User.deleteMany({ _id: { $in: userIds } });

    res.json({
      message: 'Purged all non-admin users and related data',
      deleted: {
        users: usersResult.deletedCount || 0,
        foods: foodsResult.deletedCount || 0,
        meals: mealsResult.deletedCount || 0,
      },
      keptAdmins: admins.map(a => a.email)
    });
  } catch (error) {
    console.error('Admin purge error:', error);
    res.status(500).json({ message: 'Server error during purge' });
  }
});

// POST /api/admin/bulk-import-foods
// Bulk import foods from JSON array
router.post('/bulk-import-foods', auth, requireAdmin, [
  body('foods').isArray({ min: 1 }).withMessage('Foods array is required'),
  body('foods.*.name').notEmpty().withMessage('Food name is required'),
  body('foods.*.category').isIn([
    'fruits', 'vegetables', 'grains', 'protein', 'dairy', 'nuts_seeds',
    'oils_fats', 'beverages', 'sweets', 'snacks', 'prepared_foods', 'other'
  ]).withMessage('Invalid category'),
  body('foods.*.nutrition.calories').isNumeric().withMessage('Calories must be numeric'),
  body('foods.*.nutrition.protein').isNumeric().withMessage('Protein must be numeric'),
  body('foods.*.nutrition.carbs').isNumeric().withMessage('Carbs must be numeric'),
  body('foods.*.nutrition.fat').isNumeric().withMessage('Fat must be numeric')
], async (req, res) => {
  try {
    const { foods, clearExisting = false } = req.body;
    
    // Clear existing foods if requested
    if (clearExisting) {
      const deleteResult = await Food.deleteMany({});
      console.log(`Cleared ${deleteResult.deletedCount} existing foods`);
    }
    
    // Process foods and add admin metadata
    const processedFoods = foods.map(food => ({
      ...food,
      createdBy: req.user._id,
      isPublic: food.isPublic !== undefined ? food.isPublic : true,
      isVerified: true,
      per100g: food.servingSize?.unit === 'piece' ? false : true
    }));
    
    // Insert foods
    const insertedFoods = await Food.insertMany(processedFoods);
    
    // Count foods by category for summary
    const categoryCounts = {};
    insertedFoods.forEach(food => {
      categoryCounts[food.category] = (categoryCounts[food.category] || 0) + 1;
    });
    
    res.json({
      message: `Successfully imported ${insertedFoods.length} foods`,
      imported: insertedFoods.length,
      categoryCounts,
      sampleFoods: insertedFoods.slice(0, 5).map(f => ({
        name: f.name,
        nameAr: f.nameAr,
        category: f.category,
        servingSize: f.servingSize
      }))
    });
    
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ 
      message: 'Server error during bulk import',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
